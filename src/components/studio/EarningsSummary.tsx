import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Eye,
  Users,
  Calendar,
  ArrowUpRight,
  Clock,
  Zap
} from 'lucide-react';
import { clsx } from 'clsx';

interface EarningsData {
  totalEarnings: number;
  monthlyEarnings: number;
  weeklyEarnings: number;
  dailyEarnings: number;
  pendingPayouts: number;
  totalViews: number;
  totalTips: number;
  averageTipAmount: number;
  topPerformingVideo?: {
    id: string;
    title: string;
    earnings: number;
    views: number;
  };
  earningsHistory: Array<{
    date: string;
    amount: number;
    type: 'tip' | 'payout' | 'bonus';
  }>;
}

interface EarningsSummaryProps {
  data: EarningsData;
  isLoading?: boolean;
  className?: string;
  onViewDetails?: () => void;
  onRequestPayout?: () => void;
}

export function EarningsSummary({
  data,
  isLoading = false,
  className,
  onViewDetails,
  onRequestPayout
}: EarningsSummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString();
  };

  const getEarningsChange = () => {
    // Mock calculation - in real app this would compare to previous period
    const change = ((data.monthlyEarnings - data.weeklyEarnings * 4) / (data.weeklyEarnings * 4)) * 100;
    return {
      percentage: Math.abs(change),
      isPositive: change >= 0
    };
  };

  const earningsChange = getEarningsChange();

  if (isLoading) {
    return (
      <div className={clsx('space-y-6', className)}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-8 bg-muted rounded animate-pulse" />
                <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('space-y-6', className)}>
      {/* Main Earnings Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Earnings */}
        <Card className="p-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Total Earnings</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(data.totalEarnings)}</div>
            <div className="flex items-center gap-1 text-xs">
              {earningsChange.isPositive ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span className={clsx(
                earningsChange.isPositive ? 'text-green-600' : 'text-red-600'
              )}>
                {earningsChange.percentage.toFixed(1)}% from last month
              </span>
            </div>
          </div>
        </Card>

        {/* Monthly Earnings */}
        <Card className="p-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">This Month</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(data.monthlyEarnings)}</div>
            <div className="text-xs text-muted-foreground">
              Weekly: {formatCurrency(data.weeklyEarnings)}
            </div>
          </div>
        </Card>

        {/* Pending Payouts */}
        <Card className="p-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Pending</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(data.pendingPayouts)}</div>
            <div className="text-xs text-muted-foreground">
              Available for payout
            </div>
          </div>
        </Card>

        {/* Total Tips */}
        <Card className="p-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <Zap className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Total Tips</span>
            </div>
            <div className="text-2xl font-bold">{formatNumber(data.totalTips)}</div>
            <div className="text-xs text-muted-foreground">
              Avg: {formatCurrency(data.averageTipAmount)}
            </div>
          </div>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Overview */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Performance Overview</h3>
              <Button variant="ghost" size="sm" onClick={onViewDetails}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Total Views</span>
                </div>
                <span className="font-medium">{formatNumber(data.totalViews)}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Unique Viewers</span>
                </div>
                <span className="font-medium">{formatNumber(Math.floor(data.totalViews * 0.7))}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Tips Received</span>
                </div>
                <span className="font-medium">{formatNumber(data.totalTips)}</span>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Engagement Rate</span>
                <Badge variant="secondary">
                  {((data.totalTips / data.totalViews) * 100).toFixed(2)}%
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Top Performing Content */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Top Performing</h3>
              <Button variant="ghost" size="sm">
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>

            {data.topPerformingVideo ? (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="font-medium truncate mb-1">
                    {data.topPerformingVideo.title}
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{formatNumber(data.topPerformingVideo.views)} views</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(data.topPerformingVideo.earnings)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Revenue per view</span>
                    <span className="font-medium">
                      {formatCurrency(data.topPerformingVideo.earnings / data.topPerformingVideo.views)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Performance vs average</span>
                    <Badge variant="outline" className="text-green-600">
                      +{(((data.topPerformingVideo.earnings / data.topPerformingVideo.views) / (data.totalEarnings / data.totalViews) - 1) * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <div className="w-12 h-12 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <p className="text-sm">No performance data yet</p>
                <p className="text-xs">Upload content to see analytics</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        <Button onClick={onRequestPayout} className="gap-2">
          <ArrowUpRight className="h-4 w-4" />
          Request Payout
        </Button>
        
        <Button variant="outline" onClick={onViewDetails} className="gap-2">
          <Eye className="h-4 w-4" />
          View Detailed Analytics
        </Button>
      </div>
    </div>
  );
}