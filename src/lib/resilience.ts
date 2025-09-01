// Network resilience and retry utilities for Live Streaming Platform

import { metricsApi } from './api';

/**
 * Retry configuration options
 */
export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  jitter?: boolean;
  retryCondition?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  jitter: true,
  retryCondition: (error: any) => {
    // Retry on network errors, timeouts, and 5xx server errors
    if (error?.name === 'NetworkError' || error?.name === 'TimeoutError') {
      return true;
    }
    if (error?.status >= 500 && error?.status < 600) {
      return true;
    }
    if (error?.code === 'NETWORK_ERROR' || error?.code === 'TIMEOUT') {
      return true;
    }
    return false;
  },
  onRetry: () => {},
};

/**
 * Exponential backoff with jitter
 */
function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
  const exponentialDelay = options.baseDelay * Math.pow(options.backoffFactor, attempt - 1);
  const clampedDelay = Math.min(exponentialDelay, options.maxDelay);
  
  if (options.jitter) {
    // Add random jitter (±25%)
    const jitterRange = clampedDelay * 0.25;
    const jitter = (Math.random() - 0.5) * 2 * jitterRange;
    return Math.max(0, clampedDelay + jitter);
  }
  
  return clampedDelay;
}

/**
 * Retry wrapper for async functions with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry this error
      if (!config.retryCondition(error)) {
        throw error;
      }

      // Don't retry on the last attempt
      if (attempt === config.maxAttempts) {
        break;
      }

      // Calculate delay and wait
      const delay = calculateDelay(attempt, config);
      
      // Call retry callback
      config.onRetry(attempt, error);
      
      // Log retry attempt
      console.warn(`Retry attempt ${attempt}/${config.maxAttempts} after ${delay}ms:`, error);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Circuit breaker for preventing cascading failures
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private options: {
      failureThreshold: number;
      recoveryTimeout: number;
      monitoringPeriod: number;
    } = {
      failureThreshold: 5,
      recoveryTimeout: 60000, // 1 minute
      monitoringPeriod: 300000, // 5 minutes
    }
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.options.recoveryTimeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.options.failureThreshold) {
      this.state = 'open';
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
    };
  }
}

/**
 * Network status monitor
 */
export class NetworkStatusMonitor {
  private isOnline = navigator.onLine;
  private listeners: Array<(online: boolean) => void> = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  private handleOnline = () => {
    this.isOnline = true;
    this.reconnectAttempts = 0;
    this.notifyListeners(true);
    console.log('Network connection restored');
  };

  private handleOffline = () => {
    this.isOnline = false;
    this.notifyListeners(false);
    console.warn('Network connection lost');
  };

  private notifyListeners(online: boolean) {
    this.listeners.forEach(listener => {
      try {
        listener(online);
      } catch (error) {
        console.error('Error in network status listener:', error);
      }
    });
  }

  onStatusChange(listener: (online: boolean) => void) {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  async waitForConnection(timeout = 30000): Promise<boolean> {
    if (this.isOnline) {
      return true;
    }

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        unsubscribe();
        resolve(false);
      }, timeout);

      const unsubscribe = this.onStatusChange((online) => {
        if (online) {
          clearTimeout(timeoutId);
          unsubscribe();
          resolve(true);
        }
      });
    });
  }

  getStatus() {
    return {
      isOnline: this.isOnline,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  destroy() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    this.listeners = [];
  }
}

/**
 * Graceful degradation utility
 */
export class GracefulDegradation {
  private features = new Map<string, boolean>();
  private fallbacks = new Map<string, () => any>();

  /**
   * Register a feature with its availability check
   */
  registerFeature(name: string, isAvailable: () => boolean, fallback?: () => any) {
    this.features.set(name, isAvailable());
    if (fallback) {
      this.fallbacks.set(name, fallback);
    }
  }

  /**
   * Check if a feature is available
   */
  isFeatureAvailable(name: string): boolean {
    return this.features.get(name) ?? false;
  }

  /**
   * Get feature or fallback
   */
  getFeatureOrFallback<T>(name: string, feature: () => T): T | any {
    if (this.isFeatureAvailable(name)) {
      try {
        return feature();
      } catch (error) {
        console.warn(`Feature ${name} failed, using fallback:`, error);
        return this.fallbacks.get(name)?.() ?? null;
      }
    }
    
    return this.fallbacks.get(name)?.() ?? null;
  }
}

/**
 * Error recovery strategies
 */
export const errorRecoveryStrategies = {
  /**
   * Recover from WebSocket connection errors
   */
  websocketRecovery: {
    maxReconnectAttempts: 5,
    reconnectDelay: 1000,
    backoffFactor: 1.5,
    
    async reconnect(
      createConnection: () => WebSocket,
      onReconnect?: () => void
    ): Promise<WebSocket> {
      let attempts = 0;
      
      while (attempts < this.maxReconnectAttempts) {
        try {
          const ws = createConnection();
          
          return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              ws.close();
              reject(new Error('WebSocket connection timeout'));
            }, 10000);

            ws.onopen = () => {
              clearTimeout(timeout);
              onReconnect?.();
              resolve(ws);
            };

            ws.onerror = () => {
              clearTimeout(timeout);
              reject(new Error('WebSocket connection failed'));
            };
          });
        } catch (error) {
          attempts++;
          
          if (attempts >= this.maxReconnectAttempts) {
            throw new Error(`Failed to reconnect after ${attempts} attempts`);
          }
          
          const delay = this.reconnectDelay * Math.pow(this.backoffFactor, attempts - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      throw new Error('Max reconnection attempts exceeded');
    },
  },

  /**
   * Recover from API request errors
   */
  apiRecovery: {
    async recoverFromError(error: any, originalRequest: () => Promise<any>) {
      // Handle different types of API errors
      if (error?.status === 401) {
        // Unauthorized - might need to refresh token
        console.warn('API request unauthorized, attempting token refresh');
        // Could implement token refresh logic here
        throw error; // Re-throw for now
      }
      
      if (error?.status === 429) {
        // Rate limited - wait and retry
        const retryAfter = error?.headers?.['retry-after'] || 5;
        console.warn(`Rate limited, retrying after ${retryAfter} seconds`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        return originalRequest();
      }
      
      if (error?.status >= 500) {
        // Server error - retry with backoff
        return withRetry(originalRequest, {
          maxAttempts: 3,
          baseDelay: 2000,
          retryCondition: (err) => err?.status >= 500,
        });
      }
      
      throw error;
    },
  },

  /**
   * Recover from media playback errors
   */
  mediaRecovery: {
    async recoverFromError(
      error: any,
      video: HTMLVideoElement,
      src: string
    ): Promise<void> {
      console.warn('Media playback error, attempting recovery:', error);
      
      // Try different recovery strategies
      const strategies = [
        // Strategy 1: Reload the source
        async () => {
          video.load();
          await new Promise(resolve => setTimeout(resolve, 1000));
        },
        
        // Strategy 2: Reset src and reload
        async () => {
          video.src = '';
          await new Promise(resolve => setTimeout(resolve, 500));
          video.src = src;
          video.load();
        },
        
        // Strategy 3: Create new video element (last resort)
        async () => {
          const parent = video.parentElement;
          if (parent) {
            const newVideo = video.cloneNode(true) as HTMLVideoElement;
            parent.replaceChild(newVideo, video);
            newVideo.src = src;
            newVideo.load();
          }
        },
      ];
      
      for (let i = 0; i < strategies.length; i++) {
        try {
          await strategies[i]();
          console.log(`Media recovery strategy ${i + 1} succeeded`);
          return;
        } catch (recoveryError) {
          console.warn(`Media recovery strategy ${i + 1} failed:`, recoveryError);
          
          if (i === strategies.length - 1) {
            throw new Error('All media recovery strategies failed');
          }
        }
      }
    },
  },
};

/**
 * Global error handler setup
 */
export function setupGlobalErrorHandling() {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Report to metrics
    metricsApi.reportError({
      type: 'unhandled_rejection',
      message: event.reason?.message || 'Unhandled promise rejection',
      stack: event.reason?.stack,
      timestamp: Date.now(),
      url: window.location.href,
    }).catch(() => {});
    
    // Prevent default browser behavior
    event.preventDefault();
  });

  // Handle global JavaScript errors
  window.addEventListener('error', (event) => {
    console.error('Global JavaScript error:', event.error);
    
    // Report to metrics
    metricsApi.reportError({
      type: 'javascript_error',
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
      timestamp: Date.now(),
      url: window.location.href,
    }).catch(() => {});
  });
}

// Global instances
export const networkMonitor = new NetworkStatusMonitor();
export const gracefulDegradation = new GracefulDegradation();

// Setup global error handling
if (typeof window !== 'undefined') {
  setupGlobalErrorHandling();
}