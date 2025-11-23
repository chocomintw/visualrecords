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
  const communicationStats = useAppStore((state) => state.communicationStats)

  if (!communicationStats) {
    return null
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
    unknownNumbersByDay
  } = communicationStats

  const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#84cc16", "#f97316"]
  const UNKNOWN_COLORS = ["#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#06b6d4", "#8b5cf6", "#a855f7"]

  const tooltipStyle = {
    contentStyle: {
      backgroundColor: "hsl(var(--popover))",
      borderColor: "hsl(var(--border))",
      borderRadius: "var(--radius)",
      color: "hsl(var(--popover-foreground))"
    },
    itemStyle: { color: "hsl(var(--popover-foreground))" },
    labelStyle: { color: "hsl(var(--popover-foreground))" }
  }

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
                      {...tooltipStyle}
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
                    <Bar dataKey="count" fill="#10b981" name="Calls" isAnimationActive={false} />
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
                      {...tooltipStyle}
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
                    <Bar dataKey="count" fill="#3b82f6" name="Texts" isAnimationActive={false} />
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
                      isAnimationActive={false}
                    >
                      {textsPerContact.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip {...tooltipStyle} formatter={(value) => [`${value} texts`, "Count"]} />
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
                      isAnimationActive={false}
                    >
                      {callsPerContact.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip {...tooltipStyle} formatter={(value) => [`${value} calls`, "Count"]} />
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
                      {...tooltipStyle}
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
                    <Line type="monotone" dataKey="texts" stroke="#3b82f6" strokeWidth={2} name="Contact Texts" isAnimationActive={false} />
                    <Line type="monotone" dataKey="calls" stroke="#10b981" strokeWidth={2} name="Contact Calls" isAnimationActive={false} />
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
                    <Tooltip {...tooltipStyle} />
                    <Legend />
                    <Bar dataKey="texts" fill="#3b82f6" name="Texts" isAnimationActive={false} />
                    <Bar dataKey="calls" fill="#10b981" name="Calls" isAnimationActive={false} />
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
                      isAnimationActive={false}
                    >
                      {textsPerUnknown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={UNKNOWN_COLORS[index % UNKNOWN_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip {...tooltipStyle} formatter={(value) => [`${value} texts`, "Count"]} />
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
                      isAnimationActive={false}
                    >
                      {callsPerUnknown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={UNKNOWN_COLORS[index % UNKNOWN_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip {...tooltipStyle} formatter={(value) => [`${value} calls`, "Count"]} />
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
                      {...tooltipStyle}
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
                    <Line type="monotone" dataKey="texts" stroke="#ef4444" strokeWidth={2} name="Unknown Texts" isAnimationActive={false} />
                    <Line type="monotone" dataKey="calls" stroke="#f97316" strokeWidth={2} name="Unknown Calls" isAnimationActive={false} />
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
                    <Tooltip {...tooltipStyle} />
                    <Legend />
                    <Bar dataKey="texts" fill="#ef4444" name="Texts" isAnimationActive={false} />
                    <Bar dataKey="calls" fill="#f97316" name="Calls" isAnimationActive={false} />
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


