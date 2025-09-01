// React hooks for error handling and resilience

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  withRetry, 
  RetryOptions, 
  networkMonitor, 
  gracefulDegradation,
  errorRecoveryStrategies 
} from '../lib/resilience';
import { useErrorHandler } from '../components/common/ErrorBoundary';

/**
 * Hook for network status monitoring
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  useEffect(() => {
    const unsubscribe = networkMonitor.onStatusChange((online) => {
      setIsOnline(online);
      if (online) {
        setReconnectAttempts(0);
      }
    });

    return unsubscribe;
  }, []);

  const waitForConnection = useCallback(async (timeout?: number) => {
    return networkMonitor.waitForConnection(timeout);
  }, []);

  return {
    isOnline,
    reconnectAttempts,
    waitForConnection,
  };
}

/**
 * Hook for resilient API calls with retry logic
 */
export function useResilientApi<T = any>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);
  const { reportError } = useErrorHandler();
  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(async (
    apiCall: () => Promise<T>,
    retryOptions?: RetryOptions
  ) => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError(null);

    try {
      const result = await withRetry(apiCall, {
        maxAttempts: 3,
        baseDelay: 1000,
        onRetry: (attempt, error) => {
          console.warn(`API retry attempt ${attempt}:`, error);
        },
        ...retryOptions,
      });

      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      
      // Report error for monitoring
      await reportError(error, 'resilient_api_call');
      
      throw error;
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [reportError]);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    loading,
    error,
    data,
    execute,
    reset,
  };
}

/**
 * Hook for WebSocket connection with automatic reconnection
 */
export function useResilientWebSocket(url: string, options?: {
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  onMessage?: (event: MessageEvent) => void;
  onError?: (error: Event) => void;
  onReconnect?: () => void;
}) {
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const { reportError } = useErrorHandler();

  const connect = useCallback(async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return wsRef.current;
    }

    setConnectionState('connecting');

    try {
      const ws = await errorRecoveryStrategies.websocketRecovery.reconnect(
        () => new WebSocket(url),
        options?.onReconnect
      );

      wsRef.current = ws;
      setConnectionState('connected');
      setReconnectAttempts(0);

      // Set up event listeners
      ws.onmessage = options?.onMessage || (() => {});
      
      ws.onclose = () => {
        setConnectionState('disconnected');
        
        // Attempt reconnection if not manually closed
        if (reconnectAttempts < (options?.maxReconnectAttempts || 5)) {
          const delay = (options?.reconnectDelay || 1000) * Math.pow(1.5, reconnectAttempts);
          
          reconnectTimeoutRef.current = window.setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, delay);
        }
      };

      ws.onerror = (error) => {
        setConnectionState('error');
        options?.onError?.(error);
        reportError(new Error('WebSocket error'), 'websocket_connection');
      };

      return ws;
    } catch (error) {
      setConnectionState('error');
      const wsError = error instanceof Error ? error : new Error(String(error));
      await reportError(wsError, 'websocket_reconnection_failed');
      throw wsError;
    }
  }, [url, options, reconnectAttempts, reportError]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setConnectionState('disconnected');
    setReconnectAttempts(0);
  }, []);

  const sendMessage = useCallback((data: string | ArrayBuffer | Blob) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(data);
      return true;
    }
    return false;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connectionState,
    reconnectAttempts,
    connect,
    disconnect,
    sendMessage,
    isConnected: connectionState === 'connected',
  };
}

/**
 * Hook for graceful feature degradation
 */
export function useGracefulDegradation() {
  const checkFeature = useCallback((name: string, check: () => boolean, fallback?: () => any) => {
    gracefulDegradation.registerFeature(name, check, fallback);
    return gracefulDegradation.isFeatureAvailable(name);
  }, []);

  const useFeature = useCallback(<T>(name: string, feature: () => T): T | any => {
    return gracefulDegradation.getFeatureOrFallback(name, feature);
  }, []);

  return {
    checkFeature,
    useFeature,
  };
}

/**
 * Hook for offline detection and handling
 */
export function useOfflineHandler(options?: {
  onOffline?: () => void;
  onOnline?: () => void;
  showNotification?: boolean;
}) {
  const { isOnline } = useNetworkStatus();
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline && !wasOffline) {
      setWasOffline(true);
      options?.onOffline?.();
      
      if (options?.showNotification) {
        // Could show a toast notification here
        console.warn('You are currently offline. Some features may not work.');
      }
    } else if (isOnline && wasOffline) {
      setWasOffline(false);
      options?.onOnline?.();
      
      if (options?.showNotification) {
        console.log('Connection restored.');
      }
    }
  }, [isOnline, wasOffline, options]);

  return {
    isOnline,
    wasOffline,
  };
}

/**
 * Hook for error recovery with user-friendly messages
 */
export function useErrorRecovery() {
  const [recoveryState, setRecoveryState] = useState<{
    isRecovering: boolean;
    recoveryAttempts: number;
    lastError: Error | null;
  }>({
    isRecovering: false,
    recoveryAttempts: 0,
    lastError: null,
  });

  const { reportError } = useErrorHandler();

  const recover = useCallback(async (
    recoveryFn: () => Promise<void>,
    error: Error,
    maxAttempts = 3
  ) => {
    setRecoveryState(prev => ({
      isRecovering: true,
      recoveryAttempts: prev.recoveryAttempts + 1,
      lastError: error,
    }));

    try {
      await withRetry(recoveryFn, {
        maxAttempts,
        baseDelay: 2000,
        onRetry: (attempt) => {
          console.log(`Recovery attempt ${attempt}/${maxAttempts}`);
        },
      });

      // Recovery successful
      setRecoveryState({
        isRecovering: false,
        recoveryAttempts: 0,
        lastError: null,
      });

      return true;
    } catch (recoveryError) {
      // Recovery failed
      const finalError = recoveryError instanceof Error ? recoveryError : new Error(String(recoveryError));
      
      setRecoveryState(prev => ({
        isRecovering: false,
        recoveryAttempts: prev.recoveryAttempts,
        lastError: finalError,
      }));

      await reportError(finalError, 'error_recovery_failed');
      return false;
    }
  }, [reportError]);

  const reset = useCallback(() => {
    setRecoveryState({
      isRecovering: false,
      recoveryAttempts: 0,
      lastError: null,
    });
  }, []);

  return {
    ...recoveryState,
    recover,
    reset,
  };
}

/**
 * Hook for media error recovery
 */
export function useMediaErrorRecovery(videoRef: React.RefObject<HTMLVideoElement>, src: string) {
  const [mediaError, setMediaError] = useState<MediaError | null>(null);
  const { recover, isRecovering } = useErrorRecovery();

  const handleMediaError = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !video.error) return;

    const error = video.error;
    setMediaError(error);

    console.warn('Media error detected:', {
      code: error.code,
      message: error.message,
    });

    // Attempt recovery
    const recovered = await recover(
      async () => {
        if (video) {
          await errorRecoveryStrategies.mediaRecovery.recoverFromError(
            error,
            video,
            src
          );
        }
      },
      new Error(`Media error: ${error.message} (code: ${error.code})`),
      3
    );

    if (recovered) {
      setMediaError(null);
    }
  }, [videoRef, src, recover]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.addEventListener('error', handleMediaError);
    
    return () => {
      video.removeEventListener('error', handleMediaError);
    };
  }, [handleMediaError]);

  return {
    mediaError,
    isRecovering,
    hasError: mediaError !== null,
  };
}