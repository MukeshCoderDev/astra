import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, handleAPIError } from '../lib/api';
import { useToast } from '../providers/ToastProvider';

// Simple API hook for direct HTTP calls
export function useApi() {
  return {
    get: async (endpoint: string) => {
      try {
        const response = await apiClient.get(endpoint);
        return { ok: true, data: response };
      } catch (error) {
        return { ok: false, error: handleAPIError(error) };
      }
    },
    post: async (endpoint: string, data?: any) => {
      try {
        const response = await apiClient.post(endpoint, data);
        return { ok: true, data: response };
      } catch (error) {
        return { ok: false, error: handleAPIError(error) };
      }
    },
    put: async (endpoint: string, data?: any) => {
      try {
        const response = await apiClient.put(endpoint, data);
        return { ok: true, data: response };
      } catch (error) {
        return { ok: false, error: handleAPIError(error) };
      }
    },
    delete: async (endpoint: string) => {
      try {
        const response = await apiClient.delete(endpoint);
        return { ok: true, data: response };
      } catch (error) {
        return { ok: false, error: handleAPIError(error) };
      }
    },
  };
}

// Generic API hook for GET requests
export function useApiQuery<T>(
  queryKey: string[],
  endpoint: string,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    cacheTime?: number;
  }
) {
  return useQuery({
    queryKey,
    queryFn: () => apiClient.get<T>(endpoint),
    staleTime: options?.staleTime || 1000 * 60 * 5, // 5 minutes
    enabled: options?.enabled,
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

// Generic API hook for mutations (POST, PUT, PATCH, DELETE)
export function useApiMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: unknown, variables: TVariables) => void;
    invalidateQueries?: string[][];
    showSuccessToast?: boolean;
    showErrorToast?: boolean;
    successMessage?: string;
  }
) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn,
    onSuccess: (data, variables) => {
      // Invalidate related queries
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }

      // Show success toast
      if (options?.showSuccessToast !== false) {
        success(options?.successMessage || 'Operation completed successfully');
      }

      // Call custom success handler
      options?.onSuccess?.(data, variables);
    },
    onError: (err, variables) => {
      // Show error toast
      if (options?.showErrorToast !== false) {
        error('Error', handleAPIError(err));
      }

      // Call custom error handler
      options?.onError?.(err, variables);
    },
  });
}

// Optimistic update helper
export function useOptimisticMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    queryKey: string[];
    updateFn: (oldData: any, variables: TVariables) => any;
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: unknown, variables: TVariables) => void;
  }
) {
  const queryClient = useQueryClient();
  const { error } = useToast();

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: options.queryKey });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(options.queryKey);

      // Optimistically update
      queryClient.setQueryData(options.queryKey, (old: any) =>
        options.updateFn(old, variables)
      );

      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(options.queryKey, context.previousData);
      }

      error('Error', handleAPIError(err));
      options?.onError?.(err, variables);
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: options.queryKey });
    },
    onSuccess: options?.onSuccess,
  });
}