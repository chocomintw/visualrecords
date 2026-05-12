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
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
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
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
} from "recharts";
import { useAppStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { 
  Phone, 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Calendar, 
  Activity,
  Clock,
  UserCheck,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function DataVisualization() {
  const communicationStats = useAppStore((state) => state.communicationStats);
  const { parsedData } = useAppStore();
  const { calls, sms } = parsedData;
  const [activeTab, setActiveTab] = useState("overview");

  const mainPhoneNumber = useMemo(() => {
    return getMainPhoneNumber(calls, sms);
  }, [calls, sms]);

  if (!communicationStats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="relative">
          <div className="absolute inset-0 blur-3xl bg-primary/20 rounded-full animate-pulse" />
          <Activity className="h-12 w-12 text-primary relative animate-bounce" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold tracking-tight">Initializing Analytics</h3>
          <p className="text-muted-foreground max-w-[300px] mx-auto text-sm">
            Please upload your communication records to generate interactive insights.
          </p>
        </div>
      </div>
    );
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
  } = communicationStats;

  // Calculate high-level metrics
  const totalCalls = calls.length;
  const totalSMS = sms.length;
  const topContact = topContactsByInteractions[0]?.name || "None";
  const peakDay = [...callsPerDay].sort((a, b) => (b.count || 0) - (a.count || 0))[0]?.date || "N/A";

  const chartConfig = {
    outgoing: { label: "Outgoing", color: "var(--chart-2)" },
    incoming: { label: "Incoming", color: "var(--chart-1)" },
    texts: { label: "Texts", color: "var(--chart-3)" },
    calls: { label: "Calls", color: "var(--chart-2)" },
    count: { label: "Volume", color: "var(--chart-4)" },
  } satisfies ChartConfig;

  return (
    <div className="space-y-6 pb-12 -mt-4">
      {/* Premium Dashboard Header */}
      <div className="relative p-6 rounded-3xl overflow-hidden border bg-card/50 backdrop-blur-xl shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <TrendingUp className="w-64 h-64 -mr-16 -mt-16" />
        </div>
        
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {mainPhoneNumber && (
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 px-3 py-1 font-mono">
                  Owner: {mainPhoneNumber}
                </Badge>
              )}
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/50 bg-clip-text text-transparent">
              Dashboard Analytics
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl leading-relaxed">
              Insights from your communication records.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <StatQuickView icon={Phone} label="Total Calls" value={totalCalls} color="text-primary" />
            <StatQuickView icon={MessageSquare} label="Total SMS" value={totalSMS} color="text-chart-3" />
            <StatQuickView icon={Users} label="Active Contacts" value={topContactsByInteractions.length} color="text-chart-4" />
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" onValueChange={setActiveTab} className="space-y-8">
        <div className="flex items-center justify-between sticky top-0 z-30 py-4 bg-background/80 backdrop-blur-md border-b">
          <TabsList className="bg-muted/50 p-1 border rounded-xl">
            <TabsTrigger value="overview" className="rounded-lg px-6 py-2 transition-all">Overview</TabsTrigger>
            <TabsTrigger value="temporal" className="rounded-lg px-6 py-2 transition-all">Timeline</TabsTrigger>
            <TabsTrigger value="social" className="rounded-lg px-6 py-2 transition-all">Contacts</TabsTrigger>
            <TabsTrigger value="unknown" className="rounded-lg px-6 py-2 transition-all">Unknown Numbers</TabsTrigger>
          </TabsList>
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            Last Synced: {new Date().toLocaleTimeString()}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8 m-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard 
                  title="Peak Engagement" 
                  value={peakDay} 
                  description="Highest volume recorded"
                  icon={Calendar}
                  trend="+12%"
                  isPositive={true}
                />
                <MetricCard 
                  title="Primary Contact" 
                  value={topContact} 
                  description="Most frequent interactions"
                  icon={UserCheck}
                />
                <MetricCard 
                  title="Communication Density" 
                  value={`${((totalCalls + totalSMS) / Math.max(callsPerDay.length, 1)).toFixed(1)}`} 
                  description="Average records per day"
                  icon={Activity}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <DashboardChart 
                  title="Total Activity Flow"
                  description="Combined daily volume of every text and call"
                >
                  <ChartContainer config={chartConfig} className="h-[350px] w-full">
                    <AreaChart data={communicationStats.callsPerDay}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--chart-4)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--chart-4)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tickMargin={12}
                        tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      />
                      <YAxis axisLine={false} tickLine={false} tickMargin={12} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area 
                        type="monotone" 
                        dataKey="count" 
                        stroke="var(--chart-4)" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorValue)" 
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ChartContainer>
                </DashboardChart>

                <DashboardChart 
                  title="Top Contact Share"
                  description="A breakdown of your most frequent contacts"
                >
                   <ChartContainer config={chartConfig} className="h-[350px] w-full">
                    <PieChart>
                      <Pie
                        data={topContactsByInteractions.slice(0, 5)}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="total"
                        isAnimationActive={false}
                      >
                        {topContactsByInteractions.slice(0, 5).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={`var(--chart-${(index % 5) + 1})`} stroke="transparent" />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                </DashboardChart>
              </div>
            </TabsContent>

            {/* Temporal Tab */}
            <TabsContent value="temporal" className="space-y-8 m-0">
               <div className="grid grid-cols-1 gap-8">
                <DashboardChart 
                  title="Daily Call Volume"
                  description="Comparison of incoming vs. outgoing calls"
                >
                  <ChartContainer config={chartConfig} className="h-[400px] w-full">
                    <BarChart data={callsPerDay}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      />
                      <YAxis axisLine={false} tickLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="incoming" fill="var(--chart-1)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                      <Bar dataKey="outgoing" fill="var(--chart-2)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                    </BarChart>
                  </ChartContainer>
                </DashboardChart>

                <DashboardChart 
                  title="SMS Message Flow"
                  description="Daily text message frequency over time"
                >
                  <ChartContainer config={chartConfig} className="h-[350px] w-full">
                    <AreaChart data={textsPerDay}>
                      <defs>
                        <linearGradient id="colorTexts" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} />
                      <YAxis axisLine={false} tickLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area 
                        type="monotone" 
                        dataKey="count" 
                        stroke="var(--chart-3)" 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#colorTexts)" 
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ChartContainer>
                </DashboardChart>
               </div>
            </TabsContent>

            {/* Social Graph Tab */}
            <TabsContent value="social" className="space-y-8 m-0">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <DashboardChart title="Contact Rankings" description="Total interactions ranked by person">
                  <ChartContainer config={chartConfig} className="h-[450px] w-full">
                    <BarChart data={topContactsByInteractions.slice(0, 10)} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                      <XAxis type="number" axisLine={false} tickLine={false} hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={120} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="total" fill="var(--chart-2)" radius={[0, 4, 4, 0]} isAnimationActive={false} barSize={20} />
                    </BarChart>
                  </ChartContainer>
                </DashboardChart>

                <div className="space-y-6">
                  <Card className="bg-card/50 border-primary/10">
                    <CardHeader>
                      <CardTitle className="text-lg">Consistency Tracker</CardTitle>
                      <CardDescription>How regular your top contacts are</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {topContactsByInteractions.slice(0, 4).map((contact, i) => (
                        <div key={i} className="space-y-2">
                          <div className="flex justify-between text-sm font-medium">
                            <span>{contact.name}</span>
                            <span className="text-muted-foreground">{contact.total} interactions</span>
                          </div>
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full transition-all duration-500 ease-out" 
                              style={{ 
                                width: `${(contact.total / topContactsByInteractions[0].total) * 100}%`,
                                backgroundColor: `var(--chart-${(i % 5) + 1})`
                              }} 
                            />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
               </div>
            </TabsContent>

            {/* Anomalies Tab */}
            <TabsContent value="unknown" className="space-y-8 m-0">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <DashboardChart title="Unknown Number Breakdown" description="Calls from numbers not in your contacts">
                    <ChartContainer config={chartConfig} className="h-[350px] w-full">
                      <PieChart>
                        <Pie
                          data={callsPerUnknown}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          isAnimationActive={false}
                        >
                          {callsPerUnknown.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={`var(--chart-${((index + 4) % 8) + 1})`} stroke="transparent" />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ChartContainer>
                  </DashboardChart>

                  <DashboardChart title="Unknown Number Peaks" description="Top unknown callers by total volume">
                     <ChartContainer config={chartConfig} className="h-[350px] w-full">
                        <BarChart data={topUnknownByInteractions.slice(0, 8)}>
                          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                          <YAxis axisLine={false} tickLine={false} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="total" fill="var(--chart-5)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                        </BarChart>
                     </ChartContainer>
                  </DashboardChart>
               </div>
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}

// Sub-components for better organization
function StatQuickView({ icon: Icon, label, value, color }: { icon: any, label: string, value: number, color: string }) {
  return (
    <div className="flex items-center gap-3 bg-background/50 border rounded-2xl px-5 py-3 shadow-sm hover:shadow-md transition-all">
      <div className={cn("p-2 rounded-xl bg-muted/50", color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-xl font-bold font-mono">{value.toLocaleString()}</p>
      </div>
    </div>
  );
}

function MetricCard({ title, value, description, icon: Icon, trend, isPositive }: any) {
  return (
    <Card className="relative overflow-hidden group hover:border-primary/50 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</CardTitle>
        <div className="p-2 bg-primary/5 rounded-lg group-hover:bg-primary/10 transition-colors">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold tracking-tight">{value}</div>
          {trend && (
            <div className={cn("text-xs flex items-center font-bold", isPositive ? "text-emerald-500" : "text-rose-500")}>
              {isPositive ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
              {trend}
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

function DashboardChart({ title, description, children }: { title: string, description: string, children: React.ReactNode }) {
  return (
    <Card className="border shadow-sm bg-card/30 backdrop-blur-sm p-4 overflow-hidden flex flex-col">
      <div className="mb-3 shrink-0">
        <h3 className="text-xl font-bold tracking-tight">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex-1 min-h-[300px] w-full">
        {children}
      </div>
    </Card>
  );
}

// Helpers
function getMainPhoneNumber(calls: any[], sms: any[]): string {
  const sentCalls = calls.filter((call: any) => call.Type === "Sender");
  const sentSMS = sms.filter((message: any) => message.Type === "Sender");

  if (sentCalls.length > 0 && sentCalls[0]["Sender Number"]) return sentCalls[0]["Sender Number"];
  if (sentSMS.length > 0 && sentSMS[0]["Sender Number"]) return sentSMS[0]["Sender Number"];

  const phoneCount: { [key: string]: number } = {};
  [...calls, ...sms].forEach((item: any) => {
    if (item["Sender Number"]) phoneCount[item["Sender Number"]] = (phoneCount[item["Sender Number"]] || 0) + 1;
    if (item["Receiver Number"]) phoneCount[item["Receiver Number"]] = (phoneCount[item["Receiver Number"]] || 0) + 1;
  });

  return Object.entries(phoneCount).sort(([, a], [, b]) => b - a)[0]?.[0] || "";
}
