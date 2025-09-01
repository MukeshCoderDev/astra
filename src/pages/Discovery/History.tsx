import { useEffect, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { HistoryItem } from '../../components/common/HistoryItem';
import { Loading } from '../../components/ui/loading';
import { Button } from '../../components/ui/button';
import { ErrorState } from '../../components/common/ErrorState';
import { PageErrorBoundary } from '../../components/common/PageErrorBoundary';
import { HistoryListSkeleton } from '../../components/common/LoadingSkeletons';
import { Trash2, AlertTriangle } from 'lucide-react';
import { ENV } from '../../lib/env';
import { useHistory } from '../../hooks/useHistory';
import type { HistoryItem as HistoryItemType } from '../../types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../components/ui/alert-dialog';

interface PageResponse {
  items: HistoryItemType[];
  nextPage?: number;
  hasMore: boolean;
}

export default function History() {
  const observerRef = useRef<HTMLDivElement>(null);
  const { removeItem, clearAll, isClearing } = useHistory();

  const fetchHistoryItems = async (page: number): Promise<PageResponse> => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      const response = await fetch(`${ENV.API_BASE}/bff/history?${params}`, {
        cache: 'no-store', // Always fetch fresh data for personalized content
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }

      const data = await response.json();
      return {
        items: data.items || [],
        nextPage: page,
        hasMore: data.hasMore || false,
      };
    } catch (error) {
      console.warn('API call failed, using mock data:', error);
      
      // Fallback to mock data - simulate watch history
      const { mockVideos } = await import('../../lib/mockData');
      
      // Create history items from mock videos
      const historyItems = mockVideos.slice(0, 10).map((video, index) => ({
        id: `history-${video.id}`,
        video,
        watchedAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(), // Spread over last 10 days
        progressPct: Math.floor(Math.random() * 80) + 20, // Random progress between 20-100%
      }));
      
      // Simulate pagination
      const startIndex = (page - 1) * 20;
      const endIndex = startIndex + 20;
      const pageItems = historyItems.slice(startIndex, endIndex);
      
      return {
        items: pageItems,
        nextPage: page,
        hasMore: endIndex < historyItems.length,
      };
    }
  };

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
    queryKey: ['history'],
    queryFn: ({ pageParam = 1 }) => fetchHistoryItems(pageParam),
    getNextPageParam: (lastPage) => lastPage.hasMore ? (lastPage.nextPage || 1) + 1 : undefined,
    staleTime: 0, // Always fetch fresh for personalized content
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

  const handleClearAll = () => {
    clearAll();
  };

  // Error state
  if (isError && error) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-6">
          <ErrorState
            error={error}
            title="Failed to load watch history"
            description="There was a problem loading your watch history. Please check your connection and try again."
            onRetry={() => refetch()}
            variant="default"
            className="py-12"
          />
        </div>
      </div>
    );
  }

  const allItems = data?.pages.flatMap(page => page.items) || [];

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">Watch History</h1>
              <p className="text-muted-foreground">
                Videos you've watched recently
              </p>
            </div>
          </div>
          <HistoryListSkeleton count={6} />
        </div>
      </div>
    );
  }

  // Empty state
  if (allItems.length === 0) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">Watch History</h1>
              <p className="text-muted-foreground">
                Videos you've watched recently
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">📺</div>
            <h3 className="text-lg font-semibold mb-2">No history yet</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Videos you watch will appear here so you can easily find them later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageErrorBoundary section="History Page">
      <div className="min-h-screen">
        {/* Page Header */}
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">Watch History</h1>
              <p className="text-muted-foreground">
                Videos you've watched recently
              </p>
            </div>
            
            {/* Clear All Button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="gap-2" disabled={isClearing}>
                  <Trash2 className="h-4 w-4" />
                  {isClearing ? 'Clearing...' : 'Clear all'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Clear watch history?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove all videos from your watch history. 
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearAll}
                    disabled={isClearing}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isClearing ? 'Clearing...' : 'Clear all'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* History Items */}
        <div className="container mx-auto px-4 pb-6">
          <PageErrorBoundary section="History List">
            <div className="space-y-2">
              {allItems.map((item) => (
                <HistoryItem 
                  key={item.id} 
                  item={item} 
                  onRemove={removeItem}
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
            {!hasNextPage && allItems.length > 0 && (
              <div className="text-center py-8 text-muted-foreground">
                You've reached the end of your history
              </div>
            )}
          </PageErrorBoundary>
        </div>
      </div>
    </PageErrorBoundary>
  );
}