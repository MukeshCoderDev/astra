import { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { 
  DollarSign, 
  Heart,
  Zap,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { clsx } from 'clsx';
import { Video, Creator } from '../../types';
import { useWallet } from '../../hooks/useWallet';

interface TipSheetProps {
  video: Video;
  creator: Creator;
  isOpen: boolean;
  onClose: () => void;
  onTipSent?: (amount: number) => void;
}

const PRESET_AMOUNTS = [1, 5, 10, 25, 50, 100];

export function TipSheet({
  video,
  creator,
  isOpen,
  onClose,
  onTipSent
}: TipSheetProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [step, setStep] = useState<'amount' | 'processing' | 'success' | 'error'>('amount');
  const [error, setError] = useState<string | null>(null);

  const {
    balance,
    sendTip,
    isSendingTip,
    formatCurrency
  } = useWallet();

  const getAmount = () => {
    return selectedAmount || parseFloat(customAmount) || 0;
  };

  const isAmountValid = () => {
    const amount = getAmount();
    const availableBalance = balance?.usdc || 0;
    return amount >= 1 && amount <= availableBalance && amount <= 1000;
  };

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
  };

  const handleSendTip = async () => {
    if (!isAmountValid()) return;

    const amount = getAmount();
    setStep('processing');
    setError(null);

    try {
      await sendTip({
        videoId: video.id,
        creatorId: creator.id,
        amount
      });

      setStep('success');
      onTipSent?.(amount);

      // Auto close after success
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send tip');
      setStep('error');
    }
  };

  const handleClose = () => {
    setSelectedAmount(null);
    setCustomAmount('');
    setMessage('');
    setStep('amount');
    setError(null);
    onClose();
  };

  const getInsufficientFundsMessage = () => {
    const amount = getAmount();
    const availableBalance = balance?.usdc || 0;
    const needed = amount - availableBalance;
    return `You need ${formatCurrency(needed)} more to send this tip.`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Send Tip
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Creator Info */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Avatar className="h-10 w-10">
              <AvatarImage src={creator.avatar} alt={creator.displayName} />
              <AvatarFallback>{creator.displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{creator.displayName}</div>
              <div className="text-sm text-muted-foreground truncate">@{creator.handle}</div>
            </div>
            
            {creator.verified && (
              <Badge variant="secondary" className="text-xs">
                Verified
              </Badge>
            )}
          </div>

          {/* Video Info */}
          <div className="text-sm text-muted-foreground">
            <div className="font-medium text-foreground mb-1">"{video.title}"</div>
            <div>{video.views.toLocaleString()} views • {video.likes.toLocaleString()} likes</div>
          </div>

          {/* Step 1: Amount Selection */}
          {step === 'amount' && (
            <div className="space-y-4">
              {/* Balance Display */}
              {balance && (
                <div className="text-center p-3 bg-primary/5 rounded-lg">
                  <div className="text-sm text-muted-foreground">Your balance</div>
                  <div className="font-medium">{formatCurrency(balance.usdc)}</div>
                </div>
              )}

              {/* Preset Amounts */}
              <div>
                <Label>Select amount</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {PRESET_AMOUNTS.map((amount) => (
                    <Button
                      key={amount}
                      variant={selectedAmount === amount ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleAmountSelect(amount)}
                      className="text-sm"
                      disabled={balance && amount > balance.usdc}
                    >
                      ${amount}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div className="space-y-2">
                <Label htmlFor="custom-amount">Or enter custom amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="custom-amount"
                    type="number"
                    placeholder="0.00"
                    value={customAmount}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    className="pl-10"
                    min="1"
                    max="1000"
                    step="0.01"
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  Minimum: $1.00 • Maximum: $1,000.00
                </div>
              </div>

              {/* Optional Message */}
              <div className="space-y-2">
                <Label htmlFor="tip-message">Message (optional)</Label>
                <Input
                  id="tip-message"
                  placeholder="Say something nice..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={100}
                />
                <div className="text-xs text-muted-foreground text-right">
                  {message.length}/100
                </div>
              </div>

              {/* Validation Messages */}
              {getAmount() > 0 && !isAmountValid() && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {balance && getAmount() > balance.usdc 
                    ? getInsufficientFundsMessage()
                    : getAmount() < 1 
                      ? 'Minimum tip is $1.00'
                      : 'Maximum tip is $1,000.00'
                  }
                </div>
              )}

              {/* Send Button */}
              <Button 
                onClick={handleSendTip}
                disabled={!isAmountValid() || isSendingTip}
                className="w-full gap-2"
              >
                {isSendingTip ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Heart className="h-4 w-4" />
                    Send {formatCurrency(getAmount())} Tip
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Step 2: Processing */}
          {step === 'processing' && (
            <div className="text-center space-y-4 py-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <div>
                <div className="font-medium">Sending Tip</div>
                <div className="text-sm text-muted-foreground">
                  Processing your {formatCurrency(getAmount())} tip...
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 'success' && (
            <div className="text-center space-y-4 py-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="font-medium">Tip Sent!</div>
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(getAmount())} sent to {creator.displayName}
                </div>
                {message && (
                  <div className="text-sm text-muted-foreground mt-2 italic">
                    "{message}"
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Error */}
          {step === 'error' && (
            <div className="text-center space-y-4 py-8">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <div className="font-medium">Tip Failed</div>
                <div className="text-sm text-muted-foreground">
                  {error || 'Something went wrong. Please try again.'}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={() => setStep('amount')} className="flex-1">
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}