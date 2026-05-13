"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { UploadedFiles } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Phone, 
  Users, 
  X, 
  Info, 
  Wallet, 
  CheckCircle2, 
  Activity,
  ArrowRight
} from "lucide-react";
import { FileDropZone } from "@/components/file-drop-zone";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface FileUploadProps {
  onFilesUpload: (files: UploadedFiles) => void;
  isLoading?: boolean;
  allowedTypes?: (keyof UploadedFiles)[];
  onSuccess?: () => void;
}

export default function FileUpload({
  onFilesUpload,
  isLoading = false,
  allowedTypes,
  onSuccess,
}: FileUploadProps) {
  const uploadedFiles = useAppStore((state) => state.uploadedFiles);
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleFilesAdded = useCallback(
    (type: keyof UploadedFiles, files: File[]) => {
      if (files.length === 0) return;

      const currentFiles = uploadedFiles[type] || [];
      const newFiles = [...currentFiles, ...files];

      const newUploadedFiles = { ...uploadedFiles, [type]: newFiles };
      onFilesUpload(newUploadedFiles);
    },
    [uploadedFiles, onFilesUpload],
  );

  const removeFile = (type: keyof UploadedFiles, index: number) => {
    const currentFiles = uploadedFiles[type] || [];
    const newFiles = currentFiles.filter((_, i) => i !== index);

    const newUploadedFiles = { ...uploadedFiles, [type]: newFiles };
    onFilesUpload(newUploadedFiles);
  };

  const removeAllFiles = (type: keyof UploadedFiles) => {
    const newUploadedFiles = { ...uploadedFiles, [type]: [] };
    onFilesUpload(newUploadedFiles);
  };

  const getFileIcon = (type: keyof UploadedFiles, size = "h-4 w-4") => {
    switch (type) {
      case "sms":
        return <FileText className={size} />;
      case "calls":
        return <Phone className={size} />;
      case "contacts":
        return <Users className={size} />;
      case "bank":
        return <Wallet className={size} />;
      default:
        return <FileText className={size} />;
    }
  };

  const getFileTypeLabel = (type: keyof UploadedFiles) => {
    switch (type) {
      case "sms":
        return "SMS Messages";
      case "calls":
        return "Call Logs";
      case "contacts":
        return "Contact List";
      case "bank":
        return "Bank Records";
      default:
        return type;
    }
  };

  const allFileTypes: (keyof UploadedFiles)[] = [
    "sms",
    "calls",
    "contacts",
    "bank",
  ];
  const fileTypes = allowedTypes || allFileTypes;

  const totalFiles = useMemo(() => {
    return Object.values(uploadedFiles).reduce(
      (total, files) => total + (files?.length || 0),
      0,
    );
  }, [uploadedFiles]);

  const hasCommsData = (uploadedFiles.sms?.length || 0) > 0 || (uploadedFiles.calls?.length || 0) > 0;

  if (!isMounted) return null;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-primary">
            <Activity className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Upload Data</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">Upload Records</h2>
          <p className="text-muted-foreground text-sm max-w-md">
            Import your logs to begin your analysis.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {totalFiles > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10"
            >
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-semibold text-primary">
                {totalFiles} File{totalFiles !== 1 ? "s" : ""} Loaded
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Main Drop Area Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Communication Data Group */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <MessageSquareIcon className="h-4 w-4 text-blue-500" />
              Communication Records
            </h3>
            <Badge variant="outline" className="text-[10px] uppercase tracking-tighter opacity-70">
              Required for charts
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {["sms", "calls"].map((type) => {
              const files = uploadedFiles[type as keyof UploadedFiles] || [];

              return (
                <FileSlot
                  key={type}
                  type={type as keyof UploadedFiles}
                  files={files}
                  isLoading={isLoading}
                  onFilesDrop={(f) => handleFilesAdded(type as keyof UploadedFiles, f)}
                  onRemove={(idx) => removeFile(type as keyof UploadedFiles, idx)}
                  onClear={() => removeAllFiles(type as keyof UploadedFiles)}
                  icon={getFileIcon(type as keyof UploadedFiles)}
                  label={getFileTypeLabel(type as keyof UploadedFiles)}
                />
              );
            })}
          </div>
        </div>

        {/* Supporting Data Group */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              Supporting Intelligence
            </h3>
            <Badge variant="outline" className="text-[10px] uppercase tracking-tighter opacity-70">
              Optional but helpful
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {["contacts", "bank"].map((type) => {
              const files = uploadedFiles[type as keyof UploadedFiles] || [];
              
              return (
                <FileSlot
                  key={type}
                  type={type as keyof UploadedFiles}
                  files={files}
                  isLoading={isLoading}
                  onFilesDrop={(f) => handleFilesAdded(type as keyof UploadedFiles, f)}
                  onRemove={(idx) => removeFile(type as keyof UploadedFiles, idx)}
                  onClear={() => removeAllFiles(type as keyof UploadedFiles)}
                  icon={getFileIcon(type as keyof UploadedFiles)}
                  label={getFileTypeLabel(type as keyof UploadedFiles)}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t border-border/50">
        <div className="flex items-start gap-3 text-muted-foreground max-w-lg">
          <div className="mt-1 h-5 w-5 rounded-full bg-muted flex items-center justify-center shrink-0">
            <Info className="h-3 w-3" />
          </div>
          <p className="text-xs leading-relaxed">
            All files are processed locally in your browser. We never upload your sensitive data to any server. 
            Supported formats: <span className="text-foreground font-medium">.CSV, .XLSX, .XLS</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

function FileSlot({ 
  files, 
  isLoading, 
  onFilesDrop, 
  onRemove, 
  onClear, 
  icon, 
  label,
}: { 
  type: keyof UploadedFiles; 
  files: File[]; 
  isLoading: boolean; 
  onFilesDrop: (f: File[]) => void; 
  onRemove: (idx: number) => void; 
  onClear: () => void; 
  icon: React.ReactNode; 
  label: string;
}) {
  const fileCount = files.length;
  
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</span>
        {fileCount > 0 && (
          <button 
            onClick={onClear}
            className="text-[10px] text-primary hover:underline font-bold"
          >
            Clear
          </button>
        )}
      </div>
      
      <div className="relative">
        <FileDropZone
          onFilesDrop={onFilesDrop}
          accept=".csv,.xlsx,.xls"
          disabled={isLoading}
          icon={icon}
          title={label}
          description="Drag or click"
          className={cn(
            "transition-all duration-300",
            fileCount > 0 ? "border-primary/40 bg-primary/5 py-4" : "py-8"
          )}
        />
        
        {fileCount > 0 && (
          <div className="absolute top-2 right-2">
            <div className="bg-primary text-primary-foreground h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm">
              {fileCount}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {fileCount > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1.5 overflow-hidden"
          >
            {files.map((file, idx) => (
              <div 
                key={file.name + idx}
                className="flex items-center justify-between group px-2.5 py-2 rounded-xl bg-muted/40 border border-border/40 hover:border-primary/20 hover:bg-muted/60 transition-all"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-6 w-6 rounded-lg bg-background flex items-center justify-center shadow-xs border border-border/50 text-muted-foreground group-hover:text-primary transition-colors">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs font-medium truncate max-w-[100px]" title={file.name}>
                    {file.name}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemove(idx)}
                  className="h-6 w-6 rounded-lg hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MessageSquareIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
