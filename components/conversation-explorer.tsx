"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, MessageSquare, Phone, User, UserX, ExternalLink, Users, ArrowLeftRight } from "lucide-react"
import { useState, useMemo } from "react"
import { useAppStore } from "@/lib/store"

interface ConversationMessage {
    "SMS #"?: string
    "Call #"?: string
    "Sender Number": string
    "Receiver Number": string
    "Message Body"?: string
    "Call Info"?: string
    Type: "Sender" | "Receiver"
    Timestamp: string
    isSMS: boolean
    participant1: string
    participant2: string
    participant1Display: string
    participant2Display: string
}

interface Conversation {
    conversationKey: string
    participant1Display: string
    participant2Display: string
    messages: ConversationMessage[]
    lastActivity: string
    messageCount: number
    callCount: number
    hasUnknownParticipants: boolean
}

export default function ConversationExplorer() {
    const { parsedData } = useAppStore()
    const { sms, calls, contacts } = parsedData
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<"all" | "messages" | "calls">("all")

    // Create contact lookup map
    const contactMap = useMemo(() => {
        const map: { [key: string]: string } = {}
        contacts.forEach((contact: any) => {
            map[contact["Phone Number"]] = contact["Contact Name"]
        })
        return map
    }, [contacts])

    // Helper to get display name for a phone number
    const getDisplayName = (phoneNumber: string): string => {
        const contactName = contactMap[phoneNumber]
        if (contactName) {
            return `${contactName} (${phoneNumber})`
        }
        return `Unknown (${phoneNumber})`
    }

    // Helper to detect the main phone number (user's own number)
    const mainPhoneNumber = useMemo(() => {
        // Try to get from the Type field in calls and SMS first
        const sentCalls = calls.filter((call: any) => call.Type === "Sender")
        const sentSMS = sms.filter((message: any) => message.Type === "Sender")

        if (sentCalls.length > 0 && sentCalls[0]["Sender Number"]) {
            return sentCalls[0]["Sender Number"]
        }
        if (sentSMS.length > 0 && sentSMS[0]["Sender Number"]) {
            return sentSMS[0]["Sender Number"]
        }

        // Fallback: count occurrences of each phone number
        const phoneCount: { [key: string]: number } = {}

        const allItems = [...calls, ...sms]
        allItems.forEach((item: any) => {
            if (item["Sender Number"] && item["Sender Number"].trim()) {
                const sender = item["Sender Number"].trim()
                phoneCount[sender] = (phoneCount[sender] || 0) + 1
            }
            if (item["Receiver Number"] && item["Receiver Number"].trim()) {
                const receiver = item["Receiver Number"].trim()
                phoneCount[receiver] = (phoneCount[receiver] || 0) + 1
            }
        })

        const sortedPhones = Object.entries(phoneCount).sort(([, a], [, b]) => b - a)
        return sortedPhones[0]?.[0] || ""
    }, [sms, calls])

    // Helper to create a unique conversation key from two phone numbers
    const getConversationKey = (num1: string, num2: string): string => {
        // Sort numbers to ensure same conversation regardless of order
        return [num1, num2].sort().join("|||")
    }

    // Process all conversations
    const conversations = useMemo(() => {
        const conversationMap: { [key: string]: ConversationMessage[] } = {}

        // Deduplicate SMS messages by Sender, Receiver, Timestamp and Body
        // ignoring SMS # which might differ between sender/receiver copies
        const seenSMS = new Set<string>()
        const uniqueSMS = sms.filter((message: any) => {
            // Create a robust unique key using content and metadata
            // Normalize by trimming and lowercasing to handle minor differences in imports (CSV vs XLSX)
            const sender = String(message["Sender Number"] || "").replace(/\D/g, "")
            const receiver = String(message["Receiver Number"] || "").replace(/\D/g, "")
            const body = String(message["Message Body"] || "").toLowerCase().replace(/\s+/g, "")

            let timestamp = String(message.Timestamp || "").trim()
            try {
                const date = new Date(timestamp)
                if (!isNaN(date.getTime())) {
                    timestamp = date.toISOString()
                } else {
                    timestamp = timestamp.toLowerCase()
                }
            } catch (e) {
                timestamp = timestamp.toLowerCase()
            }

            const key = `${sender}-${receiver}-${timestamp}-${body}`

            if (seenSMS.has(key)) {
                return false
            }
            seenSMS.add(key)
            return true
        })

        // Process SMS messages
        uniqueSMS.forEach((message: any) => {
            const sender = message["Sender Number"]
            const receiver = message["Receiver Number"]
            const conversationKey = getConversationKey(sender, receiver)

            if (!conversationMap[conversationKey]) {
                conversationMap[conversationKey] = []
            }

            conversationMap[conversationKey].push({
                ...message,
                isSMS: true,
                participant1: sender,
                participant2: receiver,
                participant1Display: getDisplayName(sender),
                participant2Display: getDisplayName(receiver),
            })
        })

        // Process calls
        calls.forEach((call: any) => {
            const sender = call["Sender Number"]
            const receiver = call["Receiver Number"]
            const conversationKey = getConversationKey(sender, receiver)

            if (!conversationMap[conversationKey]) {
                conversationMap[conversationKey] = []
            }

            conversationMap[conversationKey].push({
                ...call,
                isSMS: false,
                participant1: sender,
                participant2: receiver,
                participant1Display: getDisplayName(sender),
                participant2Display: getDisplayName(receiver),
            })
        })

        // Convert to array and sort
        return Object.entries(conversationMap)
            .map(([conversationKey, messages]) => {
                // Sort messages chronologically
                const sortedMessages = messages.sort(
                    (a, b) => new Date(a.Timestamp).getTime() - new Date(b.Timestamp).getTime(),
                )

                // Get display names from first message (they're all the same for a conversation)
                const firstMsg = sortedMessages[0]
                const hasUnknown =
                    firstMsg.participant1Display.startsWith("Unknown") ||
                    firstMsg.participant2Display.startsWith("Unknown")

                return {
                    conversationKey,
                    participant1Display: firstMsg.participant1Display,
                    participant2Display: firstMsg.participant2Display,
                    messages: sortedMessages,
                    lastActivity: sortedMessages[sortedMessages.length - 1]?.Timestamp,
                    messageCount: messages.filter((m) => m.isSMS).length,
                    callCount: messages.filter((m) => !m.isSMS).length,
                    hasUnknownParticipants: hasUnknown,
                }
            })
            .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
    }, [sms, calls, contactMap])

    // Filter conversations based on active tab
    const tabFilteredConversations = useMemo(() => {
        if (activeTab === "messages") {
            return conversations.filter((c) => c.messageCount > 0)
        } else if (activeTab === "calls") {
            return conversations.filter((c) => c.callCount > 0)
        }
        return conversations
    }, [conversations, activeTab])

    // Filter conversations based on search
    const filteredConversations = useMemo(() => {
        if (!searchTerm) return tabFilteredConversations

        return tabFilteredConversations.filter(
            (conversation) =>
                conversation.participant1Display.toLowerCase().includes(searchTerm.toLowerCase()) ||
                conversation.participant2Display.toLowerCase().includes(searchTerm.toLowerCase()) ||
                conversation.messages.some(
                    (message) => message.isSMS && message["Message Body"]?.toLowerCase().includes(searchTerm.toLowerCase()),
                ),
        )
    }, [tabFilteredConversations, searchTerm])

    // Get current conversation and filter its messages based on active tab
    const currentConversation = useMemo(() => {
        const conversation = selectedConversation
            ? conversations.find((c) => c.conversationKey === selectedConversation)
            : filteredConversations[0]

        if (!conversation) return null

        // Filter messages based on active tab
        let filteredMessages = conversation.messages
        if (activeTab === "messages") {
            filteredMessages = conversation.messages.filter(m => m.isSMS)
        } else if (activeTab === "calls") {
            filteredMessages = conversation.messages.filter(m => !m.isSMS)
        }

        return {
            ...conversation,
            messages: filteredMessages
        }
    }, [selectedConversation, conversations, filteredConversations, activeTab])

    // Function to render message content with embedded images
    const renderMessageContent = (message: ConversationMessage) => {
        const content = message["Message Body"] || ""

        // Check if message contains Imgur links
        const imgurRegex = /(https?:\/\/i\.imgur\.com\/[a-zA-Z0-9]+\.(?:jpg|jpeg|png|gif))/gi
        const matches = content.match(imgurRegex)

        if (matches && matches.length > 0) {
            return (
                <div className="space-y-2">
                    {/* Text content (if any text besides the image links) */}
                    {content.replace(imgurRegex, "").trim() && (
                        <p className="text-sm">{content.replace(imgurRegex, "").trim()}</p>
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
            )
        }

        // Regular text message
        return <p className="text-sm">{content}</p>
    }

    return (
        <div className="space-y-6">
            {/* Header with Tabs */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Conversation Explorer</CardTitle>
                    <CardDescription className="text-base">
                        View all communications between participants. Direction indicators removed due to unreliable tracking.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="all" className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                All ({conversations.length})
                            </TabsTrigger>
                            <TabsTrigger value="messages" className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Messages ({conversations.filter((c) => c.messageCount > 0).length})
                            </TabsTrigger>
                            <TabsTrigger value="calls" className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                Calls ({conversations.filter((c) => c.callCount > 0).length})
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
                {/* Conversations List */}
                <Card className="lg:col-span-1">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-xl">Conversations</CardTitle>
                        <CardDescription className="text-base">{filteredConversations.length} conversations</CardDescription>
                        <div className="relative mt-2">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search participants or messages..."
                                className="pl-10 py-2"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[580px]">
                            <div className="space-y-2 p-3">
                                {filteredConversations.map((conversation) => (
                                    <div
                                        key={conversation.conversationKey}
                                        className={`p-3 rounded-lg cursor-pointer transition-colors ${currentConversation?.conversationKey === conversation.conversationKey
                                            ? "bg-muted"
                                            : "hover:bg-muted/50"
                                            }`}
                                        onClick={() => setSelectedConversation(conversation.conversationKey)}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-start gap-2 min-w-0 flex-1">
                                                {conversation.hasUnknownParticipants ? (
                                                    <UserX className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                                                ) : (
                                                    <Users className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                                )}
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <p className="font-medium text-sm truncate">{conversation.participant1Display}</p>
                                                        <ArrowLeftRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                                        <p className="font-medium text-sm truncate">{conversation.participant2Display}</p>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {conversation.messages[conversation.messages.length - 1]?.isSMS
                                                            ? (() => {
                                                                const lastMessage =
                                                                    conversation.messages[conversation.messages.length - 1]["Message Body"] || "Message"
                                                                const hasImgur = lastMessage.includes("i.imgur.com")
                                                                return hasImgur ? "📷 Image" : lastMessage
                                                            })()
                                                            : "Call"}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                                <div className="flex gap-1">
                                                    {conversation.messageCount > 0 && (
                                                        <Badge variant="secondary" className="h-5 text-xs">
                                                            <MessageSquare className="h-3 w-3 mr-1" />
                                                            {conversation.messageCount}
                                                        </Badge>
                                                    )}
                                                    {conversation.callCount > 0 && (
                                                        <Badge variant="secondary" className="h-5 text-xs">
                                                            <Phone className="h-3 w-3 mr-1" />
                                                            {conversation.callCount}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(conversation.lastActivity).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Conversation History */}
                <Card className="lg:col-span-2">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-xl">
                            {currentConversation ? (
                                <div className="flex items-center gap-2">
                                    <span>{currentConversation.participant1Display}</span>
                                    <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                                    <span>{currentConversation.participant2Display}</span>
                                </div>
                            ) : (
                                "Select a conversation"
                            )}
                        </CardTitle>
                        <CardDescription className="text-base">
                            {currentConversation && (
                                <div className="flex items-center gap-4">
                                    <span>{currentConversation.messageCount} messages</span>
                                    <span>{currentConversation.callCount} calls</span>
                                    <span>
                                        First: {new Date(currentConversation.messages[0]?.Timestamp).toLocaleDateString()} - Last:{" "}
                                        {new Date(currentConversation.lastActivity).toLocaleDateString()}
                                    </span>
                                </div>
                            )}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[640px]">
                            <div className="space-y-4 p-4 pb-2">
                                {currentConversation ? (
                                    currentConversation.messages.map((message, index) => (
                                        <div key={index} className="flex gap-3">
                                            {/* Timeline indicator */}
                                            <div className="flex flex-col items-center flex-shrink-0">
                                                <div
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center ${message.isSMS ? "bg-purple-100 text-purple-600" : "bg-green-100 text-green-600"
                                                        }`}
                                                >
                                                    {message.isSMS ? <MessageSquare className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
                                                </div>
                                                {index < currentConversation.messages.length - 1 && (
                                                    <div className="w-0.5 h-full bg-border mt-2" />
                                                )}
                                            </div>

                                            {/* Message content */}
                                            <div className="flex-1 pb-2">
                                                <div className="bg-muted/50 rounded-lg p-3 border">
                                                    {/* Header with participants */}
                                                    <div className="flex items-center justify-between mb-2 pb-2 border-b">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-sm">
                                                                {getDisplayName(message["Sender Number"])}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {new Date(message.Timestamp).toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Badge variant="outline" className="text-xs">
                                                                {message.isSMS ? "SMS" : "Call"}
                                                            </Badge>
                                                            {message.isSMS && (
                                                                <Badge
                                                                    variant="secondary"
                                                                    className={`text-xs ${message["Sender Number"] === mainPhoneNumber
                                                                        ? "bg-green-100 text-green-700 border-green-200"
                                                                        : "bg-blue-100 text-blue-700 border-blue-200"
                                                                        }`}
                                                                >
                                                                    {message["Sender Number"] === mainPhoneNumber ? "Sender" : "Receiver"}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Content */}
                                                    {message.isSMS ? (
                                                        <div className="text-sm">{renderMessageContent(message)}</div>
                                                    ) : (
                                                        <div className="text-sm text-muted-foreground">
                                                            {message["Call Info"] && (
                                                                <p>{message["Call Info"]}</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-muted-foreground py-8">
                                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>Select a conversation to view communications</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
