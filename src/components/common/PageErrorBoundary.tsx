import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorState } from './ErrorState';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  section?: string; // For analytics/logging
  resetKeys?: Array<string | number>; // Keys that trigger reset when changed
  resetOnPropsChange?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * Enhanced error boundary for page sections with automatic reset capabilities
 */
export class PageErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`PageErrorBoundary caught an error in ${this.props.section || 'unknown section'}:`, error, errorInfo);
    
    this.setState({ errorInfo });
    
    // Call custom error handler
    this.props.onError?.(error, errorInfo);
    
    // Log to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error monitoring service
      console.error('Error boundary triggered:', {
        error: error.message,
        stack: error.stack,
        section: this.props.section,
        componentStack: errorInfo.componentStack,
      });
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;
    
    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetKeys?.some((key, idx) => prevProps.resetKeys?.[idx] !== key)) {
        this.resetErrorBoundary();
      }
    }
    
    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetErrorBoundary();
    }
  }

  resetErrorBoundary = () => {
    // Clear any existing timeout
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
    
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleRetry = () => {
    this.resetErrorBoundary();
    
    // Add a small delay to prevent immediate re-error
    this.resetTimeoutId = window.setTimeout(() => {
      // Force a re-render by updating state
      this.forceUpdate();
    }, 100);
  };

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error state with retry functionality
      return (
        <ErrorState
          error={this.state.error || new Error('An unexpected error occurred')}
          title={`Error in ${this.props.section || 'this section'}`}
          description="Something went wrong while loading this content. Please try again."
          onRetry={this.handleRetry}
          showDetails={process.env.NODE_ENV === 'development'}
          className="min-h-[200px]"
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary for functional components
 */
export function useErrorHandler(section?: string) {
  return React.useCallback((error: Error, errorInfo?: ErrorInfo) => {
    console.error(`Error in ${section || 'component'}:`, error, errorInfo);
    
    // Log to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error monitoring service
      console.error('Component error:', {
        error: error.message,
        stack: error.stack,
        section,
      });
    }
  }, [section]);
}

/**
 * Higher-order component to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <PageErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </PageErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}