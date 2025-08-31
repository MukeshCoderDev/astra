import { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { 
  ArrowUpRight, 
  DollarSign, 
  AlertCircle,
  CheckCircle,
  Clock,
  Shield,
  CreditCard,
  Building
} from 'lucide-react';
import { clsx } from 'clsx';
import { WalletBalance } from '../../types';

interface WithdrawDialogProps {
  balance: WalletBalance;
  trigger?: React.ReactNode;
  onSuccess?: (amount: number) => void;
  className?: string;
}

type WithdrawMethod = 'bank' | 'card';

export function WithdrawDialog({
  balance,
  trigger,
  onSuccess,
  className
}: WithdrawDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<WithdrawMethod>('bank');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'amount' | 'method' | 'processing' | 'success'>('amount');

  const getAmount = () => parseFloat(amount) || 0;
  const maxWithdraw = balance.availableForWithdraw;
  const minWithdraw = 10;

  const isAmountValid = () => {
    const amt = getAmount();
    return amt >= minWithdraw && amt <= maxWithdraw;
  };

  const getWithdrawFee = () => {
    return method === 'bank' ? 0 : getAmount() * 0.029; // 2.9% for card, free for bank
  };

  const getNetAmount = () => {
    return getAmount() - getWithdrawFee();
  };

  const handleContinue = () => {
    if (isAmountValid()) {
      setStep('method');
    }
  };

  const handleWithdraw = async () => {
    setIsProcessing(true);
    setStep('processing');

    try {
      // Simulate withdrawal processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setStep('success');
      onSuccess?.(getAmount());
      
      // Auto close after success
      setTimeout(() => {
        setIsOpen(false);
        resetForm();
      }, 2000);
    } catch (error) {
      console.error('Withdrawal failed:', error);
      setStep('method');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setMethod('bank');
    setStep('amount');
    setIsProcessing(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const defaultTrigger = (
    <Button variant="outline" className={clsx('gap-2', className)}>
      <ArrowUpRight className="h-4 w-4" />
      Withdraw
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpRight className="h-5 w-5" />
            Withdraw Funds
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Amount Selection */}
          {step === 'amount' && (
            <div className="space-y-4">
              {/* Available Balance */}
              <Card className="p-4 bg-muted/50">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Available to withdraw</div>
                  <div className="text-2xl font-bold">{formatCurrency(maxWithdraw)}</div>
                  <Badge variant="outline" className="mt-1">USDC</Badge>
                </div>
              </Card>

              {/* Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="withdraw-amount">Withdrawal Amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="withdraw-amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-10"
                    min={minWithdraw}
                    max={maxWithdraw}
                    step="0.01"
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Minimum: {formatCurrency(minWithdraw)}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAmount(maxWithdraw.toString())}
                    className="h-auto p-0 text-xs text-primary hover:bg-transparent"
                  >
                    Max: {formatCurrency(maxWithdraw)}
                  </Button>
                </div>
              </div>

              {/* Validation Messages */}
              {amount && !isAmountValid() && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {getAmount() < minWithdraw 
                    ? `Minimum withdrawal is ${formatCurrency(minWithdraw)}`
                    : `Maximum withdrawal is ${formatCurrency(maxWithdraw)}`
                  }
                </div>
              )}

              <Button 
                onClick={handleContinue}
                disabled={!isAmountValid()}
                className="w-full"
              >
                Continue
              </Button>
            </div>
          )}

          {/* Step 2: Method Selection */}
          {step === 'method' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{formatCurrency(getAmount())}</div>
                <div className="text-sm text-muted-foreground">Withdrawal amount</div>
              </div>

              {/* Withdrawal Methods */}
              <div className="space-y-3">
                <div className="text-sm font-medium">Select withdrawal method</div>
                
                {/* Bank Transfer */}
                <Card 
                  className={clsx(
                    'p-4 cursor-pointer transition-colors',
                    method === 'bank' ? 'ring-2 ring-primary' : 'hover:bg-accent'
                  )}
                  onClick={() => setMethod('bank')}
                >
                  <div className="flex items-center gap-3">
                    <Building className="h-6 w-6 text-primary" />
                    <div className="flex-1">
                      <div className="font-medium">Bank Transfer</div>
                      <div className="text-sm text-muted-foreground">
                        1-3 business days • No fees
                      </div>
                    </div>
                    <Badge variant="secondary">Free</Badge>
                  </div>
                </Card>

                {/* Debit Card */}
                <Card 
                  className={clsx(
                    'p-4 cursor-pointer transition-colors',
                    method === 'card' ? 'ring-2 ring-primary' : 'hover:bg-accent'
                  )}
                  onClick={() => setMethod('card')}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-6 w-6 text-primary" />
                    <div className="flex-1">
                      <div className="font-medium">Debit Card</div>
                      <div className="text-sm text-muted-foreground">
                        Instant • 2.9% fee
                      </div>
                    </div>
                    <Badge variant="outline">2.9%</Badge>
                  </div>
                </Card>
              </div>

              {/* Fee Breakdown */}
              <Card className="p-3 bg-muted/50">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Withdrawal amount:</span>
                    <span>{formatCurrency(getAmount())}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Processing fee:</span>
                    <span>{formatCurrency(getWithdrawFee())}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-2">
                    <span>You'll receive:</span>
                    <span>{formatCurrency(getNetAmount())}</span>
                  </div>
                </div>
              </Card>

              {/* Security Notice */}
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  Withdrawals are processed securely and may take up to {method === 'bank' ? '3 business days' : 'a few minutes'} to complete.
                </span>
              </div>

              {/* Legal Acknowledgment */}
              <div className="text-xs text-muted-foreground">
                <p>
                  By proceeding, you agree to our{' '}
                  <a 
                    href="/legal/terms" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Terms of Service
                  </a>
                  {' '}and acknowledge our{' '}
                  <a 
                    href="/legal/privacy" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Privacy Policy
                  </a>
                  . Withdrawal fees and processing times may apply.
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setStep('amount')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleWithdraw}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  Withdraw {formatCurrency(getNetAmount())}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Processing */}
          {step === 'processing' && (
            <div className="text-center space-y-4 py-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Clock className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <div>
                <div className="font-medium">Processing Withdrawal</div>
                <div className="text-sm text-muted-foreground">
                  Please wait while we process your withdrawal...
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <div className="text-center space-y-4 py-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="font-medium">Withdrawal Initiated!</div>
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(getNetAmount())} will arrive in {method === 'bank' ? '1-3 business days' : 'a few minutes'}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}