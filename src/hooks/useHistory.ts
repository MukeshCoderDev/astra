import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiDelete } from '../lib/api';
import { useToast } from '../providers/ToastProvider';
import { generateIdempotencyKey, getErrorMessageForUser } from '../lib/errorHandling';
import type { HistoryItem } from '../types';

/**
 * Hook for optimistic history management
 * Provides immediate UI feedback with error recovery
 */
export function useHistory() {
  const queryClient = useQueryClient();
  const { error: showError, success: showSuccess } = useToast();

  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const idempotencyKey = generateIdempotencyKey('remove_history');
      
      const response = await apiDelete(`/bff/history/${itemId}`, {
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      });
      
      if (!response.ok) {
        throw new Error(response.error || 'Failed to remove from history');
      }
      
      return { itemId };
    },
    onMutate: async (itemId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['history'] });

      // Snapshot the previous value
      const previousHistory = queryClient.getQueriesData({ queryKey: ['history'] });

      // Optimistically remove the item
      queryClient.setQueriesData({ queryKey: ['history'] }, (old: any) => {
        if (!old) return old;
        
        if (old.pages) {
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              items: page.items?.filter((item: HistoryItem) => item.id !== itemId) || [],
            })),
          };
        }
        
        return Array.isArray(old) ? old.filter((item: HistoryItem) => item.id !== itemId) : old;
      });

      return { previousHistory };
    },
    onError: (error, itemId, context) => {
      // Revert optimistic updates
      if (context?.previousHistory) {
        context.previousHistory.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      // Show error message
      showError(
        'Failed to remove from history',
        getErrorMessageForUser(error)
      );
    },
    onSuccess: () => {
      showSuccess('Removed from history');
    },
    onSettled: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      const idempotencyKey = generateIdempotencyKey('clear_history');
      
      const response = await apiDelete('/bff/history/clear', {
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      });
      
      if (!response.ok) {
        throw new Error(response.error || 'Failed to clear history');
      }
      
      return true;
    },
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['history'] });

      // Snapshot the previous value
      const previousHistory = queryClient.getQueriesData({ queryKey: ['history'] });

      // Optimistically clear all history
      queryClient.setQueriesData({ queryKey: ['history'] }, (old: any) => {
        if (!old) return old;
        
        if (old.pages) {
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              items: [],
            })),
          };
        }
        
        return [];
      });

      return { previousHistory };
    },
    onError: (error, _, context) => {
      // Revert optimistic updates
      if (context?.previousHistory) {
        context.previousHistory.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      // Show error message
      showError(
        'Failed to clear history',
        getErrorMessageForUser(error)
      );
    },
    onSuccess: () => {
      showSuccess('History cleared');
    },
    onSettled: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });

  /**
   * Remove a single item from history
   */
  const removeItem = (itemId: string) => {
    removeItemMutation.mutate(itemId);
  };

  /**
   * Clear all history
   */
  const clearAll = () => {
    clearAllMutation.mutate();
  };

  return {
    removeItem,
    clearAll,
    isRemoving: removeItemMutation.isPending,
    isClearing: clearAllMutation.isPending,
    error: removeItemMutation.error || clearAllMutation.error,
  };
}