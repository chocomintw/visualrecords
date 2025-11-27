"use client"

import FileUpload from "@/components/file-upload"
import DataVisualization from "@/components/data-visualization"
import DataTable from "@/components/data-table"
import ConversationExplorer from "@/components/conversation-explorer"
import { SessionManager } from "@/components/session-manager"
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

export default function CommunicationDashboard() {
    const { parsedData, isLoading, error, handleFilesUpload } = useAppStore()

    const hasData = parsedData.sms.length > 0 || parsedData.calls.length > 0

    return (
        <div className="space-y-10">
            <div className="flex justify-end">
                <SessionManager />
            </div>

            {/* File Upload Section */}
            <FileUpload onFilesUpload={handleFilesUpload} isLoading={isLoading} allowedTypes={["sms", "calls", "contacts"]} />

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
                                Conversations
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="visualization" className="mt-8">
                            <DataVisualization />
                        </TabsContent>

                        <TabsContent value="table" className="mt-8">
                            <DataTable />
                        </TabsContent>

                        <TabsContent value="explorer" className="mt-8">
                            <ConversationExplorer />
                        </TabsContent>
                    </Tabs>
                </div>
            )}
        </div>
    )
}
