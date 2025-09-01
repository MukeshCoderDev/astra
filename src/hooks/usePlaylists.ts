import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost, apiDelete } from '../lib/api';
import { useToast } from '../providers/ToastProvider';
import { generateIdempotencyKey, getErrorMessageForUser } from '../lib/errorHandling';
import type { Playlist, Video } from '../types';

/**
 * Hook for optimistic playlist management
 * Provides immediate UI feedback with error recovery
 */
export function usePlaylists() {
  const queryClient = useQueryClient();
  const { error: showError, success: showSuccess } = useToast();

  const createPlaylistMutation = useMutation({
    mutationFn: async ({ title }: { title: string }) => {
      const idempotencyKey = generateIdempotencyKey('create_playlist');
      
      const response = await apiPost('/bff/playlists', { title }, {
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      });
      
      if (!response.ok) {
        throw new Error(response.error || 'Failed to create playlist');
      }
      
      return response.data;
    },
    onMutate: async ({ title }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['playlists'] });

      // Snapshot the previous value
      const previousPlaylists = queryClient.getQueryData(['playlists']);

      // Optimistically add the new playlist
      const optimisticPlaylist: Playlist = {
        id: `temp-${Date.now()}`,
        title,
        videoCount: 0,
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData(['playlists'], (old: Playlist[] | undefined) => {
        return old ? [optimisticPlaylist, ...old] : [optimisticPlaylist];
      });

      return { previousPlaylists, optimisticPlaylist };
    },
    onError: (error, variables, context) => {
      // Revert optimistic updates
      if (context?.previousPlaylists) {
        queryClient.setQueryData(['playlists'], context.previousPlaylists);
      }

      // Show error message
      showError(
        'Failed to create playlist',
        getErrorMessageForUser(error)
      );
    },
    onSuccess: (data, variables, context) => {
      // Replace optimistic playlist with real data
      if (context?.optimisticPlaylist) {
        queryClient.setQueryData(['playlists'], (old: Playlist[] | undefined) => {
          if (!old) return [data.playlist];
          return old.map(playlist => 
            playlist.id === context.optimisticPlaylist.id 
              ? data.playlist 
              : playlist
          );
        });
      }
      
      showSuccess('Playlist created successfully');
    },
    onSettled: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
  });

  const removeVideoMutation = useMutation({
    mutationFn: async ({ playlistId, videoId }: { playlistId: string; videoId: string }) => {
      const idempotencyKey = generateIdempotencyKey('remove_playlist_video');
      
      const response = await apiDelete(`/bff/playlists/${playlistId}/videos/${videoId}`, {
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      });
      
      if (!response.ok) {
        throw new Error(response.error || 'Failed to remove video from playlist');
      }
      
      return { playlistId, videoId };
    },
    onMutate: async ({ playlistId, videoId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['playlist', playlistId] });
      await queryClient.cancelQueries({ queryKey: ['playlists'] });

      // Snapshot the previous values
      const previousPlaylist = queryClient.getQueryData(['playlist', playlistId]);
      const previousPlaylists = queryClient.getQueryData(['playlists']);

      // Optimistically remove the video from playlist
      queryClient.setQueryData(['playlist', playlistId], (old: any) => {
        if (!old) return old;
        
        return {
          ...old,
          items: old.items?.filter((video: Video) => video.id !== videoId) || [],
          videoCount: Math.max(0, (old.videoCount || 0) - 1),
        };
      });

      // Update playlists list
      queryClient.setQueryData(['playlists'], (old: Playlist[] | undefined) => {
        if (!old) return old;
        
        return old.map(playlist => 
          playlist.id === playlistId
            ? { ...playlist, videoCount: Math.max(0, playlist.videoCount - 1) }
            : playlist
        );
      });

      return { previousPlaylist, previousPlaylists };
    },
    onError: (error, { playlistId }, context) => {
      // Revert optimistic updates
      if (context?.previousPlaylist) {
        queryClient.setQueryData(['playlist', playlistId], context.previousPlaylist);
      }
      if (context?.previousPlaylists) {
        queryClient.setQueryData(['playlists'], context.previousPlaylists);
      }

      // Show error message
      showError(
        'Failed to remove video',
        getErrorMessageForUser(error)
      );
    },
    onSuccess: () => {
      showSuccess('Video removed from playlist');
    },
    onSettled: (data) => {
      // Invalidate and refetch
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['playlist', data.playlistId] });
        queryClient.invalidateQueries({ queryKey: ['playlists'] });
      }
    },
  });

  const deletePlaylistMutation = useMutation({
    mutationFn: async (playlistId: string) => {
      const idempotencyKey = generateIdempotencyKey('delete_playlist');
      
      const response = await apiDelete(`/bff/playlists/${playlistId}`, {
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      });
      
      if (!response.ok) {
        throw new Error(response.error || 'Failed to delete playlist');
      }
      
      return { playlistId };
    },
    onMutate: async (playlistId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['playlists'] });

      // Snapshot the previous value
      const previousPlaylists = queryClient.getQueryData(['playlists']);

      // Optimistically remove the playlist
      queryClient.setQueryData(['playlists'], (old: Playlist[] | undefined) => {
        return old ? old.filter(playlist => playlist.id !== playlistId) : [];
      });

      return { previousPlaylists };
    },
    onError: (error, playlistId, context) => {
      // Revert optimistic updates
      if (context?.previousPlaylists) {
        queryClient.setQueryData(['playlists'], context.previousPlaylists);
      }

      // Show error message
      showError(
        'Failed to delete playlist',
        getErrorMessageForUser(error)
      );
    },
    onSuccess: () => {
      showSuccess('Playlist deleted');
    },
    onSettled: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
  });

  /**
   * Create a new playlist
   */
  const createPlaylist = (title: string) => {
    createPlaylistMutation.mutate({ title });
  };

  /**
   * Remove a video from a playlist
   */
  const removeVideoFromPlaylist = (playlistId: string, videoId: string) => {
    removeVideoMutation.mutate({ playlistId, videoId });
  };

  /**
   * Delete a playlist
   */
  const deletePlaylist = (playlistId: string) => {
    deletePlaylistMutation.mutate(playlistId);
  };

  return {
    createPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    isCreating: createPlaylistMutation.isPending,
    isRemoving: removeVideoMutation.isPending,
    isDeleting: deletePlaylistMutation.isPending,
    error: createPlaylistMutation.error || removeVideoMutation.error || deletePlaylistMutation.error,
  };
}