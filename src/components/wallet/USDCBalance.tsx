import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { clsx } from 'clsx';
import { WalletBalance, TipTransaction } from '../../types';

interface USDCBalanceProps {
  balance: WalletBalance;
  transactions?: TipTransaction[];
  isLoading?: boolean;
  onRefresh?: () => void;
  className?: string;
}

export function USDCBalance({
  balance,
  transactions = [],
  isLoading = false,
  onRefresh,
  className
}: USDCBalanceProps) {
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (transaction: TipTransaction) => {
    // This would be determined by transaction type in a real implementation
    // For now, assuming all transactions are tips received
    return <ArrowDownLeft className="h-4 w-4 text-green-600" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className={clsx('space-y-6', className)}>
      {/* Main Balance Card */}
      <Card className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-lg font-semibold">USDC Balance</h2>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsBalanceVisible(!isBalanceVisible)}
              >
                {isBalanceVisible ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              
              {onRefresh && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRefresh}
                  disabled={isLoading}
                >
                  <RefreshCw className={clsx('h-4 w-4', isLoading && 'animate-spin')} />
                </Button>
              )}
            </div>
          </div>

          {/* Main Balance */}
          <div className="space-y-2">
            <div className="text-3xl font-bold">
              {isBalanceVisible ? formatBalance(balance.usdc) : '••••••'}
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Badge variant="outline" className="text-xs">USDC</Badge>
              <span>•</span>
              <span>Last updated {formatDate(balance.lastUpdated)}</span>
            </div>
          </div>

          <Separator />

          {/* Balance Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Pending Earnings</span>
              </div>
              <div className="text-lg font-medium">
                {isBalanceVisible ? formatBalance(balance.pendingEarnings) : '••••'}
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>Available to Withdraw</span>
              </div>
              <div className="text-lg font-medium">
                {isBalanceVisible ? formatBalance(balance.availableForWithdraw) : '••••'}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <Card className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Recent Transactions</h3>
            
            <div className="space-y-3">
              {transactions.slice(0, 5).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {getTransactionIcon(transaction)}
                    </div>
                    
                    <div className="space-y-1">
                      <div className="font-medium">
                        Tip received
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(transaction.timestamp)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-medium">
                      +{formatBalance(transaction.amount)}
                    </div>
                    <div className={clsx('text-sm capitalize', getStatusColor(transaction.status))}>
                      {transaction.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {transactions.length > 5 && (
              <Button variant="outline" className="w-full">
                View All Transactions
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Empty State */}
      {transactions.length === 0 && (
        <Card className="p-8 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto">
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
            
            <div>
              <h3 className="font-medium mb-2">No transactions yet</h3>
              <p className="text-muted-foreground text-sm">
                Your transaction history will appear here once you start receiving tips or making payments.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}