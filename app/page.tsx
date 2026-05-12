"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { ThemeToggle } from "@/components/theme-toggle";
import { SessionManager } from "@/components/session-manager";
import FileUpload from "@/components/file-upload";
import DataVisualization from "@/components/data-visualization";
import DataTable from "@/components/data-table";
import ConversationExplorer from "@/components/conversation-explorer";
import ContactEditor from "@/components/contact-editor";
import { BankAnalyzer } from "@/components/bank-analyzer";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  BarChart3,
  Table,
  MessageSquare,
  Users,
  Wallet,
  ArrowLeftRight,
  Menu,
  X,
  Sparkles,
} from "lucide-react";

type View = "upload" | "charts" | "tables" | "conversations" | "contacts" | "bank";

const navItems: { id: View; label: string; icon: typeof Upload; section?: string; requiresComms?: boolean; requiresBank?: boolean }[] = [
  { id: "upload", label: "Upload Data", icon: Upload, section: "Data" },
  { id: "charts", label: "Charts", icon: BarChart3, section: "Analysis", requiresComms: true },
  { id: "tables", label: "Data Tables", icon: Table, requiresComms: true },
  { id: "conversations", label: "Conversations", icon: MessageSquare, requiresComms: true },
  { id: "contacts", label: "Contacts", icon: Users, section: "Tools" },
  { id: "bank", label: "Bank", icon: Wallet },
];

export default function Home() {
  const [activeView, setActiveView] = useState<View>("upload");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { parsedData, handleFilesUpload, isLoading } = useAppStore();
  const hasCommsData = parsedData.sms.length > 0 || parsedData.calls.length > 0;
  const hasBankData = parsedData.bank.length > 0;

  const handleNavClick = (id: View) => {
    setActiveView(id);
    setSidebarOpen(false);
  };

  const currentNav = navItems.find((n) => n.id === activeView);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[260px] bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="h-[60px] flex items-center gap-2.5 px-5 border-b border-sidebar-border shrink-0">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-base font-bold tracking-tight">visualrecords</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
            {navItems.map((item, i) => {
              const isDisabled = isMounted && (
                (item.requiresComms && !hasCommsData) ||
                (item.requiresBank && !hasBankData)
              );
            const showSection = item.section && (i === 0 || navItems[i - 1]?.section !== item.section);

            return (
              <div key={item.id}>
                {showSection && (
                  <div className="px-3 pt-4 pb-1.5 first:pt-0">
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                      {item.section}
                    </span>
                  </div>
                )}
                <motion.button
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => !isDisabled && handleNavClick(item.id)}
                  disabled={isDisabled}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 relative group",
                    activeView === item.id
                      ? "bg-primary/10 text-primary dark:bg-primary/15"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    isDisabled && "opacity-35 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground"
                  )}
                >
                  {activeView === item.id && (
                    <motion.div
                      layoutId="active-nav"
                      className="absolute left-0 w-1 h-5 bg-primary rounded-r-full"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {isDisabled && (
                    <Badge variant="outline" className="ml-auto text-[10px] h-5 px-1.5 opacity-70">
                      No data
                    </Badge>
                  )}
                </motion.button>
              </div>
            );
          })}
        </nav>

        {/* Session actions in sidebar bottom */}
        <div className="p-3 border-t border-sidebar-border shrink-0">
          <SessionManager />
        </div>
      </aside>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-[60px] flex items-center justify-between px-4 sm:px-6 border-b bg-background/80 backdrop-blur-md sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div>
              <h2 className="text-base font-semibold leading-tight">
                {currentNav?.label}
              </h2>
              {hasCommsData && activeView === "upload" && (
                <p className="text-xs text-muted-foreground">
                  {parsedData.sms.length} messages · {parsedData.calls.length} calls · {parsedData.contacts.length} contacts
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto min-w-0 relative">
          <div className="p-3 sm:p-5 lg:p-6 mx-auto w-full max-w-[1600px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -2 }}
                transition={{ duration: 0.1, ease: "easeOut" }}
              >
                {activeView === "upload" && (
                  <FileUpload
                    onFilesUpload={handleFilesUpload}
                    isLoading={isLoading}
                    allowedTypes={["sms", "calls", "contacts", "bank"]}
                    onSuccess={() => setActiveView("charts")}
                  />
                )}
                {activeView === "charts" && <DataVisualization />}
                {activeView === "tables" && <DataTable />}
                {activeView === "conversations" && <ConversationExplorer />}
                {activeView === "contacts" && <ContactEditor />}
                { activeView === "bank" && <BankAnalyzer /> }
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
