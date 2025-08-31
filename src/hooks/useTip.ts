import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TipTransaction } from '../types';

interface TipOptions {
  videoId: string;
  creatorId: string;
  amount: number;
  message?: string;
}

interface UseTipOptions {
  onTipSent?: (transaction: TipTransaction) => void;
  onError?: (error: Error) => void;
}

export function useTip(options: UseTipOptions = {}) {
  const [optimisticTips, setOptimisticTips] = useState<Map<string, number>>(new Map());
  const queryClient = useQueryClient();

  const { onTipSent, onError } = options;

  // Send tip mutation
  const sendTipMutation = useMutation({
    mutationFn: async (tipOptions: TipOptions): Promise<TipTransaction> => {
      // Add optimistic update
      setOptimisticTips(prev => {
        const newMap = new Map(prev);
        const currentTips = newMap.get(tipOptions.videoId) || 0;
        newMap.set(tipOptions.videoId, currentTips + tipOptions.amount);
        return newMap;
      });

      try {
        // This would be replaced with actual API call
        const response = await fetch('/api/tips/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tipOptions),
        });

        if (!response.ok) {
          throw new Error('Failed to send tip');
        }

        const transaction: TipTransaction = await response.json();
        return transaction;
      } catch (error) {
        // Revert optimistic update on error
        setOptimisticTips(prev => {
          const newMap = new Map(prev);
          const currentTips = newMap.get(tipOptions.videoId) || 0;
          const revertedTips = Math.max(0, currentTips - tipOptions.amount);
          if (revertedTips === 0) {
            newMap.delete(tipOptions.videoId);
          } else {
            newMap.set(tipOptions.videoId, revertedTips);
          }
          return newMap;
        });
        throw error;
      }
    },
    onSuccess: (transaction) => {
      // Remove optimistic update since real data will come from server
      setOptimisticTips(prev => {
        const newMap = new Map(prev);
        newMap.delete(transaction.videoId);
        return newMap;
      });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['videos', transaction.videoId] });
      queryClient.invalidateQueries({ queryKey: ['creator', transaction.creatorId] });

      onTipSent?.(transaction);
    },
    onError: (error) => {
      onError?.(error as Error);
    }
  });

  // Get optimistic tip amount for a video
  const getOptimisticTips = useCallback((videoId: string) => {
    return optimisticTips.get(videoId) || 0;
  }, [optimisticTips]);

  // Send tip with optimistic updates
  const sendTip = useCallback(async (tipOptions: TipOptions) => {
    return sendTipMutation.mutateAsync(tipOptions);
  }, [sendTipMutation]);

  // Check if user can afford tip
  const canAffordTip = useCallback((amount: number, balance?: number) => {
    if (!balance) return false;
    return balance >= amount;
  }, []);

  // Format tip amount for display
  const formatTipAmount = useCallback((amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return `${amount.toFixed(0)}`;
  }, []);

  // Get tip statistics for a video
  const getTipStats = useCallback((videoId: string, baseTips: number = 0) => {
    const optimisticAmount = getOptimisticTips(videoId);
    const totalTips = baseTips + optimisticAmount;
    
    return {
      totalTips,
      optimisticTips: optimisticAmount,
      baseTips,
      formattedAmount: formatTipAmount(totalTips)
    };
  }, [getOptimisticTips, formatTipAmount]);

  // Clear optimistic updates (useful for cleanup)
  const clearOptimisticTips = useCallback(() => {
    setOptimisticTips(new Map());
  }, []);

  return {
    // State
    isSendingTip: sendTipMutation.isPending,
    tipError: sendTipMutation.error,
    
    // Actions
    sendTip,
    clearOptimisticTips,
    
    // Utilities
    getOptimisticTips,
    getTipStats,
    canAffordTip,
    formatTipAmount
  };
}