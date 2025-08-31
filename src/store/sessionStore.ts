import { create } from 'zustand';

interface User {
  id: string;
  handle: string;
  displayName: string;
  avatar?: string;
  verified: boolean;
  kycStatus?: 'pending' | 'approved' | 'rejected';
}

interface SessionState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  login: (user: User) => void;
  logout: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (isLoading) => set({ isLoading }),
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));