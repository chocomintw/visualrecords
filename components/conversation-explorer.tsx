"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Search,
  MessageSquare,
  Phone,
  UserX,
  ExternalLink,
  Users,
  ArrowLeftRight,
  Download,
  CheckSquare,
  Square,
  UserPlus,
  Edit2,
  Save,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { useTheme } from "next-themes";

interface ConversationMessage {
  "SMS #"?: string;
  "Call #"?: string;
  "Sender Number": string;
  "Receiver Number": string;
  "Message Body"?: string;
  "Call Info"?: string;
  Type: "Sender" | "Receiver";
  Timestamp: string;
  isSMS: boolean;
  participant1: string;
  participant2: string;
  participant1Display: string;
  participant2Display: string;
}

interface Conversation {
  conversationKey: string;
  participant1Display: string;
  participant2Display: string;
  messages: ConversationMessage[];
  lastActivity: string;
  messageCount: number;
  callCount: number;
  hasUnknownParticipants: boolean;
}

// Helper function to parse Excel date serial numbers
const parseExcelDate = (value: any): Date => {
  // If it's already a valid date string, parse it normally
  if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  // If it's a number, treat it as Excel serial date
  if (typeof value === "number" || !isNaN(Number(value))) {
    const excelEpoch = new Date(1899, 11, 30); // Excel's epoch is Dec 30, 1899
    const days = Number(value);
    const milliseconds = days * 24 * 60 * 60 * 1000;
    return new Date(excelEpoch.getTime() + milliseconds);
  }

  // Fallback to a fixed epoch date if parsing fails to avoid hydration mismatch
  console.warn("Could not parse timestamp:", value);
  return new Date(0);
};

// Helper to format timestamp for display (stable for SSR)
const formatTimestamp = (timestamp: any): string => {
  const date = parseExcelDate(timestamp);
  return date.toLocaleString("en-US");
};

export default function ConversationExplorer() {
  const { parsedData } = useAppStore();
  const { theme } = useTheme();
  const { sms, calls, contacts } = parsedData;
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const [activeTab, setActiveTab] = useState<"all" | "messages" | "calls">(
    "all",
  );
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<number>>(
    new Set(),
  );
  const [isExporting, setIsExporting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // Quick Contact Edit State
  const { setContacts } = useAppStore();
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [editingPhone, setEditingPhone] = useState("");
  const [editingName, setEditingName] = useState("");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Create contact lookup map
  const contactMap = useMemo(() => {
    const map: { [key: string]: string } = {};
    contacts.forEach((contact: any) => {
      map[contact["Phone Number"]] = contact["Contact Name"];
    });
    return map;
  }, [contacts]);

  // Helper to get display name for a phone number
  const getDisplayInfo = (phoneNumber: string) => {
    const contactName = contactMap[phoneNumber];
    if (contactName) {
      return { name: contactName, isUnknown: false };
    }
    return { name: `Unknown (${phoneNumber})`, isUnknown: true };
  };

  const getDisplayName = (phoneNumber: string): string => {
    return getDisplayInfo(phoneNumber).name;
  };

  const openContactDialog = (phoneNumber: string) => {
    const existingName = contactMap[phoneNumber] || "";
    setEditingPhone(phoneNumber);
    setEditingName(existingName);
    setIsContactDialogOpen(true);
  };

  const saveContact = () => {
    if (!editingPhone) return;

    const newContacts = [...contacts];
    const existingIndex = newContacts.findIndex(c => c["Phone Number"] === editingPhone);

    if (existingIndex >= 0) {
      newContacts[existingIndex] = {
        ...newContacts[existingIndex],
        "Contact Name": editingName.trim() || editingPhone,
        "Full Name": editingName.trim() || editingPhone,
      };
    } else {
      newContacts.push({
        "Phone Number": editingPhone,
        "Contact Name": editingName.trim() || editingPhone,
        "Full Name": editingName.trim() || editingPhone,
      });
    }

    setContacts(newContacts);
    setIsContactDialogOpen(false);
  };

  // Helper to detect the main phone number (user's own number)
  const mainPhoneNumber = useMemo(() => {
    // Try to get from the Type field in calls and SMS first
    const sentCalls = calls.filter((call: any) => call.Type === "Sender");
    const sentSMS = sms.filter((message: any) => message.Type === "Sender");

    if (sentCalls.length > 0 && sentCalls[0]["Sender Number"]) {
      return sentCalls[0]["Sender Number"];
    }
    if (sentSMS.length > 0 && sentSMS[0]["Sender Number"]) {
      return sentSMS[0]["Sender Number"];
    }

    // Fallback: count occurrences of each phone number
    const phoneCount: { [key: string]: number } = {};

    const allItems = [...calls, ...sms];
    allItems.forEach((item: any) => {
      if (item["Sender Number"] && item["Sender Number"].trim()) {
        const sender = item["Sender Number"].trim();
        phoneCount[sender] = (phoneCount[sender] || 0) + 1;
      }
      if (item["Receiver Number"] && item["Receiver Number"].trim()) {
        const receiver = item["Receiver Number"].trim();
        phoneCount[receiver] = (phoneCount[receiver] || 0) + 1;
      }
    });

    const sortedPhones = Object.entries(phoneCount).sort(
      ([, a], [, b]) => b - a,
    );
    return sortedPhones[0]?.[0] || "";
  }, [sms, calls]);

  // Helper to create a unique conversation key from two phone numbers
  const getConversationKey = (num1: string, num2: string): string => {
    // Sort numbers to ensure same conversation regardless of order
    return [num1, num2].sort().join("|||");
  };

  // Process all conversations
  const conversations = useMemo(() => {
    const conversationMap: { [key: string]: ConversationMessage[] } = {};

    // Deduplicate SMS messages by Sender, Receiver, Timestamp and Body
    const seenSMS = new Set<string>();
    const uniqueSMS = sms.filter((message: any) => {
      const sender = String(message["Sender Number"] || "").replace(/\D/g, "");
      const receiver = String(message["Receiver Number"] || "").replace(
        /\D/g,
        "",
      );
      const body = String(message["Message Body"] || "")
        .toLowerCase()
        .replace(/\s+/g, "");

      // Parse the timestamp properly for Excel dates
      const parsedDate = parseExcelDate(message.Timestamp);
      const timestamp = parsedDate.toISOString();

      const key = `${sender}-${receiver}-${timestamp}-${body}`;

      if (seenSMS.has(key)) {
        return false;
      }
      seenSMS.add(key);
      return true;
    });

    // Process SMS messages
    uniqueSMS.forEach((message: any) => {
      const sender = message["Sender Number"];
      const receiver = message["Receiver Number"];
      const conversationKey = getConversationKey(sender, receiver);

      if (!conversationMap[conversationKey]) {
        conversationMap[conversationKey] = [];
      }

      conversationMap[conversationKey].push({
        ...message,
        isSMS: true,
        participant1: sender,
        participant2: receiver,
        participant1Display: getDisplayName(sender),
        participant2Display: getDisplayName(receiver),
      });
    });

    // Process calls
    calls.forEach((call: any) => {
      const sender = call["Sender Number"];
      const receiver = call["Receiver Number"];
      const conversationKey = getConversationKey(sender, receiver);

      if (!conversationMap[conversationKey]) {
        conversationMap[conversationKey] = [];
      }

      conversationMap[conversationKey].push({
        ...call,
        isSMS: false,
        participant1: sender,
        participant2: receiver,
        participant1Display: getDisplayName(sender),
        participant2Display: getDisplayName(receiver),
      });
    });

    // Convert to array and sort
    return Object.entries(conversationMap)
      .map(([conversationKey, messages]) => {
        // Sort messages chronologically using parseExcelDate
        const sortedMessages = messages.sort(
          (a, b) =>
            parseExcelDate(a.Timestamp).getTime() -
            parseExcelDate(b.Timestamp).getTime(),
        );

        // Get display names from first message (they're all the same for a conversation)
        const firstMsg = sortedMessages[0];
        const hasUnknown =
          firstMsg.participant1Display.startsWith("Unknown") ||
          firstMsg.participant2Display.startsWith("Unknown");

        return {
          conversationKey,
          participant1Display: firstMsg.participant1Display,
          participant2Display: firstMsg.participant2Display,
          messages: sortedMessages,
          lastActivity: sortedMessages[sortedMessages.length - 1]?.Timestamp,
          messageCount: messages.filter((m) => m.isSMS).length,
          callCount: messages.filter((m) => !m.isSMS).length,
          hasUnknownParticipants: hasUnknown,
        };
      })
      .sort(
        (a, b) =>
          parseExcelDate(b.lastActivity).getTime() -
          parseExcelDate(a.lastActivity).getTime(),
      );
  }, [sms, calls, contactMap]);

  // Filter conversations based on active tab
  const tabFilteredConversations = useMemo(() => {
    if (activeTab === "messages") {
      return conversations.filter((c) => c.messageCount > 0);
    } else if (activeTab === "calls") {
      return conversations.filter((c) => c.callCount > 0);
    }
    return conversations;
  }, [conversations, activeTab]);

  // Filter conversations based on search
  const filteredConversations = useMemo(() => {
    if (!searchTerm) return tabFilteredConversations;

    return tabFilteredConversations.filter(
      (conversation) =>
        conversation.participant1Display
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        conversation.participant2Display
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        conversation.messages.some(
          (message) =>
            message.isSMS &&
            message["Message Body"]
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()),
        ),
    );
  }, [tabFilteredConversations, searchTerm]);

  // Get current conversation and filter its messages based on active tab
  const currentConversation = useMemo(() => {
    const conversation = selectedConversation
      ? conversations.find((c) => c.conversationKey === selectedConversation)
      : filteredConversations[0];

    if (!conversation) return null;

    // Filter messages based on active tab
    let filteredMessages = conversation.messages;
    if (activeTab === "messages") {
      filteredMessages = conversation.messages.filter((m) => m.isSMS);
    } else if (activeTab === "calls") {
      filteredMessages = conversation.messages.filter((m) => !m.isSMS);
    }

    return {
      ...conversation,
      messages: filteredMessages,
    };
  }, [selectedConversation, conversations, filteredConversations, activeTab]);

  // Reset selection when conversation changes
  useMemo(() => {
    setIsSelectionMode(false);
    setSelectedMessages(new Set());
  }, [selectedConversation]);

  const toggleMessageSelection = (index: number) => {
    const newSelected = new Set(selectedMessages);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedMessages(newSelected);
  };

  const handleExport = async () => {
    if (!currentConversation || isExporting) return;

    setIsExporting(true);
    const isDark = theme === "dark";
    
    try {
      const { toPng } = await import("html-to-image");
      
      // 1. Create a container that is technically "visible" but hidden from the user's view
      const container = document.createElement("div");
      container.id = "export-temp-container";
      
      // Theme colors
      const bgColor = isDark ? "#09090b" : "#ffffff";
      const textColor = isDark ? "#fafafa" : "#111827";
      const mutedTextColor = isDark ? "#a1a1aa" : "#4b5563";
      const borderColor = isDark ? "#27272a" : "#f3f4f6";
      const cardBg = isDark ? "#18181b" : "#f9fafb";
      const cardBorder = isDark ? "#27272a" : "#e5e7eb";

      // Position it way off-screen but keep it 'visible' for the renderer
      Object.assign(container.style, {
        position: "absolute",
        top: "0",
        left: "0",
        width: "800px",
        backgroundColor: bgColor,
        color: textColor,
        padding: "40px",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        zIndex: "-1000",
        opacity: "1",
        pointerEvents: "none",
        transform: "translateX(-200%)",
      });
      
      // Ensure we have the base theme class
      container.className = isDark ? "dark bg-background text-foreground" : "light bg-white text-black"; 
      document.body.appendChild(container);

      // 2. Add Professional Header
      const header = document.createElement("div");
      header.style.marginBottom = "32px";
      header.style.paddingBottom = "20px";
      header.style.borderBottom = `2px solid ${borderColor}`;
      header.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
          <div style="width: 36px; height: 36px; background-color: #3b82f6; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
            <svg style="width: 20px; height: 20px; color: white;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          </div>
          <h1 style="font-size: 26px; font-weight: 800; color: ${textColor}; letter-spacing: -0.025em;">Communication Record</h1>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 12px;">
          <div style="display: flex; align-items: center; gap: 10px; font-size: 16px; font-weight: 600; color: ${isDark ? "#e4e4e7" : "#374151"};">
            <span>${currentConversation.participant1Display}</span>
            <svg style="width: 14px; height: 14px; color: ${isDark ? "#52525b" : "#9ca3af"};" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 1l4 4-4 4m6 14l-4-4 4-4M2 12h19M21 12H2"/></svg>
            <span>${currentConversation.participant2Display}</span>
          </div>
          <div style="text-align: right;">
            <p style="font-size: 11px; font-weight: 700; color: ${isDark ? "#71717a" : "#9ca3af"}; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 2px;">Export Date</p>
            <p style="font-size: 14px; font-weight: 600; color: ${mutedTextColor};">${new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
      `;
      container.appendChild(header);

      // 3. Add Messages
      const messagesToExport = isSelectionMode
        ? currentConversation.messages.filter((_, idx) => selectedMessages.has(idx))
        : currentConversation.messages;

      const messagesContainer = document.createElement("div");
      messagesContainer.style.display = "flex";
      messagesContainer.style.flexDirection = "column";
      messagesContainer.style.gap = "20px";
      container.appendChild(messagesContainer);

      // Clone each message element
      const messageElements = document.querySelectorAll("[data-message-index]");
      let addedCount = 0;

      messageElements.forEach((el) => {
        const index = parseInt(el.getAttribute("data-message-index") || "-1");
        const msgData = currentConversation.messages[index];
        
        if (messagesToExport.includes(msgData)) {
          const clone = el.cloneNode(true) as HTMLElement;
          addedCount++;
          
          // Cleanup clone
          const checkbox = clone.querySelector(".selection-checkbox");
          if (checkbox) checkbox.remove();
          
          const editButtons = clone.querySelectorAll(".export-hidden");
          editButtons.forEach(btn => btn.remove());

          // Reset Framer Motion styles that might hide the element
          clone.style.opacity = "1";
          clone.style.transform = "none";
          clone.style.visibility = "visible";
          clone.style.width = "100%";
          clone.style.display = "flex";
          clone.style.position = "static";
          
          // Fix colors for theme-aware export
          const timelineContainer = clone.children[0] as HTMLElement;
          const iconCircle = timelineContainer?.children[0] as HTMLElement;
          const verticalLine = timelineContainer?.children[1] as HTMLElement;

          if (timelineContainer) {
            timelineContainer.style.backgroundColor = "transparent";
            timelineContainer.style.display = "flex";
            timelineContainer.style.flexDirection = "column";
            timelineContainer.style.alignItems = "center";
            timelineContainer.style.width = "40px";
            timelineContainer.style.padding = "0";
            timelineContainer.style.margin = "0";
          }

          if (iconCircle) {
            const isSms = iconCircle.classList.contains("bg-purple-100") || iconCircle.classList.contains("dark:bg-purple-500/15") || iconCircle.innerHTML.includes("MessageSquare");
            
            if (isDark) {
              iconCircle.style.backgroundColor = isSms ? "rgba(168, 85, 247, 0.15)" : "rgba(34, 197, 94, 0.15)";
              iconCircle.style.color = isSms ? "#c084fc" : "#4ade80";
            } else {
              iconCircle.style.backgroundColor = isSms ? "#f3e8ff" : "#dcfce7";
              iconCircle.style.color = isSms ? "#9333ea" : "#16a34a";
            }
            
            iconCircle.style.borderRadius = "9999px";
            iconCircle.style.display = "flex";
            iconCircle.style.alignItems = "center";
            iconCircle.style.justifyContent = "center";
            iconCircle.style.width = "32px";
            iconCircle.style.height = "32px";
            iconCircle.style.minWidth = "32px";
            iconCircle.style.minHeight = "32px";
            iconCircle.style.flexShrink = "0";
          }

          if (verticalLine) {
            verticalLine.style.backgroundColor = isDark ? "#27272a" : "#e5e7eb";
            verticalLine.style.width = "2px";
            verticalLine.style.flex = "1";
            verticalLine.style.marginTop = "8px";
          }

          const card = clone.querySelector(".flex-1 > div") as HTMLElement;
          if (card) {
            card.style.backgroundColor = cardBg;
            card.style.borderColor = cardBorder;
            card.style.borderRadius = "14px";
            card.style.padding = "16px";
            card.style.borderWidth = "1px";
            card.style.color = textColor;
            card.style.boxShadow = "none";
            
            // Fix header inside card
            const cardHeader = card.querySelector(".border-b") as HTMLElement;
            if (cardHeader) cardHeader.style.borderColor = isDark ? "#27272a" : "#f3f4f6";

            // Fix Badges visibility (SMS/Call tags)
            const badges = card.querySelectorAll(".inline-flex");
            badges.forEach((badge) => {
              const b = badge as HTMLElement;
              b.style.opacity = "1";
              b.style.visibility = "visible";
              
              // If it's the outline variant (SMS/Call)
              if (b.classList.contains("border-input") || b.classList.contains("border") || b.classList.contains("border-outline")) {
                b.style.color = isDark ? "#d4d4d8" : "#4b5563";
                b.style.borderColor = isDark ? "#3f3f46" : "#d1d5db";
                b.style.backgroundColor = "transparent";
              } 
              // If it's the secondary variant (Sender/Receiver)
              else {
                if (b.innerText.includes("Sender")) {
                  if (isDark) {
                    b.style.backgroundColor = "rgba(34, 197, 94, 0.15)";
                    b.style.color = "#4ade80";
                    b.style.borderColor = "rgba(34, 197, 94, 0.3)";
                  } else {
                    b.style.backgroundColor = "#dcfce7";
                    b.style.color = "#15803d";
                  }
                } else if (b.innerText.includes("Receiver")) {
                  if (isDark) {
                    b.style.backgroundColor = "rgba(59, 130, 246, 0.15)";
                    b.style.color = "#60a5fa";
                    b.style.borderColor = "rgba(59, 130, 246, 0.3)";
                  } else {
                    b.style.backgroundColor = "#dbeafe";
                    b.style.color = "#1d4ed8";
                  }
                }
              }
            });
          }

          messagesContainer.appendChild(clone);
        }
      });

      // 4. Final Polish & Export
      const footer = document.createElement("div");
      footer.style.marginTop = "40px";
      footer.style.paddingTop = "24px";
      footer.style.borderTop = `1px solid ${borderColor}`;
      footer.style.textAlign = "center";
      footer.innerHTML = `<p style="font-size: 12px; color: ${isDark ? "#52525b" : "#9ca3af"}; font-weight: 500;">VisualRecords • Generated Local Session</p>`;
      container.appendChild(footer);

      if (addedCount === 0) {
        throw new Error("No messages found to export. Ensure the conversation view is visible.");
      }

      // Wait longer for browser to paint the hidden element
      await new Promise((resolve) => setTimeout(resolve, 500));

      const dataUrl = await toPng(container, {
        backgroundColor: bgColor,
        pixelRatio: 2,
        cacheBust: true,
        style: {
          transform: "none",
          left: "0",
          top: "0"
        }
      });

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `Evidence-${currentConversation.participant1Display.split(' ')[0]}-${new Date().getTime()}.png`;
      link.click();

      document.body.removeChild(container);
      if (isSelectionMode) {
        setIsSelectionMode(false);
        setSelectedMessages(new Set());
      }
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed: " + (error instanceof Error ? error.message : "Check console for details"));
    } finally {
      setIsExporting(false);
    }
  };

  // Function to render message content with embedded images
  const renderMessageContent = (message: ConversationMessage) => {
    const content = message["Message Body"] || "";

    // Check if message contains Image links (Imgur or Ibb.co)
    const imageRegex =
      /(https?:\/\/(?:i\.imgur\.com\/[a-zA-Z0-9]+\.(?:jpg|jpeg|png|gif)|i\.ibb\.co\/[a-zA-Z0-9]+\/[a-zA-Z0-9-]+\.(?:jpg|jpeg|png|gif)))/gi;
    const matches = content.match(imageRegex);

    if (matches && matches.length > 0) {
      return (
        <div className="space-y-2">
          {/* Text content (if any text besides the image links) */}
          {content.replace(imageRegex, "").trim() && (
            <p className="text-sm">{content.replace(imageRegex, "").trim()}</p>
          )}

          {/* Embedded images */}
          <div className="space-y-2">
            {matches.map((imgUrl, index) => (
              <div key={index} className="relative group">
                <img
                  src={imgUrl}
                  alt="Shared image"
                  className="max-w-full max-h-64 rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  loading="lazy"
                  onClick={() => window.open(imgUrl, "_blank")}
                />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Badge
                    variant="secondary"
                    className="text-xs bg-black/50 text-white hover:bg-black/70 cursor-pointer"
                    onClick={() => window.open(imgUrl, "_blank")}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Open
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  <a
                    href={imgUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3 w-3" />
                    {imgUrl.split("/").pop()}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Regular text message
    return <p className="text-sm">{content}</p>;
  };

  if (!isMounted) return null;

  return (
    <div className="space-y-6 pb-12 -mt-4">
      {/* Premium Header */}
      <div className="relative p-6 rounded-3xl overflow-hidden border bg-card/50 backdrop-blur-xl shadow-2xl mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
              Timeline View
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/50 bg-clip-text text-transparent">
              Messages & Calls
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl leading-relaxed">
              Read full conversations and view complete call history.
            </p>
          </div>
          
          <div className="w-full md:w-auto">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as typeof activeTab)}
              className="w-full"
            >
              <TabsList className="bg-muted/50 p-1 border rounded-xl w-full md:w-auto">
                <TabsTrigger value="all" className="rounded-lg px-6 transition-all">All ({conversations.length})</TabsTrigger>
                <TabsTrigger value="messages" className="rounded-lg px-6 transition-all">Messages</TabsTrigger>
                <TabsTrigger value="calls" className="rounded-lg px-6 transition-all">Calls</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 h-[calc(100vh-280px)] min-h-[600px] min-w-0">
        {/* Conversations List */}
        <Card className="lg:col-span-1 overflow-hidden flex flex-col min-w-0 border shadow-sm bg-card/30 backdrop-blur-sm">
          <div className="p-4 border-b">
            <h3 className="text-lg font-bold tracking-tight mb-3">Recent Activity</h3>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search names or messages..."
                className="pl-9 bg-background/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-2 p-3">
                <AnimatePresence initial={false}>
                  {filteredConversations.map((conversation) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      key={conversation.conversationKey}
                      className={`p-3 pr-4 rounded-lg cursor-pointer transition-colors ${
                        currentConversation?.conversationKey ===
                        conversation.conversationKey
                          ? "bg-muted"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() =>
                        setSelectedConversation(conversation.conversationKey)
                      }
                    >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0 flex-1">
                        {conversation.hasUnknownParticipants ? (
                          <UserX className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                        ) : (
                          <Users className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5 mb-1 min-w-0">
                            <p className="font-bold text-sm truncate max-w-[80px] sm:max-w-[120px] lg:max-w-[100px] xl:max-w-none text-foreground">
                              {conversation.participant1Display}
                            </p>
                            <ArrowLeftRight className="h-3 w-3 text-muted-foreground shrink-0 opacity-70" />
                            <p className="font-bold text-sm truncate max-w-[80px] sm:max-w-[120px] lg:max-w-[100px] xl:max-w-none text-foreground">
                              {conversation.participant2Display}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {conversation.messages[
                              conversation.messages.length - 1
                            ]?.isSMS
                              ? (() => {
                                  const lastMessage =
                                    conversation.messages[
                                      conversation.messages.length - 1
                                    ]["Message Body"] || "Message";
                                  const hasImage =
                                    lastMessage.includes("i.imgur.com") ||
                                    lastMessage.includes("i.ibb.co");
                                  return hasImage ? "📷 Image" : lastMessage;
                                })()
                              : "Call"}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0 self-start ml-auto">
                        <div className="flex gap-1 flex-wrap justify-end">
                          {conversation.messageCount > 0 && (
                            <Badge variant="secondary" className="h-4 text-[9px] px-1 font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border-none">
                              {conversation.messageCount}
                            </Badge>
                          )}
                          {conversation.callCount > 0 && (
                            <Badge variant="secondary" className="h-4 text-[9px] px-1 font-bold bg-green-500/10 text-green-600 dark:text-green-400 border-none">
                              {conversation.callCount}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[9px] font-bold text-muted-foreground/80 uppercase tracking-tighter whitespace-nowrap">
                          {parseExcelDate(
                            conversation.lastActivity,
                          ).toLocaleDateString("en-US")}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Conversation History */}
        <Card className="lg:col-span-2 flex flex-col overflow-hidden min-w-0 border shadow-sm bg-card/30 backdrop-blur-sm">
          <div className="p-4 border-b bg-card/50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">
                  {currentConversation ? (
                    <div className="flex items-center gap-2">
                      <span className="text-foreground">{currentConversation.participant1Display}</span>
                      <ArrowLeftRight className="h-4 w-4 text-muted-foreground opacity-50" />
                      <span className="text-foreground">{currentConversation.participant2Display}</span>
                    </div>
                  ) : (
                    "Select a chat"
                  )}
                </h3>
                <div className="text-xs text-muted-foreground mt-1 font-medium">
                  {currentConversation && (
                    <div className="flex items-center gap-3">
                      <span>{currentConversation.messageCount} messages</span>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                      <span>{currentConversation.callCount} calls</span>
                    </div>
                  )}
                </div>
              </div>
              {currentConversation && (
                <div className="flex items-center gap-2">
                  <Button
                    variant={isSelectionMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsSelectionMode(!isSelectionMode)}
                    disabled={isExporting}
                  >
                    {isSelectionMode ? (
                      <>
                        <CheckSquare className="h-4 w-4 mr-2" />
                        Cancel Selection
                      </>
                    ) : (
                      <>
                        <Square className="h-4 w-4 mr-2" />
                        Select Messages
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    disabled={
                      isExporting ||
                      (isSelectionMode && selectedMessages.size === 0)
                    }
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {isExporting
                      ? "Exporting..."
                      : isSelectionMode
                        ? `Export (${selectedMessages.size})`
                        : "Export All"}
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="p-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div id="conversation-container" className="space-y-4 p-4 pb-2">
                {currentConversation ? (
                  currentConversation.messages.map((message, index) => (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.05, 0.5) }}
                      key={`${currentConversation.conversationKey}-${index}`}
                      data-message-index={index}
                      className="flex gap-4 group"
                    >
                      {/* Timeline indicator */}
                      <div className="flex flex-col items-center shrink-0">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            message.isSMS
                              ? "bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400"
                              : "bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400"
                          }`}
                        >
                          {message.isSMS ? (
                            <MessageSquare className="h-4 w-4" />
                          ) : (
                            <Phone className="h-4 w-4" />
                          )}
                        </div>
                        {index < currentConversation.messages.length - 1 && (
                          <div className="w-0.5 h-full bg-border mt-2" />
                        )}
                      </div>

                      {/* Message content */}
                      <div className="flex-1 pb-2">
                        <div
                          className={`bg-muted/50 rounded-lg p-3 border transition-all relative ${
                            isSelectionMode
                              ? selectedMessages.has(index)
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "hover:border-primary/50 cursor-pointer"
                              : ""
                          }`}
                          onClick={() =>
                            isSelectionMode && toggleMessageSelection(index)
                          }
                        >
                          {/* Selection indicator */}
                          {isSelectionMode && selectedMessages.has(index) && (
                            <div className="absolute top-2 right-2 selection-checkbox">
                              <CheckSquare className="h-5 w-5 text-primary" />
                            </div>
                          )}
                           {/* Header with participants */}
                           <div className="flex items-center justify-between mb-2 pb-2 border-b">
                             <div className="flex flex-col">
                               <div className="flex items-center gap-2 group/name">
                                 {getDisplayInfo(message["Sender Number"]).isUnknown && (
                                   <UserX className="h-3 w-3 text-orange-500 shrink-0" />
                                 )}
                                 <span className={`font-bold text-sm ${getDisplayInfo(message["Sender Number"]).isUnknown ? 'text-orange-500/90' : 'text-foreground'}`}>
                                   {getDisplayName(message["Sender Number"])}
                                 </span>
                                 <Button 
                                   variant="ghost" 
                                   size="icon" 
                                   className="h-5 w-5 opacity-0 group-hover/name:opacity-100 transition-opacity export-hidden"
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     openContactDialog(message["Sender Number"]);
                                   }}
                                 >
                                   <Edit2 className="h-3 w-3" />
                                 </Button>
                               </div>
                               <span className="text-[10px] uppercase font-bold tracking-tight text-muted-foreground/70">
                                 {formatTimestamp(message.Timestamp)}
                               </span>
                             </div>
                            <div className="flex gap-2">
                              <Badge variant="secondary" className="text-[10px] font-bold bg-muted border-transparent shadow-none">
                                {message.isSMS ? "SMS" : "Call"}
                              </Badge>
                              {message.isSMS && (
                                <Badge
                                  variant="secondary"
                                  className={`text-[10px] font-bold border-transparent shadow-none ${
                                    message["Sender Number"] === mainPhoneNumber
                                      ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                      : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                  }`}
                                >
                                  {message["Sender Number"] === mainPhoneNumber
                                    ? "Sent"
                                    : "Received"}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Content */}
                          {message.isSMS ? (
                            <div className="text-sm">
                              {renderMessageContent(message)}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              {message["Call Info"] && (
                                <p>{message["Call Info"]}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a conversation to view communications</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </Card>
      </div>
      {/* Quick Contact Edit Dialog */}
      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent className="sm:max-w-[425px] border bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Identify Contact
            </DialogTitle>
            <DialogDescription>
              Assign a name to this phone number to update your records.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider opacity-70">Phone Number</Label>
              <Input
                id="phone"
                value={editingPhone}
                readOnly
                className="font-mono bg-muted/50 border-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider opacity-70">Display Name</Label>
              <Input
                id="name"
                placeholder="Enter contact name..."
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && saveContact()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsContactDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveContact} className="gap-2">
              <Save className="h-4 w-4" />
              Save Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
