/**
 * Comprehensive error logging and tracking system
 */

import { trackApiError, trackNetworkError, trackVideoError } from './monitoring';

export interface LogLevel {
  ERROR: 'error';
  WARN: 'warn';
  INFO: 'info';
  DEBUG: 'debug';
}

export const LOG_LEVELS: LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
};

export interface LogEntry {
  level: keyof LogLevel;
  message: string;
  timestamp: number;
  context?: Record<string, any>;
  stack?: string;
  userId?: string;
  sessionId?: string;
  page: string;
  userAgent: string;
}

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  videoId?: string;
  apiEndpoint?: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

class ErrorLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private sessionId: string;
  private userId?: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupGlobalErrorHandlers();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupGlobalErrorHandlers() {
    // Capture unhandled errors
    window.addEventListener('error', (event) => {
      this.error('Unhandled JavaScript Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled Promise Rejection', {
        reason: event.reason,
        stack: event.reason?.stack,
      });
    });

    // Capture resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target && event.target !== window) {
        const target = event.target as any;
        if (target.src || target.href) {
          this.error('Resource Loading Error', {
            resource: target.src || target.href,
            tagName: target.tagName,
          });
        }
      }
    }, true);
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  private createLogEntry(
    level: keyof LogLevel,
    message: string,
    context?: ErrorContext
  ): LogEntry {
    return {
      level,
      message,
      timestamp: Date.now(),
      context,
      userId: this.userId,
      sessionId: this.sessionId,
      page: window.location.pathname,
      userAgent: navigator.userAgent,
    };
  }

  private addLog(entry: LogEntry) {
    this.logs.push(entry);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Send to external logging service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToLoggingService(entry);
    } else {
      // Console output in development
      const consoleMethod = entry.level === 'error' ? 'error' : 
                           entry.level === 'warn' ? 'warn' : 'log';
      console[consoleMethod](`[${entry.level.toUpperCase()}] ${entry.message}`, entry.context);
    }
  }

  private async sendToLoggingService(entry: LogEntry) {
    try {
      // Replace with your actual logging service endpoint
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });

      if (!response.ok) {
        console.warn('Failed to send log to service:', response.status);
      }
    } catch (error) {
      console.warn('Error sending log to service:', error);
    }
  }

  error(message: string, context?: ErrorContext) {
    const entry = this.createLogEntry('ERROR', message, context);
    this.addLog(entry);
  }

  warn(message: string, context?: ErrorContext) {
    const entry = this.createLogEntry('WARN', message, context);
    this.addLog(entry);
  }

  info(message: string, context?: ErrorContext) {
    const entry = this.createLogEntry('INFO', message, context);
    this.addLog(entry);
  }

  debug(message: string, context?: ErrorContext) {
    if (process.env.NODE_ENV === 'development') {
      const entry = this.createLogEntry('DEBUG', message, context);
      this.addLog(entry);
    }
  }

  // Specific error logging methods
  logApiError(endpoint: string, method: string, status: number, error: any, context?: ErrorContext) {
    this.error(`API Error: ${method} ${endpoint}`, {
      ...context,
      apiEndpoint: endpoint,
      method,
      status,
      error: error.message || error,
      stack: error.stack,
    });

    // Also track in monitoring
    trackApiError(endpoint, method, status, error);
  }

  logNetworkError(url: string, error: any, context?: ErrorContext) {
    this.error(`Network Error: ${url}`, {
      ...context,
      url,
      error: error.message || error,
      stack: error.stack,
    });

    // Also track in monitoring
    trackNetworkError(url, 0, error.message || 'Network error');
  }

  logVideoError(videoId: string, error: any, context?: ErrorContext) {
    this.error(`Video Playback Error: ${videoId}`, {
      ...context,
      videoId,
      error: error.message || error,
      errorCode: error.code,
      stack: error.stack,
    });

    // Also track in monitoring
    trackVideoError(videoId, error);
  }

  logComponentError(component: string, error: any, context?: ErrorContext) {
    this.error(`Component Error: ${component}`, {
      ...context,
      component,
      error: error.message || error,
      stack: error.stack,
    });
  }

  logUserAction(action: string, context?: ErrorContext) {
    this.info(`User Action: ${action}`, context);
  }

  logPerformanceIssue(metric: string, value: number, threshold: number, context?: ErrorContext) {
    this.warn(`Performance Issue: ${metric}`, {
      ...context,
      metric,
      value,
      threshold,
      exceedsThreshold: value > threshold,
    });
  }

  // Get logs for debugging
  getLogs(level?: keyof LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
  }

  // Export logs for debugging
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Get error summary for reporting
  getErrorSummary(timeWindow: number = 3600000): { [key: string]: number } {
    const cutoff = Date.now() - timeWindow;
    const recentErrors = this.logs.filter(log => 
      log.level === 'ERROR' && log.timestamp > cutoff
    );

    const summary: { [key: string]: number } = {};
    recentErrors.forEach(error => {
      const key = error.message.split(':')[0]; // Group by error type
      summary[key] = (summary[key] || 0) + 1;
    });

    return summary;
  }
}

// Global error logger instance
export const errorLogger = new ErrorLogger();

// Convenience functions
export const logError = (message: string, context?: ErrorContext) => 
  errorLogger.error(message, context);

export const logWarn = (message: string, context?: ErrorContext) => 
  errorLogger.warn(message, context);

export const logInfo = (message: string, context?: ErrorContext) => 
  errorLogger.info(message, context);

export const logDebug = (message: string, context?: ErrorContext) => 
  errorLogger.debug(message, context);

// Specific error logging functions
export const logApiError = (endpoint: string, method: string, status: number, error: any, context?: ErrorContext) =>
  errorLogger.logApiError(endpoint, method, status, error, context);

export const logNetworkError = (url: string, error: any, context?: ErrorContext) =>
  errorLogger.logNetworkError(url, error, context);

export const logVideoError = (videoId: string, error: any, context?: ErrorContext) =>
  errorLogger.logVideoError(videoId, error, context);

export const logComponentError = (component: string, error: any, context?: ErrorContext) =>
  errorLogger.logComponentError(component, error, context);

export const logUserAction = (action: string, context?: ErrorContext) =>
  errorLogger.logUserAction(action, context);

export const logPerformanceIssue = (metric: string, value: number, threshold: number, context?: ErrorContext) =>
  errorLogger.logPerformanceIssue(metric, value, threshold, context);

// React Error Boundary integration
export class ErrorBoundaryLogger {
  static logError(error: Error, errorInfo: any, component?: string) {
    errorLogger.logComponentError(component || 'Unknown Component', error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });
  }
}

// Hook for component-level error logging
export function useErrorLogger(componentName: string) {
  const logComponentError = (error: any, context?: ErrorContext) => {
    errorLogger.logComponentError(componentName, error, context);
  };

  const logComponentAction = (action: string, context?: ErrorContext) => {
    errorLogger.logUserAction(`${componentName}: ${action}`, context);
  };

  return {
    logError: logComponentError,
    logAction: logComponentAction,
    logWarn: (message: string, context?: ErrorContext) => 
      errorLogger.warn(`${componentName}: ${message}`, context),
    logInfo: (message: string, context?: ErrorContext) => 
      errorLogger.info(`${componentName}: ${message}`, context),
  };
}

// Development helpers
if (process.env.NODE_ENV === 'development') {
  // Make error logger available in console for debugging
  (window as any).errorLogger = errorLogger;
  
  // Add keyboard shortcut to export logs
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'L') {
      console.log('Error Logs:', errorLogger.exportLogs());
      console.log('Error Summary:', errorLogger.getErrorSummary());
    }
  });
}

export default errorLogger;