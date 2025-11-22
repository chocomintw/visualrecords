"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
} from "recharts"
import { useAppStore } from "@/lib/store"

export default function DataVisualization() {
  const { parsedData } = useAppStore()
  const { sms, calls, contacts } = parsedData

  // Process data for charts
  const callsPerDay = processCallsPerDay(calls)
  const textsPerDay = processTextsPerDay(sms)
  const textsPerContact = processTextsPerContact(sms, contacts)
  const callsPerContact = processCallsPerContact(calls, contacts)
  const topContactsByInteractions = processTopContactsByInteractions(sms, calls, contacts)
  const contactsActivityByDay = processContactsActivityByDay(sms, calls, contacts)

  // Process data for unknown numbers
  const textsPerUnknown = processTextsPerUnknown(sms, contacts)
  const callsPerUnknown = processCallsPerUnknown(calls, contacts)
  const topUnknownByInteractions = processTopUnknownByInteractions(sms, calls, contacts)
  const unknownNumbersByDay = processUnknownNumbersByDay(sms, calls, contacts)

  const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#84cc16", "#f97316"]
  const UNKNOWN_COLORS = ["#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#06b6d4", "#8b5cf6", "#a855f7"]

  return (
    <div className="space-y-6">
      <Tabs defaultValue="daily" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto p-0 bg-muted rounded-lg">
          <TabsTrigger value="daily" className="py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Daily Activity
          </TabsTrigger>
          <TabsTrigger
            value="contacts"
            className="py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            Top Contacts
          </TabsTrigger>
          <TabsTrigger value="unknown" className="py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Unknown Numbers
          </TabsTrigger>
        </TabsList>

        {/* Daily Activity Tab */}
        <TabsContent value="daily" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Calls Per Day */}
            <Card>
              <CardHeader>
                <CardTitle>Calls Per Day</CardTitle>
                <CardDescription>Daily call volume over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={callsPerDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => {
                        const date = new Date(value)
                        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      }}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => {
                        const date = new Date(value)
                        return date.toLocaleDateString("en-US", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      }}
                    />
                    <Bar dataKey="count" fill="#10b981" name="Calls" />
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
                        const date = new Date(value)
                        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      }}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => {
                        const date = new Date(value)
                        return date.toLocaleDateString("en-US", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      }}
                    />
                    <Bar dataKey="count" fill="#3b82f6" name="Texts" />
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
                      label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {textsPerContact.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} texts`, "Count"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Calls Per Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Calls Per Contact</CardTitle>
                <CardDescription>Top contacts by call volume</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={callsPerContact}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {callsPerContact.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} calls`, "Count"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Contacts Activity Over Time */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Contacts Activity Over Time</CardTitle>
                <CardDescription>Daily interactions with known contacts</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={contactsActivityByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => {
                        const date = new Date(value)
                        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      }}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => {
                        const date = new Date(value)
                        return date.toLocaleDateString("en-US", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="texts" stroke="#3b82f6" strokeWidth={2} name="Contact Texts" />
                    <Line type="monotone" dataKey="calls" stroke="#10b981" strokeWidth={2} name="Contact Calls" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Contacts - Total Interactions */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Top Contacts - Total Interactions</CardTitle>
                <CardDescription>Combined calls and texts for top contacts</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={topContactsByInteractions} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="texts" fill="#3b82f6" name="Texts" />
                    <Bar dataKey="calls" fill="#10b981" name="Calls" />
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
                <CardDescription>Top unknown numbers by SMS volume</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={textsPerUnknown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {textsPerUnknown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={UNKNOWN_COLORS[index % UNKNOWN_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} texts`, "Count"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Calls From Unknown Numbers */}
            <Card>
              <CardHeader>
                <CardTitle>Calls From Unknown Numbers</CardTitle>
                <CardDescription>Top unknown numbers by call volume</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={callsPerUnknown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {callsPerUnknown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={UNKNOWN_COLORS[index % UNKNOWN_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} calls`, "Count"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Unknown Numbers Activity Over Time */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Unknown Numbers Activity Over Time</CardTitle>
                <CardDescription>Daily unknown number interactions</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={unknownNumbersByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => {
                        const date = new Date(value)
                        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      }}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => {
                        const date = new Date(value)
                        return date.toLocaleDateString("en-US", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="texts" stroke="#ef4444" strokeWidth={2} name="Unknown Texts" />
                    <Line type="monotone" dataKey="calls" stroke="#f97316" strokeWidth={2} name="Unknown Calls" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Unknown Numbers - Total Interactions */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Top Unknown Numbers - Total Interactions</CardTitle>
                <CardDescription>Combined calls and texts for unknown numbers</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={topUnknownByInteractions} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="texts" fill="#ef4444" name="Texts" />
                    <Bar dataKey="calls" fill="#f97316" name="Calls" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Helper functions (keep the same as before)
function processContactsActivityByDay(sms: any[], calls: any[], contacts: any[]) {
  const contactMap = createContactMap(contacts)
  const dailyData: { [key: string]: { texts: number; calls: number } } = {}

  // Process SMS from known contacts
  sms.forEach((message) => {
    const date = message.Timestamp.split(" ")[0]
    const contactNumber = message.Type === "Sender" ? message["Receiver Number"] : message["Sender Number"]

    // Only include if we have a contact name
    if (contactMap[contactNumber]) {
      if (!dailyData[date]) {
        dailyData[date] = { texts: 0, calls: 0 }
      }
      dailyData[date].texts++
    }
  })

  // Process Calls from known contacts
  calls.forEach((call) => {
    const date = call.Timestamp.split(" ")[0]
    const contactNumber = call.Type === "Sender" ? call["Receiver Number"] : call["Sender Number"]

    // Only include if we have a contact name
    if (contactMap[contactNumber]) {
      if (!dailyData[date]) {
        dailyData[date] = { texts: 0, calls: 0 }
      }
      dailyData[date].calls++
    }
  })

  return Object.entries(dailyData)
    .map(([date, counts]) => ({
      date,
      texts: counts.texts,
      calls: counts.calls,
      total: counts.texts + counts.calls,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

function processCallsPerDay(calls: any[]) {
  const dayCounts: { [key: string]: number } = {}

  calls.forEach((call) => {
    const date = call.Timestamp.split(" ")[0]
    dayCounts[date] = (dayCounts[date] || 0) + 1
  })

  return Object.entries(dayCounts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

function processTextsPerDay(sms: any[]) {
  const dayCounts: { [key: string]: number } = {}

  sms.forEach((message) => {
    const date = message.Timestamp.split(" ")[0]
    dayCounts[date] = (dayCounts[date] || 0) + 1
  })

  return Object.entries(dayCounts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

function processTextsPerContact(sms: any[], contacts: any[]) {
  const contactMap = createContactMap(contacts)
  const contactCounts: { [key: string]: number } = {}

  sms.forEach((message) => {
    const contactNumber = message.Type === "Sender" ? message["Receiver Number"] : message["Sender Number"]
    const contactName = contactMap[contactNumber]
    // Only include if we have a contact name
    if (contactName) {
      contactCounts[contactName] = (contactCounts[contactName] || 0) + 1
    }
  })

  return Object.entries(contactCounts)
    .map(([name, value]) => ({ name: truncateName(name), value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)
}

function processCallsPerContact(calls: any[], contacts: any[]) {
  const contactMap = createContactMap(contacts)
  const contactCounts: { [key: string]: number } = {}

  calls.forEach((call) => {
    const contactNumber = call.Type === "Sender" ? call["Receiver Number"] : call["Sender Number"]
    const contactName = contactMap[contactNumber]
    // Only include if we have a contact name
    if (contactName) {
      contactCounts[contactName] = (contactCounts[contactName] || 0) + 1
    }
  })

  return Object.entries(contactCounts)
    .map(([name, value]) => ({ name: truncateName(name), value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)
}

function processTopContactsByInteractions(sms: any[], calls: any[], contacts: any[]) {
  const contactMap = createContactMap(contacts)
  const interactionCounts: { [key: string]: { texts: number; calls: number } } = {}

  // Count SMS - only for known contacts
  sms.forEach((message) => {
    const contactNumber = message.Type === "Sender" ? message["Receiver Number"] : message["Sender Number"]
    const contactName = contactMap[contactNumber]
    if (contactName) {
      if (!interactionCounts[contactName]) {
        interactionCounts[contactName] = { texts: 0, calls: 0 }
      }
      interactionCounts[contactName].texts++
    }
  })

  // Count Calls - only for known contacts
  calls.forEach((call) => {
    const contactNumber = call.Type === "Sender" ? call["Receiver Number"] : call["Sender Number"]
    const contactName = contactMap[contactNumber]
    if (contactName) {
      if (!interactionCounts[contactName]) {
        interactionCounts[contactName] = { texts: 0, calls: 0 }
      }
      interactionCounts[contactName].calls++
    }
  })

  // Get top contacts by total interactions
  return Object.entries(interactionCounts)
    .map(([name, counts]) => ({
      name: truncateName(name),
      texts: counts.texts,
      calls: counts.calls,
      total: counts.texts + counts.calls,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)
}

function processTextsPerUnknown(sms: any[], contacts: any[]) {
  const contactMap = createContactMap(contacts)
  const unknownCounts: { [key: string]: number } = {}

  sms.forEach((message) => {
    const contactNumber = message.Type === "Sender" ? message["Receiver Number"] : message["Sender Number"]
    // Only include if we DON'T have a contact name
    if (!contactMap[contactNumber]) {
      unknownCounts[contactNumber] = (unknownCounts[contactNumber] || 0) + 1
    }
  })

  return Object.entries(unknownCounts)
    .map(([number, value]) => ({
      name: truncateNumber(number),
      value,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)
}

function processCallsPerUnknown(calls: any[], contacts: any[]) {
  const contactMap = createContactMap(contacts)
  const unknownCounts: { [key: string]: number } = {}

  calls.forEach((call) => {
    const contactNumber = call.Type === "Sender" ? call["Receiver Number"] : call["Sender Number"]
    // Only include if we DON'T have a contact name
    if (!contactMap[contactNumber]) {
      unknownCounts[contactNumber] = (unknownCounts[contactNumber] || 0) + 1
    }
  })

  return Object.entries(unknownCounts)
    .map(([number, value]) => ({
      name: truncateNumber(number),
      value,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)
}

function processTopUnknownByInteractions(sms: any[], calls: any[], contacts: any[]) {
  const contactMap = createContactMap(contacts)
  const interactionCounts: { [key: string]: { texts: number; calls: number } } = {}

  // Count SMS - only for unknown numbers
  sms.forEach((message) => {
    const contactNumber = message.Type === "Sender" ? message["Receiver Number"] : message["Sender Number"]
    if (!contactMap[contactNumber]) {
      if (!interactionCounts[contactNumber]) {
        interactionCounts[contactNumber] = { texts: 0, calls: 0 }
      }
      interactionCounts[contactNumber].texts++
    }
  })

  // Count Calls - only for unknown numbers
  calls.forEach((call) => {
    const contactNumber = call.Type === "Sender" ? call["Receiver Number"] : call["Sender Number"]
    if (!contactMap[contactNumber]) {
      if (!interactionCounts[contactNumber]) {
        interactionCounts[contactNumber] = { texts: 0, calls: 0 }
      }
      interactionCounts[contactNumber].calls++
    }
  })

  // Get top unknown numbers by total interactions
  return Object.entries(interactionCounts)
    .map(([number, counts]) => ({
      name: truncateNumber(number),
      texts: counts.texts,
      calls: counts.calls,
      total: counts.texts + counts.calls,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)
}

function processUnknownNumbersByDay(sms: any[], calls: any[], contacts: any[]) {
  const contactMap = createContactMap(contacts)
  const dailyData: { [key: string]: { texts: number; calls: number } } = {}

  // Process SMS from unknown numbers
  sms.forEach((message) => {
    const date = message.Timestamp.split(" ")[0]
    const contactNumber = message.Type === "Sender" ? message["Receiver Number"] : message["Sender Number"]

    if (!contactMap[contactNumber]) {
      if (!dailyData[date]) {
        dailyData[date] = { texts: 0, calls: 0 }
      }
      dailyData[date].texts++
    }
  })

  // Process Calls from unknown numbers
  calls.forEach((call) => {
    const date = call.Timestamp.split(" ")[0]
    const contactNumber = call.Type === "Sender" ? call["Receiver Number"] : call["Sender Number"]

    if (!contactMap[contactNumber]) {
      if (!dailyData[date]) {
        dailyData[date] = { texts: 0, calls: 0 }
      }
      dailyData[date].calls++
    }
  })

  return Object.entries(dailyData)
    .map(([date, counts]) => ({
      date,
      texts: counts.texts,
      calls: counts.calls,
      total: counts.texts + counts.calls,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

function createContactMap(contacts: any[]): { [key: string]: string } {
  const contactMap: { [key: string]: string } = {}
  contacts.forEach((contact) => {
    contactMap[contact["Phone Number"]] = contact["Contact Name"]
  })
  return contactMap
}

function truncateName(name: string): string {
  return name.length > 20 ? name.substring(0, 20) + "..." : name
}

function truncateNumber(number: string): string {
  if (number.length <= 12) return number
  return number.substring(0, 8) + "..." + number.substring(number.length - 4)
}
