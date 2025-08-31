/**
 * Comprehensive monitoring and error tracking system
 * Handles performance monitoring, error reporting, and user analytics
 */

import React from 'react';

interface ErrorReport {
  message: string;
  stack?: string;
  url: string;
  lineNumber?: number;
  columnNumber?: number;
  timestamp: number;
  userId?: string;
  sessionId: string;
  userAgent: string;
  additionalData?: Record<string, any>;
}

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

interface UserAction {
  action: string;
  element?: string;
  page: string;
  timestamp: number;
  userId?: string;
  sessionId: string;
  additionalData?: Record<string, any>;
}

class MonitoringService {
  private sessionId: string;
  private userId?: string;
  private errorQueue: ErrorReport[] = [];
  private performanceQueue: PerformanceMetric[] = [];
  private userActionQueue: UserAction[] = [];
  private isInitialized = false;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeMonitoring();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeMonitoring() {
    if (typeof window === 'undefined') return;

    // Global error handler
    window.addEventListener('error', (event) => {
      this.reportError({
        message: event.message,
        stack: event.error?.stack,
        url: event.filename || window.location.href,
        lineNumber: event.lineno,
        columnNumber: event.colno,
        timestamp: Date.now(),
        sessionId: this.sessionId,
        userAgent: navigator.userAgent,
        userId: this.userId,
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        url: window.location.href,
        timestamp: Date.now(),
        sessionId: this.sessionId,
        userAgent: navigator.userAgent,
        userId: this.userId,
        additionalData: { type: 'unhandledRejection' },
      });
    });

    // Performance monitoring
    if ('PerformanceObserver' in window) {
      this.initializePerformanceMonitoring();
    }

    // User interaction tracking
    this.initializeUserActionTracking();

    // Core Web Vitals monitoring
    this.initializeCoreWebVitals();

    this.isInitialized = true;
  }

  private initializePerformanceMonitoring() {
    // Navigation timing
    const navObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          this.reportPerformanceMetric({
            name: 'page_load_time',
            value: navEntry.loadEventEnd - navEntry.loadEventStart,
            timestamp: Date.now(),
            tags: { page: window.location.pathname },
          });

          this.reportPerformanceMetric({
            name: 'dom_content_loaded',
            value: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
            timestamp: Date.now(),
            tags: { page: window.location.pathname },
          });
        }
      });
    });

    navObserver.observe({ entryTypes: ['navigation'] });

    // Resource timing
    const resourceObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        const resourceEntry = entry as PerformanceResourceTiming;
        
        // Track slow resources
        if (resourceEntry.duration > 1000) {
          this.reportPerformanceMetric({
            name: 'slow_resource',
            value: resourceEntry.duration,
            timestamp: Date.now(),
            tags: {
              resource: resourceEntry.name,
              type: this.getResourceType(resourceEntry.name),
            },
          });
        }
      });
    });

    resourceObserver.observe({ entryTypes: ['resource'] });

    // Long task monitoring
    const longTaskObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        this.reportPerformanceMetric({
          name: 'long_task',
          value: entry.duration,
          timestamp: Date.now(),
          tags: { page: window.location.pathname },
        });
      });
    });

    longTaskObserver.observe({ entryTypes: ['longtask'] });
  }

  private initializeCoreWebVitals() {
    // Import web-vitals dynamically with error handling
    try {
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS((metric) => {
          this.reportPerformanceMetric({
            name: 'cls',
            value: metric.value,
            timestamp: Date.now(),
            tags: { page: window.location.pathname },
          });
        });

        getFID((metric) => {
          this.reportPerformanceMetric({
            name: 'fid',
            value: metric.value,
            timestamp: Date.now(),
            tags: { page: window.location.pathname },
          });
        });

        getFCP((metric) => {
          this.reportPerformanceMetric({
            name: 'fcp',
            value: metric.value,
            timestamp: Date.now(),
            tags: { page: window.location.pathname },
          });
        });

        getLCP((metric) => {
          this.reportPerformanceMetric({
            name: 'lcp',
            value: metric.value,
            timestamp: Date.now(),
            tags: { page: window.location.pathname },
          });
        });

        getTTFB((metric) => {
          this.reportPerformanceMetric({
            name: 'ttfb',
            value: metric.value,
            timestamp: Date.now(),
            tags: { page: window.location.pathname },
          });
        });
      }).catch((error) => {
        console.warn('Failed to load web-vitals:', error);
      });
    } catch (error) {
      console.warn('Web-vitals not available:', error);
    }
  }

  private initializeUserActionTracking() {
    // Click tracking
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const element = this.getElementSelector(target);
      
      this.reportUserAction({
        action: 'click',
        element,
        page: window.location.pathname,
        timestamp: Date.now(),
        sessionId: this.sessionId,
        userId: this.userId,
        additionalData: {
          x: event.clientX,
          y: event.clientY,
          button: event.button,
        },
      });
    });

    // Form submission tracking
    document.addEventListener('submit', (event) => {
      const target = event.target as HTMLFormElement;
      const formId = target.id || target.className || 'unknown';
      
      this.reportUserAction({
        action: 'form_submit',
        element: formId,
        page: window.location.pathname,
        timestamp: Date.now(),
        sessionId: this.sessionId,
        userId: this.userId,
      });
    });

    // Page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.reportUserAction({
        action: document.hidden ? 'page_hidden' : 'page_visible',
        page: window.location.pathname,
        timestamp: Date.now(),
        sessionId: this.sessionId,
        userId: this.userId,
      });
    });
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return 'image';
    if (url.match(/\.(mp4|webm|ogg|m3u8)$/)) return 'video';
    if (url.match(/\.(woff|woff2|ttf|eot)$/)) return 'font';
    return 'other';
  }

  private getElementSelector(element: HTMLElement): string {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  reportError(error: Partial<ErrorReport>) {
    const errorReport: ErrorReport = {
      message: error.message || 'Unknown error',
      stack: error.stack,
      url: error.url || window.location.href,
      lineNumber: error.lineNumber,
      columnNumber: error.columnNumber,
      timestamp: error.timestamp || Date.now(),
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      userId: this.userId,
      additionalData: error.additionalData,
    };

    this.errorQueue.push(errorReport);
    this.flushErrorQueue();

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Error reported:', errorReport);
    }
  }

  reportPerformanceMetric(metric: PerformanceMetric) {
    this.performanceQueue.push(metric);
    this.flushPerformanceQueue();

    // Log to console in development
    if (import.meta.env.DEV) {
      console.log('Performance metric:', metric);
    }
  }

  reportUserAction(action: UserAction) {
    this.userActionQueue.push(action);
    this.flushUserActionQueue();

    // Log to console in development
    if (import.meta.env.DEV && action.action !== 'click') {
      console.log('User action:', action);
    }
  }

  private async flushErrorQueue() {
    if (this.errorQueue.length === 0) return;

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    try {
      await this.sendToMonitoringService('/api/monitoring/errors', errors);
    } catch (error) {
      console.error('Failed to send error reports:', error);
      // Re-queue errors for retry
      this.errorQueue.unshift(...errors);
    }
  }

  private async flushPerformanceQueue() {
    if (this.performanceQueue.length === 0) return;

    const metrics = [...this.performanceQueue];
    this.performanceQueue = [];

    try {
      await this.sendToMonitoringService('/api/monitoring/performance', metrics);
    } catch (error) {
      console.error('Failed to send performance metrics:', error);
      // Don't re-queue performance metrics to avoid memory issues
    }
  }

  private async flushUserActionQueue() {
    if (this.userActionQueue.length === 0) return;

    const actions = [...this.userActionQueue];
    this.userActionQueue = [];

    try {
      await this.sendToMonitoringService('/api/monitoring/actions', actions);
    } catch (error) {
      console.error('Failed to send user actions:', error);
      // Don't re-queue user actions to avoid memory issues
    }
  }

  private async sendToMonitoringService(endpoint: string, data: any[]) {
    if (import.meta.env.DEV) {
      // Don't send to monitoring service in development
      return;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data,
        sessionId: this.sessionId,
        userId: this.userId,
        timestamp: Date.now(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Monitoring service error: ${response.status}`);
    }
  }

  // Manual error reporting
  captureException(error: Error, additionalData?: Record<string, any>) {
    this.reportError({
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      userId: this.userId,
      additionalData,
    });
  }

  // Manual performance tracking
  startPerformanceTimer(name: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.reportPerformanceMetric({
        name,
        value: duration,
        timestamp: Date.now(),
        tags: { page: window.location.pathname },
      });
    };
  }

  // Health check
  getHealthStatus() {
    return {
      initialized: this.isInitialized,
      sessionId: this.sessionId,
      userId: this.userId,
      queueSizes: {
        errors: this.errorQueue.length,
        performance: this.performanceQueue.length,
        userActions: this.userActionQueue.length,
      },
    };
  }
}

// Global monitoring instance
const monitoring = new MonitoringService();

// Export monitoring functions
export function setUserId(userId: string) {
  monitoring.setUserId(userId);
}

export function captureException(error: Error, additionalData?: Record<string, any>) {
  monitoring.captureException(error, additionalData);
}

export function reportPerformanceMetric(name: string, value: number, tags?: Record<string, string>) {
  monitoring.reportPerformanceMetric({
    name,
    value,
    timestamp: Date.now(),
    tags,
  });
}

export function startPerformanceTimer(name: string) {
  return monitoring.startPerformanceTimer(name);
}

export function reportUserAction(action: string, element?: string, additionalData?: Record<string, any>) {
  monitoring.reportUserAction({
    action,
    element,
    page: window.location.pathname,
    timestamp: Date.now(),
    sessionId: monitoring['sessionId'],
    userId: monitoring['userId'],
    additionalData,
  });
}

export function getMonitoringHealth() {
  return monitoring.getHealthStatus();
}

// React hooks for monitoring
export function useErrorHandler() {
  return {
    captureException,
    reportError: (message: string, additionalData?: Record<string, any>) => {
      monitoring.reportError({
        message,
        url: window.location.href,
        timestamp: Date.now(),
        additionalData,
      });
    },
  };
}

export function usePerformanceMonitor() {
  return {
    startTimer: startPerformanceTimer,
    reportMetric: reportPerformanceMetric,
  };
}

// Higher-order component for error boundaries
export function withErrorMonitoring<P extends object>(
  Component: React.ComponentType<P>
) {
  return function MonitoredComponent(props: P) {
    React.useEffect(() => {
      const originalConsoleError = console.error;
      
      console.error = (...args) => {
        // Report React errors to monitoring
        if (args[0]?.includes?.('React')) {
          captureException(new Error(args.join(' ')), {
            type: 'react_error',
            component: Component.name,
          });
        }
        originalConsoleError.apply(console, args);
      };

      return () => {
        console.error = originalConsoleError;
      };
    }, []);

    return <Component {...props} />;
  };
}

// Performance monitoring decorator
export function withPerformanceMonitoring<P extends object>(
  componentName: string,
  Component: React.ComponentType<P>
) {
  return function PerformanceMonitoredComponent(props: P) {
    React.useEffect(() => {
      const endTimer = startPerformanceTimer(`component_render_${componentName}`);
      return endTimer;
    }, []);

    return <Component {...props} />;
  };
}

export default monitoring;