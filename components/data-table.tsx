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
  const dailyActivity = useMemo(() => processDailyActivity(sms, calls), [sms, calls]);
  const contactInteractions = useMemo(() => processContactInteractions(sms, calls, contacts), [sms, calls, contacts]);
  const unknownNumberInteractions = useMemo(() => processUnknownNumberInteractions(sms, calls, contacts), [sms, calls, contacts]);

  return (
    <div className="space-y-6 pb-12 -mt-4">
      {/* Premium Header */}
      <div className="relative p-6 rounded-3xl overflow-hidden border bg-card/50 backdrop-blur-xl shadow-2xl mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
              Data Records
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/50 bg-clip-text text-transparent">
              Detailed Logs
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl">
              A complete list of every call and message found in your files.
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="daily" className="space-y-8">
        <div className="flex items-center justify-center sticky top-0 z-30 py-4 bg-background/80 backdrop-blur-md border-b mb-6">
          <TabsList className="bg-muted/50 p-1 border rounded-xl">
            <TabsTrigger value="daily" className="rounded-lg px-6 py-2 transition-all">Daily History</TabsTrigger>
            <TabsTrigger value="contacts" className="rounded-lg px-6 py-2 transition-all">Known Contacts</TabsTrigger>
            <TabsTrigger value="unknown" className="rounded-lg px-6 py-2 transition-all">Unknown Numbers</TabsTrigger>
          </TabsList>
        </div>

        {/* Daily Activity Tab */}
        <TabsContent value="daily" className="m-0">
          <Card className="border shadow-sm bg-card/30 backdrop-blur-sm p-6 overflow-hidden">
            <div className="mb-6">
              <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Daily Activity History
              </h3>
              <p className="text-sm text-muted-foreground">A day-by-day breakdown of all calls and texts.</p>
            </div>
            
            <div className="rounded-xl border bg-background/50 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[180px] font-bold">Date</TableHead>
                    <TableHead className="text-center font-bold">SMS Volume</TableHead>
                    <TableHead className="text-center font-bold">Call Volume</TableHead>
                    <TableHead className="text-center font-bold">Daily Total</TableHead>
                    <TableHead className="text-right font-bold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyActivity.map((day, index) => (
                    <TableRow key={index} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-semibold text-foreground">
                        {new Date(day.date).toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-transparent shadow-none">
                          {day.texts} msg
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-transparent shadow-none">
                          {day.calls} calls
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-mono font-bold">
                        {day.total}
                      </TableCell>
                      <TableCell className="text-right">
                        <ActivityLevelBadge count={day.total} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Contact Interactions Tab */}
        <TabsContent value="contacts" className="m-0">
          <Card className="border shadow-sm bg-card/30 backdrop-blur-sm p-6 overflow-hidden">
            <div className="mb-6">
              <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Contact Interaction Summary
              </h3>
              <p className="text-sm text-muted-foreground">Interaction totals for people in your contact list.</p>
            </div>
            
            <div className="rounded-xl border bg-background/50 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-bold">Contact Name</TableHead>
                    <TableHead className="font-bold">Phone Number</TableHead>
                    <TableHead className="text-center font-bold">SMS</TableHead>
                    <TableHead className="text-center font-bold">Calls</TableHead>
                    <TableHead className="text-center font-bold">Total</TableHead>
                    <TableHead className="text-right font-bold">Classification</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contactInteractions.map((contact, index) => (
                    <TableRow key={index} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-semibold text-foreground">
                        {contact.contactName}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {contact.phoneNumber}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-transparent shadow-none">
                          {contact.texts}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-transparent shadow-none">
                          {contact.calls}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-mono font-bold">
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
            </div>
          </Card>
        </TabsContent>

        {/* Unknown Numbers Tab */}
        <TabsContent value="unknown" className="m-0">
          <Card className="border shadow-sm bg-card/30 backdrop-blur-sm p-6 overflow-hidden">
            <div className="mb-6">
              <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <UserX className="h-5 w-5 text-primary" />
                Unknown Number Tracking
              </h3>
              <p className="text-sm text-muted-foreground">Activity from numbers not saved in your phone.</p>
            </div>
            
            <div className="rounded-xl border bg-background/50 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-bold">Phone Number</TableHead>
                    <TableHead className="text-center font-bold">SMS</TableHead>
                    <TableHead className="text-center font-bold">Calls</TableHead>
                    <TableHead className="text-center font-bold">Total</TableHead>
                    <TableHead className="text-center font-bold">Last Activity</TableHead>
                    <TableHead className="text-right font-bold">Persistence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unknownNumberInteractions.map((number, index) => (
                    <TableRow key={index} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-mono font-bold text-foreground">
                        {number.phoneNumber}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-transparent shadow-none">
                          {number.texts}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-transparent shadow-none">
                          {number.calls}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-mono font-bold">
                        {number.total}
                      </TableCell>
                      <TableCell className="text-center text-sm font-medium">
                        {number.lastInteraction
                          ? new Date(number.lastInteraction).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })
                          : "---"}
                      </TableCell>
                      <TableCell className="text-right">
                        <UnknownNumberStatus total={number.total} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
      <Badge variant="outline" className="bg-gray-50 dark:bg-gray-500/10">
        Low
      </Badge>
    );
  } else if (count <= 15) {
    return (
      <Badge
        variant="outline"
        className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-500/15 dark:text-yellow-400 dark:border-yellow-500/30"
      >
        Medium
      </Badge>
    );
  } else if (count <= 30) {
    return (
      <Badge
        variant="outline"
        className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/30"
      >
        High
      </Badge>
    );
  } else {
    return (
      <Badge
        variant="outline"
        className="bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30"
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
        className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30"
      >
        Mostly Texts
      </Badge>
    );
  } else if (callPercentage > 80) {
    return (
      <Badge
        variant="outline"
        className="bg-green-50 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-400 dark:border-green-500/30"
      >
        Mostly Calls
      </Badge>
    );
  } else if (texts > calls) {
    return (
      <Badge
        variant="outline"
        className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-400 dark:border-indigo-500/30"
      >
        More Texts
      </Badge>
    );
  } else if (calls > texts) {
    return (
      <Badge
        variant="outline"
        className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30"
      >
        More Calls
      </Badge>
    );
  } else {
    return (
      <Badge
        variant="outline"
        className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/30"
      >
        Balanced
      </Badge>
    );
  }
}

function UnknownNumberStatus({ total }: { total: number }) {
  if (total === 1) {
    return (
      <Badge variant="outline" className="bg-gray-50 dark:bg-gray-500/10">
        One-off
      </Badge>
    );
  } else if (total <= 3) {
    return (
      <Badge
        variant="outline"
        className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30"
      >
        Occasional
      </Badge>
    );
  } else if (total <= 10) {
    return (
      <Badge
        variant="outline"
        className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/30"
      >
        Frequent
      </Badge>
    );
  } else {
    return (
      <Badge
        variant="outline"
        className="bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30"
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
