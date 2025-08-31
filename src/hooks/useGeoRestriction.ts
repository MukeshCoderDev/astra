import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '../lib/api';

interface GeoRestrictionSettings {
  videoId?: string;
  blockedCountries: string[];
  enabled: boolean;
}

interface WatermarkSettings {
  enabled: boolean;
  accountDefault: boolean;
  opacity: number;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
}

interface VideoGeoSettings {
  videoId: string;
  geoRestriction: GeoRestrictionSettings;
  watermark: WatermarkSettings;
}

interface AccountGeoSettings {
  defaultGeoRestriction: {
    enabled: boolean;
    blockedCountries: string[];
  };
  defaultWatermark: WatermarkSettings;
}

export function useGeoRestriction(videoId?: string) {
  const queryClient = useQueryClient();

  // Fetch video-specific geo-restriction settings
  const videoSettingsQuery = useQuery({
    queryKey: ['geo-restriction', 'video', videoId],
    queryFn: async (): Promise<VideoGeoSettings> => {
      if (!videoId) throw new Error('Video ID required');
      
      const response = await apiClient.get(`/bff/studio/videos/${videoId}/geo-settings`);
      return response;
    },
    enabled: !!videoId,
  });

  // Fetch account-level default settings
  const accountSettingsQuery = useQuery({
    queryKey: ['geo-restriction', 'account'],
    queryFn: async (): Promise<AccountGeoSettings> => {
      const response = await apiClient.get('/bff/studio/geo-settings');
      return response;
    },
  });

  // Update video geo-restriction settings
  const updateVideoGeoMutation = useMutation({
    mutationFn: async (settings: Partial<VideoGeoSettings>) => {
      if (!videoId) throw new Error('Video ID required');
      
      const response = await apiClient.patch(`/bff/studio/videos/${videoId}/geo-settings`, settings);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geo-restriction', 'video', videoId] });
      queryClient.invalidateQueries({ queryKey: ['studio', 'content'] });
      toast.success('Geo-restriction settings updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update geo-restriction settings');
    },
  });

  // Update account default settings
  const updateAccountGeoMutation = useMutation({
    mutationFn: async (settings: Partial<AccountGeoSettings>) => {
      const response = await apiClient.patch('/bff/studio/geo-settings', settings);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geo-restriction', 'account'] });
      toast.success('Default geo-restriction settings updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update default settings');
    },
  });

  // Bulk update multiple videos
  const bulkUpdateGeoMutation = useMutation({
    mutationFn: async (data: { videoIds: string[]; settings: Partial<VideoGeoSettings> }) => {
      const response = await apiClient.patch('/bff/studio/videos/bulk/geo-settings', data);
      return response;
    },
    onSuccess: (_, variables) => {
      // Invalidate queries for all affected videos
      variables.videoIds.forEach(id => {
        queryClient.invalidateQueries({ queryKey: ['geo-restriction', 'video', id] });
      });
      queryClient.invalidateQueries({ queryKey: ['studio', 'content'] });
      toast.success(`Updated geo-restriction settings for ${variables.videoIds.length} video(s)`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to bulk update geo-restriction settings');
    },
  });

  // Helper functions
  const updateVideoGeoRestriction = useCallback((blockedCountries: string[]) => {
    if (!videoId) return;
    
    updateVideoGeoMutation.mutate({
      geoRestriction: {
        videoId,
        blockedCountries,
        enabled: blockedCountries.length > 0,
      },
    });
  }, [videoId, updateVideoGeoMutation]);

  const updateVideoWatermark = useCallback((watermark: WatermarkSettings) => {
    if (!videoId) return;
    
    updateVideoGeoMutation.mutate({ watermark });
  }, [videoId, updateVideoGeoMutation]);

  const updateAccountDefaults = useCallback((settings: Partial<AccountGeoSettings>) => {
    updateAccountGeoMutation.mutate(settings);
  }, [updateAccountGeoMutation]);

  const bulkUpdateVideos = useCallback((videoIds: string[], settings: Partial<VideoGeoSettings>) => {
    bulkUpdateGeoMutation.mutate({ videoIds, settings });
  }, [bulkUpdateGeoMutation]);

  return {
    // Data
    videoSettings: videoSettingsQuery.data,
    accountSettings: accountSettingsQuery.data,
    
    // Loading states
    isLoadingVideo: videoSettingsQuery.isLoading,
    isLoadingAccount: accountSettingsQuery.isLoading,
    isUpdatingVideo: updateVideoGeoMutation.isPending,
    isUpdatingAccount: updateAccountGeoMutation.isPending,
    isBulkUpdating: bulkUpdateGeoMutation.isPending,
    
    // Error states
    videoError: videoSettingsQuery.error,
    accountError: accountSettingsQuery.error,
    updateError: updateVideoGeoMutation.error || updateAccountGeoMutation.error || bulkUpdateGeoMutation.error,
    
    // Actions
    updateVideoGeoRestriction,
    updateVideoWatermark,
    updateAccountDefaults,
    bulkUpdateVideos,
    
    // Refetch functions
    refetchVideo: videoSettingsQuery.refetch,
    refetchAccount: accountSettingsQuery.refetch,
  };
}

// Hook for checking if content is geo-blocked for current user
export function useGeoBlockCheck() {
  const [userLocation, setUserLocation] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  const detectUserLocation = useCallback(async () => {
    setIsDetecting(true);
    
    try {
      // Use the geo-block API to detect user's location
      const response = await apiClient.get('/bff/geo/detect');
      setUserLocation(response.countryCode);
      return response.countryCode;
    } catch (error) {
      console.error('Failed to detect user location:', error);
      return null;
    } finally {
      setIsDetecting(false);
    }
  }, []);

  const checkVideoAccess = useCallback((blockedCountries: string[], userCountry?: string) => {
    const country = userCountry || userLocation;
    if (!country || !blockedCountries.length) return true;
    
    return !blockedCountries.includes(country);
  }, [userLocation]);

  return {
    userLocation,
    isDetecting,
    detectUserLocation,
    checkVideoAccess,
  };
}