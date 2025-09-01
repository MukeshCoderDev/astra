import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { WS_EVENTS, CHAT_CONFIG } from '../constants/live';
import { getEnv } from '../lib/env';
import type { StreamStatus } from '../types/live';

/**
 * Stream status update event
 */
interface StreamStatusUpdate {
  streamId: string;
  status: StreamStatus;
  timestamp: number;
}

/**
 * Hook for managing stream status with real-time updates
 */
export function useStreamStatus(streamId: string, initialStatus?: StreamStatus) {
  const [status, setStatus] = useState<StreamStatus>(initialStatus || 'preview');
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttemptsRef = useRef(0);

  /**
   * Connect to WebSocket for real-time status updates
   */
  const connect = useCallback(() => {
    const wsUrl = getEnv('VITE_WS_URL') || getEnv('NEXT_PUBLIC_WS_URL');
    if (!wsUrl) {
      console.warn('WebSocket URL not configured for stream status');
      setError('WebSocket not configured');
      return;
    }

    try {
      // Clean up existing connection
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      const socket: Socket = io(wsUrl, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        reconnection: false, // Handle reconnection manually
      });

      socketRef.current = socket;

      // Join the stream's status room
      socket.emit('join_stream_status', { streamId });

      // Handle connection events
      socket.on('connect', () => {
        console.log('Connected to stream status WebSocket');
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      });

      socket.on('disconnect', (reason) => {
        console.log('Disconnected from stream status WebSocket:', reason);
        setIsConnected(false);
        
        // Attempt reconnection if not manually disconnected
        if (reason !== 'io client disconnect') {
          attemptReconnect();
        }
      });

      socket.on('connect_error', (error) => {
        console.error('Stream status WebSocket connection error:', error);
        setIsConnected(false);
        setError('Connection failed');
        attemptReconnect();
      });

      // Listen for status updates
      socket.on(WS_EVENTS.CONTROL_STATUS, (update: StreamStatusUpdate) => {
        if (update.streamId === streamId) {
          console.log('Stream status updated:', update.status);
          setStatus(update.status);
        }
      });

    } catch (error) {
      console.error('Failed to connect to stream status WebSocket:', error);
      setError('Failed to connect');
    }
  }, [streamId]);

  /**
   * Attempt to reconnect with exponential backoff
   */
  const attemptReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= CHAT_CONFIG.RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached for stream status');
      setError('Connection lost');
      return;
    }

    const delay = CHAT_CONFIG.RECONNECT_DELAY_MS * Math.pow(2, reconnectAttemptsRef.current);
    reconnectAttemptsRef.current += 1;

    console.log(`Attempting to reconnect to stream status (attempt ${reconnectAttemptsRef.current}/${CHAT_CONFIG.RECONNECT_ATTEMPTS}) in ${delay}ms`);

    setTimeout(() => {
      connect();
    }, delay);
  }, [connect]);

  /**
   * Manually disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
  }, []);

  /**
   * Manually trigger reconnection
   */
  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    setError(null);
    connect();
  }, [connect, disconnect]);

  // Initialize connection
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Handle visibility change to reconnect when tab becomes active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isConnected && !error) {
        reconnect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isConnected, error, reconnect]);

  return {
    status,
    isConnected,
    error,
    reconnect,
    disconnect,
  };
}