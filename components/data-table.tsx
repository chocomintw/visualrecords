"use client";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Phone, MessageSquare, Users, UserX, Calendar } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useMemo } from "react";

export default function DataTable() {
  const { parsedData } = useAppStore();
  const { sms, calls, contacts } = parsedData;

  // ⚡ Bolt: Memoize the results of these expensive data processing functions.
  // By using useMemo, we ensure that these functions are only re-run when the
  // underlying data (sms, calls, contacts) actually changes. This prevents
  // unnecessary re-calculations on every render, significantly improving the
  // performance of the DataTable component, especially with large datasets.
  const dailyActivity = useMemo(
    () => processDailyActivity(sms, calls),
    [sms, calls],
  );
  const contactInteractions = useMemo(
    () => processContactInteractions(sms, calls, contacts),
    [sms, calls, contacts],
  );
  const unknownNumberInteractions = useMemo(
    () => processUnknownNumberInteractions(sms, calls, contacts),
    [sms, calls, contacts],
  );

  return (
    <div className="space-y-6">
      <Tabs defaultValue="daily" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto p-0 bg-muted rounded-lg">
          <TabsTrigger
            value="daily"
            className="flex items-center gap-2 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Calendar className="h-4 w-4" />
            Daily Activity
          </TabsTrigger>
          <TabsTrigger
            value="contacts"
            className="flex items-center gap-2 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Users className="h-4 w-4" />
            Contact Interactions
          </TabsTrigger>
          <TabsTrigger
            value="unknown"
            className="flex items-center gap-2 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <UserX className="h-4 w-4" />
            Unknown Numbers
          </TabsTrigger>
        </TabsList>

        {/* Daily Activity Tab */}
        <TabsContent value="daily" className="mt-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Calendar className="h-5 w-5" />
                Daily Communication Activity
              </CardTitle>
              <CardDescription className="text-base">
                Complete breakdown of SMS and call activity by date
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 px-6">
              <Table>
                <TableCaption>
                  Total: {dailyActivity.length} days of activity • {sms.length}{" "}
                  texts • {calls.length} calls
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Date</TableHead>
                    <TableHead className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <MessageSquare className="h-4 w-4 text-blue-500" />
                        Texts
                      </div>
                    </TableHead>
                    <TableHead className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Phone className="h-4 w-4 text-green-500" />
                        Calls
                      </div>
                    </TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-right">Activity Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyActivity.map((day, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {new Date(day.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200"
                        >
                          {day.texts}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          {day.calls}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {day.total}
                      </TableCell>
                      <TableCell className="text-right">
                        <ActivityLevelBadge count={day.total} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Interactions Tab */}
        <TabsContent value="contacts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Contact Interactions
              </CardTitle>
              <CardDescription>
                Detailed breakdown of interactions with each contact
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableCaption>
                  {contactInteractions.length} known contacts with interactions
                  • {contacts.length} total contacts in address book
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contact</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <MessageSquare className="h-4 w-4 text-blue-500" />
                        Texts
                      </div>
                    </TableHead>
                    <TableHead className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Phone className="h-4 w-4 text-green-500" />
                        Calls
                      </div>
                    </TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-right">
                      Interaction Type
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contactInteractions.map((contact, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {contact.contactName}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {contact.phoneNumber}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200"
                        >
                          {contact.texts}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          {contact.calls}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {contact.total}
                      </TableCell>
                      <TableCell className="text-right">
                        <InteractionTypeBadge
                          texts={contact.texts}
                          calls={contact.calls}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Unknown Numbers Tab */}
        <TabsContent value="unknown">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserX className="h-5 w-5" />
                Unknown Number Interactions
              </CardTitle>
              <CardDescription>
                Numbers not in your contacts with the most interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableCaption>
                  {unknownNumberInteractions.length} unknown numbers with
                  interactions
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Phone Number</TableHead>
                    <TableHead className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <MessageSquare className="h-4 w-4 text-blue-500" />
                        Texts
                      </div>
                    </TableHead>
                    <TableHead className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Phone className="h-4 w-4 text-green-500" />
                        Calls
                      </div>
                    </TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">
                      Last Interaction
                    </TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unknownNumberInteractions.map((number, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono font-medium">
                        {number.phoneNumber}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200"
                        >
                          {number.texts}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          {number.calls}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {number.total}
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {number.lastInteraction
                          ? new Date(
                              number.lastInteraction,
                            ).toLocaleDateString()
                          : "Unknown"}
                      </TableCell>
                      <TableCell className="text-right">
                        <UnknownNumberStatus total={number.total} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper components
function ActivityLevelBadge({ count }: { count: number }) {
  if (count === 0) {
    return <Badge variant="secondary">No Activity</Badge>;
  } else if (count <= 5) {
    return (
      <Badge variant="outline" className="bg-gray-50">
        Low
      </Badge>
    );
  } else if (count <= 15) {
    return (
      <Badge
        variant="outline"
        className="bg-yellow-50 text-yellow-700 border-yellow-200"
      >
        Medium
      </Badge>
    );
  } else if (count <= 30) {
    return (
      <Badge
        variant="outline"
        className="bg-orange-50 text-orange-700 border-orange-200"
      >
        High
      </Badge>
    );
  } else {
    return (
      <Badge
        variant="outline"
        className="bg-red-50 text-red-700 border-red-200"
      >
        Very High
      </Badge>
    );
  }
}

function InteractionTypeBadge({
  texts,
  calls,
}: {
  texts: number;
  calls: number;
}) {
  const total = texts + calls;
  const textPercentage = (texts / total) * 100;
  const callPercentage = (calls / total) * 100;

  if (textPercentage > 80) {
    return (
      <Badge
        variant="outline"
        className="bg-blue-50 text-blue-700 border-blue-200"
      >
        Mostly Texts
      </Badge>
    );
  } else if (callPercentage > 80) {
    return (
      <Badge
        variant="outline"
        className="bg-green-50 text-green-700 border-green-200"
      >
        Mostly Calls
      </Badge>
    );
  } else if (texts > calls) {
    return (
      <Badge
        variant="outline"
        className="bg-indigo-50 text-indigo-700 border-indigo-200"
      >
        More Texts
      </Badge>
    );
  } else if (calls > texts) {
    return (
      <Badge
        variant="outline"
        className="bg-emerald-50 text-emerald-700 border-emerald-200"
      >
        More Calls
      </Badge>
    );
  } else {
    return (
      <Badge
        variant="outline"
        className="bg-purple-50 text-purple-700 border-purple-200"
      >
        Balanced
      </Badge>
    );
  }
}

function UnknownNumberStatus({ total }: { total: number }) {
  if (total === 1) {
    return (
      <Badge variant="outline" className="bg-gray-50">
        One-off
      </Badge>
    );
  } else if (total <= 3) {
    return (
      <Badge
        variant="outline"
        className="bg-blue-50 text-blue-700 border-blue-200"
      >
        Occasional
      </Badge>
    );
  } else if (total <= 10) {
    return (
      <Badge
        variant="outline"
        className="bg-orange-50 text-orange-700 border-orange-200"
      >
        Frequent
      </Badge>
    );
  } else {
    return (
      <Badge
        variant="outline"
        className="bg-red-50 text-red-700 border-red-200"
      >
        Very Frequent
      </Badge>
    );
  }
}

// Data processing functions (keep the same as before)
function processDailyActivity(sms: any[], calls: any[]) {
  const dailyData: { [key: string]: { texts: number; calls: number } } = {};

  // Process SMS
  sms.forEach((message) => {
    const date = message.Timestamp.split(" ")[0];
    if (!dailyData[date]) {
      dailyData[date] = { texts: 0, calls: 0 };
    }
    dailyData[date].texts++;
  });

  // Process Calls
  calls.forEach((call) => {
    const date = call.Timestamp.split(" ")[0];
    if (!dailyData[date]) {
      dailyData[date] = { texts: 0, calls: 0 };
    }
    dailyData[date].calls++;
  });

  return Object.entries(dailyData)
    .map(([date, counts]) => ({
      date,
      texts: counts.texts,
      calls: counts.calls,
      total: counts.texts + counts.calls,
    }))
    .sort((a, b) => b.date.localeCompare(a.date)); // Most recent first
}

function processContactInteractions(sms: any[], calls: any[], contacts: any[]) {
  const contactMap = createContactMap(contacts);
  const interactionCounts: {
    [key: string]: { phoneNumber: string; texts: number; calls: number };
  } = {};

  // Process SMS - only for known contacts
  sms.forEach((message) => {
    const contactNumber =
      message.Type === "Sender"
        ? message["Receiver Number"]
        : message["Sender Number"];
    const contactName = contactMap[contactNumber];

    // Only process if we have a contact name
    if (contactName) {
      if (!interactionCounts[contactName]) {
        interactionCounts[contactName] = {
          phoneNumber: contactNumber,
          texts: 0,
          calls: 0,
        };
      }
      interactionCounts[contactName].texts++;
    }
  });

  // Process Calls - only for known contacts
  calls.forEach((call) => {
    const contactNumber =
      call.Type === "Sender" ? call["Receiver Number"] : call["Sender Number"];
    const contactName = contactMap[contactNumber];

    // Only process if we have a contact name
    if (contactName) {
      if (!interactionCounts[contactName]) {
        interactionCounts[contactName] = {
          phoneNumber: contactNumber,
          texts: 0,
          calls: 0,
        };
      }
      interactionCounts[contactName].calls++;
    }
  });

  return Object.entries(interactionCounts)
    .map(([contactName, data]) => ({
      contactName,
      phoneNumber: data.phoneNumber,
      texts: data.texts,
      calls: data.calls,
      total: data.texts + data.calls,
    }))
    .sort((a, b) => b.total - a.total);
}

function processUnknownNumberInteractions(
  sms: any[],
  calls: any[],
  contacts: any[],
) {
  const contactMap = createContactMap(contacts);
  const unknownNumbers: {
    [key: string]: { texts: number; calls: number; lastInteraction: string };
  } = {};

  // Process SMS from unknown numbers
  sms.forEach((message) => {
    const contactNumber =
      message.Type === "Sender"
        ? message["Receiver Number"]
        : message["Sender Number"];
    if (!contactMap[contactNumber]) {
      if (!unknownNumbers[contactNumber]) {
        unknownNumbers[contactNumber] = {
          texts: 0,
          calls: 0,
          lastInteraction: message.Timestamp,
        };
      }
      unknownNumbers[contactNumber].texts++;
      // Update last interaction if this message is newer
      if (
        new Date(message.Timestamp) >
        new Date(unknownNumbers[contactNumber].lastInteraction)
      ) {
        unknownNumbers[contactNumber].lastInteraction = message.Timestamp;
      }
    }
  });

  // Process Calls from unknown numbers
  calls.forEach((call) => {
    const contactNumber =
      call.Type === "Sender" ? call["Receiver Number"] : call["Sender Number"];
    if (!contactMap[contactNumber]) {
      if (!unknownNumbers[contactNumber]) {
        unknownNumbers[contactNumber] = {
          texts: 0,
          calls: 0,
          lastInteraction: call.Timestamp,
        };
      }
      unknownNumbers[contactNumber].calls++;
      // Update last interaction if this call is newer
      if (
        new Date(call.Timestamp) >
        new Date(unknownNumbers[contactNumber].lastInteraction)
      ) {
        unknownNumbers[contactNumber].lastInteraction = call.Timestamp;
      }
    }
  });

  return Object.entries(unknownNumbers)
    .map(([phoneNumber, data]) => ({
      phoneNumber,
      texts: data.texts,
      calls: data.calls,
      total: data.texts + data.calls,
      lastInteraction: data.lastInteraction,
    }))
    .sort((a, b) => b.total - a.total);
}

function createContactMap(contacts: any[]): { [key: string]: string } {
  const contactMap: { [key: string]: string } = {};
  contacts.forEach((contact) => {
    contactMap[contact["Phone Number"]] = contact["Contact Name"];
  });
  return contactMap;
}
