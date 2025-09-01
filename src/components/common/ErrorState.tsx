import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { AlertTriangle, RefreshCw, Wifi, WifiOff, AlertCircle, Info } from 'lucide-react';
import { clsx } from 'clsx';
import { getErrorMessageForUser, isRetryableError } from '../../lib/errorHandling';

interface ErrorStateProps {
  error: Error | string | null;
  title?: string;
  description?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  retryLabel?: string;
  className?: string;
  variant?: 'default' | 'compact' | 'inline';
  showIcon?: boolean;
  showDetails?: boolean;
}

/**
 * Comprehensive error state component with retry functionality
 * Provides user-friendly error messages and appropriate recovery actions
 */
export function ErrorState({
  error,
  title,
  description,
  onRetry,
  isRetrying = false,
  retryLabel = 'Try again',
  className,
  variant = 'default',
  showIcon = true,
  showDetails = false,
}: ErrorStateProps) {
  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.message;
  const userFriendlyMessage = getErrorMessageForUser(error);
  const canRetry = isRetryableError(error);
  
  // Determine error type for appropriate styling and icon
  const getErrorType = (message: string) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
      return { type: 'network', icon: WifiOff, color: 'text-orange-500' };
    }
    
    if (lowerMessage.includes('unauthorized') || lowerMessage.includes('forbidden')) {
      return { type: 'auth', icon: AlertCircle, color: 'text-yellow-500' };
    }
    
    if (lowerMessage.includes('not found')) {
      return { type: 'notFound', icon: Info, color: 'text-blue-500' };
    }
    
    return { type: 'general', icon: AlertTriangle, color: 'text-red-500' };
  };

  const { type, icon: Icon, color } = getErrorType(errorMessage);

  // Compact variant for inline errors
  if (variant === 'compact') {
    return (
      <div className={clsx('flex items-center gap-3 p-3 rounded-lg bg-muted/50', className)}>
        {showIcon && <Icon className={clsx('h-5 w-5 flex-shrink-0', color)} />}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            {title || 'Error'}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {description || userFriendlyMessage}
          </p>
        </div>
        {onRetry && (
          <Button
            onClick={onRetry}
            disabled={isRetrying}
            size="sm"
            variant="outline"
            className="flex-shrink-0"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3 mr-1" />
                {retryLabel}
              </>
            )}
          </Button>
        )}
      </div>
    );
  }

  // Inline variant for minimal space
  if (variant === 'inline') {
    return (
      <div className={clsx('flex items-center gap-2 text-sm text-muted-foreground', className)}>
        {showIcon && <Icon className={clsx('h-4 w-4', color)} />}
        <span>{description || userFriendlyMessage}</span>
        {onRetry && (
          <Button
            onClick={onRetry}
            disabled={isRetrying}
            size="sm"
            variant="ghost"
            className="h-auto p-1 text-xs"
          >
            {isRetrying ? 'Retrying...' : 'Retry'}
          </Button>
        )}
      </div>
    );
  }

  // Default card variant
  return (
    <div className={clsx('flex items-center justify-center p-8', className)}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {showIcon && (
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Icon className={clsx('h-6 w-6', color)} />
            </div>
          )}
          <CardTitle className="text-lg">
            {title || getDefaultTitle(type)}
          </CardTitle>
          <CardDescription>
            {description || userFriendlyMessage}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {showDetails && process.env.NODE_ENV === 'development' && (
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                Technical Details
              </summary>
              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                {errorMessage}
              </pre>
            </details>
          )}
          
          <div className="flex gap-2">
            {onRetry && (
              <Button
                onClick={onRetry}
                disabled={isRetrying}
                className="flex-1"
                variant="outline"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {retryLabel}
                  </>
                )}
              </Button>
            )}
            
            <Button
              onClick={() => window.location.reload()}
              className="flex-1"
              variant={onRetry ? "secondary" : "default"}
            >
              <Wifi className="mr-2 h-4 w-4" />
              Refresh Page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getDefaultTitle(type: string): string {
  switch (type) {
    case 'network':
      return 'Connection Problem';
    case 'auth':
      return 'Access Required';
    case 'notFound':
      return 'Content Not Found';
    default:
      return 'Something Went Wrong';
  }
}