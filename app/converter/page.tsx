"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UploadCloud, FileJson, ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import { parseIFruitFile, generateCSV, type IFruitExport } from "@/lib/ifruit-parser";

export default function ConverterPage() {
  const [fileData, setFileData] = useState<IFruitExport | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          const parsed = parseIFruitFile(text);
          setFileData(parsed);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          const parsed = parseIFruitFile(text);
          setFileData(parsed);
        }
      };
      reader.readAsText(file);
    }
  };

  const downloadFile = (data: any[], type: 'sms' | 'calls' | 'contacts', nameBase: string) => {
    const csvContent = generateCSV(data, type);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${nameBase.replace('.csv', '').replace('.txt', '')}_${type}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-400">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">iFruit Data Converter</h1>
        </div>
        
        <Card className="max-w-3xl mx-auto border-border/50 shadow-lg">
          <CardContent className="p-8">
            <div 
              className="flex flex-col items-center justify-center space-y-6 min-h-[300px]"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {!fileData ? (
                <>
                  <div className="bg-primary/10 p-6 rounded-full">
                    <UploadCloud className="h-12 w-12 text-primary" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-semibold">Upload iFruit Text File</h3>
                    <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                      Select or drop the .txt or .csv text file exported from iFruit. We'll convert it automatically into the standard VisualRecords format, saving SMS, Calls, and Contacts into separate CSV files.
                    </p>
                  </div>
                  <label className="cursor-pointer relative overflow-hidden group">
                    <div className="bg-primary hover:bg-primary/90 text-primary-foreground transition-colors h-10 px-4 py-2 rounded-md inline-flex items-center justify-center font-medium text-sm">
                      Select File
                    </div>
                    <input type="file" className="hidden" accept=".csv,.txt" onChange={handleFileUpload} />
                  </label>
                </>
              ) : (
                <div className="w-full space-y-6">
                  <div className="flex items-center gap-4 justify-center text-center">
                    <FileJson className="h-8 w-8 text-primary" />
                    <h3 className="text-xl font-semibold">Parsed: {fileName}</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <Card className="bg-muted/50 border-transparent">
                      <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                        <div className="text-3xl font-bold text-foreground">{fileData.contacts.length}</div>
                        <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Contacts Extract</div>
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="w-full"
                          disabled={fileData.contacts.length === 0}
                          onClick={() => downloadFile(fileData.contacts, 'contacts', fileName)}
                        >
                          <Download className="mr-2 h-4 w-4" /> Download
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="bg-muted/50 border-transparent">
                      <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                        <div className="text-3xl font-bold text-foreground">{fileData.sms.length}</div>
                        <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Messages Extract</div>
                        <Button 
                          variant="default"  
                          size="sm" 
                          className="w-full"
                          disabled={fileData.sms.length === 0}
                          onClick={() => downloadFile(fileData.sms, 'sms', fileName)}
                        >
                          <Download className="mr-2 h-4 w-4" /> Download
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="bg-muted/50 border-transparent">
                      <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                        <div className="text-3xl font-bold text-foreground">{fileData.calls.length}</div>
                        <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Calls Extract</div>
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="w-full"
                          disabled={fileData.calls.length === 0}
                          onClick={() => downloadFile(fileData.calls, 'calls', fileName)}
                        >
                          <Download className="mr-2 h-4 w-4" /> Download
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="flex justify-center pt-8">
                    <Button variant="ghost" onClick={() => setFileData(null)}>
                      Convert Another File
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
