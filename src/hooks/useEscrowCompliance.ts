import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '../lib/api';

interface EscrowTransaction {
  id: string;
  amount: number;
  currency: 'USDC';
  status: 'held' | 'released' | 'frozen' | 'disputed';
  videoId: string;
  videoTitle: string;
  fromUser: {
    id: string;
    handle: string;
    displayName: string;
    avatar?: string;
  };
  createdAt: string;
  releaseDate: string;
  holdDays: number;
  disputeReason?: string;
  adminNotes?: string;
}

interface EscrowSummary {
  totalHeld: number;
  totalReleased: number;
  totalFrozen: number;
  pendingCount: number;
  releasedCount: number;
  frozenCount: number;
}

interface DisputeData {
  reason: string;
  category: 'unauthorized' | 'technical' | 'content' | 'other';
  description: string;
  evidence?: string;
}

interface ComplianceReport {
  id: string;
  type: 'monthly' | 'quarterly' | 'annual' | 'custom';
  period: string;
  status: 'generating' | 'ready' | 'submitted' | 'error';
  generatedAt: string;
  submittedAt?: string;
  downloadUrl?: string;
  summary: {
    totalTransactions: number;
    totalAmount: number;
    uniqueUsers: number;
    averageTransaction: number;
  };
}

export function useEscrowCompliance() {
  const queryClient = useQueryClient();

  // Fetch escrow transactions
  const escrowQuery = useQuery({
    queryKey: ['escrow', 'transactions'],
    queryFn: async (): Promise<{ transactions: EscrowTransaction[]; summary: EscrowSummary }> => {
      const response = await apiClient.get('/bff/studio/escrow');
      return response;
    },
  });

  // Fetch compliance reports
  const reportsQuery = useQuery({
    queryKey: ['compliance', 'reports'],
    queryFn: async (): Promise<ComplianceReport[]> => {
      const response = await apiClient.get('/bff/studio/compliance/reports');
      return response;
    },
  });

  // Request early release of escrowed funds
  const requestReleaseMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      const response = await apiClient.post(`/bff/studio/escrow/${transactionId}/request-release`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escrow', 'transactions'] });
      toast.success('Release request submitted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to request release');
    },
  });

  // Submit dispute for transaction
  const submitDisputeMutation = useMutation({
    mutationFn: async ({ transactionId, dispute }: { transactionId: string; dispute: DisputeData }) => {
      const response = await apiClient.post(`/bff/studio/escrow/${transactionId}/dispute`, dispute);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escrow', 'transactions'] });
      toast.success('Dispute submitted successfully. Transaction has been frozen pending review.');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit dispute');
    },
  });

  // Generate compliance report
  const generateReportMutation = useMutation({
    mutationFn: async ({ type, period }: { type: ComplianceReport['type']; period: string }) => {
      const response = await apiClient.post('/bff/studio/compliance/reports/generate', {
        type,
        period,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance', 'reports'] });
      toast.success('Report generation started. You will be notified when it\'s ready.');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to generate report');
    },
  });

  // Download compliance report
  const downloadReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const response = await apiClient.get(`/bff/studio/compliance/reports/${reportId}/download`, {
        headers: { Accept: 'application/pdf' },
      });
      
      // Create blob and download
      const blob = new Blob([response], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `compliance-report-${reportId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return response;
    },
    onSuccess: () => {
      toast.success('Report downloaded successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to download report');
    },
  });

  // Submit compliance report to authorities
  const submitReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const response = await apiClient.post(`/bff/studio/compliance/reports/${reportId}/submit`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance', 'reports'] });
      toast.success('Report submitted to regulatory authorities successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit report');
    },
  });

  // Bulk operations for escrow transactions
  const bulkEscrowMutation = useMutation({
    mutationFn: async ({ 
      action, 
      transactionIds 
    }: { 
      action: 'request-release' | 'freeze' | 'unfreeze'; 
      transactionIds: string[] 
    }) => {
      const response = await apiClient.post('/bff/studio/escrow/bulk', {
        action,
        transactionIds,
      });
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['escrow', 'transactions'] });
      toast.success(`Bulk ${variables.action} completed for ${variables.transactionIds.length} transaction(s)`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to perform bulk operation');
    },
  });

  // Helper functions
  const requestRelease = useCallback((transactionId: string) => {
    requestReleaseMutation.mutate(transactionId);
  }, [requestReleaseMutation]);

  const submitDispute = useCallback((transactionId: string, dispute: DisputeData) => {
    submitDisputeMutation.mutate({ transactionId, dispute });
  }, [submitDisputeMutation]);

  const generateReport = useCallback((type: ComplianceReport['type'], period: string) => {
    generateReportMutation.mutate({ type, period });
  }, [generateReportMutation]);

  const downloadReport = useCallback((reportId: string) => {
    downloadReportMutation.mutate(reportId);
  }, [downloadReportMutation]);

  const submitReport = useCallback((reportId: string) => {
    submitReportMutation.mutate(reportId);
  }, [submitReportMutation]);

  const bulkEscrowAction = useCallback((
    action: 'request-release' | 'freeze' | 'unfreeze', 
    transactionIds: string[]
  ) => {
    bulkEscrowMutation.mutate({ action, transactionIds });
  }, [bulkEscrowMutation]);

  return {
    // Data
    escrowData: escrowQuery.data,
    reports: reportsQuery.data || [],
    
    // Loading states
    isLoadingEscrow: escrowQuery.isLoading,
    isLoadingReports: reportsQuery.isLoading,
    isRequestingRelease: requestReleaseMutation.isPending,
    isSubmittingDispute: submitDisputeMutation.isPending,
    isGeneratingReport: generateReportMutation.isPending,
    isDownloadingReport: downloadReportMutation.isPending,
    isSubmittingReport: submitReportMutation.isPending,
    isBulkProcessing: bulkEscrowMutation.isPending,
    
    // Error states
    escrowError: escrowQuery.error,
    reportsError: reportsQuery.error,
    
    // Actions
    requestRelease,
    submitDispute,
    generateReport,
    downloadReport,
    submitReport,
    bulkEscrowAction,
    
    // Refetch functions
    refetchEscrow: escrowQuery.refetch,
    refetchReports: reportsQuery.refetch,
  };
}

// Hook for escrow transaction filtering and sorting
export function useEscrowFilters(transactions: EscrowTransaction[] = []) {
  const [statusFilter, setStatusFilter] = useState<EscrowTransaction['status'] | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTransactions = transactions
    .filter(transaction => {
      // Status filter
      if (statusFilter !== 'all' && transaction.status !== statusFilter) {
        return false;
      }
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          transaction.videoTitle.toLowerCase().includes(query) ||
          transaction.fromUser.displayName.toLowerCase().includes(query) ||
          transaction.fromUser.handle.toLowerCase().includes(query)
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  return {
    filteredTransactions,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    searchQuery,
    setSearchQuery,
  };
}