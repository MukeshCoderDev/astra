import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useRealTimeNotifications } from '../hooks/useRealTimeNotifications';
import { useSessionStore } from '../store/sessionStore';

interface SocketContextValue {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  emit: (event: string, data?: any) => boolean;
  on: (event: string, handler: (...args: any[]) => void) => () => void;
  off: (event: string, handler?: (...args: any[]) => void) => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const { user } = useSessionStore();
  const socket = useSocket({
    autoConnect: !!user,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  // Initialize real-time notifications
  useRealTimeNotifications();

  // Join user room when connected
  useEffect(() => {
    if (socket.connected && user) {
      socket.emit('join_user_room', { userId: user.id });
    }
  }, [socket.connected, socket.emit, user]);

  const contextValue: SocketContextValue = {
    connected: socket.connected,
    connecting: socket.connecting,
    error: socket.error,
    emit: socket.emit,
    on: socket.on,
    off: socket.off,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
}