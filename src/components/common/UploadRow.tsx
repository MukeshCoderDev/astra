import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ExternalLink, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UploadItem } from '../../types';

interface UploadRowProps {
  item: UploadItem;
}

export function UploadRow({ item }: UploadRowProps) {
  const navigate = useNavigate();
  const { video, status, views, uploadedAt } = item;

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    }
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'default';
      case 'processing':
        return 'secondary';
      case 'live':
        return 'destructive';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
      {/* Thumbnail */}
      <div className="flex-shrink-0 w-32 aspect-video bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
        <img
          src={video.poster}
          alt={video.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Video Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm line-clamp-2 mb-1">
          {video.title}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
          {video.description}
        </p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Uploaded {formatDate(uploadedAt)}</span>
          <span>{video.durationLabel}</span>
        </div>
      </div>

      {/* Status */}
      <div className="flex-shrink-0 w-24">
        <Badge variant={getStatusColor(status)} className="text-xs">
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      </div>

      {/* Views */}
      <div className="flex-shrink-0 w-20 text-sm text-muted-foreground">
        {formatViews(views)} views
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/watch/${video.id}`)}
          className="gap-2"
        >
          <ExternalLink className="h-3 w-3" />
          Open
        </Button>
        <Button variant="ghost" size="sm">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}