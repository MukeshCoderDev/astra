import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { DownloadButton } from '../../components/common/DownloadButton';
import { Loading } from '../../components/ui/loading';
import { AlertCircle, HardDrive, Trash2, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  getCachedVideos, 
  getCacheSize, 
  clearAllCache, 
  formatBytes, 
  isDownloadSupported,
  type CachedVideo 
} from '../../lib/downloadManager';
import { useToast } from '../../providers/ToastProvider';

export default function Downloads() {
  const [cachedVideos, setCachedVideos] = useState<CachedVideo[]>([]);
  const [cacheSize, setCacheSize] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const navigate = useNavigate();
  const { success: showSuccess, error: showError } = useToast();

  const isSupported = isDownloadSupported();

  useEffect(() => {
    if (isSupported) {
      loadCachedContent();
    } else {
      setIsLoading(false);
    }
  }, [isSupported]);

  const loadCachedContent = async () => {
    try {
      setIsLoading(true);
      const [videos, size] = await Promise.all([
        getCachedVideos(),
        getCacheSize()
      ]);
      
      setCachedVideos(videos);
      setCacheSize(size);
    } catch (error) {
      console.error('Failed to load cached content:', error);
      showError('Failed to load downloads', 'Could not retrieve cached videos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to remove all downloaded videos? This action cannot be undone.')) {
      return;
    }

    try {
      setIsClearing(true);
      await clearAllCache();
      setCachedVideos([]);
      setCacheSize(0);
      showSuccess('All downloads cleared', 'All cached videos have been removed');
    } catch (error) {
      showError('Failed to clear downloads', 'Could not remove cached videos');
    } finally {
      setIsClearing(false);
    }
  };

  const handleVideoRemoved = () => {
    // Refresh the list when a video is removed
    loadCachedContent();
  };

  // Not supported state
  if (!isSupported) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold mb-2">Downloads</h1>
          <p className="text-muted-foreground mb-6">
            Offline video downloads (Prototype)
          </p>

          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Downloads not supported</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Your browser does not support offline downloads. Please use a modern browser with service worker support.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold mb-2">Downloads</h1>
          <p className="text-muted-foreground mb-6">
            Offline video downloads (Prototype)
          </p>
          
          <div className="flex justify-center py-12">
            <Loading />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">Downloads</h1>
            <p className="text-muted-foreground">
              Offline video downloads (Prototype)
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={loadCachedContent}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            
            {cachedVideos.length > 0 && (
              <Button
                variant="destructive"
                onClick={handleClearAll}
                disabled={isClearing}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* Storage Info */}
        <div className="bg-card border rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <HardDrive className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Storage Used</p>
              <p className="text-sm text-muted-foreground">
                {formatBytes(cacheSize)} • {cachedVideos.length} video{cachedVideos.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4">
        {cachedVideos.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">📱</div>
            <h3 className="text-lg font-semibold mb-2">No downloads yet</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              Download videos to watch them offline. Look for the download button on video pages.
            </p>
            <Button onClick={() => navigate('/')} variant="outline">
              Browse Videos
            </Button>
          </div>
        ) : (
          // Videos list
          <div className="space-y-4">
            {cachedVideos.map((video) => (
              <div key={video.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                {/* Thumbnail */}
                <div className="flex-shrink-0 w-32 aspect-video bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                  <img
                    src={video.poster}
                    alt={video.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Video Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                    {video.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    {video.creator.displayName} • {video.durationLabel}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Downloaded {new Date(video.cachedAt).toLocaleDateString()}
                    {video.size && ` • ${formatBytes(video.size)}`}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/watch/${video.id}`)}
                    className="gap-2"
                  >
                    Watch
                  </Button>
                  
                  <DownloadButton 
                    video={{
                      id: video.id,
                      title: video.title,
                      hlsUrl: video.hlsUrl,
                      poster: video.poster,
                      durationLabel: video.durationLabel,
                      creator: video.creator,
                      // Add required fields with defaults
                      description: '',
                      durationSec: 0,
                      views: 0,
                      likes: 0,
                      tips: 0,
                      createdAt: '',
                      updatedAt: '',
                      tags: [],
                      visibility: 'public',
                      type: 'long',
                    }}
                    showLabel={false}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}