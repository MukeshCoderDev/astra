import { useState } from 'react';
import { Heart, Share2, DollarSign, MessageCircle, Bookmark } from 'lucide-react';
import { Button } from '../ui/button';
import { TipButton } from '../wallet/TipButton';
import { clsx } from 'clsx';
import { Video, Creator } from '../../types';

interface ReactionBarProps {
  video: Video;
  creator: Creator;
  isLiked?: boolean;
  isBookmarked?: boolean;
  canTip?: boolean;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  onLike?: (videoId: string, isLiked: boolean) => void;
  onShare?: (videoId: string) => void;
  onTipSent?: (amount: number) => void;
  onComment?: (videoId: string) => void;
  onBookmark?: (videoId: string, isBookmarked: boolean) => void;
}

export function ReactionBar({
  video,
  creator,
  isLiked = false,
  isBookmarked = false,
  canTip = true,
  orientation = 'horizontal',
  className,
  onLike,
  onShare,
  onTipSent,
  onComment,
  onBookmark,
}: ReactionBarProps) {
  const [liked, setLiked] = useState(isLiked);
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [currentLikeCount, setCurrentLikeCount] = useState(video.likes);

  const handleLike = () => {
    const newLikedState = !liked;
    setLiked(newLikedState);
    setCurrentLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
    onLike?.(video.id, newLikedState);
  };

  const handleBookmark = () => {
    const newBookmarkedState = !bookmarked;
    setBookmarked(newBookmarkedState);
    onBookmark?.(video.id, newBookmarkedState);
  };

  const handleShare = () => {
    onShare?.(video.id);
  };

  const handleComment = () => {
    onComment?.(video.id);
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const isVertical = orientation === 'vertical';

  return (
    <div
      className={clsx(
        'flex gap-2',
        isVertical ? 'flex-col items-center' : 'flex-row items-center',
        className
      )}
    >
      {/* Like Button */}
      <div className={clsx('flex', isVertical ? 'flex-col items-center' : 'flex-row items-center gap-1')}>
        <Button
          variant="ghost"
          size={isVertical ? 'icon' : 'sm'}
          onClick={handleLike}
          className={clsx(
            'transition-colors',
            liked 
              ? 'text-red-500 hover:text-red-600' 
              : 'text-muted-foreground hover:text-foreground',
            isVertical && 'rounded-full bg-black/20 hover:bg-black/30 text-white'
          )}
        >
          <Heart className={clsx('h-4 w-4', liked && 'fill-current')} />
          {!isVertical && <span className="ml-1">{formatCount(currentLikeCount)}</span>}
        </Button>
        {isVertical && (
          <span className="text-xs text-white font-medium">
            {formatCount(currentLikeCount)}
          </span>
        )}
      </div>

      {/* Comment Button */}
      <div className={clsx('flex', isVertical ? 'flex-col items-center' : 'flex-row items-center gap-1')}>
        <Button
          variant="ghost"
          size={isVertical ? 'icon' : 'sm'}
          onClick={handleComment}
          className={clsx(
            'text-muted-foreground hover:text-foreground transition-colors',
            isVertical && 'rounded-full bg-black/20 hover:bg-black/30 text-white'
          )}
        >
          <MessageCircle className="h-4 w-4" />
          {!isVertical && <span className="ml-1">{formatCount(video.views)}</span>}
        </Button>
        {isVertical && (
          <span className="text-xs text-white font-medium">
            {formatCount(video.views)}
          </span>
        )}
      </div>

      {/* Share Button */}
      <div className={clsx('flex', isVertical ? 'flex-col items-center' : 'flex-row items-center gap-1')}>
        <Button
          variant="ghost"
          size={isVertical ? 'icon' : 'sm'}
          onClick={handleShare}
          className={clsx(
            'text-muted-foreground hover:text-foreground transition-colors',
            isVertical && 'rounded-full bg-black/20 hover:bg-black/30 text-white'
          )}
        >
          <Share2 className="h-4 w-4" />
          {!isVertical && <span className="ml-1">Share</span>}
        </Button>
        {isVertical && (
          <span className="text-xs text-white font-medium">
            Share
          </span>
        )}
      </div>

      {/* Tip Button */}
      {canTip && (
        <div className={clsx('flex', isVertical ? 'flex-col items-center' : 'flex-row items-center')}>
          <TipButton
            video={video}
            creator={creator}
            variant="icon"
            onTipSent={onTipSent}
            className={clsx(
              isVertical && 'rounded-full bg-black/20 hover:bg-black/30 text-white'
            )}
          />
        </div>
      )}

      {/* Bookmark Button */}
      <div className={clsx('flex', isVertical ? 'flex-col items-center' : 'flex-row items-center gap-1')}>
        <Button
          variant="ghost"
          size={isVertical ? 'icon' : 'sm'}
          onClick={handleBookmark}
          className={clsx(
            'transition-colors',
            bookmarked 
              ? 'text-blue-500 hover:text-blue-600' 
              : 'text-muted-foreground hover:text-foreground',
            isVertical && 'rounded-full bg-black/20 hover:bg-black/30 text-white'
          )}
        >
          <Bookmark className={clsx('h-4 w-4', bookmarked && 'fill-current')} />
          {!isVertical && <span className="ml-1">Save</span>}
        </Button>
        {isVertical && (
          <span className="text-xs text-white font-medium">
            Save
          </span>
        )}
      </div>
    </div>
  );
}