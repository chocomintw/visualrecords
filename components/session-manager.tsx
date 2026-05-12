"use client";

import { useRef, useState } from "react";
import { Download, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { downloadSession, validateSession } from "@/lib/utils";
import { toast } from "sonner";

export function SessionManager() {
  const { parsedData, loadSession, isLoading } = useAppStore();
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasData =
    parsedData.sms.length > 0 ||
    parsedData.calls.length > 0 ||
    parsedData.contacts.length > 0 ||
    parsedData.bank.length > 0;

  const handleExport = () => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      downloadSession(parsedData, `visualrecords-session-${timestamp}.json`);
      toast.success("Session exported successfully");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export session");
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const validatedData = validateSession(data);
      loadSession(validatedData);
      toast.success("Session imported successfully");
    } catch (error) {
      console.error("Import failed:", error);
      toast.error("Failed to import session: Invalid file format");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".json"
      />

      <Button
        variant="ghost"
        size="sm"
        onClick={handleImportClick}
        disabled={isLoading || isImporting}
        className="justify-start gap-2.5 h-8 px-3 text-[13px] font-medium text-muted-foreground hover:text-foreground"
      >
        {isImporting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Upload className="h-3.5 w-3.5" />
        )}
        Import Session
      </Button>

      {hasData && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExport}
          disabled={isLoading || isImporting}
          className="justify-start gap-2.5 h-8 px-3 text-[13px] font-medium text-muted-foreground hover:text-foreground"
        >
          <Download className="h-3.5 w-3.5" />
          Export Session
        </Button>
      )}
    </div>
  );
}
