import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Theme, getStoredTheme, setStoredTheme, applyTheme } from '../lib/theme';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
}

export function ThemeProvider({ children, defaultTheme = 'dark' }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);

  // Initialize theme from storage on mount
  useEffect(() => {
    const storedTheme = getStoredTheme();
    if (storedTheme && storedTheme !== theme) {
      setThemeState(storedTheme);
    }
    applyTheme(theme);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    setStoredTheme(newTheme);
    applyTheme(newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  // Apply theme when it changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const value = {
    theme,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};