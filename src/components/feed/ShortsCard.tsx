import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Play, Heart, Share2, DollarSign } from 'lucide-react';
import { clsx } from 'clsx';
import { Video } from '../../types';

interface ShortsCardProps {
  video: Video;
  className?: string;
}

export function ShortsCard({ video, className }: ShortsCardProps) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const handleVideoClick = () => {
    navigate(`/shorts/${video.id}`);
  };

  const handleCreatorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/@${video.creator.handle}`);
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

  return (
    <div 
      className={clsx(
        'group relative cursor-pointer overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800',
        'aspect-[9/16] w-full max-w-[280px]',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleVideoClick}
    >
      {/* Video Thumbnail */}
      <img
        src={video.poster}
        alt={video.title}
        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* Play Button Overlay */}
      <div className={clsx(
        'absolute inset-0 flex items-center justify-center transition-opacity duration-200',
        isHovered ? 'opacity-100' : 'opacity-0'
      )}>
        <Button
          size="lg"
          className="rounded-full bg-white/90 text-black hover:bg-white"
        >
          <Play className="h-6 w-6 fill-current" />
        </Button>
      </div>

      {/* Duration Badge */}
      <Badge 
        variant="secondary" 
        className="absolute top-3 right-3 bg-black/70 text-white text-xs"
      >
        {video.durationLabel}
      </Badge>

      {/* Adult Content Badge */}
      {video.adultContent && (
        <Badge 
          variant="destructive" 
          className="absolute top-3 left-3 text-xs"
        >
          18+
        </Badge>
      )}

      {/* Content Info - Bottom Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
        {/* Creator Info */}
        <div 
          className="flex items-center gap-2 mb-2 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={handleCreatorClick}
        >
          <Avatar className="h-8 w-8 border-2 border-white/20">
            <AvatarImage src={video.creator.avatar} alt={video.creator.displayName} />
            <AvatarFallback className="text-xs bg-gray-600 text-white">
              {video.creator.displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium truncate">
                {video.creator.displayName}
              </span>
              {video.creator.verified && (
                <Badge variant="secondary" className="text-xs bg-blue-500 text-white border-0">
                  ✓
                </Badge>
              )}
            </div>
            <div className="text-xs text-white/70">
              @{video.creator.handle}
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-medium text-sm line-clamp-2 mb-2">
          {video.title}
        </h3>

        {/* Stats and Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-white/80">
            <span>{formatViews(video.views)} views</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Heart className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <DollarSign className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}