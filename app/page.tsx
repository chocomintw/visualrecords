"use client";

import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Users, Wallet } from "lucide-react";
import CommunicationDashboard from "@/components/communication-dashboard";
import ContactEditor from "@/components/contact-editor";
import { BankAnalyzer } from "@/components/bank-analyzer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-[1600px]">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold tracking-tight">visualrecords</h1>
        </div>

        <Tabs defaultValue="communication" className="w-full space-y-8">
          <TabsList className="grid w-full max-w-md grid-cols-3 h-12 p-1 bg-muted/50 rounded-xl border border-border/50">
            <TabsTrigger
              value="communication"
              className="flex items-center gap-2 text-sm font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <MessageSquare className="h-4 w-4" />
              Communication
            </TabsTrigger>
            <TabsTrigger
              value="contacts"
              className="flex items-center gap-2 text-sm font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Users className="h-4 w-4" />
              Contacts
            </TabsTrigger>
            <TabsTrigger
              value="bank"
              className="flex items-center gap-2 text-sm font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Wallet className="h-4 w-4" />
              Bank
            </TabsTrigger>
          </TabsList>

          <TabsContent value="communication" className="outline-none">
            <CommunicationDashboard />
          </TabsContent>

          <TabsContent value="contacts" className="outline-none">
            <ContactEditor />
          </TabsContent>

          <TabsContent value="bank" className="outline-none">
            <BankAnalyzer />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
