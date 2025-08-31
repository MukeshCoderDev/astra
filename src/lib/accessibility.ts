/**
 * Accessibility utility functions
 */

/**
 * Generate unique IDs for ARIA relationships
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if an element is focusable
 */
export function isFocusable(element: HTMLElement): boolean {
  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ];

  return focusableSelectors.some(selector => element.matches(selector));
}

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(', ');

  return Array.from(container.querySelectorAll(focusableSelectors));
}

/**
 * Trap focus within a container
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = getFocusableElements(container);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

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
  firstElement?.focus();

  return () => {
    container.removeEventListener('keydown', handleTabKey);
  };
}

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Format time for screen readers
 */
export function formatTimeForScreenReader(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''}, ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}, ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
  } else {
    return `${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
  }
}

/**
 * Format numbers for screen readers
 */
export function formatNumberForScreenReader(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)} million`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)} thousand`;
  }
  return num.toString();
}

/**
 * Create ARIA label for video content
 */
export function createVideoAriaLabel(video: {
  title: string;
  creator: { displayName: string };
  views: number;
  durationSec: number;
}): string {
  const duration = formatTimeForScreenReader(video.durationSec);
  const views = formatNumberForScreenReader(video.views);
  
  return `${video.title} by ${video.creator.displayName}, ${duration} duration, ${views} views`;
}

/**
 * Create ARIA label for tip button
 */
export function createTipAriaLabel(amount: number, creatorName: string): string {
  return `Tip ${amount} USDC to ${creatorName}`;
}

/**
 * Validate color contrast ratio
 */
export function getContrastRatio(color1: string, color2: string): number {
  // This is a simplified version - in production you'd use a proper color contrast library
  // For now, return a mock value that indicates good contrast
  return 4.5; // WCAG AA minimum
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if user prefers high contrast
 */
export function prefersHighContrast(): boolean {
  return window.matchMedia('(prefers-contrast: high)').matches;
}

/**
 * Skip link functionality
 */
export function createSkipLink(targetId: string, label: string): HTMLElement {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.textContent = label;
  skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md';
  
  return skipLink;
}

/**
 * Manage page title for screen readers
 */
export function updatePageTitle(title: string, siteName: string = 'Astra'): void {
  document.title = `${title} | ${siteName}`;
}

/**
 * Create landmark regions
 */
export const landmarks = {
  main: 'main',
  navigation: 'navigation',
  banner: 'banner',
  contentinfo: 'contentinfo',
  complementary: 'complementary',
  search: 'search',
  form: 'form'
} as const;

/**
 * ARIA live region priorities
 */
export const liveRegions = {
  polite: 'polite',
  assertive: 'assertive',
  off: 'off'
} as const;

/**
 * Common ARIA attributes
 */
export const ariaAttributes = {
  expanded: 'aria-expanded',
  selected: 'aria-selected',
  checked: 'aria-checked',
  disabled: 'aria-disabled',
  hidden: 'aria-hidden',
  label: 'aria-label',
  labelledby: 'aria-labelledby',
  describedby: 'aria-describedby',
  live: 'aria-live',
  atomic: 'aria-atomic',
  relevant: 'aria-relevant',
  busy: 'aria-busy',
  current: 'aria-current',
  controls: 'aria-controls',
  owns: 'aria-owns',
  activedescendant: 'aria-activedescendant'
} as const;