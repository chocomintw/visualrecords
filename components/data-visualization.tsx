"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useAppStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Phone } from "lucide-react";
import { useState, useMemo } from "react";

interface CallConversation {
  contactName: string;
  calls: Array<{
    "Call #"?: string;
    "Sender Number": string;
    "Receiver Number": string;
    "Call Info": string;
    Type: "Sender" | "Receiver";
    Timestamp: string;
    isOutgoing: boolean;
  }>;
  callCount: number;
  lastActivity: string;
}

export default function DataVisualization() {
  const communicationStats = useAppStore((state) => state.communicationStats);
  const { parsedData } = useAppStore();
  const { calls, contacts, sms } = parsedData;
  const [selectedCallContact, setSelectedCallContact] = useState<string | null>(
    null,
  );

  // ⚡ Bolt: Memoize the contact map to avoid re-computing it on every render.
  // This is a significant optimization as it prevents an O(n*m) complexity
  // issue in the enhancedStats calculation below where `createContactMap` was
  // being called inside a loop.
  const contactMap = useMemo(() => createContactMap(contacts), [contacts]);

  if (!communicationStats) {
    return null;
  }

  const {
    callsPerDay,
    textsPerDay,
    textsPerContact,
    callsPerContact,
    topContactsByInteractions,
    contactsActivityByDay,
    textsPerUnknown,
    callsPerUnknown,
    topUnknownByInteractions,
    unknownNumbersByDay,
  } = communicationStats;

  // Get the main phone number from parsed data
  const mainPhoneNumber = useMemo(() => {
    return getMainPhoneNumber(calls, sms);
  }, [calls, sms]);

  // Process call conversations with proper direction guessing
  const callConversations = useMemo(() => {
    const conversationMap: { [key: string]: CallConversation } = {};

    // Process calls into conversations with proper direction
    calls.forEach((call: any) => {
      const { contactNumber, isOutgoing } = determineCallDirection(
        call,
        mainPhoneNumber,
      );
      const contactName =
        contactMap[contactNumber] || `Unknown (${contactNumber})`;

      if (!conversationMap[contactName]) {
        conversationMap[contactName] = {
          contactName,
          calls: [],
          callCount: 0,
          lastActivity: "",
        };
      }

      conversationMap[contactName].calls.push({
        ...call,
        isOutgoing,
      });
      conversationMap[contactName].callCount++;

      // Update last activity
      const callDate = new Date(call.Timestamp);
      const currentLastActivity = new Date(
        conversationMap[contactName].lastActivity || 0,
      );
      if (callDate > currentLastActivity) {
        conversationMap[contactName].lastActivity = call.Timestamp;
      }
    });

    // Sort conversations by most recent activity and sort calls chronologically
    return Object.values(conversationMap)
      .map((conversation) => ({
        ...conversation,
        calls: conversation.calls.sort(
          (a, b) =>
            new Date(a.Timestamp).getTime() - new Date(b.Timestamp).getTime(),
        ),
      }))
      .sort(
        (a, b) =>
          new Date(b.lastActivity).getTime() -
          new Date(a.lastActivity).getTime(),
      );
  }, [calls, contactMap, mainPhoneNumber]);

  const selectedCallConversation = selectedCallContact
    ? callConversations.find((c) => c.contactName === selectedCallContact)
    : callConversations[0];

  // Enhanced stats with direction information
  const enhancedStats = useMemo(() => {
    if (!communicationStats) return null;

    // ⚡ Bolt: Optimize directional stats calculation.
    // By creating lookup maps for calls by date and contact, we reduce the
    // complexity from O(n*m) to O(n+m), avoiding nested loops. This provides a
    // significant performance boost for large datasets.

    // 1. Create lookup maps in a single pass over the calls data.
    const callsByDate: { [key: string]: { outgoing: number; incoming: number } } = {};
    const callsByContact: { [key: string]: { outgoing: number; incoming: number } } = {};

    calls.forEach((call: any) => {
      const { contactNumber, isOutgoing } = determineCallDirection(
        call,
        mainPhoneNumber,
      );

      // Populate callsByDate map
      const callDate = new Date(call.Timestamp).toDateString();
      if (!callsByDate[callDate]) {
        callsByDate[callDate] = { outgoing: 0, incoming: 0 };
      }
      if (isOutgoing) {
        callsByDate[callDate].outgoing++;
      } else {
        callsByDate[callDate].incoming++;
      }

      // Populate callsByContact map
      const contactName =
        contactMap[contactNumber] || `Unknown (${contactNumber})`;
      if (!callsByContact[contactName]) {
        callsByContact[contactName] = { outgoing: 0, incoming: 0 };
      }
      if (isOutgoing) {
        callsByContact[contactName].outgoing++;
      } else {
        callsByContact[contactName].incoming++;
      }
    });

    // 2. Use the maps to efficiently enhance the stats.
    const enhancedCallsPerDay = callsPerDay.map((day) => {
      const statDate = new Date(day.date).toDateString();
      const counts = callsByDate[statDate] || { outgoing: 0, incoming: 0 };
      return {
        ...day,
        ...counts,
      };
    });

    const enhancedCallsPerContact = callsPerContact.map((contactStat) => {
      const counts = callsByContact[contactStat.name] || {
        outgoing: 0,
        incoming: 0,
      };
      return {
        ...contactStat,
        ...counts,
      };
    });

    return {
      ...communicationStats,
      enhancedCallsPerDay,
      enhancedCallsPerContact,
    };
  }, [
    communicationStats,
    calls,
    contactMap,
    mainPhoneNumber,
    callsPerDay,
    callsPerContact,
  ]);

  const COLORS = [
    "#3b82f6",
    "#10b981",
    "#8b5cf6",
    "#f59e0b",
    "#ef4444",
    "#06b6d4",
    "#84cc16",
    "#f97316",
  ];
  const UNKNOWN_COLORS = [
    "#ef4444",
    "#f97316",
    "#f59e0b",
    "#eab308",
    "#84cc16",
    "#06b6d4",
    "#8b5cf6",
    "#a855f7",
  ];
  const DIRECTION_COLORS = ["#10b981", "#3b82f6"]; // Outgoing, Incoming

  const tooltipStyle = {
    contentStyle: {
      backgroundColor: "hsl(var(--popover))",
      borderColor: "hsl(var(--border))",
      borderRadius: "var(--radius)",
      color: "hsl(var(--popover-foreground))",
    },
    itemStyle: { color: "hsl(var(--popover-foreground))" },
    labelStyle: { color: "hsl(var(--popover-foreground))" },
  };

  return (
    <div className="space-y-6">
      {/* Owner Phone Number Badge */}
      {mainPhoneNumber && (
        <div className="flex justify-center">
          <Badge variant="outline" className="px-4 py-2 text-sm">
            <Phone className="h-4 w-4 mr-2" />
            Owner: {mainPhoneNumber}
          </Badge>
        </div>
      )}

      <Tabs defaultValue="daily" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-3xl mx-auto p-0 bg-muted rounded-lg">
          <TabsTrigger
            value="daily"
            className="py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            Daily Activity
          </TabsTrigger>
          <TabsTrigger
            value="contacts"
            className="py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            Top Contacts
          </TabsTrigger>
          <TabsTrigger
            value="unknown"
            className="py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            Unknown Numbers
          </TabsTrigger>
        </TabsList>

        {/* Daily Activity Tab */}
        <TabsContent value="daily" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Enhanced Calls Per Day with Direction */}
            <Card>
              <CardHeader>
                <CardTitle>Calls Per Day</CardTitle>
                <CardDescription>
                  Daily call volume with outgoing/incoming breakdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={enhancedStats?.enhancedCallsPerDay || callsPerDay}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        });
                      }}
                    />
                    <YAxis />
                    <Tooltip
                      {...tooltipStyle}
                      labelFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString("en-US", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        });
                      }}
                    />
                    <Legend />
                    {enhancedStats?.enhancedCallsPerDay ? (
                      <>
                        <Bar
                          dataKey="outgoing"
                          fill="#10b981"
                          name="Outgoing Calls"
                          isAnimationActive={false}
                        />
                        <Bar
                          dataKey="incoming"
                          fill="#3b82f6"
                          name="Incoming Calls"
                          isAnimationActive={false}
                        />
                      </>
                    ) : (
                      <Bar
                        dataKey="count"
                        fill="#10b981"
                        name="Calls"
                        isAnimationActive={false}
                      />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Texts Per Day */}
            <Card>
              <CardHeader>
                <CardTitle>Texts Per Day</CardTitle>
                <CardDescription>Daily SMS volume over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={textsPerDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        });
                      }}
                    />
                    <YAxis />
                    <Tooltip
                      {...tooltipStyle}
                      labelFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString("en-US", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        });
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="#3b82f6"
                      name="Texts"
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Top Contacts Tab */}
        <TabsContent value="contacts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Texts Per Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Texts Per Contact</CardTitle>
                <CardDescription>Top contacts by SMS volume</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={textsPerContact}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      isAnimationActive={false}
                    >
                      {textsPerContact.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      {...tooltipStyle}
                      formatter={(value) => [`${value} texts`, "Count"]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Enhanced Calls Per Contact with Direction */}
            <Card>
              <CardHeader>
                <CardTitle>Calls Per Contact</CardTitle>
                <CardDescription>
                  Top contacts by call volume with direction
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={
                      enhancedStats?.enhancedCallsPerContact || callsPerContact
                    }
                    layout="vertical"
                    margin={{ left: 100, right: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      width={90}
                    />
                    <Tooltip {...tooltipStyle} />
                    <Legend />
                    {enhancedStats?.enhancedCallsPerContact ? (
                      <>
                        <Bar
                          dataKey="outgoing"
                          fill="#10b981"
                          name="Outgoing"
                          isAnimationActive={false}
                        />
                        <Bar
                          dataKey="incoming"
                          fill="#3b82f6"
                          name="Incoming"
                          isAnimationActive={false}
                        />
                      </>
                    ) : (
                      <Bar
                        dataKey="value"
                        fill="#10b981"
                        name="Calls"
                        isAnimationActive={false}
                      />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Contacts Activity Over Time */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Contacts Activity Over Time</CardTitle>
                <CardDescription>
                  Daily interactions with known contacts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={contactsActivityByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        });
                      }}
                    />
                    <YAxis />
                    <Tooltip
                      {...tooltipStyle}
                      labelFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString("en-US", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        });
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="texts"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Contact Texts"
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="calls"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Contact Calls"
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Contacts - Total Interactions */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Top Contacts - Total Interactions</CardTitle>
                <CardDescription>
                  Combined calls and texts for top contacts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={topContactsByInteractions} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={100}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip {...tooltipStyle} />
                    <Legend />
                    <Bar
                      dataKey="texts"
                      fill="#3b82f6"
                      name="Texts"
                      isAnimationActive={false}
                    />
                    <Bar
                      dataKey="calls"
                      fill="#10b981"
                      name="Calls"
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Unknown Numbers Tab */}
        <TabsContent value="unknown" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Texts From Unknown Numbers */}
            <Card>
              <CardHeader>
                <CardTitle>Texts From Unknown Numbers</CardTitle>
                <CardDescription>
                  Top unknown numbers by SMS volume
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={textsPerUnknown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      isAnimationActive={false}
                    >
                      {textsPerUnknown.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={UNKNOWN_COLORS[index % UNKNOWN_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      {...tooltipStyle}
                      formatter={(value) => [`${value} texts`, "Count"]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Calls From Unknown Numbers */}
            <Card>
              <CardHeader>
                <CardTitle>Calls From Unknown Numbers</CardTitle>
                <CardDescription>
                  Top unknown numbers by call volume
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={callsPerUnknown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      isAnimationActive={false}
                    >
                      {callsPerUnknown.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={UNKNOWN_COLORS[index % UNKNOWN_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      {...tooltipStyle}
                      formatter={(value) => [`${value} calls`, "Count"]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Unknown Numbers Activity Over Time */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Unknown Numbers Activity Over Time</CardTitle>
                <CardDescription>
                  Daily unknown number interactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={unknownNumbersByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        });
                      }}
                    />
                    <YAxis />
                    <Tooltip
                      {...tooltipStyle}
                      labelFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString("en-US", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        });
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="texts"
                      stroke="#ef4444"
                      strokeWidth={2}
                      name="Unknown Texts"
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="calls"
                      stroke="#f97316"
                      strokeWidth={2}
                      name="Unknown Calls"
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Unknown Numbers - Total Interactions */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Top Unknown Numbers - Total Interactions</CardTitle>
                <CardDescription>
                  Combined calls and texts for unknown numbers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={topUnknownByInteractions} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={120}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip {...tooltipStyle} />
                    <Legend />
                    <Bar
                      dataKey="texts"
                      fill="#ef4444"
                      name="Texts"
                      isAnimationActive={false}
                    />
                    <Bar
                      dataKey="calls"
                      fill="#f97316"
                      name="Calls"
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Enhanced helper functions with phone number guessing
function createContactMap(contacts: any[]): { [key: string]: string } {
  const contactMap: { [key: string]: string } = {};
  contacts.forEach((contact: any) => {
    contactMap[contact["Phone Number"]] = contact["Contact Name"];
  });
  return contactMap;
}

function getMainPhoneNumber(calls: any[], sms: any[]): string {
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

  const sortedPhones = Object.entries(phoneCount).sort(([, a], [, b]) => b - a);
  return sortedPhones[0]?.[0] || "";
}

// And update the determineCallDirection function to be more robust:

function determineCallDirection(
  call: any,
  mainPhoneNumber: string,
): { contactNumber: string; isOutgoing: boolean } {
  const sender = call["Sender Number"]?.trim() || "";
  const receiver = call["Receiver Number"]?.trim() || "";

  if (!mainPhoneNumber) {
    return { contactNumber: receiver || sender, isOutgoing: true };
  }

  // Use the Type field if available (from our parsing logic)
  if (call.Type === "Sender") {
    return { contactNumber: receiver, isOutgoing: true };
  } else if (call.Type === "Receiver") {
    return { contactNumber: sender, isOutgoing: false };
  }

  // Fallback to phone number comparison
  if (sender === mainPhoneNumber) {
    return { contactNumber: receiver, isOutgoing: true };
  } else if (receiver === mainPhoneNumber) {
    return { contactNumber: sender, isOutgoing: false };
  } else {
    // Final fallback - assume outgoing if we can't determine
    return { contactNumber: receiver || sender, isOutgoing: true };
  }
}
