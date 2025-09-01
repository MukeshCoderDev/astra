import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Download, Trash2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '../../providers/ToastProvider';
import { 
  requestCache, 
  requestUncache, 
  isVideoCached, 
  isDownloadSupported,
  onDownloadProgress,
  type DownloadProgress 
} from '../../lib/downloadManager';
import { Video } from '../../types';

interface DownloadButtonProps {
  video: Video;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  showLabel?: boolean;
}

export function DownloadButton({ 
  video, 
  size = 'sm', 
  variant = 'outline',
  showLabel = false 
}: DownloadButtonProps) {
  const [isCached, setIsCached] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'completed' | 'failed'>('idle');
  const { success: showSuccess, error: showError } = useToast();

  // Check if downloads are supported
  const isSupported = isDownloadSupported();

  useEffect(() => {
    // Check initial cache status
    checkCacheStatus();
    
    // Listen for download progress
    const unsubscribe = onDownloadProgress((progressData: DownloadProgress) => {
      if (progressData.videoId === video.id) {
        setProgress(progressData.progress);
        setDownloadStatus(progressData.status);
        
        if (progressData.status === 'completed') {
          setIsCached(true);
          setIsLoading(false);
          showSuccess('Video downloaded successfully', 'Video is now available offline');
        } else if (progressData.status === 'failed') {
          setIsLoading(false);
          showError('Download failed', 'Failed to download video for offline viewing');
        }
      }
    });

    return unsubscribe;
  }, [video.id, showSuccess, showError]);

  const checkCacheStatus = async () => {
    try {
      const cached = await isVideoCached(video.id);
      setIsCached(cached);
    } catch (error) {
      console.error('Failed to check cache status:', error);
    }
  };

  const handleDownload = async () => {
    if (!isSupported) {
      showError('Downloads not supported', 'Your browser does not support offline downloads');
      return;
    }

    setIsLoading(true);
    setDownloadStatus('downloading');
    setProgress(0);

    try {
      await requestCache(video.id, video.hlsUrl);
      // Progress updates will be handled by the progress listener
    } catch (error) {
      setIsLoading(false);
      setDownloadStatus('failed');
      showError(
        'Download failed',
        error instanceof Error ? error.message : 'Failed to download video'
      );
    }
  };

  const handleRemove = async () => {
    setIsLoading(true);

    try {
      await requestUncache(video.id);
      setIsCached(false);
      setDownloadStatus('idle');
      setProgress(0);
      showSuccess('Download removed', 'Video removed from offline storage');
    } catch (error) {
      showError(
        'Failed to remove download',
        error instanceof Error ? error.message : 'Failed to remove cached video'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return null;
  }

  const getIcon = () => {
    if (isLoading && downloadStatus === 'downloading') {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    
    if (isCached || downloadStatus === 'completed') {
      return <CheckCircle className="h-4 w-4" />;
    }
    
    if (downloadStatus === 'failed') {
      return <AlertCircle className="h-4 w-4" />;
    }
    
    return <Download className="h-4 w-4" />;
  };

  const getLabel = () => {
    if (downloadStatus === 'downloading') {
      return `Downloading... ${progress}%`;
    }
    
    if (isCached || downloadStatus === 'completed') {
      return 'Downloaded';
    }
    
    if (downloadStatus === 'failed') {
      return 'Failed';
    }
    
    return 'Download';
  };

  const getVariant = () => {
    if (downloadStatus === 'failed') {
      return 'destructive';
    }
    
    if (isCached || downloadStatus === 'completed') {
      return 'default';
    }
    
    return variant;
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        size={size}
        variant={getVariant() as any}
        onClick={isCached ? handleRemove : handleDownload}
        disabled={isLoading}
        className="gap-2"
      >
        {getIcon()}
        {showLabel && <span>{getLabel()}</span>}
      </Button>
      
      {isCached && !isLoading && (
        <Button
          size={size}
          variant="ghost"
          onClick={handleRemove}
          className="gap-2"
          title="Remove download"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
      
      {/* Progress bar for downloading */}
      {downloadStatus === 'downloading' && (
        <div className="flex-1 min-w-0">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}