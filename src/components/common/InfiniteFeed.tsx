import { useEffect, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { VideoCard } from '../feed/VideoCard';
import { Loading } from '../ui/loading';
import { ErrorState } from './ErrorState';
import { VideoGridSkeleton } from './LoadingSkeletons';
import { LiveRegion } from '../ui/screen-reader';
import { clsx } from 'clsx';
import { Video } from '../../types';
import { useAccessibilityContext } from '../../providers/AccessibilityProvider';

export interface PageResponse {
  items: Video[];
  nextPage?: number;
  hasMore: boolean;
}

interface InfiniteFeedProps {
  queryKey: any[];
  fetchPage: (page: number) => Promise<PageResponse>;
  renderError?: (error: Error, retry: () => void) => React.ReactNode;
  className?: string;
  emptyMessage?: string;
  emptyDescription?: string;
  ariaLabel?: string;
}

export function InfiniteFeed({ 
  queryKey, 
  fetchPage, 
  renderError,
  className,
  emptyMessage = "No videos found",
  emptyDescription = "Try adjusting your filters or check back later.",
  ariaLabel = "Video feed"
}: InfiniteFeedProps) {
  const observerRef = useRef<HTMLDivElement>(null);
  const { announceToScreenReader } = useAccessibilityContext();

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
    keepPreviousData: true, // Keep previous data while fetching new data
    refetchOnWindowFocus: false, // Don't refetch on window focus for better performance
    refetchOnReconnect: true, // Refetch when network reconnects
  });

  // Intersection Observer for infinite scroll with performance optimizations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
          announceToScreenReader('Loading more videos', 'polite');
        }
      },
      { 
        rootMargin: '600px',
        threshold: 0.1 // Trigger when 10% of the element is visible
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
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, announceToScreenReader]);

  // Announce when new content is loaded
  useEffect(() => {
    if (data?.pages && data.pages.length > 1) {
      const totalVideos = data.pages.flatMap(page => page.items).length;
      announceToScreenReader(`${totalVideos} videos loaded`, 'polite');
    }
  }, [data?.pages, announceToScreenReader]);

  // Error state
  if (isError && error) {
    if (renderError) {
      return (
        <div className={className} role="alert" aria-live="assertive">
          {renderError(error, () => refetch())}
        </div>
      );
    }

    return (
      <div className={className} role="alert" aria-live="assertive">
        <ErrorState
          error={error}
          title="Failed to load content"
          description="There was a problem loading the videos. Please check your connection and try again."
          onRetry={() => refetch()}
          variant="default"
          className="py-12"
        />
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={className} aria-live="polite" aria-label="Loading videos">
        <VideoGridSkeleton count={8} />
        <LiveRegion>Loading videos...</LiveRegion>
      </div>
    );
  }

  const allVideos = data?.pages.flatMap(page => page.items) || [];

  // Empty state
  if (allVideos.length === 0) {
    return (
      <div 
        className={clsx("flex flex-col items-center justify-center py-12", className)}
        role="status"
        aria-live="polite"
      >
        <div className="text-6xl mb-4" aria-hidden="true">📺</div>
        <h3 className="text-lg font-semibold mb-2">{emptyMessage}</h3>
        <p className="text-muted-foreground text-center max-w-md">
          {emptyDescription}
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Video Grid */}
      <div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
        role="feed"
        aria-label={ariaLabel}
        aria-busy={isFetchingNextPage}
      >
        {allVideos.map((video, index) => (
          <VideoCard 
            key={video.id} 
            video={video}
            aria-setsize={allVideos.length}
            aria-posinset={index + 1}
          />
        ))}
      </div>

      {/* Loading more indicator */}
      {isFetchingNextPage && (
        <div className="flex justify-center py-8" role="status" aria-live="polite">
          <Loading />
          <LiveRegion>Loading more videos...</LiveRegion>
        </div>
      )}

      {/* Intersection observer target */}
      <div ref={observerRef} className="h-4" aria-hidden="true" />

      {/* End of results */}
      {!hasNextPage && allVideos.length > 0 && (
        <div 
          className="text-center py-8 text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          You've reached the end
        </div>
      )}
    </div>
  );
}