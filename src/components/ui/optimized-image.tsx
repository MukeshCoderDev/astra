import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { useImageLazyLoad, useIntersectionObserver } from '../../hooks/usePerformance';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  blurDataURL?: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  fill?: boolean;
  aspectRatio?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Optimized image component with lazy loading and blur placeholder
 */
export function OptimizedImage({
  src,
  alt,
  placeholder,
  blurDataURL,
  priority = false,
  quality = 75,
  sizes,
  fill = false,
  aspectRatio,
  objectFit = 'cover',
  className,
  onLoad,
  onError,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState(placeholder || blurDataURL || '');
  const imgRef = useRef<HTMLImageElement>(null);
  
  const { targetRef, hasIntersected } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px',
  });

  // Load image when it intersects or if it's priority
  useEffect(() => {
    if (!src || (!hasIntersected && !priority)) return;

    const img = new Image();
    
    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
      onLoad?.();
    };
    
    img.onerror = () => {
      setHasError(true);
      onError?.();
    };

    // Set sizes for responsive images
    if (sizes) {
      img.sizes = sizes;
    }

    img.src = src;
  }, [src, hasIntersected, priority, sizes, onLoad, onError]);

  const containerStyle: React.CSSProperties = {
    ...(aspectRatio && { aspectRatio }),
    ...(fill && {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
    }),
  };

  const imageStyle: React.CSSProperties = {
    objectFit,
    transition: 'opacity 0.3s ease-in-out',
    opacity: isLoaded ? 1 : 0,
  };

  if (hasError) {
    return (
      <div
        ref={targetRef}
        className={clsx(
          'flex items-center justify-center bg-muted text-muted-foreground',
          fill ? 'absolute inset-0' : 'w-full h-full',
          className
        )}
        style={containerStyle}
        role="img"
        aria-label={alt}
      >
        <span className="text-sm">Failed to load image</span>
      </div>
    );
  }

  return (
    <div
      ref={targetRef}
      className={clsx(
        'relative overflow-hidden',
        fill ? 'absolute inset-0' : 'w-full h-full',
        className
      )}
      style={containerStyle}
    >
      {/* Blur placeholder */}
      {blurDataURL && !isLoaded && (
        <img
          src={blurDataURL}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-sm scale-110"
          aria-hidden="true"
        />
      )}
      
      {/* Loading skeleton */}
      {!isLoaded && !blurDataURL && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}

      {/* Main image */}
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        className={clsx(
          'w-full h-full',
          fill ? 'absolute inset-0' : '',
        )}
        style={imageStyle}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        {...props}
      />
    </div>
  );
}

interface ResponsiveImageProps extends OptimizedImageProps {
  srcSet?: string;
  breakpoints?: {
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
  };
}

/**
 * Responsive image component with multiple breakpoints
 */
export function ResponsiveImage({
  srcSet,
  breakpoints,
  sizes,
  ...props
}: ResponsiveImageProps) {
  // Generate sizes attribute from breakpoints
  const responsiveSizes = sizes || (breakpoints ? 
    Object.entries(breakpoints)
      .map(([breakpoint, size]) => {
        const minWidth = {
          sm: '640px',
          md: '768px',
          lg: '1024px',
          xl: '1280px',
        }[breakpoint];
        return `(min-width: ${minWidth}) ${size}`;
      })
      .join(', ') + ', 100vw'
    : undefined
  );

  return (
    <OptimizedImage
      {...props}
      srcSet={srcSet}
      sizes={responsiveSizes}
    />
  );
}

interface AvatarImageProps extends Omit<OptimizedImageProps, 'aspectRatio' | 'objectFit'> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
}

/**
 * Optimized avatar image component
 */
export function AvatarImage({
  size = 'md',
  fallback,
  className,
  ...props
}: AvatarImageProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <div className={clsx('relative rounded-full overflow-hidden', sizeClasses[size], className)}>
      <OptimizedImage
        {...props}
        aspectRatio="1"
        objectFit="cover"
        fill
        placeholder={fallback}
        className="rounded-full"
      />
    </div>
  );
}

interface VideoThumbnailProps extends OptimizedImageProps {
  duration?: string;
  isLive?: boolean;
}

/**
 * Optimized video thumbnail component
 */
export function VideoThumbnail({
  duration,
  isLive,
  className,
  children,
  ...props
}: VideoThumbnailProps) {
  return (
    <div className={clsx('relative group', className)}>
      <OptimizedImage
        {...props}
        aspectRatio="16/9"
        objectFit="cover"
        className="rounded-lg"
      />
      
      {/* Duration badge */}
      {duration && !isLive && (
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
          {duration}
        </div>
      )}
      
      {/* Live badge */}
      {isLive && (
        <div className="absolute bottom-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          LIVE
        </div>
      )}
      
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg" />
      
      {children}
    </div>
  );
}