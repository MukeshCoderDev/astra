import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  FileVideo, 
  Pause, 
  Play, 
  X, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Upload
} from 'lucide-react';
import { clsx } from 'clsx';

export interface UploadProgressProps {
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed' | 'paused';
  speed?: number; // bytes per second
  timeRemaining?: number; // seconds
  error?: string | null;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  onRetry?: () => void;
  className?: string;
}

export function UploadProgress({
  file,
  progress,
  status,
  speed,
  timeRemaining,
  error,
  onPause,
  onResume,
  onCancel,
  onRetry,
  className
}: UploadProgressProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (status === 'uploading') {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [status]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSecond: number) => {
    return `${formatFileSize(bytesPerSecond)}/s`;
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
        return <Upload className="h-5 w-5 text-blue-500 animate-pulse" />;
      case 'processing':
        return <Clock className="h-5 w-5 text-yellow-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'paused':
        return <Pause className="h-5 w-5 text-gray-500" />;
      default:
        return <FileVideo className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'uploading':
        return 'Uploading';
      case 'processing':
        return 'Processing';
      case 'completed':
        return 'Upload Complete';
      case 'failed':
        return 'Upload Failed';
      case 'paused':
        return 'Upload Paused';
      default:
        return 'Preparing';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'uploading':
        return 'bg-blue-500';
      case 'processing':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'paused':
        return 'bg-gray-500';
      default:
        return 'bg-muted';
    }
  };

  return (
    <Card className={clsx('p-4', className)}>
      <div className="space-y-4">
        {/* File Info Header */}
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {getStatusIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{file.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{formatFileSize(file.size)}</span>
              <Badge variant="outline" className="text-xs">
                {getStatusText()}
              </Badge>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            {status === 'uploading' && onPause && (
              <Button variant="ghost" size="sm" onClick={onPause}>
                <Pause className="h-4 w-4" />
              </Button>
            )}
            
            {status === 'paused' && onResume && (
              <Button variant="ghost" size="sm" onClick={onResume}>
                <Play className="h-4 w-4" />
              </Button>
            )}
            
            {status === 'failed' && onRetry && (
              <Button variant="ghost" size="sm" onClick={onRetry}>
                Retry
              </Button>
            )}
            
            {(status === 'uploading' || status === 'paused') && onCancel && (
              <Button variant="ghost" size="sm" onClick={onCancel}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {(status === 'uploading' || status === 'processing' || status === 'paused') && (
          <div className="space-y-2">
            <Progress 
              value={progress} 
              className={clsx(
                'h-2',
                status === 'processing' && 'animate-pulse'
              )}
            />
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{Math.round(progress)}% complete</span>
              
              {status === 'uploading' && (
                <div className="flex items-center gap-3">
                  {speed && <span>{formatSpeed(speed)}</span>}
                  {timeRemaining && <span>{formatTime(timeRemaining)} remaining</span>}
                </div>
              )}
              
              {status === 'processing' && (
                <span>Processing video...</span>
              )}
            </div>
          </div>
        )}

        {/* Upload Stats */}
        {status === 'uploading' && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Uploaded</div>
              <div className="font-medium">
                {formatFileSize((progress / 100) * file.size)} / {formatFileSize(file.size)}
              </div>
            </div>
            
            <div>
              <div className="text-muted-foreground">Time Elapsed</div>
              <div className="font-medium">{formatTime(elapsedTime)}</div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && status === 'failed' && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg">
            <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
            <div className="text-sm text-destructive">
              <div className="font-medium">Upload failed</div>
              <div>{error}</div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {status === 'completed' && (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <div className="text-sm text-green-700 dark:text-green-300">
              Your video has been uploaded successfully and is being processed.
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}