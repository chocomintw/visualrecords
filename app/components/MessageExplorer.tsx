'use client';

import { ParsedData } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, MessageSquare, Phone, User, UserX, Calendar, ExternalLink } from 'lucide-react';
import { useState, useMemo } from 'react';

interface MessageExplorerProps {
  data: ParsedData;
}

interface ConversationMessage {
  'SMS #'?: string;
  'Call #'?: string;
  'Sender Number': string;
  'Receiver Number': string;
  'Message Body'?: string;
  Type: 'Sender' | 'Receiver';
  Timestamp: string;
  isSMS: boolean;
  displayName: string;
  isOutgoing: boolean;
}

interface Conversation {
  contactName: string;
  messages: ConversationMessage[];
  lastActivity: string;
  messageCount: number;
  callCount: number;
}

export default function MessageExplorer({ data }: MessageExplorerProps) {
  const { sms, calls, contacts } = data;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState<string | null>(null);

  // Process conversations
  const conversations = useMemo(() => {
    const contactMap = createContactMap(contacts);
    const conversationMap: { [key: string]: ConversationMessage[] } = {};

    // Process SMS messages
    sms.forEach((message: any) => {
      const contactNumber = message.Type === 'Sender' ? message['Receiver Number'] : message['Sender Number'];
      const contactName = contactMap[contactNumber] || `Unknown (${contactNumber})`;
      
      if (!conversationMap[contactName]) {
        conversationMap[contactName] = [];
      }
      
      conversationMap[contactName].push({
        ...message,
        isSMS: true,
        displayName: contactName,
        isOutgoing: message.Type === 'Sender'
      });
    });

    // Process calls
    calls.forEach((call: any) => {
      const contactNumber = call.Type === 'Sender' ? call['Receiver Number'] : call['Sender Number'];
      const contactName = contactMap[contactNumber] || `Unknown (${contactNumber})`;
      
      if (!conversationMap[contactName]) {
        conversationMap[contactName] = [];
      }
      
      conversationMap[contactName].push({
        ...call,
        isSMS: false,
        displayName: contactName,
        isOutgoing: call.Type === 'Sender'
      });
    });

    // Sort conversations by most recent activity (for the list)
    return Object.entries(conversationMap)
      .map(([contactName, messages]) => {
        // Sort messages chronologically (oldest first) for proper chat display
        const sortedMessages = messages.sort((a, b) => new Date(a.Timestamp).getTime() - new Date(b.Timestamp).getTime());
        
        return {
          contactName,
          messages: sortedMessages,
          lastActivity: sortedMessages[sortedMessages.length - 1]?.Timestamp, // Most recent message
          messageCount: messages.filter(m => m.isSMS).length,
          callCount: messages.filter(m => !m.isSMS).length
        };
      })
      .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()); // Most recent conversations first
  }, [sms, calls, contacts]);

  // Filter conversations based on search
  const filteredConversations = useMemo(() => {
    if (!searchTerm) return conversations;
    
    return conversations.filter(conversation =>
      conversation.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.messages.some(message =>
        message.isSMS &&
        message['Message Body']?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [conversations, searchTerm]);

  const selectedConversation = selectedContact 
    ? conversations.find(c => c.contactName === selectedContact)
    : filteredConversations[0];

  // Function to render message content with embedded images
  const renderMessageContent = (message: ConversationMessage) => {
    const content = message['Message Body'] || '';
    
    // Check if message contains Imgur links
    const imgurRegex = /(https?:\/\/i\.imgur\.com\/[a-zA-Z0-9]+\.(?:jpg|jpeg|png|gif))/gi;
    const matches = content.match(imgurRegex);
    
    if (matches && matches.length > 0) {
      return (
        <div className="space-y-2">
          {/* Text content (if any text besides the image links) */}
          {content.replace(imgurRegex, '').trim() && (
            <p className="text-sm">{content.replace(imgurRegex, '').trim()}</p>
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
                  onClick={() => window.open(imgUrl, '_blank')}
                />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Badge 
                    variant="secondary" 
                    className="text-xs bg-black/50 text-white hover:bg-black/70 cursor-pointer"
                    onClick={() => window.open(imgUrl, '_blank')}
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
                    {imgUrl.split('/').pop()}
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* Conversations List */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Conversations</CardTitle>
          <CardDescription>
            {conversations.length} contacts with messages
          </CardDescription>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts or messages..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <div className="space-y-1 p-2">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.contactName}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedConversation?.contactName === conversation.contactName
                      ? 'bg-muted'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedContact(conversation.contactName)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      {conversation.contactName.startsWith('Unknown') ? (
                        <UserX className="h-4 w-4 text-orange-500 flex-shrink-0" />
                      ) : (
                        <User className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">
                          {conversation.contactName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {conversation.messages[conversation.messages.length - 1]?.isSMS 
                            ? (() => {
                                const lastMessage = conversation.messages[conversation.messages.length - 1]['Message Body'] || 'Message';
                                // Check if last message has Imgur link for preview
                                const hasImgur = lastMessage.includes('i.imgur.com');
                                return hasImgur ? '📷 Image' : lastMessage;
                              })()
                            : 'Call'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
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

      {/* Message History */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>
            {selectedConversation ? selectedConversation.contactName : 'Select a conversation'}
          </CardTitle>
          <CardDescription>
            {selectedConversation && (
              <div className="flex items-center gap-4">
                <span>{selectedConversation.messageCount} messages</span>
                <span>{selectedConversation.callCount} calls</span>
                <span>
                  First activity: {new Date(selectedConversation.messages[0]?.Timestamp).toLocaleDateString()} - 
                  Last activity: {new Date(selectedConversation.lastActivity).toLocaleDateString()}
                </span>
              </div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <div className="space-y-4 p-6">
              {selectedConversation ? (
                selectedConversation.messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${
                      message.isOutgoing ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.isOutgoing
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {message.isSMS ? (
                        <MessageSquare className="h-4 w-4" />
                      ) : (
                        <Phone className="h-4 w-4" />
                      )}
                    </div>
                    <div
                      className={`max-w-[85%] rounded-lg p-3 ${
                        message.isOutgoing
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="secondary"
                          className={`text-xs ${
                            message.isOutgoing
                              ? 'bg-blue-400 text-white'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {message.isSMS ? 'SMS' : 'Call'}
                        </Badge>
                        <span className="text-xs opacity-70">
                          {new Date(message.Timestamp).toLocaleString()}
                        </span>
                      </div>
                      
                      {message.isSMS ? (
                        renderMessageContent(message)
                      ) : (
                        <div className="text-sm">
                          <p>
                            {message.isOutgoing ? 'Outgoing call' : 'Incoming call'} •{' '}
                            {message.Type}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a conversation to view messages</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function createContactMap(contacts: any[]): { [key: string]: string } {
  const contactMap: { [key: string]: string } = {};
  contacts.forEach((contact: any) => {
    contactMap[contact['Phone Number']] = contact['Contact Name'];
  });
  return contactMap;
}