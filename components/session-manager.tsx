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
    <div className="flex items-center gap-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".json"
      />

      <Button
        variant="outline"
        size="sm"
        onClick={handleImportClick}
        disabled={isLoading || isImporting}
        className="gap-2"
      >
        {isImporting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        Import Session
      </Button>

      {hasData && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={isLoading || isImporting}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Export Session
        </Button>
      )}
    </div>
  );
}
