import React, { useRef, useState, useEffect, useMemo } from 'react';
import { clsx } from 'clsx';
import { useThrottle } from '../../hooks/usePerformance';

interface VirtualScrollProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
  getItemKey?: (item: T, index: number) => string | number;
}

/**
 * Virtual scrolling component for large lists
 */
export function VirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className,
  onScroll,
  getItemKey,
}: VirtualScrollProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const visibleRange = useMemo(() => {
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight)
    );

    const start = Math.max(0, visibleStart - overscan);
    const end = Math.min(items.length - 1, visibleEnd + overscan);

    return {
      start,
      end,
      visibleStart,
      visibleEnd,
      offsetY: start * itemHeight,
    };
  }, [items.length, itemHeight, containerHeight, scrollTop, overscan]);

  const handleScroll = useThrottle((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  }, 16); // ~60fps

  const totalHeight = items.length * itemHeight;
  const visibleItems = items.slice(visibleRange.start, visibleRange.end + 1);

  return (
    <div
      ref={scrollElementRef}
      className={clsx('overflow-auto', className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${visibleRange.offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => {
            const actualIndex = visibleRange.start + index;
            const key = getItemKey ? getItemKey(item, actualIndex) : actualIndex;
            
            return (
              <div
                key={key}
                style={{ height: itemHeight }}
                className="flex-shrink-0"
              >
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface InfiniteScrollProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  hasNextPage: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  className?: string;
  loadingComponent?: React.ReactNode;
  endMessage?: React.ReactNode;
  threshold?: number;
  getItemKey?: (item: T, index: number) => string | number;
}

/**
 * Infinite scroll component
 */
export function InfiniteScroll<T>({
  items,
  renderItem,
  hasNextPage,
  isLoading,
  onLoadMore,
  className,
  loadingComponent,
  endMessage,
  threshold = 200,
  getItemKey,
}: InfiniteScrollProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Intersection observer for loading more items
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      {
        rootMargin: `${threshold}px`,
        threshold: 0.1,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.unobserve(sentinel);
    };
  }, [hasNextPage, isLoading, onLoadMore, threshold]);

  return (
    <div ref={containerRef} className={clsx('overflow-auto', className)}>
      {items.map((item, index) => {
        const key = getItemKey ? getItemKey(item, index) : index;
        return (
          <div key={key}>
            {renderItem(item, index)}
          </div>
        );
      })}
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center py-4">
          {loadingComponent || (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          )}
        </div>
      )}
      
      {/* Sentinel for intersection observer */}
      {hasNextPage && !isLoading && (
        <div ref={sentinelRef} className="h-1" />
      )}
      
      {/* End message */}
      {!hasNextPage && !isLoading && endMessage && (
        <div className="text-center py-4 text-muted-foreground">
          {endMessage}
        </div>
      )}
    </div>
  );
}

interface GridVirtualScrollProps<T> {
  items: T[];
  itemWidth: number;
  itemHeight: number;
  containerWidth: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  gap?: number;
  overscan?: number;
  className?: string;
  getItemKey?: (item: T, index: number) => string | number;
}

/**
 * Virtual scrolling grid component
 */
export function GridVirtualScroll<T>({
  items,
  itemWidth,
  itemHeight,
  containerWidth,
  containerHeight,
  renderItem,
  gap = 0,
  overscan = 5,
  className,
  getItemKey,
}: GridVirtualScrollProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const columnsPerRow = Math.floor((containerWidth + gap) / (itemWidth + gap));
  const totalRows = Math.ceil(items.length / columnsPerRow);
  const rowHeight = itemHeight + gap;

  const visibleRange = useMemo(() => {
    const visibleStartRow = Math.floor(scrollTop / rowHeight);
    const visibleEndRow = Math.min(
      totalRows - 1,
      Math.ceil((scrollTop + containerHeight) / rowHeight)
    );

    const startRow = Math.max(0, visibleStartRow - overscan);
    const endRow = Math.min(totalRows - 1, visibleEndRow + overscan);

    const startIndex = startRow * columnsPerRow;
    const endIndex = Math.min(items.length - 1, (endRow + 1) * columnsPerRow - 1);

    return {
      startRow,
      endRow,
      startIndex,
      endIndex,
      offsetY: startRow * rowHeight,
    };
  }, [scrollTop, rowHeight, totalRows, columnsPerRow, containerHeight, overscan, items.length]);

  const handleScroll = useThrottle((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, 16);

  const totalHeight = totalRows * rowHeight;
  const visibleItems = items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);

  return (
    <div
      ref={scrollElementRef}
      className={clsx('overflow-auto', className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${visibleRange.offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            display: 'grid',
            gridTemplateColumns: `repeat(${columnsPerRow}, ${itemWidth}px)`,
            gap: `${gap}px`,
            justifyContent: 'start',
          }}
        >
          {visibleItems.map((item, index) => {
            const actualIndex = visibleRange.startIndex + index;
            const key = getItemKey ? getItemKey(item, actualIndex) : actualIndex;
            
            return (
              <div key={key} style={{ width: itemWidth, height: itemHeight }}>
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}