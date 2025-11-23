"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import type { UploadedFiles } from "@/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, Phone, Users, X, Plus, Info, Wallet } from "lucide-react"

interface FileUploadProps {
  onFilesUpload: (files: UploadedFiles) => void
  isLoading?: boolean
  allowedTypes?: (keyof UploadedFiles)[]
}

export default function FileUpload({ onFilesUpload, isLoading = false, allowedTypes }: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFiles>({})
  const fileInputRefs = useRef<{ [key in keyof UploadedFiles]?: HTMLInputElement | null }>({})

  const handleFileChange = useCallback(
    (type: keyof UploadedFiles, event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || [])
      if (files.length === 0) return

      const currentFiles = uploadedFiles[type] || []
      const newFiles = [...currentFiles, ...files]

      const newUploadedFiles = { ...uploadedFiles, [type]: newFiles }
      setUploadedFiles(newUploadedFiles)
      onFilesUpload(newUploadedFiles)

      if (fileInputRefs.current[type]) {
        fileInputRefs.current[type]!.value = ""
      }
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

  const setFileInputRef = (type: keyof UploadedFiles) => (el: HTMLInputElement | null) => {
    fileInputRefs.current[type] = el
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
                  <div className="flex items-center space-x-2">
                    <Input
                      id={type}
                      type="file"
                      accept=".csv,.xlsx"
                      onChange={(e) => handleFileChange(type, e)}
                      className="flex-1 text-sm"
                      disabled={isLoading}
                      ref={setFileInputRef(type)}
                      multiple
                    />
                    {fileCount > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeAllFiles(type)}
                        disabled={isLoading}
                        title={`Remove all ${getFileTypeLabel(type)} files`}
                        className="flex-shrink-0 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {fileCount > 0 && (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
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

                {fileCount === 0 && (
                  <div className="text-sm text-muted-foreground flex items-center gap-2 p-3 rounded-md border-2 border-dashed border-border/50 bg-muted/20">
                    <Plus className="h-4 w-4" />
                    <span className="text-xs">Add files to analyze</span>
                  </div>
                )}
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
