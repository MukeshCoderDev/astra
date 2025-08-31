import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { debounce, throttle, createIntersectionObserver, requestIdleCallback, cancelIdleCallback } from '../lib/performance';

/**
 * Hook for debounced values
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for throttled callbacks
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const throttledCallback = useMemo(
    () => throttle(callback, delay),
    [callback, delay]
  );

  return throttledCallback;
}

/**
 * Hook for debounced callbacks
 */
export function useDebounceCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const debouncedCallback = useMemo(
    () => debounce(callback, delay),
    [callback, delay]
  );

  return debouncedCallback;
}

/**
 * Hook for intersection observer (lazy loading)
 */
export function useIntersectionObserver(
  options?: IntersectionObserverInit
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const targetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = createIntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsIntersecting(entry.isIntersecting);
        
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      options
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [hasIntersected, options]);

  return { targetRef, isIntersecting, hasIntersected };
}

/**
 * Hook for virtual scrolling
 */
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLElement>(null);

  const visibleRange = useMemo(() => {
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight)
    );

    const start = Math.max(0, visibleStart - overscan);
    const end = Math.min(items.length - 1, visibleEnd + overscan);

    return {
      start,
      end,
      visibleStart,
      visibleEnd,
      offsetY: start * itemHeight,
      visibleItems: items.slice(start, end + 1),
    };
  }, [items, itemHeight, containerHeight, scrollTop, overscan]);

  const handleScroll = useThrottle((e: Event) => {
    const target = e.target as HTMLElement;
    setScrollTop(target.scrollTop);
  }, 16); // ~60fps

  useEffect(() => {
    const scrollElement = scrollElementRef.current;
    if (!scrollElement) return;

    scrollElement.addEventListener('scroll', handleScroll);
    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return {
    scrollElementRef,
    visibleRange,
    totalHeight: items.length * itemHeight,
  };
}

/**
 * Hook for image lazy loading
 */
export function useImageLazyLoad(src: string, placeholder?: string) {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const { targetRef, hasIntersected } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px',
  });

  useEffect(() => {
    if (!hasIntersected || !src) return;

    const img = new Image();
    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
    };
    img.onerror = () => {
      setIsError(true);
    };
    img.src = src;
  }, [hasIntersected, src]);

  return {
    targetRef,
    imageSrc,
    isLoaded,
    isError,
    hasIntersected,
  };
}

/**
 * Hook for measuring component render performance
 */
export function useRenderPerformance(name: string) {
  const renderCount = useRef(0);
  const startTime = useRef<number>(0);

  useEffect(() => {
    renderCount.current += 1;
    startTime.current = performance.now();
  });

  useEffect(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${name} render #${renderCount.current}: ${renderTime.toFixed(2)}ms`);
    }
  });

  return renderCount.current;
}

/**
 * Hook for idle callback execution
 */
export function useIdleCallback(
  callback: () => void,
  deps: React.DependencyList,
  options?: { timeout?: number }
) {
  useEffect(() => {
    const id = requestIdleCallback(callback, options);
    return () => cancelIdleCallback(id);
  }, deps);
}

/**
 * Hook for Web Vitals monitoring
 */
export function useWebVitals() {
  const [metrics, setMetrics] = useState<{
    CLS?: number;
    LCP?: number;
    FID?: number;
  }>({});

  useEffect(() => {
    // Measure CLS
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any[]) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          setMetrics(prev => ({ ...prev, CLS: clsValue }));
        }
      }
    });

    // Measure LCP
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      setMetrics(prev => ({ ...prev, LCP: lastEntry.startTime }));
    });

    // Measure FID
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any[]) {
        const fid = entry.processingStart - entry.startTime;
        setMetrics(prev => ({ ...prev, FID: fid }));
      }
    });

    try {
      clsObserver.observe({ type: 'layout-shift', buffered: true });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      fidObserver.observe({ type: 'first-input', buffered: true });
    } catch (e) {
      // Observers not supported
    }

    return () => {
      clsObserver.disconnect();
      lcpObserver.disconnect();
      fidObserver.disconnect();
    };
  }, []);

  return metrics;
}

/**
 * Hook for memory usage monitoring
 */
export function useMemoryMonitor() {
  const [memoryInfo, setMemoryInfo] = useState<{
    used?: number;
    total?: number;
    limit?: number;
  }>({});

  useEffect(() => {
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMemoryInfo({
          used: Math.round(memory.usedJSHeapSize / 1048576), // MB
          total: Math.round(memory.totalJSHeapSize / 1048576), // MB
          limit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
        });
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
}

/**
 * Hook for connection quality monitoring
 */
export function useNetworkStatus() {
  const [networkInfo, setNetworkInfo] = useState<{
    online: boolean;
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  }>({
    online: navigator.onLine,
  });

  useEffect(() => {
    const updateOnlineStatus = () => {
      setNetworkInfo(prev => ({ ...prev, online: navigator.onLine }));
    };

    const updateNetworkInfo = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        setNetworkInfo(prev => ({
          ...prev,
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
        }));
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    updateNetworkInfo();
    const interval = setInterval(updateNetworkInfo, 10000); // Update every 10 seconds

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      clearInterval(interval);
    };
  }, []);

  return networkInfo;
}