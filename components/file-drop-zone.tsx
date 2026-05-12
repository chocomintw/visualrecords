"use client";

import type React from "react";
import { useState, useRef, type DragEvent } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileDropZoneProps {
  onFilesDrop: (files: File[]) => void;
  accept?: string;
  maxFiles?: number;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function FileDropZone({
  onFilesDrop,
  accept = ".csv,.xlsx",
  maxFiles,
  title = "Drag & drop files here",
  description = "or click to select files",
  icon,
  className,
  disabled = false,
}: FileDropZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragActive(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragActive(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragActive(true);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      onFilesDrop(files);
    }
  };

  const handleClick = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      onFilesDrop(files);
      e.target.value = "";
    }
  };

  return (
    <div
      onClick={handleClick}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn(
        "relative group cursor-pointer flex flex-col items-center justify-center w-full rounded-2xl border-2 border-dashed transition-all duration-300 ease-in-out px-6 py-8 text-center",
        "bg-muted/5 backdrop-blur-sm",
        isDragActive
          ? "border-primary bg-primary/10 scale-[1.02] shadow-[0_0_20px_rgba(var(--primary),0.15)]"
          : "border-border/60 hover:border-primary/40 hover:bg-muted/20 hover:shadow-sm",
        disabled && "opacity-60 cursor-not-allowed pointer-events-none",
        className,
      )}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        multiple={!maxFiles || maxFiles > 1}
        accept={accept}
        onChange={handleInputChange}
        disabled={disabled}
      />

      <div
        className={cn(
          "p-3 rounded-xl bg-background border border-border/50 mb-3 shadow-sm transition-all duration-300",
          isDragActive
            ? "bg-primary text-primary-foreground scale-110 rotate-3"
            : "text-muted-foreground group-hover:text-primary group-hover:border-primary/30 group-hover:scale-105",
        )}
      >
        {icon || <Upload className="h-6 w-6" />}
      </div>

      <h3 className="text-sm font-semibold tracking-tight mb-1 transition-colors group-hover:text-primary">
        {title}
      </h3>
      <p className="text-[11px] text-muted-foreground max-w-[180px] mx-auto leading-tight">
        {description}
      </p>

      {/* Decorative corners */}
      <div className="absolute top-2 left-2 w-2 h-2 border-t-2 border-l-2 border-primary/20 rounded-tl-sm transition-all group-hover:border-primary/40" />
      <div className="absolute top-2 right-2 w-2 h-2 border-t-2 border-r-2 border-primary/20 rounded-tr-sm transition-all group-hover:border-primary/40" />
      <div className="absolute bottom-2 left-2 w-2 h-2 border-b-2 border-l-2 border-primary/20 rounded-bl-sm transition-all group-hover:border-primary/40" />
      <div className="absolute bottom-2 right-2 w-2 h-2 border-b-2 border-r-2 border-primary/20 rounded-br-sm transition-all group-hover:border-primary/40" />
    </div>
  );
}
