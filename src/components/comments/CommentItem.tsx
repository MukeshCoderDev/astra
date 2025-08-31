import { useState } from 'react';
import { Avatar } from '../ui/avatar';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Heart,
  MessageCircle,
  MoreHorizontal,
  Reply,
  Flag,
  Check
} from 'lucide-react';
import { Comment } from '../../types';
import { CommentComposer } from './CommentComposer';

interface CommentItemProps {
  comment: Comment;
  onLike: (commentId: string) => void;
  onReply: (parentId: string, content: string) => void;
  onReport: (commentId: string) => void;
  depth?: number;
  maxDepth?: number;
}

export function CommentItem({ 
  comment, 
  onLike, 
  onReply, 
  onReport,
  depth = 0,
  maxDepth = 3
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    setIsLiking(true);
    try {
      await onLike(comment.id);
    } finally {
      setIsLiking(false);
    }
  };

  const handleReply = async (content: string) => {
    await onReply(comment.id, content);
    setShowReplyForm(false);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const canShowReplies = depth < maxDepth && comment.replies.length > 0;
  const canReply = depth < maxDepth;

  return (
    <div className={`space-y-3 ${depth > 0 ? 'ml-8 border-l border-gray-200 dark:border-gray-700 pl-4' : ''}`}>
      <div className="flex gap-3">
        {/* Avatar */}
        <Avatar className="w-8 h-8 flex-shrink-0">
          <img 
            src={comment.author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author.handle}`}
            alt={comment.author.displayName}
            className="w-full h-full object-cover"
          />
        </Avatar>

        {/* Comment content */}
        <div className="flex-1 space-y-2">
          {/* Author info */}
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{comment.author.displayName}</span>
            {comment.author.verified && (
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs px-1 py-0">
                <Check className="w-2 h-2" />
              </Badge>
            )}
            <span className="text-xs text-gray-500">@{comment.author.handle}</span>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs text-gray-500">{formatTimeAgo(comment.createdAt)}</span>
          </div>

          {/* Comment text */}
          <div className="text-sm text-gray-900 dark:text-gray-100">
            {comment.content}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={isLiking}
              className={`h-6 px-2 text-xs ${
                comment.isLiked 
                  ? 'text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300' 
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <Heart className={`w-3 h-3 mr-1 ${comment.isLiked ? 'fill-current' : ''}`} />
              {comment.likes > 0 && comment.likes}
            </Button>

            {canReply && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <Reply className="w-3 h-3 mr-1" />
                Reply
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReport(comment.id)}
              className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <Flag className="w-3 h-3" />
            </Button>
          </div>

          {/* Reply form */}
          {showReplyForm && (
            <div className="mt-3">
              <CommentComposer
                onSubmit={handleReply}
                onCancel={() => setShowReplyForm(false)}
                placeholder={`Reply to @${comment.author.handle}...`}
                autoFocus
              />
            </div>
          )}

          {/* Show replies toggle */}
          {canShowReplies && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReplies(!showReplies)}
              className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <MessageCircle className="w-3 h-3 mr-1" />
              {showReplies ? 'Hide' : 'Show'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
            </Button>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {showReplies && canShowReplies && (
        <div className="space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onLike={onLike}
              onReply={onReply}
              onReport={onReport}
              depth={depth + 1}
              maxDepth={maxDepth}
            />
          ))}
        </div>
      )}
    </div>
  );
}