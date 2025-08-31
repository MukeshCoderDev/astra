import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { clsx } from 'clsx';
import { Calendar, Eye, Clock } from 'lucide-react';

interface Creator {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  isVerified?: boolean;
  followerCount?: number;
  isFollowing?: boolean;
}

interface VideoMetadataProps {
  title: string;
  description?: string;
  creator: Creator;
  viewCount?: number;
  uploadDate?: Date;
  duration?: number;
  tags?: string[];
  category?: string;
  isAdultContent?: boolean;
  layout?: 'horizontal' | 'vertical' | 'overlay';
  className?: string;
  onFollow?: (creatorId: string, isFollowing: boolean) => void;
  onCreatorClick?: (creatorId: string) => void;
}

export function VideoMetadata({
  title,
  description,
  creator,
  viewCount = 0,
  uploadDate,
  duration,
  tags = [],
  category,
  isAdultContent = false,
  layout = 'horizontal',
  className,
  onFollow,
  onCreatorClick,
}: VideoMetadataProps) {
  const handleFollow = () => {
    onFollow?.(creator.id, !creator.isFollowing);
  };

  const handleCreatorClick = () => {
    onCreatorClick?.(creator.id);
  };

  const formatViewCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M views`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K views`;
    }
    return `${count} views`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
    return `${Math.ceil(diffDays / 365)} years ago`;
  };

  const formatFollowerCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  if (layout === 'overlay') {
    return (
      <div className={clsx('absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white', className)}>
        <div className="space-y-2">
          <h3 className="font-semibold text-lg line-clamp-2">{title}</h3>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleCreatorClick}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={creator.avatar} alt={creator.displayName} />
                <AvatarFallback>{creator.displayName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="text-left">
                <div className="flex items-center gap-1">
                  <span className="font-medium text-sm">{creator.displayName}</span>
                  {creator.isVerified && (
                    <Badge variant="secondary" className="text-xs px-1 py-0">✓</Badge>
                  )}
                </div>
                {creator.followerCount && (
                  <span className="text-xs text-white/70">
                    {formatFollowerCount(creator.followerCount)} followers
                  </span>
                )}
              </div>
            </button>
            
            {onFollow && (
              <Button
                variant={creator.isFollowing ? "secondary" : "default"}
                size="sm"
                onClick={handleFollow}
                className="ml-auto"
              >
                {creator.isFollowing ? 'Following' : 'Follow'}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-white/70">
            {viewCount > 0 && (
              <>
                <Eye className="h-3 w-3" />
                <span>{formatViewCount(viewCount)}</span>
              </>
            )}
            {uploadDate && (
              <>
                <Separator orientation="vertical" className="h-3 bg-white/30" />
                <Calendar className="h-3 w-3" />
                <span>{formatDate(uploadDate)}</span>
              </>
            )}
            {duration && (
              <>
                <Separator orientation="vertical" className="h-3 bg-white/30" />
                <Clock className="h-3 w-3" />
                <span>{formatDuration(duration)}</span>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (layout === 'vertical') {
    return (
      <div className={clsx('space-y-3', className)}>
        <h2 className="font-semibold text-lg leading-tight">{title}</h2>
        
        <div className="flex items-start justify-between gap-3">
          <button
            onClick={handleCreatorClick}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-1"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={creator.avatar} alt={creator.displayName} />
              <AvatarFallback>{creator.displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="text-left flex-1">
              <div className="flex items-center gap-1">
                <span className="font-medium">{creator.displayName}</span>
                {creator.isVerified && (
                  <Badge variant="secondary" className="text-xs px-1 py-0">✓</Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {creator.followerCount && (
                  <span>{formatFollowerCount(creator.followerCount)} followers</span>
                )}
              </div>
            </div>
          </button>
          
          {onFollow && (
            <Button
              variant={creator.isFollowing ? "secondary" : "default"}
              size="sm"
              onClick={handleFollow}
            >
              {creator.isFollowing ? 'Following' : 'Follow'}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {viewCount > 0 && (
            <>
              <Eye className="h-4 w-4" />
              <span>{formatViewCount(viewCount)}</span>
            </>
          )}
          {uploadDate && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <Calendar className="h-4 w-4" />
              <span>{formatDate(uploadDate)}</span>
            </>
          )}
          {duration && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <Clock className="h-4 w-4" />
              <span>{formatDuration(duration)}</span>
            </>
          )}
        </div>

        {description && (
          <div className="text-sm text-muted-foreground">
            <p className="line-clamp-3">{description}</p>
          </div>
        )}

        {(tags.length > 0 || category || isAdultContent) && (
          <div className="flex flex-wrap gap-2">
            {isAdultContent && (
              <Badge variant="destructive" className="text-xs">
                18+
              </Badge>
            )}
            {category && (
              <Badge variant="secondary" className="text-xs">
                {category}
              </Badge>
            )}
            {tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Horizontal layout (default)
  return (
    <div className={clsx('space-y-3', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <h2 className="font-semibold text-lg leading-tight">{title}</h2>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {viewCount > 0 && (
              <>
                <Eye className="h-4 w-4" />
                <span>{formatViewCount(viewCount)}</span>
              </>
            )}
            {uploadDate && (
              <>
                <Separator orientation="vertical" className="h-4" />
                <Calendar className="h-4 w-4" />
                <span>{formatDate(uploadDate)}</span>
              </>
            )}
            {duration && (
              <>
                <Separator orientation="vertical" className="h-4" />
                <Clock className="h-4 w-4" />
                <span>{formatDuration(duration)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={handleCreatorClick}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={creator.avatar} alt={creator.displayName} />
            <AvatarFallback>{creator.displayName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="text-left">
            <div className="flex items-center gap-1">
              <span className="font-medium">{creator.displayName}</span>
              {creator.isVerified && (
                <Badge variant="secondary" className="text-xs px-1 py-0">✓</Badge>
              )}
            </div>
            {creator.followerCount && (
              <span className="text-sm text-muted-foreground">
                {formatFollowerCount(creator.followerCount)} followers
              </span>
            )}
          </div>
        </button>
        
        {onFollow && (
          <Button
            variant={creator.isFollowing ? "secondary" : "default"}
            size="sm"
            onClick={handleFollow}
          >
            {creator.isFollowing ? 'Following' : 'Follow'}
          </Button>
        )}
      </div>

      {description && (
        <div className="text-sm text-muted-foreground">
          <p className="line-clamp-2">{description}</p>
        </div>
      )}

      {(tags.length > 0 || category || isAdultContent) && (
        <div className="flex flex-wrap gap-2">
          {isAdultContent && (
            <Badge variant="destructive" className="text-xs">
              18+
            </Badge>
          )}
          {category && (
            <Badge variant="secondary" className="text-xs">
              {category}
            </Badge>
          )}
          {tags.slice(0, 5).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              #{tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}