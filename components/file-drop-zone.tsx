"use client"

import type React from "react"
import { useState, useRef, type DragEvent } from "react"
import { Upload, FileText, X, FileSpreadsheet } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface FileDropZoneProps {
    onFilesDrop: (files: File[]) => void
    accept?: string
    maxFiles?: number
    title?: string
    description?: string
    icon?: React.ReactNode
    className?: string
    disabled?: boolean
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
    const [isDragActive, setIsDragActive] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        if (disabled) return
        setIsDragActive(true)
    }

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        if (disabled) return
        setIsDragActive(false)
    }

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        if (disabled) return
        setIsDragActive(true)
    }

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        if (disabled) return
        setIsDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const files = Array.from(e.dataTransfer.files)
            // Filter by accept if needed, but usually handled by input. 
            // For now passing all dropped files that match basic extension check if needed, 
            // but simple pass-through is often enough for UX, validation can happen later.
            onFilesDrop(files)
        }
    }

    const handleClick = () => {
        if (disabled) return
        inputRef.current?.click()
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files)
            onFilesDrop(files)
            // Reset value so same file can be selected again if needed
            e.target.value = ""
        }
    }

    return (
        <div
            onClick={handleClick}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={cn(
                "relative group cursor-pointer flex flex-col items-center justify-center w-full rounded-xl border-2 border-dashed transition-all duration-200 ease-in-out px-6 py-10 text-center",
                isDragActive
                    ? "border-primary bg-primary/5 scale-[1.01] shadow-lg"
                    : "border-border/50 hover:border-primary/50 hover:bg-muted/20",
                disabled && "opacity-60 cursor-not-allowed pointer-events-none",
                className
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

            <div className={cn(
                "p-4 rounded-full bg-muted mb-4 transition-colors duration-200",
                isDragActive ? "bg-primary/10 text-primary" : "text-muted-foreground group-hover:text-primary group-hover:bg-primary/10"
            )}>
                {icon || <Upload className="h-8 w-8" />}
            </div>

            <h3 className="text-lg font-semibold tracking-tight mb-1">
                {title}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                {description}
            </p>
        </div>
    )
}
