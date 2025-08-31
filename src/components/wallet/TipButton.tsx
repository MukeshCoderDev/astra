import { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  DollarSign, 
  Heart,
  Zap
} from 'lucide-react';
import { clsx } from 'clsx';
import { TipSheet } from './TipSheet';
import { Video, Creator } from '../../types';

interface TipButtonProps {
  video: Video;
  creator: Creator;
  variant?: 'default' | 'outline' | 'ghost' | 'icon';
  size?: 'sm' | 'default' | 'lg';
  showAmount?: boolean;
  className?: string;
  onTipSent?: (amount: number) => void;
}

export function TipButton({
  video,
  creator,
  variant = 'outline',
  size = 'default',
  showAmount = true,
  className,
  onTipSent
}: TipButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [totalTipped, setTotalTipped] = useState(video.tips);

  const handleTipSent = (amount: number) => {
    setTotalTipped(prev => prev + amount);
    onTipSent?.(amount);
    setIsOpen(false);
  };

  const formatTipAmount = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return `${amount.toFixed(0)}`;
  };

  if (variant === 'icon') {
    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(true)}
          className={clsx('gap-2 text-muted-foreground hover:text-primary', className)}
        >
          <DollarSign className="h-4 w-4" />
          {showAmount && totalTipped > 0 && (
            <span className="text-sm">{formatTipAmount(totalTipped)}</span>
          )}
        </Button>

        <TipSheet
          video={video}
          creator={creator}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onTipSent={handleTipSent}
        />
      </>
    );
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsOpen(true)}
        className={clsx('gap-2', className)}
      >
        <Zap className="h-4 w-4" />
        <span>Tip</span>
        {showAmount && totalTipped > 0 && (
          <Badge variant="secondary" className="ml-1">
            ${formatTipAmount(totalTipped)}
          </Badge>
        )}
      </Button>

      <TipSheet
        video={video}
        creator={creator}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onTipSent={handleTipSent}
      />
    </>
  );
}