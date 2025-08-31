import React, { useState } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { EscrowStatusCard } from '../../components/studio/EscrowStatusCard';
import { DisputeResolutionDialog } from '../../components/studio/DisputeResolutionDialog';
import { ComplianceReportingCard } from '../../components/studio/ComplianceReportingCard';
import { useEscrowCompliance, useEscrowFilters } from '../../hooks/useEscrowCompliance';
import { 
  DollarSign, 
  FileText, 
  AlertTriangle, 
  TrendingUp,
  Clock,
  Shield,
  Download,
  RefreshCw
} from 'lucide-react';

export function EscrowCompliance() {
  const {
    escrowData,
    reports,
    isLoadingEscrow,
    isLoadingReports,
    isRequestingRelease,
    isSubmittingDispute,
    isGeneratingReport,
    requestRelease,
    submitDispute,
    generateReport,
    downloadReport,
    submitReport,
    refetchEscrow,
    refetchReports,
  } = useEscrowCompliance();

  const {
    filteredTransactions,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
  } = useEscrowFilters(escrowData?.transactions);

  const [disputeDialog, setDisputeDialog] = useState<{
    isOpen: boolean;
    transactionId: string;
    transactionAmount: number;
  }>({
    isOpen: false,
    transactionId: '',
    transactionAmount: 0,
  });

  const handleOpenDispute = (transactionId: string, amount: number) => {
    setDisputeDialog({
      isOpen: true,
      transactionId,
      transactionAmount: amount,
    });
  };

  const handleCloseDispute = () => {
    setDisputeDialog({
      isOpen: false,
      transactionId: '',
      transactionAmount: 0,
    });
  };

  const handleSubmitDispute = (disputeData: any) => {
    submitDispute(disputeDialog.transactionId, disputeData);
    handleCloseDispute();
  };

  const handleRefresh = () => {
    refetchEscrow();
    refetchReports();
  };

  // Calculate summary stats
  const summary = escrowData?.summary || {
    totalHeld: 0,
    totalReleased: 0,
    totalFrozen: 0,
    pendingCount: 0,
    releasedCount: 0,
    frozenCount: 0,
  };

  const pendingReports = reports.filter(r => r.status === 'ready').length;
  const overdueReports = reports.filter(r => {
    const reportDate = new Date(r.generatedAt);
    const now = new Date();
    const daysDiff = (now.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24);
    return r.status === 'ready' && daysDiff > 30;
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Escrow & Compliance</h1>
          <p className="text-muted-foreground mt-1">
            Manage payment escrow and regulatory compliance reporting
          </p>
        </div>
        
        <Button
          onClick={handleRefresh}
          variant="outline"
          disabled={isLoadingEscrow || isLoadingReports}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${(isLoadingEscrow || isLoadingReports) ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">In Escrow</p>
              <p className="text-2xl font-bold">
                ${summary.totalHeld.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                {summary.pendingCount} transactions
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Released</p>
              <p className="text-2xl font-bold">
                ${summary.totalReleased.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                {summary.releasedCount} transactions
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Frozen/Disputed</p>
              <p className="text-2xl font-bold">
                ${summary.totalFrozen.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                {summary.frozenCount} transactions
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Reports</p>
              <p className="text-2xl font-bold">{pendingReports}</p>
              <p className="text-xs text-muted-foreground">
                {overdueReports} overdue
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="escrow" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="escrow" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Payment Escrow
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Compliance Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="escrow" className="space-y-6">
          {/* Escrow Filters */}
          <Card className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by video title, user name, or handle..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>
              
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="held">In Escrow</option>
                  <option value="released">Released</option>
                  <option value="frozen">Frozen</option>
                  <option value="disputed">Disputed</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Escrow Status Card */}
          <EscrowStatusCard
            transactions={filteredTransactions}
            totalHeld={summary.totalHeld}
            totalReleased={summary.totalReleased}
            totalFrozen={summary.totalFrozen}
            onRequestRelease={requestRelease}
            onDispute={handleOpenDispute}
            isLoading={isLoadingEscrow}
          />
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          {/* Compliance Reporting Card */}
          <ComplianceReportingCard
            reports={reports}
            onGenerateReport={generateReport}
            onDownloadReport={downloadReport}
            onSubmitReport={submitReport}
            isGenerating={isGeneratingReport}
          />

          {/* Compliance Help */}
          <Card className="p-6">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-primary mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Compliance Requirements</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    • <strong>Monthly Reports:</strong> Due by the 15th of each month for the previous month's activity
                  </p>
                  <p>
                    • <strong>Quarterly Reports:</strong> Due within 30 days of quarter end
                  </p>
                  <p>
                    • <strong>Annual Reports:</strong> Comprehensive yearly report due by March 31st
                  </p>
                  <p>
                    • <strong>Custom Reports:</strong> Generate reports for specific date ranges as needed
                  </p>
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Note:</strong> All reports include transaction summaries, user statistics, 
                    and compliance data required by financial regulations. Reports are automatically 
                    formatted for submission to relevant authorities.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dispute Resolution Dialog */}
      <DisputeResolutionDialog
        isOpen={disputeDialog.isOpen}
        onClose={handleCloseDispute}
        onSubmit={handleSubmitDispute}
        transactionId={disputeDialog.transactionId}
        transactionAmount={disputeDialog.transactionAmount}
        isSubmitting={isSubmittingDispute}
      />
    </div>
  );
}