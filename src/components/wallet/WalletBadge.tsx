import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Wallet, 
  DollarSign, 
  TrendingUp, 
  Plus,
  Eye,
  EyeOff
} from 'lucide-react';
import { clsx } from 'clsx';
import { WalletBalance } from '../../types';

interface WalletBadgeProps {
  balance?: WalletBalance | null;
  isLoading?: boolean;
  compact?: boolean;
  showBalance?: boolean;
  className?: string;
  onClick?: () => void;
}

export function WalletBadge({
  balance,
  isLoading = false,
  compact = false,
  showBalance = true,
  className,
  onClick
}: WalletBadgeProps) {
  const navigate = useNavigate();
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate('/wallet');
    }
  };

  const formatBalance = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount.toFixed(2)}`;
  };

  const toggleBalanceVisibility = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBalanceVisible(!isBalanceVisible);
  };

  if (compact) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        className={clsx('gap-2', className)}
        disabled={isLoading}
      >
        <Wallet className="h-4 w-4" />
        {showBalance && balance && (
          <span className="font-medium">
            {isBalanceVisible ? formatBalance(balance.usdc) : '••••'}
          </span>
        )}
      </Button>
    );
  }

  return (
    <div 
      className={clsx(
        'flex items-center gap-3 p-3 rounded-lg border bg-card cursor-pointer hover:bg-accent transition-colors',
        className
      )}
      onClick={handleClick}
    >
      {/* Wallet Icon */}
      <div className="flex-shrink-0">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
          <Wallet className="h-5 w-5 text-primary" />
        </div>
      </div>

      {/* Balance Info */}
      <div className="flex-1 min-w-0">
        {isLoading ? (
          <div className="space-y-1">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
          </div>
        ) : balance ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {showBalance && isBalanceVisible ? formatBalance(balance.usdc) : '••••'}
              </span>
              <Badge variant="secondary" className="text-xs">USDC</Badge>
              {showBalance && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleBalanceVisibility}
                  className="h-auto p-1"
                >
                  {isBalanceVisible ? (
                    <EyeOff className="h-3 w-3" />
                  ) : (
                    <Eye className="h-3 w-3" />
                  )}
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {balance.pendingEarnings > 0 && (
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>+{formatBalance(balance.pendingEarnings)} pending</span>
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                <span>{formatBalance(balance.availableForWithdraw)} available</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="font-medium">Connect Wallet</div>
            <div className="text-xs text-muted-foreground">
              Add funds to start tipping
            </div>
          </div>
        )}
      </div>

      {/* Add Funds Button */}
      {balance && (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            navigate('/wallet?action=add-funds');
          }}
          className="flex-shrink-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}