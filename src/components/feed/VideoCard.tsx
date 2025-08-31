import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Play, MoreVertical, Heart, Share2, DollarSign } from 'lucide-react';
import { ReportButton } from '../compliance/ReportButton';
import { ContentVisibilityBadge } from '../compliance/ContentVisibilityBadge';
import { clsx } from 'clsx';
import { Video } from '../../types';

interface VideoCardProps {
  video: Video;
  layout?: 'grid' | 'list';
  showCreator?: boolean;
  className?: string;
}

export function VideoCard({ 
  video, 
  layout = 'grid', 
  showCreator = true,
  className 
}: VideoCardProps) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const handleVideoClick = () => {
    navigate(`/watch/${video.id}`);
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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return `${Math.floor(diffInHours / 168)}w ago`;
  };

  return (
    <Card 
      className={clsx(
        'group cursor-pointer transition-all duration-200 hover:shadow-lg',
        layout === 'list' && 'flex gap-4',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleVideoClick}
    >
      {/* Thumbnail Container */}
      <div className={clsx(
        'relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800',
        layout === 'grid' ? 'aspect-video w-full' : 'aspect-video w-48 flex-shrink-0'
      )}>
        <img
          src={video.poster}
          alt={video.title}
          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
        />
        
        {/* Play Button Overlay */}
        <div className={clsx(
          'absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity duration-200',
          isHovered ? 'opacity-100' : 'opacity-0'
        )}>
          <Button
            size="sm"
            className="rounded-full bg-white/90 text-black hover:bg-white"
          >
            <Play className="h-4 w-4 fill-current" />
          </Button>
        </div>

        {/* Duration Badge */}
        <Badge 
          variant="secondary" 
          className="absolute bottom-2 right-2 bg-black/70 text-white text-xs"
        >
          {video.durationLabel}
        </Badge>

        {/* Content Status Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {video.adultContent && (
            <Badge 
              variant="destructive" 
              className="text-xs"
            >
              18+
            </Badge>
          )}
          <ContentVisibilityBadge status={video.visibility} />
        </div>

        {/* Type Badge for Shorts */}
        {video.type === 'short' && (
          <Badge 
            variant="outline" 
            className="absolute top-2 right-2 bg-purple-500 text-white border-purple-500 text-xs"
          >
            Short
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className={clsx(
        'flex flex-col',
        layout === 'grid' ? 'p-4' : 'flex-1 py-2'
      )}>
        {/* Title and Actions */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {video.title}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>

        {/* Creator Info */}
        {showCreator && (
          <div 
            className="flex items-center gap-2 mb-2 cursor-pointer hover:text-primary transition-colors"
            onClick={handleCreatorClick}
          >
            <Avatar className="h-6 w-6">
              <AvatarImage src={video.creator.avatar} alt={video.creator.displayName} />
              <AvatarFallback className="text-xs">
                {video.creator.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
              {video.creator.displayName}
              {video.creator.verified && (
                <Badge variant="secondary" className="ml-1 text-xs">✓</Badge>
              )}
            </span>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
          <span>{formatViews(video.views)} views</span>
          <span>•</span>
          <span>{formatTimeAgo(video.createdAt)}</span>
        </div>

        {/* Description (for list layout) */}
        {layout === 'list' && video.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {video.description}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-auto">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Heart className="h-3 w-3" />
            {video.likes > 0 && formatViews(video.likes)}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Share2 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <DollarSign className="h-3 w-3" />
            {video.tips > 0 && formatViews(video.tips)}
          </Button>
          <ReportButton
            contentId={video.id}
            contentType="video"
            variant="ghost"
            size="sm"
          />
        </div>
      </div>
    </Card>
  );
}