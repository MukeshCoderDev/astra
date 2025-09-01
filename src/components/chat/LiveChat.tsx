import { useState, useEffect, useRef } from 'react';
import { Send, Users, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { ChatMessage } from './ChatMessage';
import { useLiveChat } from '../../hooks/useLiveChat';
import { useSessionStore } from '../../store/sessionStore';
import type { Message, ModerationAction } from '../../types/live';
import { CHAT_CONFIG } from '../../constants/live';

interface LiveChatProps {
  streamId: string;
  className?: string;
  isCreator?: boolean;
  isModerator?: boolean;
}

export function LiveChat({ 
  streamId, 
  className = '', 
  isCreator = false, 
  isModerator = false 
}: LiveChatProps) {
  const [newMessage, setNewMessage] = useState('');
  const [slowModeCooldown, setSlowModeCooldown] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const cooldownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { user } = useSessionStore();
  const { 
    messages, 
    viewers, 
    slowModeSec, 
    connected, 
    loading, 
    failed, 
    send 
  } = useLiveChat(streamId);

  const scrollToBottom = () => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle slow mode cooldown
  useEffect(() => {
    if (slowModeCooldown > 0) {
      cooldownIntervalRef.current = setInterval(() => {
        setSlowModeCooldown(prev => {
          if (prev <= 1) {
            if (cooldownIntervalRef.current) {
              clearInterval(cooldownIntervalRef.current);
              cooldownIntervalRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
        cooldownIntervalRef.current = null;
      }
    };
  }, [slowModeCooldown]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !connected || slowModeCooldown > 0) return;

    try {
      await send(newMessage.trim());
      setNewMessage('');
      
      // Start slow mode cooldown if enabled
      if (slowModeSec > 0) {
        setSlowModeCooldown(slowModeSec);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // TODO: Show error toast
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getConnectionStatus = () => {
    if (loading) return 'Connecting...';
    if (failed && !connected) return 'Connection failed - using fallback';
    if (!connected) return 'Disconnected';
    return 'Connected';
  };

  const canSendMessage = user && connected && !loading && slowModeCooldown === 0;

  const handleModerationAction = (messageId: string, action: ModerationAction) => {
    // The WebSocket will handle updating the message state
    // This callback can be used for UI feedback if needed
    console.log(`Moderation action ${action} performed on message ${messageId}`);
  };

  return (
    <div className={`flex flex-col h-full bg-gray-900 text-white ${className}`}>
      {/* Chat header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <h3 className="font-semibold">Live Chat</h3>
        <div className="flex items-center space-x-3 text-sm text-gray-400">
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span>{viewers}</span>
          </div>
          <div className={`text-xs px-2 py-1 rounded ${
            connected ? 'bg-green-600/20 text-green-400' : 
            failed ? 'bg-red-600/20 text-red-400' : 
            'bg-yellow-600/20 text-yellow-400'
          }`}>
            {getConnectionStatus()}
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-2">
          {messages.map((message) => (
            <ChatMessage 
              key={message.id} 
              message={message} 
              streamId={streamId}
              isCreator={isCreator}
              isModerator={isModerator}
              formatTime={formatTime}
              onModerationAction={handleModerationAction}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message input */}
      {user ? (
        <div className="p-3 border-t border-gray-700">
          {/* Slow mode indicator */}
          {slowModeSec > 0 && (
            <div className="mb-2 text-xs text-gray-400 flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>
                Slow mode: {slowModeSec}s between messages
                {slowModeCooldown > 0 && ` (${slowModeCooldown}s remaining)`}
              </span>
            </div>
          )}
          
          <div className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                slowModeCooldown > 0 
                  ? `Wait ${slowModeCooldown}s...` 
                  : canSendMessage 
                    ? "Type a message..." 
                    : getConnectionStatus()
              }
              disabled={!canSendMessage}
              className="flex-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              maxLength={CHAT_CONFIG.MAX_MESSAGE_LENGTH}
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || !canSendMessage}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Character count */}
          <div className="mt-1 text-xs text-gray-500 text-right">
            {newMessage.length}/{CHAT_CONFIG.MAX_MESSAGE_LENGTH}
          </div>
        </div>
      ) : (
        <div className="p-3 border-t border-gray-700 text-center text-gray-400 text-sm">
          Sign in to join the chat
        </div>
      )}
    </div>
  );
}

