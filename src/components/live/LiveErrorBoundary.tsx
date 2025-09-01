"use client";
import React from 'react';
import ErrorBoundary from '../common/ErrorBoundary';
import { useNetworkStatus } from '../../hooks/useResilience';

interface LiveErrorBoundaryProps {
  children: React.ReactNode;
  streamId?: string;
  fallback?: React.ReactNode;
}

/**
 * Specialized error boundary for live streaming components
 * Provides context-aware error handling and recovery options
 */
export default function LiveErrorBoundary({ 
  children, 
  streamId, 
  fallback 
}: LiveErrorBoundaryProps) {
  const { isOnline } = useNetworkStatus();

  const customFallback = fallback || (
    <div className="min-h-[400px] flex items-center justify-center bg-black rounded-lg">
      <div className="text-center text-white p-6 max-w-md">
        <div className="text-red-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        
        <h3 className="text-xl font-semibold mb-2">
          Stream Unavailable
        </h3>
        
        <p className="text-gray-300 mb-4 text-sm">
          {!isOnline 
            ? "You're currently offline. Please check your internet connection."
            : "We're experiencing technical difficulties with this stream."
          }
        </p>

        <div className="space-y-2">
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Reload Stream
          </button>
          
          <button
            onClick={() => window.history.back()}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Go Back
          </button>
        </div>

        {/* Network status indicator */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span className="text-gray-400">
            {isOnline ? 'Connected' : 'Offline'}
          </span>
        </div>

        {streamId && (
          <p className="text-xs text-gray-500 mt-3">
            Stream ID: {streamId}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <ErrorBoundary
      fallback={customFallback}
      resetKeys={[streamId, isOnline]}
      resetOnPropsChange={true}
      onError={(error, errorInfo) => {
        console.error('Live streaming error:', {
          error: error.message,
          streamId,
          isOnline,
          componentStack: errorInfo.componentStack,
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}