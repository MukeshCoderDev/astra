import { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { LiveBadge } from './';
import { 
  Play, 
  Square, 
  Loader2,
  AlertCircle,
  Users,
  Eye
} from 'lucide-react';
import { clsx } from 'clsx';
import { liveApi } from '../../lib/api';
import type { StreamStatus } from '../../types/live';

/**
 * Props for ControlRoomHeader component
 */
interface ControlRoomHeaderProps {
  /** Stream ID */
  streamId: string;
  /** Stream title */
  title: string;
  /** Current stream status */
  status: StreamStatus;
  /** Current viewer count */
  viewerCount?: number;
  /** Loading state */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Callback when status changes */
  onStatusChange?: (status: StreamStatus) => void;
  /** Callback for errors */
  onError?: (error: string) => void;
}

/**
 * Control room header component
 * Displays stream title, status, and provides Go Live/End Stream controls
 */
export default function ControlRoomHeader({
  streamId,
  title,
  status,
  viewerCount = 0,
  isLoading = false,
  className,
  onStatusChange,
  onError
}: ControlRoomHeaderProps) {
  const [actionLoading, setActionLoading] = useState(false);

  /**
   * Handle Go Live action
   */
  const handleGoLive = async () => {
    if (actionLoading || status !== 'preview') return;

    setActionLoading(true);
    try {
      const response = await liveApi.startStream(streamId);
      
      if (response.ok) {
        onStatusChange?.('live');
      } else {
        onError?.(response.error || 'Failed to start stream');
      }
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Failed to start stream');
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Handle End Stream action
   */
  const handleEndStream = async () => {
    if (actionLoading || status !== 'live') return;

    setActionLoading(true);
    try {
      const response = await liveApi.endStream(streamId);
      
      if (response.ok) {
        onStatusChange?.('ended');
      } else {
        onError?.(response.error || 'Failed to end stream');
      }
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Failed to end stream');
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Get status-specific configuration
   */
  const getStatusConfig = () => {
    switch (status) {
      case 'preview':
        return {
          badge: <LiveBadge variant="upcoming" text="PREVIEW" />,
          description: 'Stream is ready to go live',
          actionButton: (
            <Button 
              onClick={handleGoLive}
              disabled={actionLoading || isLoading}
              className="gap-2 bg-red-600 hover:bg-red-700 text-white"
              size="lg"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Go Live
            </Button>
          )
        };
      case 'live':
        return {
          badge: <LiveBadge variant="live" />,
          description: 'Stream is currently live',
          actionButton: (
            <Button 
              onClick={handleEndStream}
              disabled={actionLoading || isLoading}
              variant="destructive"
              className="gap-2"
              size="lg"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              End Stream
            </Button>
          )
        };
      case 'ended':
        return {
          badge: <LiveBadge variant="ended" />,
          description: 'Stream has ended',
          actionButton: null
        };
      default:
        return {
          badge: <LiveBadge variant="upcoming" text="UNKNOWN" />,
          description: 'Stream status unknown',
          actionButton: null
        };
    }
  };

  const statusConfig = getStatusConfig();

  /**
   * Format viewer count for display
   */
  const formatViewerCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toLocaleString();
  };

  return (
    <Card className={clsx('p-6', className)}>
      <div className="space-y-4">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              {statusConfig.badge}
              {status === 'live' && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{formatViewerCount(viewerCount)} viewers</span>
                </div>
              )}
            </div>
            
            <h1 className="text-2xl font-bold truncate mb-1">
              {title}
            </h1>
            
            <p className="text-sm text-muted-foreground">
              {statusConfig.description}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Viewer Count Badge for Live Streams */}
            {status === 'live' && (
              <Badge variant="secondary" className="gap-1">
                <Eye className="h-3 w-3" />
                {formatViewerCount(viewerCount)}
              </Badge>
            )}

            {/* Action Button */}
            {statusConfig.actionButton}
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-4 pt-2 border-t">
          <div className="flex items-center gap-2">
            <div className={clsx(
              'w-2 h-2 rounded-full',
              status === 'live' ? 'bg-red-500 animate-pulse' : 
              status === 'preview' ? 'bg-amber-500' : 'bg-gray-500'
            )} />
            <span className="text-sm font-medium capitalize">
              {status === 'preview' ? 'Ready to Go Live' : 
               status === 'live' ? 'Broadcasting Live' : 
               'Stream Ended'}
            </span>
          </div>

          {/* Stream ID for debugging */}
          <div className="text-xs text-muted-foreground">
            ID: {streamId}
          </div>

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Loading...</span>
            </div>
          )}

          {/* Error state indicator */}
          {status === 'ended' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-3 w-3" />
              <span>Stream offline</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}