"use client"

import FileUpload from "@/components/file-upload"
import DataVisualization from "@/components/data-visualization"
import DataTable from "@/components/data-table"
import MessageExplorer from "@/components/message-explorer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart3,
  AlertCircle,
  Table,
  BarChart,
  MessageSquare,
  TrendingUp,
  FileText,
  Phone,
  Users,
} from "lucide-react"
import { useAppStore } from "@/lib/store"

export default function Home() {
  const { parsedData, isLoading, error, handleFilesUpload } = useAppStore()

  const hasData = parsedData.sms.length > 0 || parsedData.calls.length > 0

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 space-y-10 max-w-[1600px]">
        {/* Header */}
        <div className="text-center space-y-5">
          <div className="flex items-center justify-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-sm">
              <BarChart3 className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              visualrecords
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Transform your communication data into actionable insights. Upload CSV or XLSX files to unlock powerful
            analytics.
          </p>
        </div>

        {/* File Upload Section */}
        <FileUpload onFilesUpload={handleFilesUpload} isLoading={isLoading} />

        {/* Loading State */}
        {isLoading && (
          <Card className="mx-auto max-w-2xl border-border/50 shadow-lg">
            <CardContent className="pt-8 pb-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-sm font-medium">Processing your files</span>
                  </div>
                  <span className="text-sm text-muted-foreground">Please wait...</span>
                </div>
                <Progress value={100} className="w-full h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  Analyzing data patterns and generating insights
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive" className="mx-auto max-w-2xl shadow-lg">
            <AlertCircle className="h-5 w-5" />
            <AlertDescription className="ml-2">
              <p className="font-medium">{error}</p>
              <p className="text-sm mt-2 opacity-90">Check the browser console for detailed debugging information.</p>
            </AlertDescription>
          </Alert>
        )}

        {/* Data Display */}
        {!isLoading && hasData && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-semibold tracking-tight">Analytics Dashboard</h2>
              </div>
            </div>

            <Tabs defaultValue="visualization" className="w-full">
              <TabsList className="grid w-full grid-cols-3 max-w-3xl mx-auto h-12 p-1 bg-muted/50 rounded-xl border border-border/50">
                <TabsTrigger
                  value="visualization"
                  className="flex items-center gap-2 text-sm font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <BarChart className="h-4 w-4" />
                  Charts
                </TabsTrigger>
                <TabsTrigger
                  value="table"
                  className="flex items-center gap-2 text-sm font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <Table className="h-4 w-4" />
                  Data Table
                </TabsTrigger>
                <TabsTrigger
                  value="explorer"
                  className="flex items-center gap-2 text-sm font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <MessageSquare className="h-4 w-4" />
                  Messages
                </TabsTrigger>
              </TabsList>

              <TabsContent value="visualization" className="mt-8">
                <DataVisualization />
              </TabsContent>

              <TabsContent value="table" className="mt-8">
                <DataTable />
              </TabsContent>

              <TabsContent value="explorer" className="mt-8">
                <MessageExplorer />
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !hasData && !error && (
          <Card className="text-center mx-auto max-w-3xl border-border/50 shadow-xl">
            <CardHeader className="pb-6 pt-12">
              <div className="mx-auto p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 w-fit mb-4">
                <BarChart3 className="h-16 w-16 text-primary" />
              </div>
              <CardTitle className="text-3xl font-semibold tracking-tight">Ready to Analyze Your Data</CardTitle>
              <CardDescription className="text-base mt-3">
                Get started by uploading your communication files
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 pb-12">
              <div className="max-w-md mx-auto space-y-6">
                <p className="text-muted-foreground text-base leading-relaxed">
                  Combine multiple SMS and call log files to visualize communication patterns, analyze trends, and
                  discover insights from your data.
                </p>
                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">SMS Data</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-3 rounded-lg bg-accent/10">
                      <Phone className="h-5 w-5 text-accent" />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">Call Logs</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-3 rounded-lg bg-chart-4/10">
                      <Users className="h-5 w-5 text-chart-4" />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">Contacts</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
