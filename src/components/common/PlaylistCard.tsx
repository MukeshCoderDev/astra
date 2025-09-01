import { Link } from 'react-router-dom';
import { Play, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import type { Playlist } from '../../types';

interface PlaylistCardProps {
  playlist: Playlist;
  className?: string;
}

// Simple time formatting utility
const formatTimeAgo = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  return `${Math.floor(diffInSeconds / 31536000)}y ago`;
};

export function PlaylistCard({ playlist, className }: PlaylistCardProps) {
  return (
    <Link 
      to={`/playlists/${playlist.id}`}
      className={clsx(
        "group block bg-card rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 hover:scale-[1.02]",
        className
      )}
    >
      {/* Cover Image */}
      <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
        {playlist.cover ? (
          <img 
            src={playlist.cover} 
            alt={playlist.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="h-8 w-8 text-primary group-hover:scale-110 transition-transform duration-200" />
          </div>
        )}
        
        {/* Video count overlay */}
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
          {playlist.videoCount} videos
        </div>
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-medium text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
          {playlist.title}
        </h3>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{playlist.videoCount} videos</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTimeAgo(playlist.updatedAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}