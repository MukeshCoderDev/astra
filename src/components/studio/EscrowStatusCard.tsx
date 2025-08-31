import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { 
  Clock, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye,
  Calendar,
  User,
  Video
} from 'lucide-react';
import { formatDuration } from '../../lib/utils';

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

interface EscrowStatusCardProps {
  transactions: EscrowTransaction[];
  totalHeld: number;
  totalReleased: number;
  totalFrozen: number;
  onRequestRelease?: (transactionId: string) => void;
  onDispute?: (transactionId: string, reason: string) => void;
  isLoading?: boolean;
}

const STATUS_CONFIG = {
  held: {
    label: 'In Escrow',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
    icon: Clock,
  },
  released: {
    label: 'Released',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
    icon: CheckCircle,
  },
  frozen: {
    label: 'Frozen',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
    icon: XCircle,
  },
  disputed: {
    label: 'Disputed',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
    icon: AlertTriangle,
  },
};

export function EscrowStatusCard({
  transactions,
  totalHeld,
  totalReleased,
  totalFrozen,
  onRequestRelease,
  onDispute,
  isLoading = false,
}: EscrowStatusCardProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<EscrowTransaction | null>(null);
  const [disputeReason, setDisputeReason] = useState('');

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

  const getTimeUntilRelease = (releaseDate: string) => {
    const now = new Date();
    const release = new Date(releaseDate);
    const diffMs = release.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Ready for release';
    
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} remaining`;
    } else {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} remaining`;
    }
  };

  const handleDispute = () => {
    if (selectedTransaction && disputeReason.trim() && onDispute) {
      onDispute(selectedTransaction.id, disputeReason);
      setSelectedTransaction(null);
      setDisputeReason('');
    }
  };

  const heldTransactions = transactions.filter(t => t.status === 'held');
  const recentTransactions = transactions.slice(0, 5);

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <DollarSign className="h-5 w-5 text-primary" />
        <div>
          <h3 className="text-lg font-semibold">Payment Escrow Status</h3>
          <p className="text-sm text-muted-foreground">
            Tips are held in escrow for 3 days before release
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
              In Escrow
            </span>
          </div>
          <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
            {formatCurrency(totalHeld)}
          </p>
          <p className="text-xs text-orange-700 dark:text-orange-300">
            {heldTransactions.length} transaction{heldTransactions.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800 dark:text-green-200">
              Released
            </span>
          </div>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100">
            {formatCurrency(totalReleased)}
          </p>
          <p className="text-xs text-green-700 dark:text-green-300">
            Last 30 days
          </p>
        </div>

        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-800 dark:text-red-200">
              Frozen/Disputed
            </span>
          </div>
          <p className="text-2xl font-bold text-red-900 dark:text-red-100">
            {formatCurrency(totalFrozen)}
          </p>
          <p className="text-xs text-red-700 dark:text-red-300">
            Requires attention
          </p>
        </div>
      </div>

      <Separator className="mb-6" />

      {/* Recent Transactions */}
      <div>
        <h4 className="font-medium mb-4">Recent Escrow Transactions</h4>
        
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : recentTransactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No escrow transactions found</p>
            <p className="text-xs mt-1">Tips will appear here when received</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTransactions.map((transaction) => {
              const StatusIcon = STATUS_CONFIG[transaction.status].icon;
              
              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <StatusIcon className="h-5 w-5 text-primary" />
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {formatCurrency(transaction.amount)}
                        </span>
                        <Badge className={STATUS_CONFIG[transaction.status].color}>
                          {STATUS_CONFIG[transaction.status].label}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{transaction.fromUser.displayName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Video className="h-3 w-3" />
                          <span className="truncate max-w-32">
                            {transaction.videoTitle}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(transaction.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {transaction.status === 'held' && (
                      <div className="text-right text-sm">
                        <p className="text-muted-foreground">
                          {getTimeUntilRelease(transaction.releaseDate)}
                        </p>
                        {onRequestRelease && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onRequestRelease(transaction.id)}
                            className="mt-1"
                          >
                            Request Release
                          </Button>
                        )}
                      </div>
                    )}

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedTransaction(transaction)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Transaction Details</DialogTitle>
                        </DialogHeader>
                        
                        {selectedTransaction && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Amount</span>
                              <span className="font-medium">
                                {formatCurrency(selectedTransaction.amount)}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Status</span>
                              <Badge className={STATUS_CONFIG[selectedTransaction.status].color}>
                                {STATUS_CONFIG[selectedTransaction.status].label}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">From</span>
                              <span className="font-medium">
                                {selectedTransaction.fromUser.displayName}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Video</span>
                              <span className="font-medium truncate max-w-48">
                                {selectedTransaction.videoTitle}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Received</span>
                              <span className="font-medium">
                                {formatDate(selectedTransaction.createdAt)}
                              </span>
                            </div>
                            
                            {selectedTransaction.status === 'held' && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Release Date</span>
                                <span className="font-medium">
                                  {formatDate(selectedTransaction.releaseDate)}
                                </span>
                              </div>
                            )}
                            
                            {selectedTransaction.disputeReason && (
                              <div>
                                <span className="text-sm text-muted-foreground">Dispute Reason</span>
                                <p className="text-sm mt-1 p-2 bg-muted rounded">
                                  {selectedTransaction.disputeReason}
                                </p>
                              </div>
                            )}
                            
                            {selectedTransaction.adminNotes && (
                              <div>
                                <span className="text-sm text-muted-foreground">Admin Notes</span>
                                <p className="text-sm mt-1 p-2 bg-muted rounded">
                                  {selectedTransaction.adminNotes}
                                </p>
                              </div>
                            )}
                            
                            {selectedTransaction.status === 'held' && onDispute && (
                              <div className="pt-4 border-t">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                  onClick={() => {
                                    // Open dispute dialog
                                    setDisputeReason('');
                                  }}
                                >
                                  <AlertTriangle className="h-4 w-4 mr-2" />
                                  Report Issue
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
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
          Tips are automatically held in escrow for 3 days to allow for dispute resolution. 
          Funds are released automatically unless frozen by admin action or dispute.
        </p>
      </div>
    </Card>
  );
}