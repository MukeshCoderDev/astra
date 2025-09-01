// Performance optimization utilities for Live Streaming Platform

import { PERFORMANCE_TARGETS } from '../constants/live';

// TypeScript declarations for requestIdleCallback
declare global {
  interface Window {
    requestIdleCallback?: (
      callback: () => void,
      options?: { timeout?: number }
    ) => number;
    cancelIdleCallback?: (id: number) => void;
  }
}

/**
 * Performance measurement utilities
 */
export class PerformanceTracker {
  private marks: Map<string, number> = new Map();
  private measures: Map<string, number> = new Map();

  /**
   * Mark a performance point
   */
  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  /**
   * Measure time between two marks
   */
  measure(name: string, startMark: string, endMark?: string): number {
    const startTime = this.marks.get(startMark);
    const endTime = endMark ? this.marks.get(endMark) : performance.now();
    
    if (startTime === undefined) {
      console.warn(`Performance mark "${startMark}" not found`);
      return 0;
    }
    
    const duration = (endTime || performance.now()) - startTime;
    this.measures.set(name, duration);
    return duration;
  }

  /**
   * Get all measurements
   */
  getMeasures(): Record<string, number> {
    return Object.fromEntries(this.measures);
  }

  /**
   * Clear all marks and measures
   */
  clear(): void {
    this.marks.clear();
    this.measures.clear();
  }
}

/**
 * CDN preconnection utilities
 */
export class CDNOptimizer {
  private preconnectedHosts = new Set<string>();

  /**
   * Preconnect to a CDN endpoint
   */
  preconnect(url: string): void {
    try {
      const parsedUrl = new URL(url);
      const origin = `${parsedUrl.protocol}//${parsedUrl.host}`;
      
      // Skip if already preconnected
      if (this.preconnectedHosts.has(origin)) {
        return;
      }
      
      // Add preconnect link
      const preconnectLink = document.createElement('link');
      preconnectLink.rel = 'preconnect';
      preconnectLink.href = origin;
      preconnectLink.crossOrigin = 'anonymous';
      document.head.appendChild(preconnectLink);
      
      // Add DNS prefetch as fallback
      const dnsPrefetchLink = document.createElement('link');
      dnsPrefetchLink.rel = 'dns-prefetch';
      dnsPrefetchLink.href = origin;
      document.head.appendChild(dnsPrefetchLink);
      
      this.preconnectedHosts.add(origin);
      
      // Clean up after 30 seconds
      setTimeout(() => {
        if (document.head.contains(preconnectLink)) {
          document.head.removeChild(preconnectLink);
        }
        if (document.head.contains(dnsPrefetchLink)) {
          document.head.removeChild(dnsPrefetchLink);
        }
        this.preconnectedHosts.delete(origin);
      }, 30000);
      
    } catch (error) {
      console.warn('Failed to preconnect to CDN:', error);
    }
  }

  /**
   * Preload a manifest file
   */
  async preloadManifest(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        cache: 'force-cache',
        priority: 'high',
      } as RequestInit);
      
      return response.ok;
    } catch (error) {
      console.warn('Failed to preload manifest:', error);
      return false;
    }
  }

  /**
   * Prefetch critical resources
   */
  prefetchResources(urls: string[]): void {
    urls.forEach(url => {
      try {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        link.as = 'fetch';
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
        
        // Clean up after 60 seconds
        setTimeout(() => {
          if (document.head.contains(link)) {
            document.head.removeChild(link);
          }
        }, 60000);
      } catch (error) {
        console.warn('Failed to prefetch resource:', url, error);
      }
    });
  }
}

/**
 * Network condition detection
 */
export class NetworkMonitor {
  /**
   * Get connection information
   */
  getConnectionInfo(): {
    type: string;
    effectiveType: string;
    downlink: number;
    rtt: number;
    saveData: boolean;
  } {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (!connection) {
      return {
        type: 'unknown',
        effectiveType: 'unknown',
        downlink: 0,
        rtt: 0,
        saveData: false,
      };
    }
    
    return {
      type: connection.type || 'unknown',
      effectiveType: connection.effectiveType || 'unknown',
      downlink: connection.downlink || 0,
      rtt: connection.rtt || 0,
      saveData: connection.saveData || false,
    };
  }

  /**
   * Check if connection is suitable for live streaming
   */
  isGoodForLiveStreaming(): boolean {
    const info = this.getConnectionInfo();
    
    // Consider good if:
    // - Downlink > 1 Mbps
    // - RTT < 300ms
    // - Not on save data mode
    return info.downlink > 1 && info.rtt < 300 && !info.saveData;
  }

  /**
   * Get recommended quality based on connection
   */
  getRecommendedQuality(): 'low' | 'medium' | 'high' | 'auto' {
    const info = this.getConnectionInfo();
    
    if (info.saveData) return 'low';
    if (info.downlink < 1) return 'low';
    if (info.downlink < 3) return 'medium';
    if (info.downlink >= 5) return 'high';
    
    return 'auto';
  }
}

/**
 * Performance analytics collector
 */
export class PerformanceAnalytics {
  private static instance: PerformanceAnalytics;
  private metrics: Array<any> = [];
  private batchSize = 10;
  private flushInterval = 30000; // 30 seconds

  static getInstance(): PerformanceAnalytics {
    if (!PerformanceAnalytics.instance) {
      PerformanceAnalytics.instance = new PerformanceAnalytics();
    }
    return PerformanceAnalytics.instance;
  }

  /**
   * Record a performance metric
   */
  record(metric: any): void {
    this.metrics.push({
      ...metric,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    });

    // Flush if batch is full
    if (this.metrics.length >= this.batchSize) {
      this.flush();
    }
  }

  /**
   * Flush metrics to analytics endpoint
   */
  private async flush(): void {
    if (this.metrics.length === 0) return;

    const batch = [...this.metrics];
    this.metrics = [];

    try {
      // Send to analytics endpoint (silent failure)
      await fetch('/bff/metrics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics: batch }),
      });
    } catch (error) {
      // Silent failure for analytics
      console.debug('Failed to send performance metrics:', error);
    }
  }

  /**
   * Start automatic flushing
   */
  startAutoFlush(): void {
    setInterval(() => this.flush(), this.flushInterval);
  }
}

/**
 * Join time optimization utilities
 */
export const joinTimeOptimizer = {
  /**
   * Optimize HLS configuration based on network conditions
   */
  optimizeHLSConfig(baseConfig: any, networkInfo: any): any {
    const optimized = { ...baseConfig };

    // Adjust buffer settings based on connection quality
    if (networkInfo.effectiveType === 'slow-2g' || networkInfo.effectiveType === '2g') {
      optimized.maxBufferLength = 3; // Smaller buffer for slow connections
      optimized.maxMaxBufferLength = 6;
    } else if (networkInfo.effectiveType === '4g') {
      optimized.maxBufferLength = 8; // Larger buffer for fast connections
      optimized.maxMaxBufferLength = 16;
    }

    // Adjust timeouts based on RTT
    if (networkInfo.rtt > 200) {
      optimized.manifestLoadingTimeOut = 8000;
      optimized.fragLoadingTimeOut = 15000;
    }

    return optimized;
  },

  /**
   * Check if join time meets performance targets
   */
  evaluateJoinTime(joinTimeMs: number): {
    status: 'excellent' | 'good' | 'acceptable' | 'slow' | 'critical';
    message: string;
  } {
    if (joinTimeMs < PERFORMANCE_TARGETS.OPTIMAL_JOIN_TIME_MS) {
      return { status: 'excellent', message: 'Excellent join time' };
    } else if (joinTimeMs < PERFORMANCE_TARGETS.MAX_JOIN_TIME_MS) {
      return { status: 'good', message: 'Good join time' };
    } else if (joinTimeMs < PERFORMANCE_TARGETS.SLOW_JOIN_THRESHOLD_MS) {
      return { status: 'acceptable', message: 'Acceptable join time' };
    } else if (joinTimeMs < PERFORMANCE_TARGETS.CRITICAL_JOIN_THRESHOLD_MS) {
      return { status: 'slow', message: 'Slow join time' };
    } else {
      return { status: 'critical', message: 'Critical join time' };
    }
  },
};

/**
 * Utility functions for performance optimization
 */

/**
 * Debounce function to limit function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  }) as T;
}

/**
 * Throttle function to limit function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T {
  let inThrottle: boolean;
  return ((...args: any[]) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  }) as T;
}

/**
 * Create intersection observer for lazy loading
 */
export function createIntersectionObserver(
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
): IntersectionObserver {
  return new IntersectionObserver(callback, options);
}

/**
 * Request idle callback polyfill
 */
export function requestIdleCallback(
  callback: () => void,
  options?: { timeout?: number }
): number {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options);
  }
  
  // Polyfill for browsers that don't support requestIdleCallback
  const start = Date.now();
  return setTimeout(() => {
    callback();
  }, Math.max(0, (options?.timeout || 50) - (Date.now() - start))) as any;
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

// Global instances
export const performanceTracker = new PerformanceTracker();
export const cdnOptimizer = new CDNOptimizer();
export const networkMonitor = new NetworkMonitor();
export const performanceAnalytics = PerformanceAnalytics.getInstance();

// Start auto-flushing analytics
performanceAnalytics.startAutoFlush();