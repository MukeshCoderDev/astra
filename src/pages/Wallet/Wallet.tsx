import { useSearchParams } from 'react-router-dom';
import { USDCBalance } from '../../components/wallet/USDCBalance';
import { OnRampButton } from '../../components/wallet/OnRampButton';
import { WithdrawDialog } from '../../components/wallet/WithdrawDialog';
import { useWallet } from '../../hooks/useWallet';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Separator } from '../../components/ui/separator';
import { 
  Wallet as WalletIcon, 
  Plus, 
  ArrowUpRight,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

function Wallet() {
  const [searchParams] = useSearchParams();
  const action = searchParams.get('action');

  const {
    balance,
    transactions,
    isLoadingBalance,
    isLoadingTransactions,
    balanceError,
    refetchBalance,
    formatCurrency
  } = useWallet({
    onBalanceUpdate: (newBalance) => {
      console.log('Balance updated:', newBalance);
    },
    onTransactionComplete: (transaction) => {
      console.log('Transaction completed:', transaction);
    },
    onError: (error) => {
      console.error('Wallet error:', error);
    }
  });

  // Mock data for development
  const mockBalance = balance || {
    usdc: 1250.75,
    pendingEarnings: 45.20,
    availableForWithdraw: 1205.55,
    lastUpdated: new Date().toISOString()
  };

  const mockTransactions = transactions || [
    {
      id: '1',
      amount: 25.00,
      currency: 'USDC' as const,
      videoId: 'video-1',
      creatorId: 'creator-1',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      status: 'completed' as const
    },
    {
      id: '2',
      amount: 10.50,
      currency: 'USDC' as const,
      videoId: 'video-2',
      creatorId: 'creator-2',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      status: 'completed' as const
    },
    {
      id: '3',
      amount: 50.00,
      currency: 'USDC' as const,
      videoId: 'video-3',
      creatorId: 'creator-3',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending' as const
    }
  ];

  if (balanceError) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <WalletIcon className="h-6 w-6" />
            Wallet
          </h1>
        </div>

        <Card className="p-8 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Failed to load wallet</h3>
              <p className="text-muted-foreground text-sm mb-4">
                There was an error loading your wallet information.
              </p>
              
              <Button onClick={() => refetchBalance()} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <WalletIcon className="h-6 w-6" />
          Wallet
        </h1>
        
        <div className="flex items-center gap-2">
          <OnRampButton 
            variant="outline"
            onSuccess={(amount) => {
              console.log(`Added ${formatCurrency(amount)} to wallet`);
              refetchBalance();
            }}
          />
          
          <WithdrawDialog 
            balance={mockBalance}
            onSuccess={(amount) => {
              console.log(`Withdrew ${formatCurrency(amount)} from wallet`);
              refetchBalance();
            }}
          />
        </div>
      </div>

      {/* Quick Actions */}
      {action === 'add-funds' && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-3">
            <Plus className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <div className="font-medium">Add funds to your wallet</div>
              <div className="text-sm text-muted-foreground">
                Get started by adding USDC to tip creators
              </div>
            </div>
            <OnRampButton 
              onSuccess={(amount) => {
                console.log(`Added ${formatCurrency(amount)} to wallet`);
                refetchBalance();
              }}
            />
          </div>
        </Card>
      )}

      {/* Main Balance Display */}
      <USDCBalance
        balance={mockBalance}
        transactions={mockTransactions}
        isLoading={isLoadingBalance || isLoadingTransactions}
        onRefresh={refetchBalance}
      />

      {/* Additional Information */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">About Your Wallet</h3>
          
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
              <div>
                <strong>USDC Balance:</strong> Your main wallet balance in USD Coin, a stable cryptocurrency pegged to the US Dollar.
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
              <div>
                <strong>Pending Earnings:</strong> Tips and earnings that are currently being processed and will be available soon.
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
              <div>
                <strong>Available to Withdraw:</strong> Funds that can be withdrawn to your bank account or debit card.
              </div>
            </div>
          </div>

          <Separator />

          <div className="text-xs text-muted-foreground">
            <p>
              Your wallet is secured with industry-standard encryption. Withdrawals may take 1-3 business days for bank transfers or be instant for debit cards (fees apply).
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default Wallet;