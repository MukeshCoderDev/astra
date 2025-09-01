import { useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { WS_EVENTS } from '../constants/live';
import { getEnv } from '../lib/env';
import type { TipEvent } from '../types/live';

/**
 * Hook for listening to live tip events via WebSocket
 */
export function useLiveTipEvents(streamId: string, onTip: (tip: TipEvent) => void) {
  const connectToTipEvents = useCallback(() => {
    const wsUrl = getEnv('VITE_WS_URL') || getEnv('NEXT_PUBLIC_WS_URL');
    if (!wsUrl) {
      console.warn('WebSocket URL not configured for tip events');
      return null;
    }

    try {
      const socket: Socket = io(wsUrl, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      // Join the stream's tip room
      socket.emit('join_tips', { streamId });

      // Listen for tip events
      socket.on(WS_EVENTS.REALTIME_TIP, (tip: TipEvent) => {
        if (tip.streamId === streamId) {
          onTip(tip);
        }
      });

      // Handle connection events
      socket.on('connect', () => {
        console.log('Connected to tip events WebSocket');
      });

      socket.on('disconnect', (reason) => {
        console.log('Disconnected from tip events WebSocket:', reason);
      });

      socket.on('connect_error', (error) => {
        console.error('Tip events WebSocket connection error:', error);
      });

      return socket;
    } catch (error) {
      console.error('Failed to connect to tip events WebSocket:', error);
      return null;
    }
  }, [streamId, onTip]);

  useEffect(() => {
    const socket = connectToTipEvents();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [connectToTipEvents]);
}