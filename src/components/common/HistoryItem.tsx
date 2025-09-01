import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { X, Play } from 'lucide-react';
// Simple time formatting utility
const formatTimeAgo = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  return `${Math.floor(diffInSeconds / 31536000)}y ago`;
};
import { clsx } from 'clsx';
import { useToast } from '../../providers/ToastProvider';
import { ENV } from '../../lib/env';
import type { HistoryItem as HistoryItemType } from '../../types';

interface HistoryItemProps {
  item: HistoryItemType;
  onRemove?: (itemId: string) => void;
  className?: string;
}

export function HistoryItem({ item, onRemove, className }: HistoryItemProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const { error: showError, success: showSuccess } = useToast();

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isRemoving) return;
    
    setIsRemoving(true);
    
    try {
      const response = await fetch(`${ENV.API_BASE}/history/${item.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Idempotency-Key': `remove-history-${item.id}-${Date.now()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to remove from history');
      }

      // Call the onRemove callback for optimistic updates
      onRemove?.(item.id);
      showSuccess('Removed from history');
    } catch (error) {
      console.error('Failed to remove from history:', error);
      showError('Failed to remove from history', 'Please try again later.');
    } finally {
      setIsRemoving(false);
    }
  };

  const progressWidth = Math.max(2, item.progressPct); // Minimum 2% for visibility
  const watchedTime = formatTimeAgo(item.watchedAt);

  return (
    <div className={clsx(
      "group relative bg-card rounded-lg overflow-hidden hover:bg-accent/50 transition-colors",
      className
    )}>
      <Link 
        to={`/watch/${item.video.id}`}
        className="flex gap-4 p-4"
      >
        {/* Video Thumbnail */}
        <div className="relative flex-shrink-0 w-40 aspect-video rounded-md overflow-hidden bg-muted">
          <img
            src={item.video.poster}
            alt={item.video.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          
          {/* Duration overlay */}
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
            {item.video.durationLabel}
          </div>
          
          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
            <div className="bg-white/90 rounded-full p-2">
              <Play className="h-4 w-4 text-black fill-black" />
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
            <div 
              className="h-full bg-red-500 transition-all duration-300"
              style={{ width: `${progressWidth}%` }}
            />
          </div>
        </div>

        {/* Video Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">
            {item.video.title}
          </h3>
          
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-2">
              <span>{item.video.creator.handle}</span>
              {item.video.creator.verified && (
                <span className="text-blue-500">✓</span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <span>{item.video.views.toLocaleString()} views</span>
              <span>•</span>
              <span>{item.video.age}</span>
            </div>
            
            <div className="flex items-center gap-2 text-xs">
              <span>Watched {watchedTime}</span>
              {item.progressPct > 0 && (
                <>
                  <span>•</span>
                  <span>{Math.round(item.progressPct)}% complete</span>
                </>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* Remove Button */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
        onClick={handleRemove}
        disabled={isRemoving}
        title="Remove from history"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}