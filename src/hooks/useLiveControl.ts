"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { ENV } from "../lib/env";
import { liveApi } from "../lib/api";
import { WS_EVENTS, CHAT_CONFIG, PERFORMANCE_TARGETS } from "../constants/live";
import type { HealthMetrics } from "../types/live";

/**
 * Live control hook state interface
 */
interface LiveControlState {
  connected: boolean;
  failed: boolean;
  loading: boolean;
  healthMetrics: HealthMetrics | null;
  viewerCount: number;
}

/**
 * Live control hook return interface
 */
interface LiveControlHook extends LiveControlState {
  reconnect: () => void;
  disconnect: () => void;
}

/**
 * Custom hook for live stream control room functionality
 * Handles WebSocket connection for health metrics and viewer count updates
 */
export function useLiveControl(streamId: string): LiveControlHook {
  const socketRef = useRef<Socket | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // State
  const [state, setState] = useState<LiveControlState>({
    connected: false,
    failed: false,
    loading: true,
    healthMetrics: null,
    viewerCount: 0,
  });

  /**
   * Update state helper
   */
  const updateState = useCallback((updates: Partial<LiveControlState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Update health metrics
   */
  const updateHealthMetrics = useCallback((metrics: HealthMetrics) => {
    updateState({ 
      healthMetrics: metrics,
      viewerCount: metrics.viewerCount 
    });
  }, [updateState]);

  /**
   * Initialize WebSocket connection
   */
  const initializeWebSocket = useCallback(() => {
    if (!ENV.WS_URL || socketRef.current?.connected) return;

    try {
      console.log(`🔌 Connecting to control WebSocket for stream ${streamId}`);
      
      const socket = io(ENV.WS_URL, {
        path: "/control",
        transports: ["websocket"],
        reconnectionAttempts: CHAT_CONFIG.RECONNECT_ATTEMPTS,
        reconnectionDelay: CHAT_CONFIG.RECONNECT_DELAY_MS,
        timeout: 10000,
      });

      socketRef.current = socket;

      // Connection events
      socket.on("connect", () => {
        console.log("✅ Control WebSocket connected");
        updateState({ connected: true, failed: false, loading: false });
        setReconnectAttempts(0);
        
        // Join the stream control room
        socket.emit("join_control", { streamId });
      });

      socket.on("disconnect", (reason) => {
        console.log("❌ Control WebSocket disconnected:", reason);
        updateState({ connected: false });
        
        // Start polling fallback if disconnection wasn't intentional
        if (reason !== "io client disconnect") {
          startPollingFallback();
        }
      });

      socket.on("connect_error", (error) => {
        console.error("🔌 Control WebSocket connection error:", error);
        updateState({ connected: false, failed: true, loading: false });
        startPollingFallback();
      });

      // Control room events
      socket.on(WS_EVENTS.CONTROL_HEALTH, (metrics: HealthMetrics) => {
        updateHealthMetrics(metrics);
      });

      socket.on(WS_EVENTS.CONTROL_VIEWERS, (data: { count: number }) => {
        updateState({ viewerCount: Number(data.count || 0) });
      });

    } catch (error) {
      console.error("Failed to initialize control WebSocket:", error);
      updateState({ connected: false, failed: true, loading: false });
      startPollingFallback();
    }
  }, [streamId, updateHealthMetrics, updateState]);

  /**
   * Start HTTP polling fallback
   */
  const startPollingFallback = useCallback(() => {
    if (pollingIntervalRef.current) return; // Already polling

    console.log("🔄 Starting HTTP polling fallback for control data");
    updateState({ failed: true });

    const poll = async () => {
      try {
        // Poll health metrics and stream stats
        const [healthResponse, statsResponse] = await Promise.all([
          liveApi.getCreatorStream(streamId),
          liveApi.getStats(streamId)
        ]);

        if (healthResponse.ok && healthResponse.data) {
          const streamData = healthResponse.data;
          
          // Extract health metrics if available
          if (streamData.healthMetrics) {
            updateHealthMetrics(streamData.healthMetrics);
          }
          
          // Update viewer count
          if (typeof streamData.viewerCount === 'number') {
            updateState({ viewerCount: streamData.viewerCount });
          }
        }

        if (statsResponse.ok && statsResponse.data) {
          const stats = statsResponse.data;
          
          // Create health metrics from stats if available
          if (stats.bitrateKbps !== undefined || stats.fps !== undefined) {
            const metrics: HealthMetrics = {
              viewerCount: stats.viewerCount || state.viewerCount,
              bitrateKbps: stats.bitrateKbps || 0,
              fps: stats.fps || 0,
              dropRate: stats.dropRate || 0,
              timestamp: Date.now(),
            };
            updateHealthMetrics(metrics);
          }
        }

        updateState({ loading: false });
      } catch (error) {
        console.warn("Control polling failed:", error);
      }
    };

    // Initial poll
    poll();

    // Set up polling interval
    pollingIntervalRef.current = setInterval(poll, PERFORMANCE_TARGETS.HEALTH_UPDATE_INTERVAL_MS);
  }, [streamId, updateHealthMetrics, updateState, state.viewerCount]);

  /**
   * Stop HTTP polling
   */
  const stopPollingFallback = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      console.log("⏹️ Stopped HTTP polling fallback for control data");
    }
  }, []);

  /**
   * Manually disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    stopPollingFallback();
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    updateState({ connected: false });
  }, [stopPollingFallback, updateState]);

  /**
   * Reconnect to WebSocket
   */
  const reconnect = useCallback(() => {
    if (reconnectAttempts >= CHAT_CONFIG.RECONNECT_ATTEMPTS) {
      console.log("Max reconnection attempts reached for control WebSocket");
      return;
    }

    setReconnectAttempts(prev => prev + 1);
    
    // Disconnect existing socket
    disconnect();

    // Retry connection with exponential backoff
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
    reconnectTimeoutRef.current = setTimeout(() => {
      initializeWebSocket();
    }, delay);
  }, [reconnectAttempts, disconnect, initializeWebSocket]);

  /**
   * Initialize connection on mount
   */
  useEffect(() => {
    if (!streamId) return;

    initializeWebSocket();

    return () => {
      // Cleanup on unmount
      disconnect();
    };
  }, [streamId, initializeWebSocket, disconnect]);

  /**
   * Auto-reconnect when connection fails
   */
  useEffect(() => {
    if (state.failed && !state.connected && reconnectAttempts < CHAT_CONFIG.RECONNECT_ATTEMPTS) {
      const delay = Math.min(5000 * Math.pow(2, reconnectAttempts), 30000);
      reconnectTimeoutRef.current = setTimeout(reconnect, delay);
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [state.failed, state.connected, reconnectAttempts, reconnect]);

  /**
   * Handle visibility change to reconnect when tab becomes active
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !state.connected && !state.loading) {
        reconnect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state.connected, state.loading, reconnect]);

  return {
    ...state,
    reconnect,
    disconnect,
  };
}