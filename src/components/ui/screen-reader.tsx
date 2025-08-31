import { useEffect, useRef } from 'react';
import { clsx } from 'clsx';

interface ScreenReaderProps {
  children: React.ReactNode;
  priority?: 'polite' | 'assertive';
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
  className?: string;
}

/**
 * Screen reader only content component
 */
export function ScreenReaderOnly({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <span className={clsx('sr-only', className)}>
      {children}
    </span>
  );
}

/**
 * Live region for screen reader announcements
 */
export function LiveRegion({
  children,
  priority = 'polite',
  atomic = true,
  relevant = 'all',
  className
}: ScreenReaderProps) {
  return (
    <div
      aria-live={priority}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className={clsx('sr-only', className)}
    >
      {children}
    </div>
  );
}

/**
 * Skip link component for keyboard navigation
 */
interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function SkipLink({ href, children, className }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={clsx(
        'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50',
        'focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        className
      )}
    >
      {children}
    </a>
  );
}

/**
 * Focus trap component
 */
interface FocusTrapProps {
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}

export function FocusTrap({ children, active = true, className }: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    
    // Focus first element when trap becomes active
    if (firstElement) {
      firstElement.focus();
    }

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [active]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

/**
 * Accessible heading component with proper hierarchy
 */
interface HeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function Heading({ level, children, className, id }: HeadingProps) {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  
  return (
    <Tag id={id} className={className}>
      {children}
    </Tag>
  );
}

/**
 * Accessible landmark component
 */
interface LandmarkProps {
  role: 'main' | 'navigation' | 'banner' | 'contentinfo' | 'complementary' | 'search' | 'form';
  children: React.ReactNode;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  className?: string;
}

export function Landmark({ 
  role, 
  children, 
  ariaLabel, 
  ariaLabelledBy, 
  className 
}: LandmarkProps) {
  return (
    <div
      role={role}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className={className}
    >
      {children}
    </div>
  );
}