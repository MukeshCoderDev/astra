"use client";
import React from 'react';
import { clsx } from 'clsx';

interface UserFriendlyErrorProps {
  error: Error | string | null;
  title?: string;
  className?: string;
  showDetails?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
  retryLabel?: string;
  isRetrying?: boolean;
}

/**
 * User-friendly error display component
 * Converts technical errors into understandable messages with recovery options
 */
export default function UserFriendlyError({
  error,
  title = "Something went wrong",
  className,
  showDetails = false,
  onRetry,
  onDismiss,
  retryLabel = "Try Again",
  isRetrying = false,
}: UserFriendlyErrorProps) {
  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.message;
  
  // Convert technical errors to user-friendly messages
  const getUserFriendlyMessage = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
      return "Connection problem. Please check your internet and try again.";
    }
    
    if (lowerMessage.includes('timeout')) {
      return "Request timed out. The server might be busy, please try again.";
    }
    
    if (lowerMessage.includes('unauthorized') || lowerMessage.includes('401')) {
      return "You need to sign in to access this content.";
    }
    
    if (lowerMessage.includes('forbidden') || lowerMessage.includes('403')) {
      return "You don't have permission to access this content.";
    }
    
    if (lowerMessage.includes('not found') || lowerMessage.includes('404')) {
      return "The content you're looking for couldn't be found.";
    }
    
    if (lowerMessage.includes('rate limit') || lowerMessage.includes('429')) {
      return "Too many requests. Please wait a moment and try again.";
    }
    
    if (lowerMessage.includes('server') || lowerMessage.includes('500')) {
      return "Server error. Our team has been notified and is working on it.";
    }
    
    if (lowerMessage.includes('cors')) {
      return "Security restriction prevented loading. Please try refreshing the page.";
    }
    
    if (lowerMessage.includes('websocket')) {
      return "Real-time connection failed. Some features may not work properly.";
    }
    
    if (lowerMessage.includes('media') || lowerMessage.includes('video')) {
      return "Video playback error. Please try refreshing or check your browser settings.";
    }
    
    // Default fallback
    return "An unexpected error occurred. Please try again.";
  };

  const friendlyMessage = getUserFriendlyMessage(errorMessage);
  
  // Determine error severity for styling
  const getSeverity = (message: string): 'error' | 'warning' | 'info' => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('unauthorized') || lowerMessage.includes('forbidden')) {
      return 'warning';
    }
    
    if (lowerMessage.includes('not found') || lowerMessage.includes('rate limit')) {
      return 'info';
    }
    
    return 'error';
  };

  const severity = getSeverity(errorMessage);
  
  const severityStyles = {
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const iconStyles = {
    error: 'text-red-400',
    warning: 'text-yellow-400',
    info: 'text-blue-400',
  };

  const buttonStyles = {
    error: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-yellow-600 hover:bg-yellow-700',
    info: 'bg-blue-600 hover:bg-blue-700',
  };

  const getIcon = () => {
    switch (severity) {
      case 'error':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className={clsx(
      'rounded-lg border p-4',
      severityStyles[severity],
      className
    )}>
      <div className="flex items-start">
        <div className={clsx('flex-shrink-0', iconStyles[severity])}>
          {getIcon()}
        </div>
        
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium">
            {title}
          </h3>
          
          <div className="mt-1 text-sm opacity-90">
            {friendlyMessage}
          </div>

          {showDetails && process.env.NODE_ENV === 'development' && (
            <details className="mt-2">
              <summary className="text-xs cursor-pointer opacity-75 hover:opacity-100">
                Technical Details
              </summary>
              <pre className="mt-1 text-xs bg-black/10 p-2 rounded overflow-auto max-h-32">
                {errorMessage}
              </pre>
            </details>
          )}

          {(onRetry || onDismiss) && (
            <div className="mt-3 flex gap-2">
              {onRetry && (
                <button
                  onClick={onRetry}
                  disabled={isRetrying}
                  className={clsx(
                    'px-3 py-1 text-white text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                    buttonStyles[severity]
                  )}
                >
                  {isRetrying ? (
                    <span className="flex items-center gap-1">
                      <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                      Retrying...
                    </span>
                  ) : (
                    retryLabel
                  )}
                </button>
              )}
              
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="px-3 py-1 text-sm border border-current rounded hover:bg-black/5 transition-colors"
                >
                  Dismiss
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}