import { useMemo, useState } from "react"
import { useAppStore } from "@/lib/store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import FileUpload from "@/components/file-upload"
import {
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts"
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

export function BankAnalyzer() {
    const bankStats = useAppStore((state) => state.bankStats)
    const bankData = useAppStore((state) => state.parsedData.bank)
    const contacts = useAppStore((state) => state.parsedData.contacts)
    const handleFilesUpload = useAppStore((state) => state.handleFilesUpload)
    const isLoading = useAppStore((state) => state.isLoading)

    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 50

    // Create a map of full names to contact names
    const contactMap = useMemo(() => {
        const map: Record<string, string> = {}
        contacts.forEach(contact => {
            const fullName = contact["Full Name"]
            const contactName = contact["Contact Name"]
            if (fullName && contactName) {
                // Map full name to contact name for display
                map[fullName.toLowerCase()] = contactName
            }
        })
        return map
    }, [contacts])

    // Memoize the sorted data to avoid re-sorting on every render
    const sortedData = useMemo(() => {
        return [...bankData].sort((a, b) => {
            const dateA = new Date(a.date).getTime() || 0
            const dateB = new Date(b.date).getTime() || 0
            return dateB - dateA
        })
    }, [bankData])

    const totalPages = Math.ceil(sortedData.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage)

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage)
        }
    }

    if (!bankStats) {
        return (
            <div className="space-y-6">
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Bank Records Analyzer</h2>
                    <p className="text-muted-foreground">Upload your bank statements to visualize your finances.</p>
                </div>
                <FileUpload
                    onFilesUpload={handleFilesUpload}
                    isLoading={isLoading}
                    allowedTypes={["bank"]}
                />
            </div>
        )
    }

    const { totalIncome, totalExpense, currentBalance, pieData, balanceHistory } = bankStats

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Financial Overview</h2>
                <div className="w-auto">
                    {/* Optional: Add a button to upload more files or reset */}
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${currentBalance.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                        <ArrowUpIcon className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">+${totalIncome.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                        <ArrowDownIcon className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">-${totalExpense.toFixed(2)}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Top Expenses</CardTitle>
                    <CardDescription>By transaction reason</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    isAnimationActive={false}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Transactions</CardTitle>
                    <CardDescription>
                        {sortedData.length} total transactions
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Receiver Name</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Routing</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-right">Balance</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedData.map((record, index) => {
                                // Try to find contact name by matching full name in 'from' field
                                const receiverName = contactMap[record.from.toLowerCase()] || record.from

                                return (
                                    <TableRow key={`${record.id}-${index}`}>
                                        <TableCell className="font-medium">{record.date}</TableCell>
                                        <TableCell>{receiverName}</TableCell>
                                        <TableCell>{record.reason}</TableCell>
                                        <TableCell className="font-mono text-xs">{record.routing}</TableCell>
                                        <TableCell className={`text-right ${record.amount > 0 ? "text-green-500" : "text-red-500"}`}>
                                            {record.amount > 0 ? "+" : ""}{record.amount.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right font-bold">
                                            {record.balance.toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>

                    {/* Pagination Controls */}
                    <div className="flex items-center justify-between space-x-2 py-4">
                        <div className="text-sm text-muted-foreground">
                            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedData.length)} of {sortedData.length} entries
                        </div>
                        <div className="space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
