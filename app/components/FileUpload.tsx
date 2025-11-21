'use client';

import { useState, useCallback, useRef } from 'react';
import { UploadedFiles } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, Phone, Users, X, AlertCircle, Plus } from 'lucide-react';

interface FileUploadProps {
  onFilesUpload: (files: UploadedFiles) => void;
  isLoading?: boolean;
}

export default function FileUpload({ onFilesUpload, isLoading = false }: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFiles>({});
  const fileInputRefs = useRef<{ [key in keyof UploadedFiles]?: HTMLInputElement | null }>({});

  const handleFileChange = useCallback((type: keyof UploadedFiles, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const currentFiles = uploadedFiles[type] || [];
    const newFiles = [...currentFiles, ...files];
    
    const newUploadedFiles = { ...uploadedFiles, [type]: newFiles };
    setUploadedFiles(newUploadedFiles);
    onFilesUpload(newUploadedFiles);

    // Clear the input to allow selecting the same files again
    if (fileInputRefs.current[type]) {
      fileInputRefs.current[type]!.value = '';
    }
  }, [uploadedFiles, onFilesUpload]);

  const removeFile = (type: keyof UploadedFiles, index: number) => {
    const currentFiles = uploadedFiles[type] || [];
    const newFiles = currentFiles.filter((_, i) => i !== index);
    
    const newUploadedFiles = { ...uploadedFiles, [type]: newFiles.length > 0 ? newFiles : undefined };
    setUploadedFiles(newUploadedFiles);
    onFilesUpload(newUploadedFiles);
  };

  const removeAllFiles = (type: keyof UploadedFiles) => {
    const newUploadedFiles = { ...uploadedFiles };
    delete newUploadedFiles[type];
    setUploadedFiles(newUploadedFiles);
    onFilesUpload(newUploadedFiles);
  };

  const getFileIcon = (type: keyof UploadedFiles) => {
    switch (type) {
      case 'sms': return <FileText className="h-4 w-4" />;
      case 'calls': return <Phone className="h-4 w-4" />;
      case 'contacts': return <Users className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getFileTypeLabel = (type: keyof UploadedFiles) => {
    switch (type) {
      case 'sms': return 'SMS Messages';
      case 'calls': return 'Call Logs';
      case 'contacts': return 'Contact List';
      default: return type;
    }
  };

  const setFileInputRef = (type: keyof UploadedFiles) => (el: HTMLInputElement | null) => {
    fileInputRefs.current[type] = el;
  };

  const fileTypes: (keyof UploadedFiles)[] = ['sms', 'calls', 'contacts'];

  const getTotalFileCount = () => {
    return Object.values(uploadedFiles).reduce((total, files) => total + (files?.length || 0), 0);
  };

  return (
  <Card className="w-full">
    <CardHeader className="pb-4">
      <CardTitle className="flex items-center gap-2 text-2xl">
        <Upload className="h-6 w-6" />
        Upload Your Data Files
      </CardTitle>
      <CardDescription className="text-base">
        Upload multiple SMS, call logs, and contact list files for combined analysis
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {fileTypes.map((type) => {
          const files = uploadedFiles[type] || [];
          const fileCount = files.length;

          return (
            <div key={type} className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor={type} className="text-sm font-medium">
                  {getFileTypeLabel(type)}
                </Label>
                {fileCount > 0 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {getFileIcon(type)}
                    {fileCount} file{fileCount !== 1 ? 's' : ''}
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
                    className="flex-1"
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
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {fileCount > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {files.map((file, index) => (
                      <div
                        key={`${type}-${index}`}
                        className="flex items-center justify-between p-3 border rounded-lg text-sm bg-muted/50"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <FileText className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate" title={file.name}>
                            {file.name}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(type, index)}
                          disabled={isLoading}
                          className="h-6 w-6 flex-shrink-0 ml-2"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {fileCount === 0 && (
                <div className="text-sm text-muted-foreground flex items-center gap-2 p-2">
                  <Plus className="h-3 w-3" />
                  Click to add files
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Alert>
        <AlertDescription className="text-sm leading-relaxed">
          <strong>Note:</strong> You can upload multiple files for each data type. All files of the same type will be combined during analysis.
          You must upload at least one SMS or Call Logs file. Contact list is optional but recommended for better visualization.
        </AlertDescription>
      </Alert>

      <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
        <div className="flex items-center gap-4">
          <span>Supported: CSV, XLSX</span>
          <span>Multiple files supported</span>
        </div>
        <div className="text-right font-medium">
          {getTotalFileCount()} file{getTotalFileCount() !== 1 ? 's' : ''} selected
        </div>
      </div>
    </CardContent>
  </Card>
);
}