import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  immersive: boolean;             // hides left rail, expands content
  setSidebarOpen: (open: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  setImmersive: (v: boolean) => void;
  toggleSidebar: () => void;
  toggleMobileMenu: () => void;
  toggleImmersive: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      mobileMenuOpen: false,
      immersive: false, // user Theater preference; route can still force it on
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setMobileMenuOpen: (mobileMenuOpen) => set({ mobileMenuOpen }),
      setImmersive: (v) => set({ immersive: v }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
      toggleImmersive: () => set((s) => ({ immersive: !s.immersive })),
    }),
    { name: 'ui' }
  )
);