// WebSocket utilities for Live Streaming Platform
import { io, Socket } from 'socket.io-client';
import { ENV } from './env';
import type { WebSocketEvents } from '../types/live';

/**
 * WebSocket connection configuration
 */
const WS_CONFIG = {
  url: ENV.WS_URL,
  options: {
    transports: ['websocket'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000,
  },
};

/**
 * Create WebSocket connection for specific namespace
 */
export function createWebSocketConnection(
  namespace: string,
  options: Partial<typeof WS_CONFIG.options> = {}
): Socket {
  const config = {
    ...WS_CONFIG.options,
    ...options,
    path: namespace,
  };

  return io(WS_CONFIG.url, config);
}

/**
 * Chat WebSocket connection
 */
export function createChatConnection(): Socket {
  return createWebSocketConnection('/chat');
}

/**
 * Real-time events WebSocket connection
 */
export function createRealtimeConnection(): Socket {
  return createWebSocketConnection('/realtime');
}

/**
 * Control room WebSocket connection
 */
export function createControlConnection(): Socket {
  return createWebSocketConnection('/control');
}

/**
 * WebSocket connection manager
 * Handles connection lifecycle and provides typed event handling
 */
export class WebSocketManager<T extends Record<string, any> = WebSocketEvents> {
  private socket: Socket | null = null;
  private namespace: string;
  private listeners: Map<string, Function[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(namespace: string) {
    this.namespace = namespace;
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = createWebSocketConnection(this.namespace);

        this.socket.on('connect', () => {
          console.log(`WebSocket connected to ${this.namespace}`);
          this.reconnectAttempts = 0;
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          console.log(`WebSocket disconnected from ${this.namespace}:`, reason);
          this.handleDisconnect();
        });

        this.socket.on('connect_error', (error) => {
          console.error(`WebSocket connection error for ${this.namespace}:`, error);
          this.handleConnectionError();
          reject(error);
        });

        // Re-attach existing listeners
        this.listeners.forEach((callbacks, event) => {
          callbacks.forEach(callback => {
            this.socket?.on(event, callback);
          });
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Add event listener with type safety
   */
  on<K extends keyof T>(event: K, callback: (data: T[K]) => void): void {
    if (!this.listeners.has(event as string)) {
      this.listeners.set(event as string, []);
    }
    
    this.listeners.get(event as string)!.push(callback);
    
    if (this.socket) {
      this.socket.on(event as string, callback);
    }
  }

  /**
   * Remove event listener
   */
  off<K extends keyof T>(event: K, callback?: (data: T[K]) => void): void {
    if (callback) {
      const callbacks = this.listeners.get(event as string) || [];
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
      
      if (this.socket) {
        this.socket.off(event as string, callback);
      }
    } else {
      this.listeners.delete(event as string);
      
      if (this.socket) {
        this.socket.off(event as string);
      }
    }
  }

  /**
   * Emit event to server
   */
  emit<K extends keyof T>(event: K, data: T[K]): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event as string, data);
    } else {
      console.warn(`Cannot emit ${String(event)}: WebSocket not connected`);
    }
  }

  /**
   * Check if WebSocket is connected
   */
  get connected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Handle disconnection
   */
  private handleDisconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
      
      setTimeout(() => {
        console.log(`Attempting to reconnect to ${this.namespace} (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect().catch(() => {
          // Reconnection failed, will try again if attempts remain
        });
      }, delay);
    } else {
      console.error(`Max reconnection attempts reached for ${this.namespace}`);
    }
  }

  /**
   * Handle connection errors
   */
  private handleConnectionError(): void {
    // Connection error handling is done in the connect method
    // This method can be extended for additional error handling
  }
}

/**
 * Singleton WebSocket managers for different namespaces
 */
export const chatWebSocket = new WebSocketManager('/chat');
export const realtimeWebSocket = new WebSocketManager('/realtime');
export const controlWebSocket = new WebSocketManager('/control');