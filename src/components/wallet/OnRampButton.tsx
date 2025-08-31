import { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { 
  CreditCard, 
  DollarSign, 
  Plus,
  ArrowRight,
  Shield,
  Clock,
  CheckCircle
} from 'lucide-react';
import { clsx } from 'clsx';

interface OnRampButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  onSuccess?: (amount: number) => void;
}

const PRESET_AMOUNTS = [10, 25, 50, 100, 250, 500];

export function OnRampButton({
  variant = 'default',
  size = 'default',
  className,
  onSuccess
}: OnRampButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'amount' | 'payment' | 'processing' | 'success'>('amount');

  const getAmount = () => {
    return selectedAmount || parseFloat(customAmount) || 0;
  };

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
  };

  const handleContinue = () => {
    const amount = getAmount();
    if (amount >= 10 && amount <= 10000) {
      setStep('payment');
    }
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    setStep('processing');

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setStep('success');
      onSuccess?.(getAmount());
      
      // Auto close after success
      setTimeout(() => {
        setIsOpen(false);
        resetForm();
      }, 2000);
    } catch (error) {
      console.error('Payment failed:', error);
      setStep('payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setSelectedAmount(null);
    setCustomAmount('');
    setStep('amount');
    setIsProcessing(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const isAmountValid = () => {
    const amount = getAmount();
    return amount >= 10 && amount <= 10000;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={clsx('gap-2', className)}>
          <Plus className="h-4 w-4" />
          Add Funds
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Add Funds to Wallet
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Amount Selection */}
          {step === 'amount' && (
            <div className="space-y-4">
              <div>
                <Label>Select Amount (USD)</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {PRESET_AMOUNTS.map((amount) => (
                    <Button
                      key={amount}
                      variant={selectedAmount === amount ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleAmountSelect(amount)}
                      className="text-sm"
                    >
                      ${amount}
                    </Button>
                  ))}
                </div>
              </div>

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
                    min="10"
                    max="10000"
                    step="0.01"
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  Minimum: $10.00 • Maximum: $10,000.00
                </div>
              </div>

              {/* Fee Information */}
              <Card className="p-3 bg-muted/50">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span>${getAmount().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Processing fee (2.9%):</span>
                    <span>${(getAmount() * 0.029).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-2">
                    <span>Total charge:</span>
                    <span>${(getAmount() * 1.029).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-primary">
                    <span>You'll receive:</span>
                    <span>${getAmount().toFixed(2)} USDC</span>
                  </div>
                </div>
              </Card>

              <Button 
                onClick={handleContinue}
                disabled={!isAmountValid()}
                className="w-full gap-2"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Step 2: Payment Method */}
          {step === 'payment' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold">${getAmount().toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">
                  Total charge: ${(getAmount() * 1.029).toFixed(2)}
                </div>
              </div>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-8 w-8 text-primary" />
                  <div>
                    <div className="font-medium">Credit/Debit Card</div>
                    <div className="text-sm text-muted-foreground">
                      Visa, Mastercard, American Express
                    </div>
                  </div>
                </div>
              </Card>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span>Secured by industry-standard encryption</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Funds available instantly after payment</span>
                </div>
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
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="flex-1 gap-2"
                >
                  Pay ${(getAmount() * 1.029).toFixed(2)}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Processing */}
          {step === 'processing' && (
            <div className="text-center space-y-4 py-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <CreditCard className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <div>
                <div className="font-medium">Processing Payment</div>
                <div className="text-sm text-muted-foreground">
                  Please wait while we process your payment...
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
                <div className="font-medium">Payment Successful!</div>
                <div className="text-sm text-muted-foreground">
                  ${getAmount().toFixed(2)} USDC has been added to your wallet
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}