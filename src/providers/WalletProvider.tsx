// Simplified Wallet Provider - will be implemented later
export const useWallet = () => {
  return {
    balance: null,
    isLoading: false,
    refreshBalance: async () => {},
    tip: async () => {},
  };
};