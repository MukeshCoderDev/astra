/**
 * Performance optimization utilities
 */

/**
 * Debounce function to limit the rate of function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
}

/**
 * Throttle function to limit function calls to once per specified time period
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Intersection Observer hook for lazy loading
 */
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
): IntersectionObserver {
  return new IntersectionObserver(callback, {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  });
}

/**
 * Image preloader utility
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Preload multiple images
 */
export async function preloadImages(srcs: string[]): Promise<void> {
  await Promise.all(srcs.map(preloadImage));
}

/**
 * Virtual scrolling utility for large lists
 */
export interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export function calculateVirtualScrollItems(
  scrollTop: number,
  totalItems: number,
  options: VirtualScrollOptions
) {
  const { itemHeight, containerHeight, overscan = 5 } = options;
  
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    totalItems - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight)
  );
  
  const start = Math.max(0, visibleStart - overscan);
  const end = Math.min(totalItems - 1, visibleEnd + overscan);
  
  return {
    start,
    end,
    visibleStart,
    visibleEnd,
    offsetY: start * itemHeight,
  };
}

/**
 * Memoization utility
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  getKey?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>) => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Request idle callback polyfill
 */
export function requestIdleCallback(
  callback: (deadline: { timeRemaining: () => number }) => void,
  options?: { timeout?: number }
): number {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options);
  }
  
  // Polyfill for browsers that don't support requestIdleCallback
  const start = Date.now();
  return setTimeout(() => {
    callback({
      timeRemaining() {
        return Math.max(0, 50 - (Date.now() - start));
      },
    });
  }, 1) as any;
}

/**
 * Cancel idle callback polyfill
 */
export function cancelIdleCallback(id: number): void {
  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
}

/**
 * Web Vitals measurement utilities
 */
export interface WebVitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

export function measureCLS(callback: (metric: WebVitalsMetric) => void): void {
  let clsValue = 0;
  let clsEntries: LayoutShift[] = [];

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries() as LayoutShift[]) {
      if (!entry.hadRecentInput) {
        clsEntries.push(entry);
        clsValue += entry.value;
      }
    }
    
    callback({
      name: 'CLS',
      value: clsValue,
      rating: clsValue <= 0.1 ? 'good' : clsValue <= 0.25 ? 'needs-improvement' : 'poor'
    });
  });

  observer.observe({ type: 'layout-shift', buffered: true });
}

export function measureLCP(callback: (metric: WebVitalsMetric) => void): void {
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1] as PerformanceEntry;
    
    callback({
      name: 'LCP',
      value: lastEntry.startTime,
      rating: lastEntry.startTime <= 2500 ? 'good' : lastEntry.startTime <= 4000 ? 'needs-improvement' : 'poor'
    });
  });

  observer.observe({ type: 'largest-contentful-paint', buffered: true });
}

export function measureFID(callback: (metric: WebVitalsMetric) => void): void {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const fid = entry.processingStart - entry.startTime;
      
      callback({
        name: 'FID',
        value: fid,
        rating: fid <= 100 ? 'good' : fid <= 300 ? 'needs-improvement' : 'poor'
      });
    }
  });

  observer.observe({ type: 'first-input', buffered: true });
}

/**
 * Resource hints utilities
 */
export function preloadResource(href: string, as: string, crossorigin?: string): void {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  if (crossorigin) link.crossOrigin = crossorigin;
  document.head.appendChild(link);
}

export function prefetchResource(href: string): void {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  document.head.appendChild(link);
}

export function preconnectToOrigin(origin: string): void {
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = origin;
  document.head.appendChild(link);
}

/**
 * Bundle analysis utilities
 */
export function logBundleSize(): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('Bundle analysis available in production build');
    return;
  }

  // This would be used with webpack-bundle-analyzer or similar
  const scripts = Array.from(document.querySelectorAll('script[src]'));
  const totalSize = scripts.reduce((size, script) => {
    const src = (script as HTMLScriptElement).src;
    // In a real implementation, you'd fetch the actual file sizes
    return size + (src.includes('chunk') ? 100 : 500); // Mock sizes
  }, 0);

  console.log(`Estimated bundle size: ${totalSize}KB`);
}

/**
 * Memory usage monitoring
 */
export function getMemoryUsage(): any {
  if ('memory' in performance) {
    return (performance as any).memory;
  }
  return null;
}

export function logMemoryUsage(): void {
  const memory = getMemoryUsage();
  if (memory) {
    console.log('Memory usage:', {
      used: Math.round(memory.usedJSHeapSize / 1048576) + ' MB',
      total: Math.round(memory.totalJSHeapSize / 1048576) + ' MB',
      limit: Math.round(memory.jsHeapSizeLimit / 1048576) + ' MB'
    });
  }
}