import { useState, useCallback } from 'react';

interface TipNotification {
  id: string;
  amount: number;
  currency: 'USDC';
  fromUser: {
    id: string;
    handle: string;
    displayName: string;
    avatar?: string;
  };
  message?: string;
}

export function useTipNotifications() {
  const [notifications, setNotifications] = useState<TipNotification[]>([]);

  const addNotification = useCallback((notification: Omit<TipNotification, 'id'>) => {
    const id = `tip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification = { ...notification, id };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
    
    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
  };
}