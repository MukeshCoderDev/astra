import { useEffect, useRef, useCallback } from 'react';
import { VideoCard } from './VideoCard';
import { ShortsCard } from './ShortsCard';
import { Loading } from '../ui/loading';
import { Button } from '../ui/button';
import { RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import { Video } from '../../types';

interface FeedListProps {
  videos: Video[];
  isLoading?: boolean;
  hasNextPage?: boolean;
  onLoadMore?: () => void;
  onRefresh?: () => void;
  layout?: 'grid' | 'list' | 'mixed';
  className?: string;
  error?: string | null;
}

export function FeedList({
  videos,
  isLoading = false,
  hasNextPage = false,
  onLoadMore,
  onRefresh,
  layout = 'grid',
  className,
  error
}: FeedListProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Infinite scroll implementation
  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isLoading && onLoadMore) {
        onLoadMore();
      }
    },
    [hasNextPage, isLoading, onLoadMore]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0.1,
      rootMargin: '100px'
    });

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [handleIntersection]);

  // Separate videos by type for mixed layout
  const longFormVideos = videos.filter(video => video.type === 'long');
  const shortFormVideos = videos.filter(video => video.type === 'short');

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-muted-foreground mb-4">
          Failed to load content
        </div>
        {onRefresh && (
          <Button onClick={onRefresh} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        )}
      </div>
    );
  }

  if (!isLoading && videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-muted-foreground mb-4">
          No content available
        </div>
        {onRefresh && (
          <Button onClick={onRefresh} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={clsx('w-full', className)}>
      {/* Mixed Layout - Alternating between long-form and shorts */}
      {layout === 'mixed' && (
        <div className="space-y-8">
          {/* Long-form videos grid */}
          {longFormVideos.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4">Videos</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {longFormVideos.map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            </section>
          )}

          {/* Shorts horizontal scroll */}
          {shortFormVideos.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4">Shorts</h2>
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {shortFormVideos.map((video) => (
                  <ShortsCard key={video.id} video={video} className="flex-shrink-0" />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Grid Layout - All videos in grid */}
      {layout === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {videos.map((video) => (
            video.type === 'short' ? (
              <ShortsCard key={video.id} video={video} />
            ) : (
              <VideoCard key={video.id} video={video} />
            )
          ))}
        </div>
      )}

      {/* List Layout - All videos in list */}
      {layout === 'list' && (
        <div className="space-y-4">
          {videos.map((video) => (
            <VideoCard 
              key={video.id} 
              video={video} 
              layout="list"
            />
          ))}
        </div>
      )}

      {/* Loading More Indicator */}
      {hasNextPage && (
        <div 
          ref={loadMoreRef}
          className="flex justify-center py-8"
        >
          {isLoading ? (
            <Loading size="sm" />
          ) : (
            <div className="text-muted-foreground text-sm">
              Scroll to load more
            </div>
          )}
        </div>
      )}

      {/* End of Feed Indicator */}
      {!hasNextPage && videos.length > 0 && (
        <div className="flex justify-center py-8">
          <div className="text-muted-foreground text-sm">
            You've reached the end
          </div>
        </div>
      )}
    </div>
  );
}