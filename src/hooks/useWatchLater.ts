import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost, apiDelete } from '../lib/api';
import { useToast } from '../providers/ToastProvider';
import { generateIdempotencyKey, getErrorMessageForUser } from '../lib/errorHandling';
import type { Video } from '../types';

/**
 * Hook for optimistic watch later functionality
 * Provides immediate UI feedback with error recovery
 */
export function useWatchLater() {
  const queryClient = useQueryClient();
  const { error: showError } = useToast();

  const watchLaterMutation = useMutation({
    mutationFn: async ({ videoId, isInWatchLater }: { videoId: string; isInWatchLater: boolean }) => {
      const idempotencyKey = generateIdempotencyKey('watch_later');
      
      if (isInWatchLater) {
        // Remove from watch later
        const response = await apiDelete(`/bff/watch-later/${videoId}`);
        if (!response.ok) {
          throw new Error(response.error || 'Failed to remove from watch later');
        }
        return { videoId, watchLater: false };
      } else {
        // Add to watch later
        const response = await apiPost(`/bff/watch-later`, { videoId }, {
          headers: {
            'Idempotency-Key': idempotencyKey,
          },
        });
        if (!response.ok) {
          throw new Error(response.error || 'Failed to add to watch later');
        }
        return { videoId, watchLater: true };
      }
    },
    onMutate: async ({ videoId, isInWatchLater }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['videos'] });
      await queryClient.cancelQueries({ queryKey: ['watch-later'] });

      // Snapshot the previous values
      const previousVideos = queryClient.getQueriesData({ queryKey: ['videos'] });
      const previousWatchLater = queryClient.getQueriesData({ queryKey: ['watch-later'] });

      // Optimistically update video data
      queryClient.setQueriesData({ queryKey: ['videos'] }, (old: any) => {
        if (!old) return old;
        
        // Handle paginated responses
        if (old.pages) {
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              items: page.items?.map((video: Video) =>
                video.id === videoId
                  ? { ...video, watchLater: !isInWatchLater }
                  : video
              ),
            })),
          };
        }
        
        // Handle single video or array responses
        if (Array.isArray(old)) {
          return old.map((video: Video) =>
            video.id === videoId
              ? { ...video, watchLater: !isInWatchLater }
              : video
          );
        }
        
        // Handle single video response
        if (old.id === videoId) {
          return { ...old, watchLater: !isInWatchLater };
        }
        
        return old;
      });

      // Update watch later list
      if (!isInWatchLater) {
        // Adding to watch later
        queryClient.setQueryData(['watch-later'], (old: any) => {
          if (!old) return old;
          
          // Get the video data to add
          const videoData = queryClient.getQueryData(['video', videoId]) as Video;
          if (!videoData) return old;
          
          if (old.pages) {
            return {
              ...old,
              pages: [
                {
                  ...old.pages[0],
                  items: [{ ...videoData, watchLater: true }, ...(old.pages[0]?.items || [])],
                },
                ...old.pages.slice(1),
              ],
            };
          }
          
          return Array.isArray(old) ? [{ ...videoData, watchLater: true }, ...old] : old;
        });
      } else {
        // Removing from watch later
        queryClient.setQueryData(['watch-later'], (old: any) => {
          if (!old) return old;
          
          if (old.pages) {
            return {
              ...old,
              pages: old.pages.map((page: any) => ({
                ...page,
                items: page.items?.filter((video: Video) => video.id !== videoId) || [],
              })),
            };
          }
          
          return Array.isArray(old) ? old.filter((video: Video) => video.id !== videoId) : old;
        });
      }

      return { previousVideos, previousWatchLater };
    },
    onError: (error, { videoId }, context) => {
      // Revert optimistic updates
      if (context?.previousVideos) {
        context.previousVideos.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousWatchLater) {
        context.previousWatchLater.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      // Show error message
      showError(
        'Failed to update watch later',
        getErrorMessageForUser(error)
      );
    },
    onSettled: () => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['watch-later'] });
    },
  });

  /**
   * Toggle watch later status for a video
   */
  const toggleWatchLater = (videoId: string, currentWatchLaterState: boolean) => {
    watchLaterMutation.mutate({ videoId, isInWatchLater: currentWatchLaterState });
  };

  return {
    toggleWatchLater,
    isLoading: watchLaterMutation.isPending,
    error: watchLaterMutation.error,
  };
}