import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { Creator, Video, ApiResponse } from '../types';
import { mockVideos } from '../lib/mockData';

export function useProfile(handle: string) {
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ['profile', handle],
    queryFn: async (): Promise<Creator> => {
      // For development, return mock data
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Find creator from mock videos
      const creator = mockVideos.find(v => v.creator.handle === handle)?.creator;
      if (!creator) {
        throw new Error('Creator not found');
      }
      return creator;
      
      // In production, use this:
      // const response = await apiClient.get<ApiResponse<Creator>>(`/creators/${handle}`);
      // return response.data;
    },
    enabled: !!handle,
  });

  const profileVideosQuery = useQuery({
    queryKey: ['profile-videos', handle],
    queryFn: async (): Promise<Video[]> => {
      // For development, return mock data
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockVideos.filter(v => v.creator.handle === handle);
      
      // In production, use this:
      // const response = await apiClient.get<ApiResponse<Video[]>>(`/creators/${handle}/videos`);
      // return response.data;
    },
    enabled: !!handle,
  });

  const followMutation = useMutation({
    mutationFn: async (creatorId: string) => {
      const response = await apiClient.post<ApiResponse<{ following: boolean }>>(`/creators/${creatorId}/follow`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', handle] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async (creatorId: string) => {
      const response = await apiClient.delete<ApiResponse<{ following: boolean }>>(`/creators/${creatorId}/follow`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', handle] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
    },
  });

  const followingStatusQuery = useQuery({
    queryKey: ['following', handle],
    queryFn: async (): Promise<boolean> => {
      // For development, return mock data
      await new Promise(resolve => setTimeout(resolve, 200));
      return false; // Default to not following
      
      // In production, use this:
      // const response = await apiClient.get<ApiResponse<{ following: boolean }>>(`/creators/${handle}/following-status`);
      // return response.data.following;
    },
    enabled: !!handle,
  });

  const videos = profileVideosQuery.data || [];
  const longFormVideos = videos.filter(v => v.type === 'long');
  const shortFormVideos = videos.filter(v => v.type === 'short');

  return {
    creator: profileQuery.data,
    videos: longFormVideos,
    shorts: shortFormVideos,
    isFollowing: followingStatusQuery.data || false,
    isLoading: profileQuery.isLoading || profileVideosQuery.isLoading,
    error: profileQuery.error || profileVideosQuery.error,
    follow: (creatorId: string) => followMutation.mutate(creatorId),
    unfollow: (creatorId: string) => unfollowMutation.mutate(creatorId),
    isFollowLoading: followMutation.isPending || unfollowMutation.isPending,
  };
}