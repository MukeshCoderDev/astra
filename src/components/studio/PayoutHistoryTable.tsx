import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  DollarSign,
  Calendar,
  TrendingUp,
  Download,
  Clock,
  Check,
  AlertTriangle
} from 'lucide-react';

export interface PayoutRecord {
  id: string;
  amount: number;
  currency: 'USDC';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  requestedAt: string;
  processedAt?: string;
  transactionHash?: string;
  walletAddress?: string;
  fees: number;
  netAmount: number;
}

interface PayoutHistoryTableProps {
  payouts: PayoutRecord[];
  onRequestPayout: () => void;
  availableBalance: number;
  minimumPayout: number;
}

export function PayoutHistoryTable({ 
  payouts, 
  onRequestPayout, 
  availableBalance,
  minimumPayout 
}: PayoutHistoryTableProps) {
  const getStatusBadge = (status: PayoutRecord['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><Check className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"><TrendingUp className="w-3 h-3 mr-1" />Processing</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"><AlertTriangle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">Cancelled</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canRequestPayout = availableBalance >= minimumPayout;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold">Payout History</h3>
        </div>
        <Button 
          onClick={onRequestPayout}
          disabled={!canRequestPayout}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Request Payout
        </Button>
      </div>

      <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Available Balance</p>
            <p className="text-xl font-semibold text-green-600">{formatCurrency(availableBalance)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Minimum Payout</p>
            <p className="text-lg font-medium">{formatCurrency(minimumPayout)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Next Payout</p>
            <p className="text-lg font-medium">
              {canRequestPayout ? 'Available Now' : 'Insufficient Balance'}
            </p>
          </div>
        </div>
      </div>

      {payouts.length === 0 ? (
        <div className="text-center py-8">
          <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Payouts Yet</h4>
          <p className="text-gray-600 dark:text-gray-400">
            Your payout history will appear here once you request your first withdrawal.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-2 font-medium text-gray-900 dark:text-gray-100">Date</th>
                <th className="text-left py-3 px-2 font-medium text-gray-900 dark:text-gray-100">Amount</th>
                <th className="text-left py-3 px-2 font-medium text-gray-900 dark:text-gray-100">Fees</th>
                <th className="text-left py-3 px-2 font-medium text-gray-900 dark:text-gray-100">Net</th>
                <th className="text-left py-3 px-2 font-medium text-gray-900 dark:text-gray-100">Status</th>
                <th className="text-left py-3 px-2 font-medium text-gray-900 dark:text-gray-100">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((payout) => (
                <tr key={payout.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900">
                  <td className="py-3 px-2">
                    <div>
                      <p className="text-sm font-medium">{formatDate(payout.requestedAt)}</p>
                      {payout.processedAt && (
                        <p className="text-xs text-gray-500">Processed: {formatDate(payout.processedAt)}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <span className="font-medium">{formatCurrency(payout.amount)}</span>
                  </td>
                  <td className="py-3 px-2">
                    <span className="text-red-600">{formatCurrency(payout.fees)}</span>
                  </td>
                  <td className="py-3 px-2">
                    <span className="font-medium text-green-600">{formatCurrency(payout.netAmount)}</span>
                  </td>
                  <td className="py-3 px-2">
                    {getStatusBadge(payout.status)}
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      {payout.transactionHash && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`https://etherscan.io/tx/${payout.transactionHash}`, '_blank')}
                          className="text-xs"
                        >
                          View Tx
                        </Button>
                      )}
                      {payout.status === 'failed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {/* Handle retry */}}
                          className="text-xs"
                        >
                          Retry
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!canRequestPayout && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            You need at least {formatCurrency(minimumPayout)} to request a payout. 
            Current balance: {formatCurrency(availableBalance)}
          </p>
        </div>
      )}
    </Card>
  );
}