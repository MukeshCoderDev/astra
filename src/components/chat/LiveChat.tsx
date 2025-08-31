import { useState, useEffect, useRef } from 'react';
import { Send, Users } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useSocketContext } from '../../providers/SocketProvider';
import { useSessionStore } from '../../store/sessionStore';
import { ScrollArea } from '../ui/scroll-area';

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatar?: string;
  message: string;
  timestamp: string;
  type: 'message' | 'tip' | 'system';
  tipAmount?: number;
}

interface LiveChatProps {
  videoId: string;
  className?: string;
}

export function LiveChat({ videoId, className = '' }: LiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [viewerCount, setViewerCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { emit, on, off, connected } = useSocketContext();
  const { user } = useSessionStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Join chat room when component mounts
  useEffect(() => {
    if (connected && videoId) {
      emit('join_chat', { videoId });
      setIsConnected(true);

      // Set up event listeners
      const unsubscribeMessage = on('chat_message', (message: ChatMessage) => {
        setMessages(prev => [...prev, message]);
      });

      const unsubscribeTip = on('chat_tip', (tipData: ChatMessage) => {
        setMessages(prev => [...prev, tipData]);
      });

      const unsubscribeViewerCount = on('viewer_count_update', (data: { count: number }) => {
        setViewerCount(data.count);
      });

      const unsubscribeUserJoined = on('user_joined_chat', (data: { username: string }) => {
        setMessages(prev => [...prev, {
          id: `system-${Date.now()}`,
          userId: 'system',
          username: 'System',
          displayName: 'System',
          message: `${data.username} joined the chat`,
          timestamp: new Date().toISOString(),
          type: 'system',
        }]);
      });

      const unsubscribeUserLeft = on('user_left_chat', (data: { username: string }) => {
        setMessages(prev => [...prev, {
          id: `system-${Date.now()}`,
          userId: 'system',
          username: 'System',
          displayName: 'System',
          message: `${data.username} left the chat`,
          timestamp: new Date().toISOString(),
          type: 'system',
        }]);
      });

      return () => {
        emit('leave_chat', { videoId });
        unsubscribeMessage();
        unsubscribeTip();
        unsubscribeViewerCount();
        unsubscribeUserJoined();
        unsubscribeUserLeft();
        setIsConnected(false);
      };
    }
  }, [connected, videoId, emit, on]);

  const sendMessage = () => {
    if (!newMessage.trim() || !user || !isConnected) return;

    const message = {
      videoId,
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    emit('send_chat_message', message);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={`flex flex-col h-full bg-gray-900 text-white ${className}`}>
      {/* Chat header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <h3 className="font-semibold">Live Chat</h3>
        <div className="flex items-center space-x-1 text-sm text-gray-400">
          <Users className="h-4 w-4" />
          <span>{viewerCount}</span>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-2">
          {messages.map((message) => (
            <ChatMessageItem key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message input */}
      {user ? (
        <div className="p-3 border-t border-gray-700">
          <div className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isConnected ? "Type a message..." : "Connecting..."}
              disabled={!isConnected}
              className="flex-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              maxLength={200}
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || !isConnected}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="h-4 w-4" />
            </Button>
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

interface ChatMessageItemProps {
  message: ChatMessage;
}

function ChatMessageItem({ message }: ChatMessageItemProps) {
  if (message.type === 'system') {
    return (
      <div className="text-xs text-gray-500 italic text-center py-1">
        {message.message}
      </div>
    );
  }

  if (message.type === 'tip') {
    return (
      <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 rounded-lg p-2 border border-yellow-600/30">
        <div className="flex items-center space-x-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={message.avatar} />
            <AvatarFallback className="text-xs bg-yellow-600">
              {message.displayName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-yellow-400 text-sm">
                {message.displayName}
              </span>
              <span className="text-xs text-gray-400">
                tipped ${message.tipAmount}
              </span>
            </div>
            {message.message && (
              <p className="text-sm text-gray-300 mt-1">{message.message}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start space-x-2 group hover:bg-gray-800/50 rounded px-2 py-1">
      <Avatar className="h-6 w-6 mt-0.5">
        <AvatarImage src={message.avatar} />
        <AvatarFallback className="text-xs bg-gray-600">
          {message.displayName.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline space-x-2">
          <span className="font-semibold text-sm text-blue-400">
            {message.displayName}
          </span>
          <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
            {formatTime(message.timestamp)}
          </span>
        </div>
        <p className="text-sm text-gray-300 break-words">{message.message}</p>
      </div>
    </div>
  );
}