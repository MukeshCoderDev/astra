import React, { createContext, useContext, useEffect, useState } from 'react';
import { announceToScreenReader } from '../lib/accessibility';

interface AccessibilityContextType {
  prefersReducedMotion: boolean;
  prefersHighContrast: boolean;
  focusVisible: boolean;
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
  updatePageTitle: (title: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function useAccessibilityContext() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibilityContext must be used within AccessibilityProvider');
  }
  return context;
}

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);
  const [focusVisible, setFocusVisible] = useState(false);

  // Monitor reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Monitor high contrast preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setPrefersHighContrast(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersHighContrast(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Monitor focus visibility
  useEffect(() => {
    let hadKeyboardEvent = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.altKey || e.ctrlKey) return;
      hadKeyboardEvent = true;
    };

    const handlePointerDown = () => {
      hadKeyboardEvent = false;
    };

    const handleFocus = () => {
      setFocusVisible(hadKeyboardEvent);
    };

    const handleBlur = () => {
      setFocusVisible(false);
    };

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('mousedown', handlePointerDown, true);
    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('touchstart', handlePointerDown, true);
    document.addEventListener('focus', handleFocus, true);
    document.addEventListener('blur', handleBlur, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('mousedown', handlePointerDown, true);
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('touchstart', handlePointerDown, true);
      document.removeEventListener('focus', handleFocus, true);
      document.removeEventListener('blur', handleBlur, true);
    };
  }, []);

  // Update page title for screen readers
  const updatePageTitle = (title: string) => {
    document.title = `${title} | Astra`;
  };

  // Apply accessibility classes to document
  useEffect(() => {
    const classes = [];
    
    if (prefersReducedMotion) {
      classes.push('reduce-motion');
    }
    
    if (prefersHighContrast) {
      classes.push('high-contrast');
    }
    
    if (focusVisible) {
      classes.push('focus-visible');
    }

    document.documentElement.className = document.documentElement.className
      .replace(/\b(reduce-motion|high-contrast|focus-visible)\b/g, '')
      .trim();
    
    if (classes.length > 0) {
      document.documentElement.className += ` ${classes.join(' ')}`;
    }
  }, [prefersReducedMotion, prefersHighContrast, focusVisible]);

  const value: AccessibilityContextType = {
    prefersReducedMotion,
    prefersHighContrast,
    focusVisible,
    announceToScreenReader,
    updatePageTitle,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
      
      {/* Global accessibility styles */}
      <style jsx global>{`
        .reduce-motion *,
        .reduce-motion *::before,
        .reduce-motion *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
        
        .high-contrast {
          filter: contrast(150%);
        }
        
        .focus-visible *:focus {
          outline: 2px solid hsl(var(--ring)) !important;
          outline-offset: 2px !important;
        }
        
        /* Screen reader only utility */
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
        
        .sr-only.focus:not(.focus\\:not-sr-only):focus,
        .sr-only.focus-within:not(.focus-within\\:not-sr-only):focus-within {
          position: static;
          width: auto;
          height: auto;
          padding: inherit;
          margin: inherit;
          overflow: visible;
          clip: auto;
          white-space: normal;
        }
        
        /* Focus visible utilities */
        .focus\\:not-sr-only:focus {
          position: static;
          width: auto;
          height: auto;
          padding: inherit;
          margin: inherit;
          overflow: visible;
          clip: auto;
          white-space: normal;
        }
        
        /* High contrast mode adjustments */
        @media (prefers-contrast: high) {
          .border {
            border-width: 2px;
          }
          
          .focus-visible\\:ring-2:focus-visible {
            --tw-ring-width: 3px;
          }
        }
        
        /* Reduced motion adjustments */
        @media (prefers-reduced-motion: reduce) {
          .animate-spin {
            animation: none;
          }
          
          .transition-all,
          .transition,
          .transition-colors,
          .transition-opacity,
          .transition-transform {
            transition: none !important;
          }
        }
      `}</style>
    </AccessibilityContext.Provider>
  );
}