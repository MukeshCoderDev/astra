import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { VideoPlayer } from './VideoPlayer';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Heart, 
  Share2, 
  DollarSign, 
  MessageCircle, 
  MoreVertical,
  ArrowLeft,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { clsx } from 'clsx';
import { Video } from '../../types';

interface ShortsPlayerProps {
  videos: Video[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  className?: string;
}

export function ShortsPlayer({ 
  videos, 
  currentIndex, 
  onIndexChange,
  className 
}: ShortsPlayerProps) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const currentVideo = videos[currentIndex];

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' && currentIndex > 0) {
        onIndexChange(currentIndex - 1);
      } else if (e.key === 'ArrowDown' && currentIndex < videos.length - 1) {
        onIndexChange(currentIndex + 1);
      } else if (e.key === 'Escape') {
        navigate('/shorts');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, videos.length, onIndexChange, navigate]);

  // Handle touch gestures
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isUpSwipe = distance > minSwipeDistance;
    const isDownSwipe = distance < -minSwipeDistance;

    if (isUpSwipe && currentIndex < videos.length - 1) {
      onIndexChange(currentIndex + 1);
    } else if (isDownSwipe && currentIndex > 0) {
      onIndexChange(currentIndex - 1);
    }
  };

  const handleCreatorClick = () => {
    navigate(`/@${currentVideo.creator.handle}`);
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    }
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  if (!currentVideo) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-muted-foreground">No video found</div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={clsx(
        'relative h-screen w-full bg-black overflow-hidden',
        className
      )}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Video Player */}
      <div className="absolute inset-0">
        <VideoPlayer
          src={currentVideo.hlsUrl}
          poster={currentVideo.poster}
          autoPlay
          muted
          loop
          controls={false}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Top Navigation */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/shorts')}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="text-white text-sm font-medium">
            Shorts
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
          >
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Navigation Arrows */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => currentIndex > 0 && onIndexChange(currentIndex - 1)}
          disabled={currentIndex === 0}
          className="text-white hover:bg-white/20 disabled:opacity-30"
        >
          <ChevronUp className="h-6 w-6" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => currentIndex < videos.length - 1 && onIndexChange(currentIndex + 1)}
          disabled={currentIndex === videos.length - 1}
          className="text-white hover:bg-white/20 disabled:opacity-30"
        >
          <ChevronDown className="h-6 w-6" />
        </Button>
      </div>

      {/* Content Overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/70 to-transparent">
        <div className="flex items-end justify-between">
          {/* Video Info */}
          <div className="flex-1 min-w-0 mr-4">
            {/* Creator Info */}
            <div 
              className="flex items-center gap-3 mb-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleCreatorClick}
            >
              <Avatar className="h-10 w-10 border-2 border-white/20">
                <AvatarImage src={currentVideo.creator.avatar} alt={currentVideo.creator.displayName} />
                <AvatarFallback className="bg-gray-600 text-white">
                  {currentVideo.creator.displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">
                    {currentVideo.creator.displayName}
                  </span>
                  {currentVideo.creator.verified && (
                    <Badge variant="secondary" className="bg-blue-500 text-white border-0 text-xs">
                      ✓
                    </Badge>
                  )}
                </div>
                <div className="text-white/70 text-sm">
                  @{currentVideo.creator.handle}
                </div>
              </div>
            </div>

            {/* Video Title */}
            <h2 className="text-white font-medium text-lg mb-2 line-clamp-2">
              {currentVideo.title}
            </h2>

            {/* Video Stats */}
            <div className="flex items-center gap-4 text-white/80 text-sm mb-3">
              <span>{formatViews(currentVideo.views)} views</span>
              <span>•</span>
              <span>{currentVideo.durationLabel}</span>
            </div>

            {/* Tags */}
            {currentVideo.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {currentVideo.tags.slice(0, 3).map((tag) => (
                  <Badge 
                    key={tag}
                    variant="secondary" 
                    className="bg-white/20 text-white border-0 text-xs"
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 p-3 rounded-full"
              >
                <Heart className="h-6 w-6" />
              </Button>
              <span className="text-white text-xs mt-1">
                {formatViews(currentVideo.likes)}
              </span>
            </div>

            <div className="flex flex-col items-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 p-3 rounded-full"
              >
                <MessageCircle className="h-6 w-6" />
              </Button>
              <span className="text-white text-xs mt-1">
                Comments
              </span>
            </div>

            <div className="flex flex-col items-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 p-3 rounded-full"
              >
                <Share2 className="h-6 w-6" />
              </Button>
              <span className="text-white text-xs mt-1">
                Share
              </span>
            </div>

            <div className="flex flex-col items-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 p-3 rounded-full"
              >
                <DollarSign className="h-6 w-6" />
              </Button>
              <span className="text-white text-xs mt-1">
                Tip
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
        <div className="flex flex-col gap-1">
          {videos.map((_, index) => (
            <div
              key={index}
              className={clsx(
                'w-1 h-8 rounded-full transition-colors',
                index === currentIndex ? 'bg-white' : 'bg-white/30'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}