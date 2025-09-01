"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { ENV } from "../lib/env";
import { liveApi } from "../lib/api";
import { WS_EVENTS, CHAT_CONFIG, PERFORMANCE_TARGETS } from "../constants/live";
import type { Message } from "../types/live";

/**
 * Live chat hook state interface
 */
interface LiveChatState {
  connected: boolean;
  failed: boolean;
  messages: Message[];
  slowModeSec: number;
  viewers: number;
  loading: boolean;
}

/**
 * Live chat hook return interface
 */
interface LiveChatHook extends LiveChatState {
  send: (text: string) => Promise<void>;
  clearMessages: () => void;
  reconnect: () => void;
}

/**
 * Custom hook for live chat functionality
 * Handles WebSocket connection with HTTP polling fallback
 */
export function useLiveChat(streamId: string): LiveChatHook {
  const socketRef = useRef<Socket | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [since, setSince] = useState<number>(Math.floor(Date.now() / 1000));
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // State
  const [state, setState] = useState<LiveChatState>({
    connected: false,
    failed: false,
    messages: [],
    slowModeSec: 0,
    viewers: 0,
    loading: true,
  });

  /**
   * Update state helper
   */
  const updateState = useCallback((updates: Partial<LiveChatState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Add message to state
   */
  const addMessage = useCallback((message: Message) => {
    setState(prev => {
      // Prevent duplicate messages
      if (prev.messages.some(m => m.id === message.id)) {
        return prev;
      }

      // Keep only the last N messages for performance
      const newMessages = [...prev.messages, message].slice(-CHAT_CONFIG.MAX_MESSAGES_DISPLAYED);
      
      // Update since timestamp
      setSince(Math.max(since, message.ts));
      
      return {
        ...prev,
        messages: newMessages,
      };
    });
  }, [since]);

  /**
   * Update pinned message
   */
  const updatePinnedMessage = useCallback((message: Message) => {
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(m => 
        m.id === message.id ? { ...m, pinned: true } : { ...m, pinned: false }
      ),
    }));
  }, []);

  /**
   * Initialize WebSocket connection
   */
  const initializeWebSocket = useCallback(() => {
    if (!ENV.WS_URL || socketRef.current?.connected) return;

    try {
      console.log(`🔌 Connecting to chat WebSocket for stream ${streamId}`);
      
      const socket = io(ENV.WS_URL, {
        path: "/chat",
        transports: ["websocket"],
        reconnectionAttempts: CHAT_CONFIG.RECONNECT_ATTEMPTS,
        reconnectionDelay: CHAT_CONFIG.RECONNECT_DELAY_MS,
        timeout: 10000,
      });

      socketRef.current = socket;

      // Connection events
      socket.on("connect", () => {
        console.log("✅ Chat WebSocket connected");
        updateState({ connected: true, failed: false, loading: false });
        setReconnectAttempts(0);
        
        // Join the stream room
        socket.emit(WS_EVENTS.CHAT_JOIN, { room: streamId });
      });

      socket.on("disconnect", (reason) => {
        console.log("❌ Chat WebSocket disconnected:", reason);
        updateState({ connected: false });
        
        // Start polling fallback if disconnection wasn't intentional
        if (reason !== "io client disconnect") {
          startPollingFallback();
        }
      });

      socket.on("connect_error", (error) => {
        console.error("🔌 Chat WebSocket connection error:", error);
        updateState({ connected: false, failed: true, loading: false });
        startPollingFallback();
      });

      // Chat events
      socket.on(WS_EVENTS.CHAT_MESSAGE, (message: Message) => {
        addMessage(message);
      });

      socket.on(WS_EVENTS.CHAT_PINNED, (message: Message) => {
        updatePinnedMessage(message);
      });

      socket.on(WS_EVENTS.CHAT_SLOW_MODE, (data: { seconds: number }) => {
        updateState({ slowModeSec: Number(data.seconds || 0) });
      });

      socket.on(WS_EVENTS.CHAT_VIEWERS, (data: { count: number }) => {
        updateState({ viewers: Number(data.count || 0) });
      });

    } catch (error) {
      console.error("Failed to initialize WebSocket:", error);
      updateState({ connected: false, failed: true, loading: false });
      startPollingFallback();
    }
  }, [streamId, addMessage, updatePinnedMessage, updateState]);

  /**
   * Start HTTP polling fallback
   */
  const startPollingFallback = useCallback(() => {
    if (pollingIntervalRef.current) return; // Already polling

    console.log("🔄 Starting HTTP polling fallback");
    updateState({ failed: true });

    const poll = async () => {
      try {
        const response = await liveApi.getChat(streamId, since);
        if (response.ok && response.data) {
          const messages = response.data as Message[];
          messages.forEach(addMessage);
          updateState({ loading: false });
        }
      } catch (error) {
        console.warn("Polling failed:", error);
      }
    };

    // Initial poll
    poll();

    // Set up polling interval
    pollingIntervalRef.current = setInterval(poll, PERFORMANCE_TARGETS.CHAT_POLLING_INTERVAL_MS);
  }, [streamId, since, addMessage, updateState]);

  /**
   * Stop HTTP polling
   */
  const stopPollingFallback = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      console.log("⏹️ Stopped HTTP polling fallback");
    }
  }, []);

  /**
   * Send message
   */
  const send = useCallback(async (text: string): Promise<void> => {
    if (!text.trim()) return;

    // Validate message length
    if (text.length > CHAT_CONFIG.MAX_MESSAGE_LENGTH) {
      throw new Error(`Message too long. Maximum ${CHAT_CONFIG.MAX_MESSAGE_LENGTH} characters.`);
    }

    try {
      if (socketRef.current?.connected) {
        // Send via WebSocket
        socketRef.current.emit(WS_EVENTS.CHAT_MESSAGE, { 
          room: streamId, 
          text: text.trim() 
        });
        
        // Optimistically add message to UI
        const optimisticMessage: Message = {
          id: `temp-${Date.now()}`,
          user: { id: "you", handle: "you" },
          text: text.trim(),
          ts: Math.floor(Date.now() / 1000),
        };
        addMessage(optimisticMessage);
      } else {
        // Send via HTTP API
        const response = await liveApi.sendMessage(streamId, text.trim());
        if (!response.ok) {
          throw new Error(response.error || "Failed to send message");
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      throw error;
    }
  }, [streamId, addMessage]);

  /**
   * Clear messages
   */
  const clearMessages = useCallback(() => {
    setState(prev => ({ ...prev, messages: [] }));
  }, []);

  /**
   * Reconnect to WebSocket
   */
  const reconnect = useCallback(() => {
    if (reconnectAttempts >= CHAT_CONFIG.RECONNECT_ATTEMPTS) {
      console.log("Max reconnection attempts reached");
      return;
    }

    setReconnectAttempts(prev => prev + 1);
    
    // Disconnect existing socket
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Stop polling
    stopPollingFallback();

    // Retry connection with exponential backoff
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
    reconnectTimeoutRef.current = setTimeout(() => {
      initializeWebSocket();
    }, delay);
  }, [reconnectAttempts, initializeWebSocket, stopPollingFallback]);

  /**
   * Initialize connection on mount
   */
  useEffect(() => {
    if (!streamId) return;

    initializeWebSocket();

    return () => {
      // Cleanup on unmount
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      
      stopPollingFallback();
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [streamId, initializeWebSocket, stopPollingFallback]);

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

  return {
    ...state,
    send,
    clearMessages,
    reconnect,
  };
}