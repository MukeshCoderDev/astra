"use client";
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign } from 'lucide-react';
import { clsx } from 'clsx';
import { PERFORMANCE_TARGETS } from '../../constants/live';
import { useLiveTipEvents } from '../../hooks/useLiveTipEvents';
import type { TipEvent } from '../../types/live';

/**
 * Props for LiveTipTicker component
 */
interface LiveTipTickerProps {
  /** Stream ID to listen for tip events */
  streamId: string;
  /** Additional CSS classes */
  className?: string;
  /** Position of the ticker */
  position?: 'top' | 'bottom';
  /** Maximum number of tips to show simultaneously */
  maxVisible?: number;
}

/**
 * Animated tip ticker for live streams
 * Features slide-left animation with 8-second duration and queue-based system
 */
export default function LiveTipTicker({
  streamId,
  className,
  position = 'top',
  maxVisible = 3
}: LiveTipTickerProps) {
  const [tipQueue, setTipQueue] = useState<TipEvent[]>([]);
  const [activeTips, setActiveTips] = useState<TipEvent[]>([]);

  /**
   * Add a new tip to the queue
   */
  const addTip = useCallback((tip: TipEvent) => {
    setTipQueue(prev => [...prev, tip]);
  }, []);

  /**
   * Process the tip queue and show next tip
   */
  useEffect(() => {
    if (tipQueue.length === 0 || activeTips.length >= maxVisible) {
      return;
    }

    const nextTip = tipQueue[0];
    setTipQueue(prev => prev.slice(1));
    setActiveTips(prev => [...prev, nextTip]);

    // Remove tip after animation duration
    const timer = setTimeout(() => {
      setActiveTips(prev => prev.filter(tip => tip.id !== nextTip.id));
    }, PERFORMANCE_TARGETS.TIP_ANIMATION_DURATION_MS);

    return () => clearTimeout(timer);
  }, [tipQueue, activeTips.length, maxVisible]);

  /**
   * Format currency amount
   */
  const formatAmount = (amount: number, currency: string) => {
    if (currency === 'USDC' || currency === 'USD') {
      return `$${amount.toFixed(2)}`;
    }
    return `${amount} ${currency}`;
  };

  /**
   * Get user display name
   */
  const getUserDisplayName = (user: TipEvent['user']) => {
    return user.handle || `User ${user.id.slice(-4)}`;
  };

  // Connect to WebSocket for real-time tip events
  useLiveTipEvents(streamId, addTip);

  return (
    <div 
      className={clsx(
        'fixed left-0 right-0 z-40 pointer-events-none',
        position === 'top' ? 'top-20' : 'bottom-20',
        className
      )}
    >
      <div className="relative h-16 overflow-hidden">
        <AnimatePresence>
          {activeTips.map((tip, index) => (
            <motion.div
              key={tip.id}
              initial={{ x: '100vw', opacity: 0 }}
              animate={{ 
                x: '-100vw', 
                opacity: 1,
                y: index * 60 // Stack multiple tips vertically
              }}
              exit={{ opacity: 0 }}
              transition={{
                x: {
                  duration: PERFORMANCE_TARGETS.TIP_ANIMATION_DURATION_MS / 1000,
                  ease: 'linear'
                },
                opacity: {
                  duration: 0.5
                },
                y: {
                  duration: 0.3
                }
              }}
              className="absolute top-0 left-0 w-full"
            >
              <div className="flex justify-center">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full px-6 py-2 shadow-lg flex items-center gap-3 max-w-md">
                  {/* Tip Icon */}
                  <div className="bg-yellow-400 rounded-full p-1.5 flex-shrink-0">
                    <DollarSign className="h-4 w-4 text-yellow-900" />
                  </div>
                  
                  {/* Tip Content */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold text-sm truncate">
                      {getUserDisplayName(tip.user)}
                    </span>
                    <span className="text-yellow-200 text-xs">tipped</span>
                    <span className="font-bold text-lg">
                      {formatAmount(tip.amount, tip.currency)}
                    </span>
                  </div>
                  
                  {/* Optional Message */}
                  {tip.message && (
                    <div className="text-xs text-green-100 truncate max-w-[120px]">
                      "{tip.message}"
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}