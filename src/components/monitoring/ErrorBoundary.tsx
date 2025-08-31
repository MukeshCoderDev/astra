import React, { Component, ErrorInfo, ReactNode } from 'react';
import { captureException } from '../../lib/monitoring';
import { Button } from '../ui';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'page' | 'component' | 'critical';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, level = 'component' } = this.props;

    // Report error to monitoring service
    captureException(error, {
      errorInfo: errorInfo.componentStack,
      errorBoundaryLevel: level,
      retryCount: this.retryCount,
      errorId: this.state.errorId,
      props: this.props,
    });

    // Call custom error handler if provided
    onError?.(error, errorInfo);

    this.setState({
      errorInfo,
    });

    // Log error in development
    if (import.meta.env.DEV) {
      console.group('🚨 Error Boundary Caught Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }
  }

  handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
      });
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, level = 'component' } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Render appropriate error UI based on level
      return this.renderErrorUI(error, errorInfo, level);
    }

    return children;
  }

  private renderErrorUI(error: Error | null, errorInfo: ErrorInfo | null, level: string) {
    const canRetry = this.retryCount < this.maxRetries;

    if (level === 'critical') {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="space-y-2">
              <AlertTriangle className="h-16 w-16 text-destructive mx-auto" />
              <h1 className="text-2xl font-bold text-foreground">
                Critical Error
              </h1>
              <p className="text-muted-foreground">
                The application encountered a critical error and cannot continue.
              </p>
            </div>

            {import.meta.env.DEV && error && (
              <div className="bg-muted p-4 rounded-lg text-left">
                <h3 className="font-semibold mb-2">Error Details:</h3>
                <pre className="text-sm text-muted-foreground overflow-auto">
                  {error.message}
                </pre>
              </div>
            )}

            <div className="space-y-3">
              <Button onClick={this.handleReload} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reload Application
              </Button>
              <Button variant="outline" onClick={this.handleGoHome} className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Go to Home
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Error ID: {this.state.errorId}
            </p>
          </div>
        </div>
      );
    }

    if (level === 'page') {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="max-w-md w-full text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Page Error</h2>
              <p className="text-muted-foreground">
                This page encountered an error and couldn't load properly.
              </p>
            </div>

            <div className="flex gap-2 justify-center">
              {canRetry && (
                <Button onClick={this.handleRetry} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again ({this.maxRetries - this.retryCount} left)
                </Button>
              )}
              <Button onClick={this.handleGoHome}>
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            </div>

            {import.meta.env.DEV && (
              <details className="text-left">
                <summary className="cursor-pointer text-sm text-muted-foreground">
                  Show Error Details
                </summary>
                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                  {error?.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    // Component level error
    return (
      <div className="border border-destructive/20 bg-destructive/5 rounded-lg p-4 my-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-2">
            <h3 className="font-medium text-destructive">Component Error</h3>
            <p className="text-sm text-muted-foreground">
              A component failed to render properly.
            </p>
            
            {canRetry && (
              <Button 
                onClick={this.handleRetry} 
                size="sm" 
                variant="outline"
                className="mt-2"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry ({this.maxRetries - this.retryCount} left)
              </Button>
            )}

            {import.meta.env.DEV && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-muted-foreground">
                  Error Details
                </summary>
                <pre className="mt-1 text-xs bg-background p-2 rounded overflow-auto">
                  {error?.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      </div>
    );
  }
}

// Specialized error boundaries for different use cases
export function PageErrorBoundary({ children, onError }: { 
  children: ReactNode; 
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}) {
  return (
    <ErrorBoundary level="page" onError={onError}>
      {children}
    </ErrorBoundary>
  );
}

export function ComponentErrorBoundary({ children, onError }: { 
  children: ReactNode; 
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}) {
  return (
    <ErrorBoundary level="component" onError={onError}>
      {children}
    </ErrorBoundary>
  );
}

export function CriticalErrorBoundary({ children, onError }: { 
  children: ReactNode; 
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}) {
  return (
    <ErrorBoundary level="critical" onError={onError}>
      {children}
    </ErrorBoundary>
  );
}

// HOC for wrapping components with error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  level: 'page' | 'component' | 'critical' = 'component'
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary level={level}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}