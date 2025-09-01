/**
 * Error handling utilities for the content discovery platform
 */

/**
 * Generate idempotency key for safe API retries
 */
export function generateIdempotencyKey(prefix: string = 'op'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extract user-friendly error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  
  return 'An unexpected error occurred';
}

/**
 * Check if error is a network error that should be retried
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return true;
    }
    
    // Timeout errors
    if (error.message.includes('timeout')) {
      return true;
    }
  }
  
  // HTTP status codes that should be retried
  if (error && typeof error === 'object' && 'status' in error) {
    const status = Number(error.status);
    return status >= 500 || status === 408 || status === 429;
  }
  
  return false;
}

/**
 * Create a retry delay with exponential backoff
 */
export function getRetryDelay(attempt: number, baseDelay: number = 1000): number {
  return Math.min(baseDelay * Math.pow(2, attempt), 10000);
}

/**
 * Toast notification messages for common errors
 */
export const ERROR_MESSAGES = {
  NETWORK: 'Network error. Please check your connection and try again.',
  TIMEOUT: 'Request timed out. Please try again.',
  UNAUTHORIZED: 'You need to be logged in to perform this action.',
  FORBIDDEN: 'You don\'t have permission to perform this action.',
  NOT_FOUND: 'The requested content was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNKNOWN: 'An unexpected error occurred. Please try again.',
} as const;

/**
 * Get appropriate error message based on error type
 */
export function getErrorMessageForUser(error: unknown): string {
  const message = getErrorMessage(error);
  
  // If it's the default generic message or empty, use our user-friendly version
  if (!message || message.trim() === '' || message === 'An unexpected error occurred') {
    return ERROR_MESSAGES.UNKNOWN;
  }
  
  if (message.toLowerCase().includes('network')) {
    return ERROR_MESSAGES.NETWORK;
  }
  
  if (message.toLowerCase().includes('timeout')) {
    return ERROR_MESSAGES.TIMEOUT;
  }
  
  if (message.toLowerCase().includes('unauthorized') || message.includes('401')) {
    return ERROR_MESSAGES.UNAUTHORIZED;
  }
  
  if (message.toLowerCase().includes('forbidden') || message.includes('403')) {
    return ERROR_MESSAGES.FORBIDDEN;
  }
  
  if (message.toLowerCase().includes('not found') || message.includes('404')) {
    return ERROR_MESSAGES.NOT_FOUND;
  }
  
  if (message.includes('500') || message.includes('502') || message.includes('503')) {
    return ERROR_MESSAGES.SERVER_ERROR;
  }
  
  return message;
}

/**
 * Error recovery strategies
 */
export const ERROR_RECOVERY = {
  RETRY: 'retry',
  FALLBACK: 'fallback',
  REDIRECT: 'redirect',
  IGNORE: 'ignore',
} as const;

export type ErrorRecoveryStrategy = typeof ERROR_RECOVERY[keyof typeof ERROR_RECOVERY];

/**
 * Determine the best recovery strategy for an error
 */
export function getRecoveryStrategy(error: unknown): ErrorRecoveryStrategy {
  const message = getErrorMessage(error);
  const lowerMessage = message.toLowerCase();
  
  // Network errors should be retried
  if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
    return ERROR_RECOVERY.RETRY;
  }
  
  // Timeout errors should be retried
  if (lowerMessage.includes('timeout')) {
    return ERROR_RECOVERY.RETRY;
  }
  
  // Auth errors should redirect to login
  if (lowerMessage.includes('unauthorized') || message.includes('401')) {
    return ERROR_RECOVERY.REDIRECT;
  }
  
  // Server errors should be retried with fallback
  if (message.includes('500') || message.includes('502') || message.includes('503')) {
    return ERROR_RECOVERY.RETRY;
  }
  
  // Client errors (except auth) should use fallback
  if (error && typeof error === 'object' && 'status' in error) {
    const status = Number(error.status);
    if (status >= 400 && status < 500 && status !== 401) {
      return ERROR_RECOVERY.FALLBACK;
    }
  }
  
  return ERROR_RECOVERY.RETRY;
}

/**
 * Enhanced error context for better debugging
 */
export interface ErrorContext {
  timestamp: number;
  userAgent: string;
  url: string;
  userId?: string;
  sessionId?: string;
  feature?: string;
  action?: string;
  metadata?: Record<string, any>;
}

/**
 * Create error context for logging
 */
export function createErrorContext(
  feature?: string,
  action?: string,
  metadata?: Record<string, any>
): ErrorContext {
  return {
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    userId: localStorage.getItem('userId') || undefined,
    sessionId: sessionStorage.getItem('sessionId') || undefined,
    feature,
    action,
    metadata,
  };
}

/**
 * Enhanced error logging with context
 */
export function logError(
  error: unknown,
  context?: Partial<ErrorContext>
): void {
  const errorContext = {
    ...createErrorContext(),
    ...context,
  };
  
  const errorData = {
    message: getErrorMessage(error),
    stack: error instanceof Error ? error.stack : undefined,
    context: errorContext,
  };
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error logged:', errorData);
  }
  
  // TODO: Send to error monitoring service in production
  if (process.env.NODE_ENV === 'production') {
    // Example: Sentry, LogRocket, etc.
    // errorMonitoringService.captureError(errorData);
  }
}