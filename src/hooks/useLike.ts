import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost, apiDelete } from '../lib/api';
import { useToast } from '../providers/ToastProvider';
import { generateIdempotencyKey, getErrorMessageForUser } from '../lib/errorHandling';
import type { Video } from '../types';

/**
 * Hook for optimistic like/unlike functionality
 * Provides immediate UI feedback with error recovery
 */
export function useLike() {
  const queryClient = useQueryClient();
  const { error: showError } = useToast();

  const likeMutation = useMutation({
    mutationFn: async ({ videoId, isLiked }: { videoId: string; isLiked: boolean }) => {
      const idempotencyKey = generateIdempotencyKey('like');
      
      if (isLiked) {
        // Unlike the video
        const response = await apiDelete(`/bff/videos/${videoId}/like`);
        if (!response.ok) {
          throw new Error(response.error || 'Failed to unlike video');
        }
        return { videoId, liked: false };
      } else {
        // Like the video
        const response = await apiPost(`/bff/videos/${videoId}/like`, {}, {
          headers: {
            'Idempotency-Key': idempotencyKey,
          },
        });
        if (!response.ok) {
          throw new Error(response.error || 'Failed to like video');
        }
        return { videoId, liked: true };
      }
    },
    onMutate: async ({ videoId, isLiked }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['videos'] });
      await queryClient.cancelQueries({ queryKey: ['liked-videos'] });

      // Snapshot the previous values
      const previousVideos = queryClient.getQueriesData({ queryKey: ['videos'] });
      const previousLikedVideos = queryClient.getQueriesData({ queryKey: ['liked-videos'] });

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
                  ? { 
                      ...video, 
                      liked: !isLiked,
                      likes: isLiked ? video.likes - 1 : video.likes + 1
                    }
                  : video
              ),
            })),
          };
        }
        
        // Handle single video or array responses
        if (Array.isArray(old)) {
          return old.map((video: Video) =>
            video.id === videoId
              ? { 
                  ...video, 
                  liked: !isLiked,
                  likes: isLiked ? video.likes - 1 : video.likes + 1
                }
              : video
          );
        }
        
        // Handle single video response
        if (old.id === videoId) {
          return {
            ...old,
            liked: !isLiked,
            likes: isLiked ? old.likes - 1 : old.likes + 1
          };
        }
        
        return old;
      });

      // Update liked videos list
      if (!isLiked) {
        // Adding to liked videos
        queryClient.setQueryData(['liked-videos'], (old: any) => {
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
                  items: [{ ...videoData, liked: true }, ...(old.pages[0]?.items || [])],
                },
                ...old.pages.slice(1),
              ],
            };
          }
          
          return Array.isArray(old) ? [{ ...videoData, liked: true }, ...old] : old;
        });
      } else {
        // Removing from liked videos
        queryClient.setQueryData(['liked-videos'], (old: any) => {
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

      return { previousVideos, previousLikedVideos };
    },
    onError: (error, { videoId }, context) => {
      // Revert optimistic updates
      if (context?.previousVideos) {
        context.previousVideos.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousLikedVideos) {
        context.previousLikedVideos.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      // Show error message
      showError(
        'Failed to update like',
        getErrorMessageForUser(error)
      );
    },
    onSettled: () => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['liked-videos'] });
    },
  });

  /**
   * Toggle like status for a video
   */
  const toggleLike = (videoId: string, currentLikedState: boolean) => {
    likeMutation.mutate({ videoId, isLiked: currentLikedState });
  };

  return {
    toggleLike,
    isLoading: likeMutation.isPending,
    error: likeMutation.error,
  };
}