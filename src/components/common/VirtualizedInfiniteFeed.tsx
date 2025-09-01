import { useEffect, useRef, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { VideoCard } from '../feed/VideoCard';
import { Loading } from '../ui/loading';
import { Button } from '../ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import { Video } from '../../types';
import { useVirtualScroll, useScrollPerformance } from '../../lib/performanceOptimizations';

export interface PageResponse {
  items: Video[];
  nextPage?: number;
  hasMore: boolean;
}

interface VirtualizedInfiniteFeedProps {
  queryKey: any[];
  fetchPage: (page: number) => Promise<PageResponse>;
  renderError?: (error: Error, retry: () => void) => React.ReactNode;
  className?: string;
  emptyMessage?: string;
  emptyDescription?: string;
  itemHeight?: number;
  enableVirtualization?: boolean;
  virtualizationThreshold?: number;
}

export function VirtualizedInfiniteFeed({ 
  queryKey, 
  fetchPage, 
  renderError,
  className,
  emptyMessage = "No videos found",
  emptyDescription = "Try adjusting your filters or check back later.",
  itemHeight = 320, // Approximate height of a video card
  enableVirtualization = false,
  virtualizationThreshold = 100
}: VirtualizedInfiniteFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<HTMLDivElement>(null);
  const { isScrolling, handleScroll } = useScrollPerformance();

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 1 }) => fetchPage(pageParam),
    getNextPageParam: (lastPage) => lastPage.hasMore ? (lastPage.nextPage || 1) + 1 : undefined,
    staleTime: 30 * 1000, // 30 seconds
    retry: 2,
    keepPreviousData: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  const allVideos = useMemo(() => 
    data?.pages.flatMap(page => page.items) || [], 
    [data]
  );

  // Determine if we should use virtualization
  const shouldVirtualize = enableVirtualization && allVideos.length > virtualizationThreshold;

  // Virtual scrolling setup
  const containerHeight = containerRef.current?.clientHeight || 600;
  const virtualScroll = useVirtualScroll(allVideos, {
    itemHeight,
    containerHeight,
    overscan: 5,
  });

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { 
        rootMargin: '600px',
        threshold: 0.1
      }
    );

    const currentRef = observerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Loading skeleton with performance optimization
  const LoadingSkeleton = useMemo(() => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg mb-3" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
          </div>
        </div>
      ))}
    </div>
  ), []);

  // Error state
  if (isError && error) {
    if (renderError) {
      return <div className={className}>{renderError(error, () => refetch())}</div>;
    }

    return (
      <div className={clsx("flex flex-col items-center justify-center py-12", className)}>
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
        <p className="text-muted-foreground text-center mb-4 max-w-md">
          {error.message || "Failed to load content. Please try again."}
        </p>
        <Button onClick={() => refetch()} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={className}>
        {LoadingSkeleton}
      </div>
    );
  }

  // Empty state
  if (allVideos.length === 0) {
    return (
      <div className={clsx("flex flex-col items-center justify-center py-12", className)}>
        <div className="text-6xl mb-4">📺</div>
        <h3 className="text-lg font-semibold mb-2">{emptyMessage}</h3>
        <p className="text-muted-foreground text-center max-w-md">
          {emptyDescription}
        </p>
      </div>
    );
  }

  // Virtualized rendering for large lists
  if (shouldVirtualize) {
    return (
      <div className={className}>
        <div 
          ref={containerRef}
          className="h-[600px] overflow-auto"
          onScroll={(e) => {
            handleScroll();
            virtualScroll.handleScroll(e);
          }}
        >
          <div style={{ height: virtualScroll.totalHeight, position: 'relative' }}>
            <div 
              style={{ 
                transform: `translateY(${virtualScroll.offsetY}px)`,
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
              }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {virtualScroll.visibleItems.map((video, index) => (
                  <VideoCard 
                    key={`${video.id}-${virtualScroll.startIndex + index}`} 
                    video={video}
                    className={isScrolling ? 'pointer-events-none' : ''}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Loading more indicator */}
        {isFetchingNextPage && (
          <div className="flex justify-center py-8">
            <Loading />
          </div>
        )}

        {/* Intersection observer target */}
        <div ref={observerRef} className="h-4" />

        {/* End of results */}
        {!hasNextPage && allVideos.length > 0 && (
          <div className="text-center py-8 text-muted-foreground">
            You've reached the end
          </div>
        )}
      </div>
    );
  }

  // Standard rendering for smaller lists
  return (
    <div className={className}>
      {/* Video Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {allVideos.map((video) => (
          <VideoCard 
            key={video.id} 
            video={video}
            className={isScrolling ? 'pointer-events-none' : ''}
          />
        ))}
      </div>

      {/* Loading more indicator */}
      {isFetchingNextPage && (
        <div className="flex justify-center py-8">
          <Loading />
        </div>
      )}

      {/* Intersection observer target */}
      <div ref={observerRef} className="h-4" />

      {/* End of results */}
      {!hasNextPage && allVideos.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          You've reached the end
        </div>
      )}
    </div>
  );
}