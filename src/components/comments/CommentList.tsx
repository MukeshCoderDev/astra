import { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { CommentItem } from './CommentItem';
import { CommentComposer } from './CommentComposer';
import { 
  MessageCircle,
  TrendingUp,
  Clock,
  Filter
} from 'lucide-react';
import { Comment } from '../../types';

interface CommentListProps {
  videoId: string;
  comments: Comment[];
  onAddComment: (content: string) => Promise<void>;
  onLikeComment: (commentId: string) => void;
  onReplyToComment: (parentId: string, content: string) => Promise<void>;
  onReportComment: (commentId: string) => void;
  isLoading?: boolean;
}

type SortOption = 'newest' | 'oldest' | 'popular';

export function CommentList({
  videoId,
  comments,
  onAddComment,
  onLikeComment,
  onReplyToComment,
  onReportComment,
  isLoading = false
}: CommentListProps) {
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const sortedComments = [...comments].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'popular':
        return b.likes - a.likes;
      default:
        return 0;
    }
  });

  const getSortIcon = (option: SortOption) => {
    switch (option) {
      case 'newest':
      case 'oldest':
        return <Clock className="w-4 h-4" />;
      case 'popular':
        return <TrendingUp className="w-4 h-4" />;
    }
  };

  const getSortLabel = (option: SortOption) => {
    switch (option) {
      case 'newest':
        return 'Newest first';
      case 'oldest':
        return 'Oldest first';
      case 'popular':
        return 'Most liked';
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold">
              {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
            </h3>
          </div>

          {/* Sort options */}
          {comments.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="popular">Most liked</option>
              </select>
            </div>
          )}
        </div>

        {/* Comment composer */}
        <CommentComposer
          onSubmit={onAddComment}
          placeholder="Share your thoughts..."
        />

        {/* Comments list */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : sortedComments.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No comments yet
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Be the first to share your thoughts about this video.
              </p>
            </div>
          ) : (
            sortedComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onLike={onLikeComment}
                onReply={onReplyToComment}
                onReport={onReportComment}
              />
            ))
          )}
        </div>
      </div>
    </Card>
  );
}