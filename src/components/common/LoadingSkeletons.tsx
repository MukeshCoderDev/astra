import React from 'react';
import { Skeleton } from '../ui/loading';
import { clsx } from 'clsx';

interface VideoGridSkeletonProps {
  count?: number;
  className?: string;
}

/**
 * Loading skeleton for video grid layouts
 */
export function VideoGridSkeleton({ count = 8, className }: VideoGridSkeletonProps) {
  return (
    <div className={clsx('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3">
          {/* Video thumbnail */}
          <Skeleton className="aspect-video w-full rounded-lg" />
          
          {/* Video title */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          
          {/* Creator and metadata */}
          <div className="flex items-center space-x-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface HistoryListSkeletonProps {
  count?: number;
  className?: string;
}

/**
 * Loading skeleton for history list layout
 */
export function HistoryListSkeleton({ count = 6, className }: HistoryListSkeletonProps) {
  return (
    <div className={clsx('space-y-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4">
          {/* Video thumbnail */}
          <Skeleton className="w-40 aspect-video rounded-md flex-shrink-0" />
          
          {/* Video details */}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
            
            {/* Progress bar */}
            <div className="pt-2">
              <Skeleton className="h-1 w-full" />
            </div>
          </div>
          
          {/* Action button */}
          <Skeleton className="w-8 h-8 rounded flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

interface PlaylistGridSkeletonProps {
  count?: number;
  className?: string;
}

/**
 * Loading skeleton for playlist grid layout
 */
export function PlaylistGridSkeleton({ count = 6, className }: PlaylistGridSkeletonProps) {
  return (
    <div className={clsx('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3">
          {/* Playlist cover */}
          <Skeleton className="aspect-video w-full rounded-lg" />
          
          {/* Playlist title */}
          <Skeleton className="h-5 w-3/4" />
          
          {/* Playlist metadata */}
          <div className="space-y-1">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface UploadTableSkeletonProps {
  count?: number;
  className?: string;
}

/**
 * Loading skeleton for upload table layout
 */
export function UploadTableSkeleton({ count = 8, className }: UploadTableSkeletonProps) {
  return (
    <div className={clsx('space-y-1', className)}>
      {/* Table header */}
      <div className="grid grid-cols-12 gap-4 p-4 border-b">
        <Skeleton className="h-4 col-span-5" />
        <Skeleton className="h-4 col-span-2" />
        <Skeleton className="h-4 col-span-2" />
        <Skeleton className="h-4 col-span-3" />
      </div>
      
      {/* Table rows */}
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="grid grid-cols-12 gap-4 p-4 border-b">
          {/* Video info */}
          <div className="col-span-5 flex gap-3">
            <Skeleton className="w-16 aspect-video rounded flex-shrink-0" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
          
          {/* Status */}
          <div className="col-span-2">
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          
          {/* Views */}
          <div className="col-span-2">
            <Skeleton className="h-4 w-16" />
          </div>
          
          {/* Actions */}
          <div className="col-span-3 flex gap-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface FilterChipsSkeletonProps {
  count?: number;
  className?: string;
}

/**
 * Loading skeleton for filter chips
 */
export function FilterChipsSkeleton({ count = 6, className }: FilterChipsSkeletonProps) {
  return (
    <div className={clsx('flex gap-2 overflow-x-auto pb-2', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-16 rounded-full flex-shrink-0" />
      ))}
    </div>
  );
}

interface PageHeaderSkeletonProps {
  showDescription?: boolean;
  showActions?: boolean;
  className?: string;
}

/**
 * Loading skeleton for page headers
 */
export function PageHeaderSkeleton({ 
  showDescription = true, 
  showActions = false, 
  className 
}: PageHeaderSkeletonProps) {
  return (
    <div className={clsx('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          {showDescription && <Skeleton className="h-4 w-96" />}
        </div>
        {showActions && (
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Generic content loading skeleton
 */
export function ContentSkeleton({ 
  type = 'grid',
  count,
  className 
}: {
  type?: 'grid' | 'list' | 'table' | 'playlist';
  count?: number;
  className?: string;
}) {
  switch (type) {
    case 'list':
      return <HistoryListSkeleton count={count} className={className} />;
    case 'table':
      return <UploadTableSkeleton count={count} className={className} />;
    case 'playlist':
      return <PlaylistGridSkeleton count={count} className={className} />;
    case 'grid':
    default:
      return <VideoGridSkeleton count={count} className={className} />;
  }
}