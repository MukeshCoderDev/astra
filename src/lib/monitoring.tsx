/**
 * Comprehensive monitoring and analytics integration
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

// Types for monitoring events
export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
}

export interface UserInteractionEvent {
  type: 'click' | 'scroll' | 'search' | 'video_play' | 'video_pause' | 'like' | 'share' | 'subscribe';
  element?: string;
  page: string;
  timestamp: number;
  userId?: string;
  videoId?: string;
  metadata?: Record<string, any>;
}

export interface ErrorEvent {
  type: 'javascript' | 'network' | 'chunk_load' | 'api' | 'video_playback';
  message: string;
  stack?: string;
  url?: string;
  line?: number;
  column?: number;
  timestamp: number;
  userId?: string;
  page: string;
  userAgent: string;
  metadata?: Record<string, any>;
}

// Analytics service interface
interface AnalyticsService {
  trackPageView: (page: string, title: string) => void;
  trackEvent: (event: UserInteractionEvent) => void;
  trackError: (error: ErrorEvent) => void;
  trackPerformance: (metric: PerformanceMetric) => void;
  setUserId: (userId: string) => void;
  setUserProperties: (properties: Record<string, any>) => void;
}

// Mock analytics service (replace with actual service like Google Analytics, Mixpanel, etc.)
class MockAnalyticsService implements AnalyticsService {
  private userId?: string;
  private userProperties: Record<string, any> = {};

  trackPageView(page: string, title: string) {
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Page View:', { page, title, userId: this.userId });
    }
    
    // In production, send to your analytics service
    // Example: gtag('config', 'GA_MEASUREMENT_ID', { page_title: title, page_location: page });
  }

  trackEvent(event: UserInteractionEvent) {
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Event:', event);
    }
    
    // In production, send to your analytics service
    // Example: gtag('event', event.type, { ...event });
  }

  trackError(error: ErrorEvent) {
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 Error:', error);
    }
    
    // In production, send to error tracking service like Sentry
    // Example: Sentry.captureException(new Error(error.message), { extra: error });
  }

  trackPerformance(metric: PerformanceMetric) {
    if (process.env.NODE_ENV === 'development') {
      console.log('⚡ Performance:', metric);
    }
    
    // In production, send to performance monitoring service
    // Example: gtag('event', metric.name, { value: metric.value, rating: metric.rating });
  }

  setUserId(userId: string) {
    this.userId = userId;
    if (process.env.NODE_ENV === 'development') {
      console.log('👤 User ID set:', userId);
    }
    
    // In production, set user ID in analytics service
    // Example: gtag('config', 'GA_MEASUREMENT_ID', { user_id: userId });
  }

  setUserProperties(properties: Record<string, any>) {
    this.userProperties = { ...this.userProperties, ...properties };
    if (process.env.NODE_ENV === 'development') {
      console.log('👤 User Properties:', this.userProperties);
    }
    
    // In production, set user properties in analytics service
    // Example: gtag('set', { user_properties: properties });
  }
}

// Global analytics instance
export const analytics = new MockAnalyticsService();

// Web Vitals monitoring
export function initializeWebVitals() {
  const sendToAnalytics = (metric: any) => {
    const performanceMetric: PerformanceMetric = {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType || 'navigate',
    };
    
    analytics.trackPerformance(performanceMetric);
  };

  getCLS(sendToAnalytics);
  getFID(sendToAnalytics);
  getFCP(sendToAnalytics);
  getLCP(sendToAnalytics);
  getTTFB(sendToAnalytics);
}

// Error monitoring
export function initializeErrorMonitoring() {
  // JavaScript errors
  window.addEventListener('error', (event) => {
    const errorEvent: ErrorEvent = {
      type: 'javascript',
      message: event.message,
      stack: event.error?.stack,
      url: event.filename,
      line: event.lineno,
      column: event.colno,
      timestamp: Date.now(),
      page: window.location.pathname,
      userAgent: navigator.userAgent,
    };
    
    analytics.trackError(errorEvent);
  });

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const errorEvent: ErrorEvent = {
      type: 'javascript',
      message: event.reason?.message || 'Unhandled promise rejection',
      stack: event.reason?.stack,
      timestamp: Date.now(),
      page: window.location.pathname,
      userAgent: navigator.userAgent,
      metadata: { reason: event.reason },
    };
    
    analytics.trackError(errorEvent);
  });

  // Chunk load errors (for code splitting)
  window.addEventListener('error', (event) => {
    if (event.target && 'src' in event.target && typeof event.target.src === 'string') {
      if (event.target.src.includes('.js') || event.target.src.includes('.css')) {
        const errorEvent: ErrorEvent = {
          type: 'chunk_load',
          message: `Failed to load resource: ${event.target.src}`,
          url: event.target.src,
          timestamp: Date.now(),
          page: window.location.pathname,
          userAgent: navigator.userAgent,
        };
        
        analytics.trackError(errorEvent);
      }
    }
  }, true);
}

// Network monitoring
export function trackNetworkError(url: string, status: number, message: string) {
  const errorEvent: ErrorEvent = {
    type: 'network',
    message: `Network error: ${status} - ${message}`,
    url,
    timestamp: Date.now(),
    page: window.location.pathname,
    userAgent: navigator.userAgent,
    metadata: { status, url },
  };
  
  analytics.trackError(errorEvent);
}

// API monitoring
export function trackApiError(endpoint: string, method: string, status: number, error: any) {
  const errorEvent: ErrorEvent = {
    type: 'api',
    message: `API error: ${method} ${endpoint} - ${status}`,
    timestamp: Date.now(),
    page: window.location.pathname,
    userAgent: navigator.userAgent,
    metadata: { endpoint, method, status, error },
  };
  
  analytics.trackError(errorEvent);
}

// Video playback monitoring
export function trackVideoError(videoId: string, error: any) {
  const errorEvent: ErrorEvent = {
    type: 'video_playback',
    message: `Video playback error: ${error.message || 'Unknown error'}`,
    timestamp: Date.now(),
    page: window.location.pathname,
    userAgent: navigator.userAgent,
    metadata: { videoId, error },
  };
  
  analytics.trackError(errorEvent);
}

// User interaction tracking
export function trackUserInteraction(
  type: UserInteractionEvent['type'],
  element?: string,
  metadata?: Record<string, any>
) {
  const event: UserInteractionEvent = {
    type,
    element,
    page: window.location.pathname,
    timestamp: Date.now(),
    metadata,
  };
  
  analytics.trackEvent(event);
}

// Content discovery specific tracking
export function trackContentDiscovery(action: string, content: any, metadata?: Record<string, any>) {
  const event: UserInteractionEvent = {
    type: action as any,
    page: window.location.pathname,
    timestamp: Date.now(),
    videoId: content.id,
    metadata: {
      contentType: content.type,
      creator: content.creator?.handle,
      category: content.category,
      ...metadata,
    },
  };
  
  analytics.trackEvent(event);
}

// Performance monitoring hook
export function usePerformanceMonitoring() {
  useEffect(() => {
    // Monitor page load performance
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          
          // Track key timing metrics
          const metrics = {
            dns: navEntry.domainLookupEnd - navEntry.domainLookupStart,
            tcp: navEntry.connectEnd - navEntry.connectStart,
            request: navEntry.responseStart - navEntry.requestStart,
            response: navEntry.responseEnd - navEntry.responseStart,
            dom: navEntry.domContentLoadedEventEnd - navEntry.responseEnd,
            load: navEntry.loadEventEnd - navEntry.loadEventStart,
          };
          
          Object.entries(metrics).forEach(([name, value]) => {
            if (value > 0) {
              analytics.trackPerformance({
                name: `timing_${name}`,
                value,
                rating: value < 100 ? 'good' : value < 300 ? 'needs-improvement' : 'poor',
                delta: 0,
                id: `${name}_${Date.now()}`,
                navigationType: 'navigate',
              });
            }
          });
        }
      }
    });

    observer.observe({ entryTypes: ['navigation'] });

    return () => observer.disconnect();
  }, []);
}

// Page view tracking hook
export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    // Track page view
    const title = document.title;
    analytics.trackPageView(location.pathname, title);
    
    // Track page timing
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const timeOnPage = endTime - startTime;
      
      analytics.trackEvent({
        type: 'scroll', // Using scroll as a generic interaction type
        page: location.pathname,
        timestamp: Date.now(),
        metadata: { timeOnPage, action: 'page_exit' },
      });
    };
  }, [location.pathname]);
}

// Initialize all monitoring
export function initializeMonitoring() {
  if (typeof window !== 'undefined') {
    initializeWebVitals();
    initializeErrorMonitoring();
    
    // Track initial page load
    analytics.trackPageView(window.location.pathname, document.title);
  }
}

// Error capture function for error boundaries
export function captureException(error: Error, context?: Record<string, any>) {
  const errorEvent: ErrorEvent = {
    type: 'javascript',
    message: error.message,
    stack: error.stack,
    timestamp: Date.now(),
    page: window.location.pathname,
    userAgent: navigator.userAgent,
    metadata: context,
  };
  
  analytics.trackError(errorEvent);
}

// Performance metric reporting
export function reportPerformanceMetric(name: string, value: number, context?: Record<string, any>) {
  const performanceMetric: PerformanceMetric = {
    name,
    value,
    rating: value < 100 ? 'good' : value < 300 ? 'needs-improvement' : 'poor',
    delta: 0,
    id: `${name}_${Date.now()}`,
    navigationType: 'navigate',
  };
  
  analytics.trackPerformance(performanceMetric);
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`⚡ Performance Metric: ${name}`, { value, context });
  }
}

// Monitoring health status
export function getMonitoringHealth() {
  return {
    sessionId: `session_${Date.now()}`,
    timestamp: new Date().toISOString(),
    queueSizes: {
      errors: 0,
      performance: 0,
    },
    status: 'healthy',
    uptime: performance.now(),
  };
}

// Export analytics instance as default
export default analytics;