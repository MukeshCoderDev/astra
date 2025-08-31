import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Heart } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

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

interface TipNotificationOverlayProps {
  notifications: TipNotification[];
  onDismiss: (id: string) => void;
}

export function TipNotificationOverlay({ notifications, onDismiss }: TipNotificationOverlayProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      <AnimatePresence>
        {notifications.map((notification) => (
          <TipNotificationItem
            key={notification.id}
            notification={notification}
            onDismiss={onDismiss}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface TipNotificationItemProps {
  notification: TipNotification;
  onDismiss: (id: string) => void;
}

function TipNotificationItem({ notification, onDismiss }: TipNotificationItemProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(notification.id);
    }, 5000);

    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="pointer-events-auto"
    >
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg shadow-lg p-4 min-w-[300px] max-w-[400px]">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Avatar className="h-10 w-10 border-2 border-white/20">
              <AvatarImage src={notification.fromUser.avatar} />
              <AvatarFallback className="bg-white/20 text-white">
                {notification.fromUser.displayName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full p-1">
              <DollarSign className="h-3 w-3 text-yellow-900" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <p className="font-semibold text-sm truncate">
                {notification.fromUser.displayName}
              </p>
              <div className="flex items-center space-x-1 text-yellow-200">
                <Heart className="h-3 w-3 fill-current" />
                <span className="text-xs">tipped</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-2xl font-bold">
                ${notification.amount}
              </span>
              <span className="text-xs text-green-100 uppercase tracking-wide">
                {notification.currency}
              </span>
            </div>
            
            {notification.message && (
              <p className="text-xs text-green-100 mt-1 line-clamp-2">
                "{notification.message}"
              </p>
            )}
          </div>
        </div>
        
        {/* Animated progress bar */}
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-white/30 rounded-b-lg"
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: 5, ease: 'linear' }}
        />
      </div>
    </motion.div>
  );
}