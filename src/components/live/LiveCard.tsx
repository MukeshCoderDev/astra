"use client";
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import LiveBadge from './LiveBadge';
import type { Stream } from '../../types/live';

/**
 * Props for LiveCard component
 */
interface LiveCardProps {
  /** Stream data */
  stream: Stream;
  /** Additional CSS classes */
  className?: string;
  /** Show viewer count */
  showViewers?: boolean;
  /** Show creator handle */
  showCreator?: boolean;
}

/**
 * Live stream card component for discovery pages
 * Displays stream thumbnail, title, creator, and status information
 */
export default function LiveCard({ 
  stream, 
  className,
  showViewers = true,
  showCreator = true 
}: LiveCardProps) {
  const isLive = stream.status === 'live';
  const isUpcoming = stream.scheduled || stream.status === 'preview';
  const isEnded = stream.status === 'ended';

  const getBadgeVariant = () => {
    if (isLive) return 'live';
    if (isUpcoming) return 'upcoming';
    if (isEnded) return 'ended';
    return 'live';
  };

  const formatViewerCount = (count: number) => {
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  return (
    <Link 
      to={`/live/${stream.id}`}
      className={clsx(
        'block group transition-transform duration-200',
        'hover:scale-[1.02] focus:scale-[1.02]',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        'rounded-lg overflow-hidden',
        className
      )}
      aria-label={`Watch ${stream.title} by ${stream.creator.handle}`}
    >
      <div className="relative">
        {/* Thumbnail Container */}
        <div className="relative aspect-video rounded-lg overflow-hidden bg-neutral-900">
          {stream.poster ? (
            <img 
              src={stream.poster} 
              alt={stream.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center">
              <div className="text-neutral-500 text-sm">No thumbnail</div>
            </div>
          )}
          
          {/* Status Badge */}
          <div className="absolute top-2 left-2 flex items-center gap-2">
            <LiveBadge variant={getBadgeVariant()} />
            {isLive && stream.viewers && (
              <span className="text-[10px] font-medium bg-black/60 text-white rounded px-1.5 py-0.5">
                {formatViewerCount(stream.viewers)} watching
              </span>
            )}
          </div>

          {/* Scheduled Time (for upcoming streams) */}
          {isUpcoming && stream.startAt && (
            <div className="absolute top-2 right-2">
              <span className="text-[10px] font-medium bg-black/60 text-white rounded px-1.5 py-0.5">
                {new Date(stream.startAt).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          )}

          {/* Gradient Overlay for Text */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          
          {/* Stream Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
            <h3 className="font-medium text-sm line-clamp-2 mb-1 group-hover:text-blue-200 transition-colors">
              {stream.title}
            </h3>
            
            {showCreator && (
              <div className="flex items-center justify-between text-xs opacity-90">
                <span className="truncate">@{stream.creator.handle}</span>
                {showViewers && stream.viewers !== undefined && (
                  <span className="ml-2 flex-shrink-0">
                    {formatViewerCount(stream.viewers)} {isLive ? 'watching' : 'viewers'}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}