import { useEffect, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { PageResponse } from '../../components/common/InfiniteFeed';
import { UploadRow } from '../../components/common/UploadRow';
import { Button } from '../../components/ui/button';
import { Loading } from '../../components/ui/loading';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import { ENV } from '../../lib/env';
import { UploadItem } from '../../types';
import { useNavigate } from 'react-router-dom';

interface YourVideosInfiniteFeedProps {
  queryKey: any[];
  fetchPage: (page: number) => Promise<PageResponse>;
  className?: string;
  emptyMessage?: string;
  emptyDescription?: string;
}

function YourVideosInfiniteFeed({ 
  queryKey, 
  fetchPage, 
  className,
  emptyMessage = "No videos found",
  emptyDescription = "Try adjusting your filters or check back later."
}: YourVideosInfiniteFeedProps) {
  const observerRef = useRef<HTMLDivElement>(null);

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
    staleTime: 0, // Always fetch fresh data for personalized content
    retry: 2,
  });

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '600px' }
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

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="animate-pulse flex items-center gap-4 p-4 border rounded-lg">
          <div className="w-32 aspect-video bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </div>
          <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      ))}
    </div>
  );

  // Error state
  if (isError && error) {
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
        <LoadingSkeleton />
      </div>
    );
  }

  const allItems = data?.pages.flatMap(page => page.items) || [];

  // Empty state
  if (allItems.length === 0) {
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

  return (
    <div className={className}>
      {/* Upload Items List */}
      <div className="space-y-2">
        {allItems.map((item) => (
          <UploadRow key={item.video.id} item={item as UploadItem} />
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
      {!hasNextPage && allItems.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          You've reached the end
        </div>
      )}
    </div>
  );
}

export default function YourVideos() {
  const navigate = useNavigate();

  const fetchYourVideos = async (page: number): Promise<PageResponse> => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      const response = await fetch(`${ENV.API_BASE}/creator/videos?${params}`, {
        cache: 'no-store', // Always fetch fresh data for personalized content
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch your videos');
      }

      const data = await response.json();
      return {
        items: data.videos || [],
        nextPage: page,
        hasMore: data.hasMore || false,
      };
    } catch (error) {
      console.warn('API call failed, using mock data:', error);
      
      // Fallback to mock data - simulate uploaded videos
      const { mockVideos } = await import('../../lib/mockData');
      
      // Create upload items from mock videos
      const uploadItems = mockVideos.slice(0, 8).map((video, index) => ({
        video,
        status: ['published', 'processing', 'live'][index % 3] as 'published' | 'processing' | 'live',
        views: video.views,
        uploadedAt: video.createdAt,
      }));
      
      // Simulate pagination
      const startIndex = (page - 1) * 20;
      const endIndex = startIndex + 20;
      const pageItems = uploadItems.slice(startIndex, endIndex);
      
      return {
        items: pageItems,
        nextPage: page,
        hasMore: endIndex < uploadItems.length,
      };
    }
  };



  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">Your Videos</h1>
            <p className="text-muted-foreground">
              Manage and track your uploaded content
            </p>
          </div>
          
          <Button onClick={() => navigate('/upload')} className="gap-2">
            Upload new video
          </Button>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-muted-foreground border-b">
          <div className="col-span-6">Video</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Views</div>
          <div className="col-span-2">Actions</div>
        </div>
      </div>

      {/* Videos List */}
      <div className="container mx-auto px-4">
        <YourVideosInfiniteFeed
          queryKey={['your-videos']}
          fetchPage={fetchYourVideos}
          emptyMessage="No uploads yet"
          emptyDescription="Upload your first video to start building your content library."
        />
      </div>
    </div>
  );
}