"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import type { UploadedFiles } from "@/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, Phone, Users, X, Info, Wallet } from "lucide-react"
import { FileDropZone } from "@/components/file-drop-zone"

interface FileUploadProps {
  onFilesUpload: (files: UploadedFiles) => void
  isLoading?: boolean
  allowedTypes?: (keyof UploadedFiles)[]
}

export default function FileUpload({ onFilesUpload, isLoading = false, allowedTypes }: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFiles>({})


  const handleFilesAdded = useCallback(
    (type: keyof UploadedFiles, files: File[]) => {
      if (files.length === 0) return

      const currentFiles = uploadedFiles[type] || []
      const newFiles = [...currentFiles, ...files]

      const newUploadedFiles = { ...uploadedFiles, [type]: newFiles }
      setUploadedFiles(newUploadedFiles)
      onFilesUpload(newUploadedFiles)
    },
    [uploadedFiles, onFilesUpload],
  )

  const removeFile = (type: keyof UploadedFiles, index: number) => {
    const currentFiles = uploadedFiles[type] || []
    const newFiles = currentFiles.filter((_, i) => i !== index)

    const newUploadedFiles = { ...uploadedFiles, [type]: newFiles }
    setUploadedFiles(newUploadedFiles)
    onFilesUpload(newUploadedFiles)
  }

  const removeAllFiles = (type: keyof UploadedFiles) => {
    const newUploadedFiles = { ...uploadedFiles, [type]: [] }
    setUploadedFiles(newUploadedFiles)
    onFilesUpload(newUploadedFiles)
  }

  const getFileIcon = (type: keyof UploadedFiles) => {
    switch (type) {
      case "sms":
        return <FileText className="h-4 w-4" />
      case "calls":
        return <Phone className="h-4 w-4" />
      case "contacts":
        return <Users className="h-4 w-4" />
      case "bank":
        return <Wallet className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getFileTypeLabel = (type: keyof UploadedFiles) => {
    switch (type) {
      case "sms":
        return "SMS Messages"
      case "calls":
        return "Call Logs"
      case "contacts":
        return "Contact List"
      case "bank":
        return "Bank Records"
      default:
        return type
    }
  }



  const allFileTypes: (keyof UploadedFiles)[] = ["sms", "calls", "contacts", "bank"]
  const fileTypes = allowedTypes || allFileTypes

  const getTotalFileCount = () => {
    return Object.values(uploadedFiles).reduce((total, files) => total + (files?.length || 0), 0)
  }

  return (
    <Card className="w-full border-border/50 shadow-lg">
      <CardHeader className="pb-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-3 text-2xl font-semibold tracking-tight">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Upload className="h-5 w-5" />
              </div>
              Upload Data Files
            </CardTitle>
            <CardDescription className="text-base leading-relaxed">
              Upload multiple CSV or XLSX files for comprehensive analysis
            </CardDescription>
          </div>
          {getTotalFileCount() > 0 && (
            <Badge variant="secondary" className="text-sm px-3 py-1.5 font-medium">
              {getTotalFileCount()} file{getTotalFileCount() !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {fileTypes.map((type) => {
            const files = uploadedFiles[type] || []
            const fileCount = files.length

            return (
              <div key={type} className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor={type} className="text-sm font-semibold flex items-center gap-2">
                    {getFileIcon(type)}
                    {getFileTypeLabel(type)}
                  </Label>
                  {fileCount > 0 && (
                    <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary">
                      {fileCount}
                    </Badge>
                  )}
                </div>

                <div className="space-y-3">
                  <FileDropZone
                    onFilesDrop={(files) => handleFilesAdded(type, files)}
                    accept=".csv,.xlsx"
                    disabled={isLoading}
                    icon={getFileIcon(type)}
                    title={`Upload ${getFileTypeLabel(type)}`}
                    description="Drag & drop or click to upload CSV/XLSX"
                    className={fileCount > 0 ? "py-4" : ""}
                  />

                  {fileCount > 0 && (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      <div className="flex justify-end mb-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAllFiles(type)}
                          disabled={isLoading}
                          className="h-6 text-xs text-muted-foreground hover:text-destructive"
                        >
                          Clear all
                        </Button>
                      </div>
                      {files.map((file, index) => (
                        <div
                          key={`${type}-${index}`}
                          className="flex items-center justify-between p-2.5 border border-border/50 rounded-md text-sm bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <FileText className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                            <span className="truncate text-xs font-medium" title={file.name}>
                              {file.name}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFile(type, index)}
                            disabled={isLoading}
                            className="h-6 w-6 flex-shrink-0 ml-2 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <Alert className="bg-muted/30 border-border/50">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm leading-relaxed ml-2">
            Upload at least one SMS or Call Logs file to begin. Contact list is optional but enhances visualization
            quality.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
