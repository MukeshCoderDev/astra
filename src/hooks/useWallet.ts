import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { WalletBalance, TipTransaction } from '../types';

interface UseWalletOptions {
  onBalanceUpdate?: (balance: WalletBalance) => void;
  onTransactionComplete?: (transaction: TipTransaction) => void;
  onError?: (error: Error) => void;
}

export function useWallet(options: UseWalletOptions = {}) {
  const [isConnecting, setIsConnecting] = useState(false);
  const queryClient = useQueryClient();

  const {
    onBalanceUpdate,
    onTransactionComplete,
    onError
  } = options;

  // Fetch wallet balance
  const {
    data: balance,
    isLoading: isLoadingBalance,
    error: balanceError,
    refetch: refetchBalance
  } = useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn: async (): Promise<WalletBalance> => {
      // This would be replaced with actual API call
      const response = await fetch('/api/wallet/balance');
      if (!response.ok) {
        throw new Error('Failed to fetch wallet balance');
      }
      return response.json();
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
    onSuccess: (data) => {
      onBalanceUpdate?.(data);
    },
    onError: (error) => {
      onError?.(error as Error);
    }
  });

  // Fetch transaction history
  const {
    data: transactions,
    isLoading: isLoadingTransactions,
    error: transactionsError
  } = useQuery({
    queryKey: ['wallet', 'transactions'],
    queryFn: async (): Promise<TipTransaction[]> => {
      // This would be replaced with actual API call
      const response = await fetch('/api/wallet/transactions');
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      return response.json();
    },
    staleTime: 60000, // 1 minute
    onError: (error) => {
      onError?.(error as Error);
    }
  });

  // Add funds mutation
  const addFundsMutation = useMutation({
    mutationFn: async (amount: number): Promise<{ success: boolean; transactionId: string }> => {
      // This would be replaced with actual payment processing
      const response = await fetch('/api/wallet/add-funds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add funds');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch wallet data
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
    onError: (error) => {
      onError?.(error as Error);
    }
  });

  // Withdraw funds mutation
  const withdrawMutation = useMutation({
    mutationFn: async ({ 
      amount, 
      method 
    }: { 
      amount: number; 
      method: 'bank' | 'card' 
    }): Promise<{ success: boolean; transactionId: string }> => {
      // This would be replaced with actual withdrawal processing
      const response = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount, method }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to process withdrawal');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch wallet data
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
    onError: (error) => {
      onError?.(error as Error);
    }
  });

  // Send tip mutation
  const sendTipMutation = useMutation({
    mutationFn: async ({ 
      videoId, 
      creatorId, 
      amount 
    }: { 
      videoId: string; 
      creatorId: string; 
      amount: number 
    }): Promise<TipTransaction> => {
      // This would be replaced with actual tip processing
      const response = await fetch('/api/tips/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoId, creatorId, amount }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send tip');
      }
      
      return response.json();
    },
    onSuccess: (transaction) => {
      // Invalidate and refetch wallet data
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      onTransactionComplete?.(transaction);
    },
    onError: (error) => {
      onError?.(error as Error);
    }
  });

  // Connect wallet (for future Web3 integration)
  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    try {
      // This would be replaced with actual wallet connection logic
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refetch balance after connection
      await refetchBalance();
    } catch (error) {
      onError?.(error as Error);
    } finally {
      setIsConnecting(false);
    }
  }, [refetchBalance, onError]);

  // Format currency helper
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }, []);

  // Format balance helper
  const formatBalance = useCallback((amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return `${amount.toFixed(2)}`;
  }, []);

  return {
    // State
    balance,
    transactions,
    isConnecting,
    
    // Loading states
    isLoadingBalance,
    isLoadingTransactions,
    isAddingFunds: addFundsMutation.isPending,
    isWithdrawing: withdrawMutation.isPending,
    isSendingTip: sendTipMutation.isPending,
    
    // Errors
    balanceError,
    transactionsError,
    addFundsError: addFundsMutation.error,
    withdrawError: withdrawMutation.error,
    tipError: sendTipMutation.error,
    
    // Actions
    connectWallet,
    addFunds: addFundsMutation.mutate,
    withdraw: withdrawMutation.mutate,
    sendTip: sendTipMutation.mutate,
    refetchBalance,
    
    // Utilities
    formatCurrency,
    formatBalance
  };
}