'use client';

import { useState } from 'react';
import FileUpload from './components/FileUpload';
import DataVisualization from './components/DataVisualization';
import DataTable from './components/DataTable';
import MessageExplorer from './components/MessageExplorer';
import { UploadedFiles, ParsedData } from '@/types';
import { parseFile, validateSMSData, validateCallData, validateContactData } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, AlertCircle, Table, BarChart, MessageSquare } from 'lucide-react';

export default function Home() {
  const [parsedData, setParsedData] = useState<ParsedData>({ sms: [], calls: [], contacts: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleFilesUpload = async (files: UploadedFiles) => {
    // If no files are selected, clear the data and return early
    if (Object.keys(files).length === 0) {
      setParsedData({ sms: [], calls: [], contacts: [] });
      setError('');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const newData: ParsedData = { sms: [], calls: [], contacts: [] };

      // Parse SMS data from multiple files
      if (files.sms && files.sms.length > 0) {
        console.log('Processing SMS files:', files.sms.map(f => f.name));
        const allSmsData = [];
        for (const file of files.sms) {
          const smsData = await parseFile(file);
          allSmsData.push(...smsData);
        }
        newData.sms = validateSMSData(allSmsData);
        console.log('Validated SMS data:', newData.sms.length);
      }

      // Parse Call data from multiple files
      if (files.calls && files.calls.length > 0) {
        console.log('Processing Calls files:', files.calls.map(f => f.name));
        const allCallData = [];
        for (const file of files.calls) {
          const callData = await parseFile(file);
          allCallData.push(...callData);
        }
        newData.calls = validateCallData(allCallData);
        console.log('Validated Calls data:', newData.calls.length);
      }

      // Parse Contact data from multiple files
      if (files.contacts && files.contacts.length > 0) {
        console.log('Processing Contacts files:', files.contacts.map(f => f.name));
        const allContactData = [];
        for (const file of files.contacts) {
          const contactData = await parseFile(file);
          allContactData.push(...contactData);
        }
        newData.contacts = validateContactData(allContactData);
        console.log('Validated Contacts data:', newData.contacts.length);
      }

      console.log('Final parsed data:', {
        smsCount: newData.sms.length,
        callsCount: newData.calls.length,
        contactsCount: newData.contacts.length
      });

      // Validate that we have at least one data type
      if (newData.sms.length === 0 && newData.calls.length === 0) {
        const errorMsg = 'Please upload at least one SMS or Call Logs file. No valid data was found in the uploaded files.';
        console.error(errorMsg);
        setError(errorMsg);
        setParsedData({ sms: [], calls: [], contacts: [] });
        return;
      }

      setParsedData(newData);
    } catch (err) {
      const errorMsg = `Error processing files: ${err instanceof Error ? err.message : 'Unknown error'}`;
      console.error('Error processing files:', err);
      setError(errorMsg);
      setParsedData({ sms: [], calls: [], contacts: [] });
    } finally {
      setIsLoading(false);
    }
  };

  const hasData = parsedData.sms.length > 0 || parsedData.calls.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">visualrecords</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Upload XLSX or CSVs files and get access to data that would make you question whether it's play-to-win or not.
          </p>
        </div>

        {/* File Upload Section */}
        <FileUpload onFilesUpload={handleFilesUpload} isLoading={isLoading} />

        {/* Loading State */}
        {isLoading && (
          <Card className="mx-auto max-w-2xl">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Processing files...</span>
                  <span className="text-sm text-muted-foreground">Please wait</span>
                </div>
                <Progress value={100} className="w-full" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive" className="mx-auto max-w-2xl">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="ml-2">
              {error}
              <br />
              <span className="text-sm mt-2 block">
                Check the browser console for detailed debugging information.
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* Data Display */}
        {!isLoading && hasData && (
          <div className="space-y-6">
            <Tabs defaultValue="visualization" className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto p-0 bg-muted rounded-lg">
              <TabsTrigger 
                value="visualization" 
                className="flex items-center gap-2 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <BarChart className="h-4 w-4" />
                Charts
              </TabsTrigger>
              <TabsTrigger 
                value="table" 
                className="flex items-center gap-2 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Table className="h-4 w-4" />
                Data Table
              </TabsTrigger>
              <TabsTrigger 
                value="explorer" 
                className="flex items-center gap-2 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <MessageSquare className="h-4 w-4" />
                Message Explorer
              </TabsTrigger>
            </TabsList>
              
              <TabsContent value="visualization" className="mt-6">
                <DataVisualization data={parsedData} />
              </TabsContent>
              
              <TabsContent value="table" className="mt-6">
                <DataTable data={parsedData} />
              </TabsContent>

              <TabsContent value="explorer" className="mt-6">
                <MessageExplorer data={parsedData} />
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !hasData && !error && (
          <Card className="text-center mx-auto max-w-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl">Ready to Analyze</CardTitle>
              <CardDescription className="text-base">
                Upload your communication data to get started with visualization and insights
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="max-w-md mx-auto space-y-4">
                <div className="text-6xl mb-6">📊</div>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Upload multiple SMS and/or call logs files to combine and visualize your communication patterns, 
                  analyze trends, and gain insights from your data.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}