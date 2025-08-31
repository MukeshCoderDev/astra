import { useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import { toast } from 'sonner';
import { useSessionStore } from '../store/sessionStore';
import { useQueryClient } from '@tanstack/react-query';
import { useTipNotifications } from './useTipNotifications';

interface TipNotification {
  id: string;
  amount: number;
  currency: 'USDC';
  videoId: string;
  videoTitle: string;
  fromUser: {
    id: string;
    handle: string;
    displayName: string;
    avatar?: string;
  };
  timestamp: string;
}

interface FollowNotification {
  id: string;
  fromUser: {
    id: string;
    handle: string;
    displayName: string;
    avatar?: string;
  };
  timestamp: string;
}

interface CommentNotification {
  id: string;
  videoId: string;
  videoTitle: string;
  comment: string;
  fromUser: {
    id: string;
    handle: string;
    displayName: string;
    avatar?: string;
  };
  timestamp: string;
}

export function useRealTimeNotifications() {
  const { on, off, connected } = useSocket();
  const { user } = useSessionStore();
  const queryClient = useQueryClient();
  const { addNotification } = useTipNotifications();

  const handleTipReceived = useCallback((notification: TipNotification) => {
    // Show animated tip overlay
    addNotification({
      amount: notification.amount,
      currency: notification.currency,
      fromUser: notification.fromUser,
    });

    // Also show toast notification
    toast.success(
      `💰 ${notification.fromUser.displayName} tipped you $${notification.amount}!`,
      {
        description: `On "${notification.videoTitle}"`,
        duration: 5000,
        action: {
          label: 'View',
          onClick: () => {
            window.location.href = `/watch/${notification.videoId}`;
          },
        },
      }
    );

    // Invalidate wallet balance to refresh
    queryClient.invalidateQueries({ queryKey: ['wallet', 'balance'] });
    
    // Invalidate earnings data
    queryClient.invalidateQueries({ queryKey: ['studio', 'earnings'] });
    
    // Update video stats if currently viewing
    queryClient.invalidateQueries({ queryKey: ['video', notification.videoId] });
  }, [queryClient, addNotification]);

  const handleFollowReceived = useCallback((notification: FollowNotification) => {
    toast.success(
      `👤 ${notification.fromUser.displayName} started following you!`,
      {
        duration: 4000,
        action: {
          label: 'View Profile',
          onClick: () => {
            window.location.href = `/@${notification.fromUser.handle}`;
          },
        },
      }
    );

    // Invalidate profile data to refresh follower count
    queryClient.invalidateQueries({ queryKey: ['profile', user?.handle] });
  }, [queryClient, user?.handle]);

  const handleCommentReceived = useCallback((notification: CommentNotification) => {
    toast.info(
      `💬 ${notification.fromUser.displayName} commented on your video`,
      {
        description: notification.comment.length > 50 
          ? `${notification.comment.substring(0, 50)}...` 
          : notification.comment,
        duration: 4000,
        action: {
          label: 'View',
          onClick: () => {
            window.location.href = `/watch/${notification.videoId}`;
          },
        },
      }
    );

    // Invalidate comments for the video
    queryClient.invalidateQueries({ queryKey: ['comments', notification.videoId] });
  }, [queryClient]);

  const handleLiveViewerJoined = useCallback((data: { viewerCount: number; videoId: string }) => {
    // Update live viewer count without showing toast (too noisy)
    queryClient.setQueryData(['video', data.videoId], (old: any) => {
      if (old) {
        return { ...old, liveViewers: data.viewerCount };
      }
      return old;
    });
  }, [queryClient]);

  const handleContentModerated = useCallback((data: { videoId: string; status: string; reason?: string }) => {
    if (data.status === 'under_review') {
      toast.warning(
        'Content Under Review',
        {
          description: `Your video has been flagged for review. ${data.reason || ''}`,
          duration: 8000,
        }
      );
    } else if (data.status === 'dmca_hidden') {
      toast.error(
        'Content Removed',
        {
          description: 'Your video has been removed due to a DMCA claim.',
          duration: 10000,
          action: {
            label: 'Learn More',
            onClick: () => {
              window.location.href = '/legal/dmca';
            },
          },
        }
      );
    }

    // Invalidate studio content list
    queryClient.invalidateQueries({ queryKey: ['studio', 'content'] });
    queryClient.invalidateQueries({ queryKey: ['video', data.videoId] });
  }, [queryClient]);

  // Set up event listeners
  useEffect(() => {
    if (!connected || !user) return;

    const unsubscribeTip = on('tip_received', handleTipReceived);
    const unsubscribeFollow = on('follow_received', handleFollowReceived);
    const unsubscribeComment = on('comment_received', handleCommentReceived);
    const unsubscribeLiveViewer = on('live_viewer_joined', handleLiveViewerJoined);
    const unsubscribeModeration = on('content_moderated', handleContentModerated);

    return () => {
      unsubscribeTip();
      unsubscribeFollow();
      unsubscribeComment();
      unsubscribeLiveViewer();
      unsubscribeModeration();
    };
  }, [
    connected,
    user,
    on,
    handleTipReceived,
    handleFollowReceived,
    handleCommentReceived,
    handleLiveViewerJoined,
    handleContentModerated,
  ]);

  return {
    connected,
  };
}