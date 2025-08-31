import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { KYCVerification, ApiResponse } from '../types';
import { mockKYCData } from '../lib/mockData';

export function useKYC() {
  const queryClient = useQueryClient();

  const kycQuery = useQuery({
    queryKey: ['kyc'],
    queryFn: async (): Promise<KYCVerification> => {
      // For development, return mock data
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockKYCData;
      
      // In production, use this:
      // const response = await apiClient.get<ApiResponse<KYCVerification>>('/kyc/status');
      // return response.data;
    },
  });

  const startVerificationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<ApiResponse<{ verificationUrl: string }>>('/kyc/start');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc'] });
    },
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('document', file);
      
      const response = await apiClient.post<ApiResponse<{ uploadId: string }>>('/kyc/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc'] });
    },
  });

  const signModelReleaseMutation = useMutation({
    mutationFn: async (signature: string) => {
      const response = await apiClient.post<ApiResponse<{ releaseId: string }>>('/kyc/model-release', {
        signature,
        timestamp: new Date().toISOString(),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc'] });
    },
  });

  return {
    kycData: kycQuery.data,
    isLoading: kycQuery.isLoading,
    error: kycQuery.error,
    startVerification: startVerificationMutation.mutate,
    uploadDocument: uploadDocumentMutation.mutate,
    signModelRelease: signModelReleaseMutation.mutate,
    isStartingVerification: startVerificationMutation.isPending,
    isUploadingDocument: uploadDocumentMutation.isPending,
    isSigningRelease: signModelReleaseMutation.isPending,
  };
}