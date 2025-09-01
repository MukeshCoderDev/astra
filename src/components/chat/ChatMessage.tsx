import { useState } from 'react';
import { Pin, MoreVertical, Clock, Ban, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { liveApi } from '../../lib/api';
import { useSessionStore } from '../../store/sessionStore';
import type { Message, ModerationAction } from '../../types/live';
import { MODERATION_DURATIONS } from '../../constants/live';

interface ChatMessageProps {
  message: Message;
  streamId: string;
  isCreator?: boolean;
  isModerator?: boolean;
  formatTime: (timestamp: number) => string;
  onModerationAction?: (messageId: string, action: ModerationAction) => void;
}

export function ChatMessage({ 
  message, 
  streamId, 
  isCreator = false, 
  isModerator = false,
  formatTime,
  onModerationAction 
}: ChatMessageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useSessionStore();
  
  const isPinned = message.pinned;
  const isDeleted = message.deleted;
  const canModerate = isCreator || isModerator;
  const isOwnMessage = user?.id === message.user.id;

  // Don't show moderation actions on own messages (except pinning for creators)
  const showModerationActions = canModerate && (!isOwnMessage || isCreator);

  if (isDeleted) {
    return (
      <div className="text-xs text-gray-600 italic py-1 px-2">
        <span className="opacity-50">Message deleted</span>
      </div>
    );
  }

  const handleModerationAction = async (action: ModerationAction) => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      let response;
      
      switch (action) {
        case 'delete':
          response = await liveApi.moderate(streamId, {
            action: 'delete',
            targetUserId: message.user.id,
            messageId: message.id,
          });
          break;
          
        case 'timeout':
          response = await liveApi.moderate(streamId, {
            action: 'timeout',
            targetUserId: message.user.id,
            durationSec: MODERATION_DURATIONS.TIMEOUT_DEFAULT_SEC,
            reason: 'Timeout from chat message',
          });
          break;
          
        case 'ban':
          response = await liveApi.moderate(streamId, {
            action: 'ban',
            targetUserId: message.user.id,
            reason: 'Banned from chat message',
          });
          break;
      }
      
      if (response?.ok) {
        onModerationAction?.(message.id, action);
      } else {
        console.error('Moderation action failed:', response?.error);
        // TODO: Show error toast
      }
    } catch (error) {
      console.error('Failed to perform moderation action:', error);
      // TODO: Show error toast
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinToggle = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      const response = isPinned 
        ? await liveApi.unpinMessage(streamId, message.id)
        : await liveApi.pinMessage(streamId, message.id);
      
      if (response?.ok) {
        // The WebSocket will handle updating the message state
      } else {
        console.error('Pin/unpin failed:', response?.error);
        // TODO: Show error toast
      }
    } catch (error) {
      console.error('Failed to pin/unpin message:', error);
      // TODO: Show error toast
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex items-start space-x-2 group hover:bg-gray-800/50 rounded px-2 py-1 ${
      isPinned ? 'bg-blue-600/10 border-l-2 border-blue-500' : ''
    }`}>
      {isPinned && (
        <div className="flex items-center justify-center w-6 h-6 mt-0.5">
          <Pin className="h-3 w-3 text-blue-400" />
        </div>
      )}
      
      <Avatar className="h-6 w-6 mt-0.5">
        <AvatarImage src={message.user.avatar} />
        <AvatarFallback className="text-xs bg-gray-600">
          {message.user.handle.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline space-x-2">
          <span className={`font-semibold text-sm ${
            message.user.role === 'creator' ? 'text-purple-400' :
            message.user.role === 'moderator' ? 'text-green-400' :
            'text-blue-400'
          }`}>
            {message.user.handle}
          </span>
          
          {isPinned && (
            <span className="text-xs text-blue-400 bg-blue-600/20 px-1 rounded">
              PINNED
            </span>
          )}
          
          <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
            {formatTime(message.ts)}
          </span>
        </div>
        
        <p className="text-sm text-gray-300 break-words mt-0.5">
          {message.text}
        </p>
      </div>

      {/* Moderation Actions */}
      {showModerationActions && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
          {isCreator && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePinToggle}
              disabled={isLoading}
              className="h-6 w-6 p-0 text-gray-400 hover:text-blue-400"
              title={isPinned ? 'Unpin Message' : 'Pin Message'}
            >
              <Pin className="h-3 w-3" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleModerationAction('delete')}
            disabled={isLoading}
            className="h-6 w-6 p-0 text-gray-400 hover:text-yellow-400"
            title="Delete Message"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          
          {!isOwnMessage && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleModerationAction('timeout')}
                disabled={isLoading}
                className="h-6 w-6 p-0 text-gray-400 hover:text-orange-400"
                title="Timeout User (5m)"
              >
                <Clock className="h-3 w-3" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleModerationAction('ban')}
                disabled={isLoading}
                className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
                title="Ban User"
              >
                <Ban className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}