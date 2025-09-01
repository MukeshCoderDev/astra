import { useState, useCallback, useRef } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { 
  Image, 
  Upload, 
  Camera,
  X,
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { clsx } from 'clsx';
import { liveApi } from '../../lib/api';

/**
 * Props for ThumbnailPicker component
 */
interface ThumbnailPickerProps {
  /** Stream ID */
  streamId: string;
  /** Current thumbnail URL */
  currentThumbnail?: string;
  /** Callback when thumbnail is updated */
  onThumbnailUpdate?: (thumbnailUrl: string) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ThumbnailPicker component
 * Provides interface for uploading thumbnails or capturing from live feed
 */
export default function ThumbnailPicker({
  streamId,
  currentThumbnail,
  onThumbnailUpdate,
  className
}: ThumbnailPickerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentThumbnail || null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Clear status messages after delay
   */
  const clearMessages = useCallback(() => {
    setTimeout(() => {
      setSuccess(null);
      setError(null);
    }, 3000);
  }, []);

  /**
   * Handle file upload
   */
  const handleFileUpload = useCallback(async (file: File) => {
    if (loading) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      clearMessages();
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('File size must be less than 5MB');
      clearMessages();
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setUploadProgress(0);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload file
      const formData = new FormData();
      formData.append('thumbnail', file);

      const response = await liveApi.uploadThumbnail(streamId, formData);
      
      if (response.ok && response.data) {
        setSuccess('Thumbnail uploaded successfully');
        onThumbnailUpdate?.(response.data.thumbnailUrl || previewUrl || '');
        setUploadProgress(100);
      } else {
        throw new Error(response.error || 'Failed to upload thumbnail');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload thumbnail';
      setError(errorMessage);
      setPreviewUrl(currentThumbnail || null);
      console.error('Thumbnail upload failed:', err);
    } finally {
      setLoading(false);
      setUploadProgress(0);
      clearMessages();
    }
  }, [streamId, loading, currentThumbnail, onThumbnailUpdate, previewUrl, clearMessages]);

  /**
   * Handle file input change
   */
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  /**
   * Handle drag and drop
   */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  /**
   * Handle drag over
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  /**
   * Capture current frame as thumbnail
   */
  const captureCurrentFrame = useCallback(async () => {
    if (loading) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Use current timestamp as frame capture point
      const frameAtSec = Math.floor(Date.now() / 1000);
      
      const response = await liveApi.setThumbnailFrame(streamId, frameAtSec);
      
      if (response.ok && response.data) {
        setSuccess('Thumbnail captured from live feed');
        const newThumbnailUrl = response.data.thumbnailUrl || `${currentThumbnail}?t=${Date.now()}`;
        setPreviewUrl(newThumbnailUrl);
        onThumbnailUpdate?.(newThumbnailUrl);
      } else {
        throw new Error(response.error || 'Failed to capture frame');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to capture frame';
      setError(errorMessage);
      console.error('Frame capture failed:', err);
    } finally {
      setLoading(false);
      clearMessages();
    }
  }, [streamId, loading, currentThumbnail, onThumbnailUpdate, clearMessages]);

  /**
   * Remove current thumbnail
   */
  const removeThumbnail = useCallback(() => {
    setPreviewUrl(null);
    onThumbnailUpdate?.('');
    setSuccess('Thumbnail removed');
    clearMessages();
  }, [onThumbnailUpdate, clearMessages]);

  /**
   * Open file picker
   */
  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <Card className={clsx('p-6', className)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Image className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Stream Thumbnail</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Upload a custom thumbnail or capture from your live feed
            </p>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {success && <CheckCircle className="h-4 w-4 text-green-600" />}
            {error && <AlertTriangle className="h-4 w-4 text-red-600" />}
            
            {previewUrl && (
              <Badge variant="default" className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                Thumbnail Set
              </Badge>
            )}
          </div>
        </div>

        {/* Thumbnail Preview */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Current Thumbnail</Label>
          
          <div className="relative">
            {previewUrl ? (
              <div className="relative group">
                <img
                  src={previewUrl}
                  alt="Stream thumbnail"
                  className="w-full max-w-md h-48 object-cover rounded-lg border"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={removeThumbnail}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-md h-48 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center bg-muted/50">
                <div className="text-center">
                  <Image className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No thumbnail set</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Upload Options */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Upload Options</Label>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* File Upload */}
            <div
              className={clsx(
                'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
                loading ? 'border-muted-foreground/25 cursor-not-allowed' : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={openFilePicker}
            >
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium mb-1">Upload Image</p>
              <p className="text-xs text-muted-foreground mb-3">
                Drag & drop or click to select
              </p>
              <p className="text-xs text-muted-foreground">
                JPG, PNG up to 5MB
              </p>
            </div>

            {/* Capture Frame */}
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium mb-1">Capture Frame</p>
              <p className="text-xs text-muted-foreground mb-3">
                Use current live frame
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={captureCurrentFrame}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Capturing...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    Capture Now
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Upload Progress */}
        {loading && uploadProgress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Status Messages */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-900 dark:text-red-100">
                {error}
              </span>
            </div>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-900 dark:text-green-100">
                {success}
              </span>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="space-y-2 pt-4 border-t">
          <h4 className="text-sm font-medium">Thumbnail Guidelines</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Use high-quality images with 16:9 aspect ratio for best results</li>
            <li>• Recommended resolution: 1280x720 pixels or higher</li>
            <li>• Avoid text overlays as they may not be readable on all devices</li>
            <li>• Thumbnails help viewers identify your stream in listings</li>
          </ul>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </Card>
  );
}