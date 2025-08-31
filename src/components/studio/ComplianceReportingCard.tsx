import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { 
  FileText, 
  Download, 
  Calendar, 
  DollarSign, 
  Users, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink
} from 'lucide-react';

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

interface ComplianceReportingCardProps {
  reports: ComplianceReport[];
  onGenerateReport: (type: ComplianceReport['type'], period: string) => void;
  onDownloadReport: (reportId: string) => void;
  onSubmitReport: (reportId: string) => void;
  isGenerating?: boolean;
}

const REPORT_TYPES = [
  {
    value: 'monthly',
    label: 'Monthly Report',
    description: 'Required monthly transaction summary',
    frequency: 'Due by 15th of each month',
  },
  {
    value: 'quarterly',
    label: 'Quarterly Report',
    description: 'Quarterly compliance and earnings report',
    frequency: 'Due within 30 days of quarter end',
  },
  {
    value: 'annual',
    label: 'Annual Report',
    description: 'Comprehensive annual compliance report',
    frequency: 'Due by March 31st',
  },
  {
    value: 'custom',
    label: 'Custom Report',
    description: 'Generate report for specific date range',
    frequency: 'On-demand',
  },
] as const;

const STATUS_CONFIG = {
  generating: {
    label: 'Generating',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
    icon: Clock,
  },
  ready: {
    label: 'Ready',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
    icon: CheckCircle,
  },
  submitted: {
    label: 'Submitted',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
    icon: FileText,
  },
  error: {
    label: 'Error',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
    icon: AlertCircle,
  },
};

export function ComplianceReportingCard({
  reports,
  onGenerateReport,
  onDownloadReport,
  onSubmitReport,
  isGenerating = false,
}: ComplianceReportingCardProps) {
  const [selectedReportType, setSelectedReportType] = useState<ComplianceReport['type']>('monthly');
  const [customPeriod, setCustomPeriod] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const getCurrentPeriod = (type: ComplianceReport['type']) => {
    const now = new Date();
    switch (type) {
      case 'monthly':
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      case 'quarterly':
        const quarter = Math.floor(now.getMonth() / 3) + 1;
        return `${now.getFullYear()}-Q${quarter}`;
      case 'annual':
        return `${now.getFullYear()}`;
      default:
        return customPeriod;
    }
  };

  const handleGenerateReport = () => {
    const period = getCurrentPeriod(selectedReportType);
    onGenerateReport(selectedReportType, period);
  };

  const getNextDueDate = () => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 15);
    return nextMonth.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const recentReports = reports.slice(0, 5);
  const pendingReports = reports.filter(r => r.status === 'ready').length;
  const overdueReports = reports.filter(r => {
    // Simple overdue logic - in real app, this would be more sophisticated
    const reportDate = new Date(r.generatedAt);
    const now = new Date();
    const daysDiff = (now.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24);
    return r.status === 'ready' && daysDiff > 30;
  }).length;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">Compliance Reporting</h3>
            <p className="text-sm text-muted-foreground">
              Generate and submit regulatory compliance reports
            </p>
          </div>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Generate Compliance Report</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-3 block">
                  Report Type
                </label>
                <div className="space-y-2">
                  {REPORT_TYPES.map((type) => (
                    <div
                      key={type.value}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedReportType === type.value
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedReportType(type.value)}
                    >
                      <div className="font-medium text-sm">{type.label}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {type.description}
                      </div>
                      <div className="text-xs text-primary mt-1">
                        {type.frequency}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedReportType === 'custom' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Custom Period
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 2024-01 to 2024-03"
                    value={customPeriod}
                    onChange={(e) => setCustomPeriod(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                </div>
              )}

              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="text-sm">
                  <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                    Report Period: {getCurrentPeriod(selectedReportType)}
                  </p>
                  <p className="text-blue-700 dark:text-blue-300 text-xs">
                    This report will include all transactions and compliance data for the specified period.
                  </p>
                </div>
              </div>

              <Button
                onClick={handleGenerateReport}
                disabled={isGenerating || (selectedReportType === 'custom' && !customPeriod)}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
              Pending Submission
            </span>
          </div>
          <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
            {pendingReports}
          </p>
          <p className="text-xs text-orange-700 dark:text-orange-300">
            Ready for submission
          </p>
        </div>

        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-800 dark:text-red-200">
              Overdue
            </span>
          </div>
          <p className="text-2xl font-bold text-red-900 dark:text-red-100">
            {overdueReports}
          </p>
          <p className="text-xs text-red-700 dark:text-red-300">
            Require immediate attention
          </p>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Next Due
            </span>
          </div>
          <p className="text-sm font-bold text-blue-900 dark:text-blue-100">
            {getNextDueDate()}
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Monthly report due
          </p>
        </div>
      </div>

      <Separator className="mb-6" />

      {/* Recent Reports */}
      <div>
        <h4 className="font-medium mb-4">Recent Reports</h4>
        
        {recentReports.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No reports generated yet</p>
            <p className="text-xs mt-1">Generate your first compliance report above</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentReports.map((report) => {
              const StatusIcon = STATUS_CONFIG[report.status].icon;
              
              return (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <StatusIcon className="h-5 w-5 text-primary" />
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {REPORT_TYPES.find(t => t.value === report.type)?.label} - {report.period}
                        </span>
                        <Badge className={STATUS_CONFIG[report.status].color}>
                          {STATUS_CONFIG[report.status].label}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          <span>{formatCurrency(report.summary.totalAmount)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          <span>{report.summary.totalTransactions} transactions</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{report.summary.uniqueUsers} users</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(report.generatedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {report.status === 'ready' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onDownloadReport(report.id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => onSubmitReport(report.id)}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Submit
                        </Button>
                      </>
                    )}
                    
                    {report.status === 'submitted' && report.downloadUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDownloadReport(report.id)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="mt-6 pt-4 border-t text-xs text-muted-foreground">
        <p>
          Compliance reports are automatically generated based on your transaction data. 
          Reports must be submitted to regulatory authorities within specified timeframes.
        </p>
      </div>
    </Card>
  );
}