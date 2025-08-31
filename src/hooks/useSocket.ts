import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSessionStore } from '../store/sessionStore';
import { toast } from 'sonner';

interface SocketConfig {
  url?: string;
  autoConnect?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

interface SocketState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  reconnectAttempt: number;
}

export function useSocket(config: SocketConfig = {}) {
  const {
    url = import.meta.env.VITE_WS_URL || 'ws://localhost:3001',
    autoConnect = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000,
  } = config;

  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useSessionStore();

  const [state, setState] = useState<SocketState>({
    connected: false,
    connecting: false,
    error: null,
    reconnectAttempt: 0,
  });

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    setState(prev => ({ ...prev, connecting: true, error: null }));

    const socket = io(url, {
      auth: {
        userId: user?.id,
        token: user?.token,
      },
      transports: ['websocket', 'polling'],
      timeout: 10000,
    });

    socket.on('connect', () => {
      console.log('WebSocket connected');
      setState({
        connected: true,
        connecting: false,
        error: null,
        reconnectAttempt: 0,
      });
      clearReconnectTimeout();
    });

    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setState(prev => ({
        ...prev,
        connected: false,
        connecting: false,
        error: reason,
      }));

      // Auto-reconnect unless manually disconnected
      if (reason !== 'io client disconnect') {
        scheduleReconnect();
      }
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setState(prev => ({
        ...prev,
        connected: false,
        connecting: false,
        error: error.message,
      }));
      scheduleReconnect();
    });

    socketRef.current = socket;
  }, [url, user, clearReconnectTimeout]);

  const scheduleReconnect = useCallback(() => {
    setState(prev => {
      const nextAttempt = prev.reconnectAttempt + 1;
      
      if (nextAttempt > reconnectionAttempts) {
        toast.error('Connection lost. Please refresh the page.');
        return { ...prev, reconnectAttempt: nextAttempt };
      }

      // Exponential backoff: 1s, 2s, 4s, 8s, 16s
      const delay = Math.min(reconnectionDelay * Math.pow(2, prev.reconnectAttempt), 30000);
      
      clearReconnectTimeout();
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log(`Attempting to reconnect (${nextAttempt}/${reconnectionAttempts})`);
        connect();
      }, delay);

      return { ...prev, reconnectAttempt: nextAttempt, connecting: true };
    });
  }, [reconnectionAttempts, reconnectionDelay, connect, clearReconnectTimeout]);

  const disconnect = useCallback(() => {
    clearReconnectTimeout();
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setState({
      connected: false,
      connecting: false,
      error: null,
      reconnectAttempt: 0,
    });
  }, [clearReconnectTimeout]);

  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
      return true;
    }
    console.warn('Cannot emit event: WebSocket not connected');
    return false;
  }, []);

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler);
      return () => socketRef.current?.off(event, handler);
    }
    return () => {};
  }, []);

  const off = useCallback((event: string, handler?: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.off(event, handler);
    }
  }, []);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect && user) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, user, connect, disconnect]);

  // Reconnect when user changes
  useEffect(() => {
    if (socketRef.current && user) {
      disconnect();
      connect();
    }
  }, [user?.id, connect, disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    emit,
    on,
    off,
    socket: socketRef.current,
  };
}