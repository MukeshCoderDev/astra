import React, { useEffect, useRef } from 'react';
import { clsx } from 'clsx';

interface FocusManagerProps {
  children: React.ReactNode;
  restoreFocus?: boolean;
  autoFocus?: boolean;
  className?: string;
}

/**
 * Focus management component that handles focus restoration and auto-focus
 */
export function FocusManager({ 
  children, 
  restoreFocus = true, 
  autoFocus = false,
  className 
}: FocusManagerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Store the previously focused element
    if (restoreFocus) {
      previousActiveElement.current = document.activeElement as HTMLElement;
    }

    // Auto-focus the first focusable element if requested
    if (autoFocus && containerRef.current) {
      const focusableElement = containerRef.current.querySelector(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      
      if (focusableElement) {
        focusableElement.focus();
      }
    }

    return () => {
      // Restore focus to the previously focused element
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [restoreFocus, autoFocus]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

interface RovingTabIndexProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical' | 'both';
  loop?: boolean;
  className?: string;
}

/**
 * Roving tab index component for keyboard navigation in lists
 */
export function RovingTabIndex({ 
  children, 
  orientation = 'vertical',
  loop = true,
  className 
}: RovingTabIndexProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const focusableElements = Array.from(
        container.querySelectorAll('[role="option"], [role="menuitem"], [role="tab"], button:not([disabled])')
      ) as HTMLElement[];

      if (focusableElements.length === 0) return;

      const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
      let nextIndex = currentIndex;

      switch (e.key) {
        case 'ArrowDown':
          if (orientation === 'vertical' || orientation === 'both') {
            e.preventDefault();
            nextIndex = currentIndex + 1;
            if (nextIndex >= focusableElements.length) {
              nextIndex = loop ? 0 : focusableElements.length - 1;
            }
          }
          break;
        case 'ArrowUp':
          if (orientation === 'vertical' || orientation === 'both') {
            e.preventDefault();
            nextIndex = currentIndex - 1;
            if (nextIndex < 0) {
              nextIndex = loop ? focusableElements.length - 1 : 0;
            }
          }
          break;
        case 'ArrowRight':
          if (orientation === 'horizontal' || orientation === 'both') {
            e.preventDefault();
            nextIndex = currentIndex + 1;
            if (nextIndex >= focusableElements.length) {
              nextIndex = loop ? 0 : focusableElements.length - 1;
            }
          }
          break;
        case 'ArrowLeft':
          if (orientation === 'horizontal' || orientation === 'both') {
            e.preventDefault();
            nextIndex = currentIndex - 1;
            if (nextIndex < 0) {
              nextIndex = loop ? focusableElements.length - 1 : 0;
            }
          }
          break;
        case 'Home':
          e.preventDefault();
          nextIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          nextIndex = focusableElements.length - 1;
          break;
      }

      if (nextIndex !== currentIndex && focusableElements[nextIndex]) {
        focusableElements[nextIndex].focus();
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [orientation, loop]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

interface FocusGuardProps {
  onFocus: () => void;
}

/**
 * Focus guard component to trap focus within a container
 */
export function FocusGuard({ onFocus }: FocusGuardProps) {
  return (
    <div
      tabIndex={0}
      onFocus={onFocus}
      style={{
        position: 'fixed',
        top: 1,
        left: 1,
        width: 1,
        height: 0,
        padding: 0,
        margin: -1,
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    />
  );
}

interface FocusTrapProps {
  children: React.ReactNode;
  active?: boolean;
  initialFocus?: React.RefObject<HTMLElement>;
  finalFocus?: React.RefObject<HTMLElement>;
  className?: string;
}

/**
 * Enhanced focus trap component with guards
 */
export function FocusTrap({ 
  children, 
  active = true, 
  initialFocus,
  finalFocus,
  className 
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const focusFirst = () => {
    if (!containerRef.current) return;
    
    if (initialFocus?.current) {
      initialFocus.current.focus();
      return;
    }

    const focusableElements = containerRef.current.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    if (firstElement) {
      firstElement.focus();
    }
  };

  const focusLast = () => {
    if (!containerRef.current) return;
    
    const focusableElements = containerRef.current.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    if (lastElement) {
      lastElement.focus();
    }
  };

  useEffect(() => {
    if (active) {
      focusFirst();
    }

    return () => {
      if (finalFocus?.current) {
        finalFocus.current.focus();
      }
    };
  }, [active, initialFocus, finalFocus]);

  if (!active) {
    return <div className={className}>{children}</div>;
  }

  return (
    <>
      <FocusGuard onFocus={focusLast} />
      <div ref={containerRef} className={className}>
        {children}
      </div>
      <FocusGuard onFocus={focusFirst} />
    </>
  );
}

interface SkipLinksProps {
  links: Array<{
    href: string;
    label: string;
  }>;
  className?: string;
}

/**
 * Skip links component for keyboard navigation
 */
export function SkipLinks({ links, className }: SkipLinksProps) {
  return (
    <nav 
      className={clsx('sr-only focus-within:not-sr-only', className)}
      aria-label="Skip links"
    >
      <ul className="flex gap-2 p-4 bg-background border-b">
        {links.map((link, index) => (
          <li key={index}>
            <a
              href={link.href}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}