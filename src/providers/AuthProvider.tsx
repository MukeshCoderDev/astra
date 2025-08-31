// Simplified Auth Provider - will be implemented later
export const useAuth = () => {
  return {
    user: null,
    isAuthenticated: false,
    login: async () => {},
    logout: () => {},
    isLoading: false,
  };
};