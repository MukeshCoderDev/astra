import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Progress } from '../ui/progress';
import { Upload, FileVideo, X, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface UploadDropzoneProps {
  onFileSelect: (file: File) => void;
  onFileRemove?: () => void;
  selectedFile?: File | null;
  isUploading?: boolean;
  uploadProgress?: number;
  error?: string | null;
  className?: string;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024 * 1024; // 20GB
const ACCEPTED_FORMATS = {
  'video/mp4': ['.mp4'],
  'video/webm': ['.webm'],
  'video/quicktime': ['.mov'],
  'video/x-msvideo': ['.avi'],
  'video/x-ms-wmv': ['.wmv']
};

export function UploadDropzone({
  onFileSelect,
  onFileRemove,
  selectedFile,
  isUploading = false,
  uploadProgress = 0,
  error,
  className
}: UploadDropzoneProps) {
  const [dragError, setDragError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setDragError(null);

    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors.some((e: any) => e.code === 'file-too-large')) {
        setDragError('File size must be less than 20GB');
      } else if (rejection.errors.some((e: any) => e.code === 'file-invalid-type')) {
        setDragError('Please select a valid video file (MP4, WebM, MOV, AVI, WMV)');
      } else {
        setDragError('Invalid file selected');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_FORMATS,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    disabled: isUploading
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (selectedFile) {
    return (
      <Card className={clsx('p-6', className)}>
        <div className="space-y-4">
          {/* File Info */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <FileVideo className="h-6 w-6 text-primary" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate">{selectedFile.name}</h3>
              <div className="text-sm text-muted-foreground">
                {formatFileSize(selectedFile.size)}
              </div>
            </div>

            {!isUploading && onFileRemove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onFileRemove}
                className="flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className={clsx('p-6', className)}>
      <div
        {...getRootProps()}
        className={clsx(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive && !isDragReject && 'border-primary bg-primary/5',
          isDragReject && 'border-destructive bg-destructive/5',
          isUploading && 'cursor-not-allowed opacity-50',
          !isDragActive && !isDragReject && 'border-muted-foreground/25 hover:border-primary hover:bg-primary/5'
        )}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium">
              {isDragActive ? 'Drop your video here' : 'Upload a video'}
            </h3>
            <p className="text-muted-foreground">
              Drag and drop a video file, or click to browse
            </p>
          </div>

          <div className="text-sm text-muted-foreground space-y-1">
            <div>Supported formats: MP4, WebM, MOV, AVI, WMV</div>
            <div>Maximum file size: 20GB</div>
          </div>

          <Button variant="outline" disabled={isUploading}>
            Choose File
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {(dragError || error) && (
        <div className="mt-4 flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {dragError || error}
        </div>
      )}
    </Card>
  );
}