import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { PayoutRecord, PayoutRequest, PayoutSettings, ApiResponse, PaginatedResponse } from '../types';
import { mockPayouts, mockPayoutSettings } from '../lib/mockData';

export function usePayout() {
  const queryClient = useQueryClient();

  const payoutHistoryQuery = useQuery({
    queryKey: ['payouts'],
    queryFn: async (): Promise<PayoutRecord[]> => {
      // For development, return mock data
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockPayouts;
      
      // In production, use this:
      // const response = await apiClient.get<PaginatedResponse<PayoutRecord>>('/payouts');
      // return response.data;
    },
  });

  const payoutSettingsQuery = useQuery({
    queryKey: ['payout-settings'],
    queryFn: async (): Promise<PayoutSettings> => {
      // For development, return mock data
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockPayoutSettings;
      
      // In production, use this:
      // const response = await apiClient.get<ApiResponse<PayoutSettings>>('/payouts/settings');
      // return response.data;
    },
  });

  const requestPayoutMutation = useMutation({
    mutationFn: async (request: PayoutRequest) => {
      const response = await apiClient.post<ApiResponse<PayoutRecord>>('/payouts/request', request);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payouts'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });

  const cancelPayoutMutation = useMutation({
    mutationFn: async (payoutId: string) => {
      const response = await apiClient.post<ApiResponse<PayoutRecord>>(`/payouts/${payoutId}/cancel`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payouts'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });

  const retryPayoutMutation = useMutation({
    mutationFn: async (payoutId: string) => {
      const response = await apiClient.post<ApiResponse<PayoutRecord>>(`/payouts/${payoutId}/retry`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payouts'] });
    },
  });

  return {
    payouts: payoutHistoryQuery.data || [],
    settings: payoutSettingsQuery.data,
    isLoading: payoutHistoryQuery.isLoading || payoutSettingsQuery.isLoading,
    error: payoutHistoryQuery.error || payoutSettingsQuery.error,
    requestPayout: requestPayoutMutation.mutate,
    cancelPayout: cancelPayoutMutation.mutate,
    retryPayout: retryPayoutMutation.mutate,
    isRequestingPayout: requestPayoutMutation.isPending,
    isCancellingPayout: cancelPayoutMutation.isPending,
    isRetryingPayout: retryPayoutMutation.isPending,
  };
}