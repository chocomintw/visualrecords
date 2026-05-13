import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import FileUpload from "@/components/file-upload";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid } from "recharts";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";

const chartConfig = {
  value: {
    label: "Amount",
    color: "var(--chart-1)",
  },
  balance: {
    label: "Balance",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function BankAnalyzer() {
  const bankStats = useAppStore((state) => state.bankStats);
  const bankData = useAppStore((state) => state.parsedData.bank);
  const contacts = useAppStore((state) => state.parsedData.contacts);
  const handleFilesUpload = useAppStore((state) => state.handleFilesUpload);
  const isLoading = useAppStore((state) => state.isLoading);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Create a map of full names to contact names
  const contactMap = useMemo(() => {
    const map: Record<string, string> = {};
    contacts.forEach((contact) => {
      const fullName = contact["Full Name"];
      const contactName = contact["Contact Name"];
      if (fullName && contactName) {
        // Map full name to contact name for display
        map[fullName.toLowerCase()] = contactName;
      }
    });
    return map;
  }, [contacts]);

  // Memoize the sorted data to avoid re-sorting on every render
  const sortedData = useMemo(() => {
    return [...bankData].sort((a, b) => {
      const dateA = new Date(a.date).getTime() || 0;
      const dateB = new Date(b.date).getTime() || 0;
      return dateB - dateA;
    });
  }, [bankData]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (!bankStats) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">
            Bank Records Analyzer
          </h2>
          <p className="text-muted-foreground">
            Upload your bank statements to visualize your finances.
          </p>
        </div>
        <FileUpload
          onFilesUpload={handleFilesUpload}
          isLoading={isLoading}
          allowedTypes={["bank"]}
        />
      </div>
    );
  }

  const { totalIncome, totalExpense, pieData } =
    bankStats;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">
          Financial Overview
        </h2>
        <div className="w-auto">
          {/* Optional: Add a button to upload more files or reset */}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <ArrowUpIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              +${totalIncome.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Expenses
            </CardTitle>
            <ArrowDownIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              -${totalExpense.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Expenses</CardTitle>
            <CardDescription>By transaction reason</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer id="bank-top-expenses" config={chartConfig} className="min-h-[300px] w-full">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${((percent || 0) * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="var(--chart-1)"
                  dataKey="value"
                  isAnimationActive={false}
                >
                  {pieData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={`var(--chart-${(index % 8) + 1})`}
                    />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>
            {sortedData.length} total transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((record, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{record.date}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">
                          {record.from || "Unknown"}
                        </span>
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {record.reason}
                        </span>
                        {contactMap[record.from?.toLowerCase() || ""] && (
                           <div className="mt-1">
                             <span className="text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full border border-primary/20">
                               Identified: {contactMap[record.from?.toLowerCase() || ""]}
                             </span>
                           </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell
                      className={`text-right ${
                        record.amount < 0 ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {record.amount < 0 ? "-" : "+"}$
                      {Math.abs(record.amount).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="text-sm font-medium">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
