export type Theme = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'theme';

export function getStoredTheme(): Theme {
  try {
    if (typeof window === 'undefined') return 'dark';
    
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme;
    return stored && (stored === 'dark' || stored === 'light') ? stored : 'dark';
  } catch {
    return 'dark';
  }
}

export function setStoredTheme(theme: Theme): void {
  try {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore localStorage errors
  }
}

export function applyTheme(theme: Theme): void {
  try {
    if (typeof window === 'undefined') return;
    
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  } catch {
    // Ignore DOM errors
  }
}

export function getSystemTheme(): Theme {
  try {
    if (typeof window === 'undefined') return 'dark';
    
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'dark';
  }
}

export function watchSystemTheme(callback: (theme: Theme) => void): () => void {
  try {
    if (typeof window === 'undefined') return () => {};
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handler = (e: MediaQueryListEvent) => {
      callback(e.matches ? 'dark' : 'light');
    };
    
    mediaQuery.addEventListener('change', handler);
    
    return () => mediaQuery.removeEventListener('change', handler);
  } catch {
    return () => {};
  }
}