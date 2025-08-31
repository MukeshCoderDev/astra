import { useState } from 'react';
import { Button } from '../ui/button';
import { Avatar } from '../ui/avatar';
import { 
  Send,
  Smile
} from 'lucide-react';

interface CommentComposerProps {
  onSubmit: (content: string) => Promise<void> | void;
  onCancel?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  currentUserAvatar?: string;
  currentUserHandle?: string;
}

export function CommentComposer({
  onSubmit,
  onCancel,
  placeholder = "Add a comment...",
  autoFocus = false,
  currentUserAvatar,
  currentUserHandle = "user"
}: CommentComposerProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(autoFocus);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content.trim());
      setContent('');
      setIsFocused(false);
    } catch (error) {
      console.error('Failed to submit comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setContent('');
    setIsFocused(false);
    onCancel?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e);
    }
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-3">
        {/* Current user avatar */}
        <Avatar className="w-8 h-8 flex-shrink-0">
          <img 
            src={currentUserAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUserHandle}`}
            alt="Your avatar"
            className="w-full h-full object-cover"
          />
        </Avatar>

        {/* Comment input */}
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoFocus={autoFocus}
            rows={isFocused ? 3 : 1}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     placeholder-gray-500 dark:placeholder-gray-400
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     resize-none transition-all duration-200"
            disabled={isSubmitting}
          />
          
          {isFocused && (
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <Smile className="w-3 h-3" />
                </Button>
                <span className="text-xs text-gray-500">
                  Cmd+Enter to post
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {onCancel && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="h-6 px-3 text-xs"
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  size="sm"
                  disabled={!content.trim() || isSubmitting}
                  className="h-6 px-3 text-xs"
                >
                  {isSubmitting ? (
                    <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3 h-3 mr-1" />
                      Post
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}