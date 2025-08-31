import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { 
  DollarSign,
  Wallet,
  AlertTriangle,
  Info
} from 'lucide-react';

interface PayoutRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: number, walletAddress: string) => Promise<void>;
  availableBalance: number;
  minimumPayout: number;
  estimatedFees: number;
}

export function PayoutRequestDialog({
  isOpen,
  onClose,
  onSubmit,
  availableBalance,
  minimumPayout,
  estimatedFees
}: PayoutRequestDialogProps) {
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ amount?: string; walletAddress?: string }>({});

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const validateForm = () => {
    const newErrors: { amount?: string; walletAddress?: string } = {};
    
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount)) {
      newErrors.amount = 'Please enter a valid amount';
    } else if (numAmount < minimumPayout) {
      newErrors.amount = `Minimum payout is ${formatCurrency(minimumPayout)}`;
    } else if (numAmount > availableBalance) {
      newErrors.amount = 'Amount exceeds available balance';
    }

    if (!walletAddress) {
      newErrors.walletAddress = 'Please enter a wallet address';
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      newErrors.walletAddress = 'Please enter a valid Ethereum address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(parseFloat(amount), walletAddress);
      setAmount('');
      setWalletAddress('');
      onClose();
    } catch (error) {
      console.error('Payout request failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const netAmount = parseFloat(amount) ? parseFloat(amount) - estimatedFees : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request Payout</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="amount">Payout Amount</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                min={minimumPayout}
                max={availableBalance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="pl-10"
              />
            </div>
            {errors.amount && (
              <p className="text-sm text-red-600 mt-1">{errors.amount}</p>
            )}
            <p className="text-sm text-gray-600 mt-1">
              Available: {formatCurrency(availableBalance)}
            </p>
          </div>

          <div>
            <Label htmlFor="walletAddress">Destination Wallet Address</Label>
            <div className="relative">
              <Wallet className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="walletAddress"
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="0x..."
                className="pl-10 font-mono text-sm"
              />
            </div>
            {errors.walletAddress && (
              <p className="text-sm text-red-600 mt-1">{errors.walletAddress}</p>
            )}
            <p className="text-sm text-gray-600 mt-1">
              Enter a valid Ethereum address to receive USDC
            </p>
          </div>
        </div>

        {parseFloat(amount) > 0 && (
          <Card className="p-4 bg-gray-50 dark:bg-gray-900">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Payout Summary
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Requested Amount:</span>
                <span className="font-medium">{formatCurrency(parseFloat(amount))}</span>
              </div>
              <div className="flex justify-between">
                <span>Network Fees:</span>
                <span className="text-red-600">-{formatCurrency(estimatedFees)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-medium">
                <span>You'll Receive:</span>
                <span className="text-green-600">{formatCurrency(netAmount)}</span>
              </div>
            </div>
          </Card>
        )}

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <p className="font-medium mb-1">Important Notes:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Payouts are processed within 1-3 business days</li>
                <li>Network fees are deducted from your payout amount</li>
                <li>Ensure your wallet address is correct - transactions cannot be reversed</li>
                <li>You'll receive USDC on the Ethereum network</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting || !amount || !walletAddress}
            className="flex items-center gap-2"
          >
            {isSubmitting ? (
              <>Processing...</>
            ) : (
              <>
                <DollarSign className="w-4 h-4" />
                Request Payout
              </>
            )}
          </Button>
        </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}