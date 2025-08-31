import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { ScreenReaderOnly, LiveRegion } from '../ui/screen-reader';
import { clsx } from 'clsx';
import { formatTimeForScreenReader, generateId } from '../../lib/accessibility';
import { useKeyboardNavigation, useScreenReader } from '../../hooks/useAccessibility';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
  className?: string;
  title?: string;
  description?: string;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

export function VideoPlayer({
  src,
  poster,
  autoPlay = false,
  muted = false,
  controls = true,
  className,
  title = "Video player",
  description,
  onTimeUpdate,
  onPlay,
  onPause,
  onEnded,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(true);
  
  const playerId = generateId('video-player');
  const { announcement, announce } = useScreenReader();

  // Initialize HLS
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        if (autoPlay) {
          video.play().catch(console.error);
        }
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        console.error('HLS Error:', data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });

      hlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = src;
      setIsLoading(false);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [src, autoPlay]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      setIsPlaying(true);
      onPlay?.();
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
    };

    const handleTimeUpdate = () => {
      const current = video.currentTime;
      const total = video.duration;
      setCurrentTime(current);
      setDuration(total);
      onTimeUpdate?.(current, total);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [onTimeUpdate, onPlay, onPause, onEnded]);

  // Keyboard navigation
  useKeyboardNavigation(
    () => togglePlay(), // Enter
    undefined, // Escape
    () => handleVolumeChange(Math.min(1, volume + 0.1)), // Arrow Up
    () => handleVolumeChange(Math.max(0, volume - 0.1)), // Arrow Down
    () => handleSeek(Math.max(0, (currentTime - 10) / duration * 100)), // Arrow Left
    () => handleSeek(Math.min(100, (currentTime + 10) / duration * 100)) // Arrow Right
  );

  // Control handlers
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      announce('Video paused');
    } else {
      video.play().catch(console.error);
      announce('Video playing');
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
    announce(video.muted ? 'Video muted' : 'Video unmuted');
  };

  const handleVolumeChange = (newVolume: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    announce(`Volume ${Math.round(newVolume * 100)}%`);
  };

  const handleSeek = (percentage: number) => {
    const video = videoRef.current;
    if (!video || !duration) return;

    const newTime = (percentage / 100) * duration;
    video.currentTime = newTime;
    announce(`Seeking to ${formatTime(newTime)}`);
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (!isFullscreen) {
      video.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={clsx(
        'relative bg-black rounded-lg overflow-hidden group',
        className
      )}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      role="region"
      aria-label={`Video player: ${title}`}
    >
      <video
        ref={videoRef}
        poster={poster}
        muted={isMuted}
        className="w-full h-full object-cover"
        onClick={togglePlay}
        aria-label={title}
        aria-describedby={description ? `${playerId}-description` : undefined}
      />
      
      {description && (
        <ScreenReaderOnly>
          <div id={`${playerId}-description`}>
            {description}
          </div>
        </ScreenReaderOnly>
      )}
      
      <LiveRegion>
        {announcement}
      </LiveRegion>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      )}

      {/* Controls overlay */}
      {controls && (
        <div
          className={clsx(
            'absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300',
            showControls ? 'opacity-100' : 'opacity-0'
          )}
        >
          {/* Play/Pause button (center) */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlay}
              className="h-16 w-16 rounded-full bg-black/50 hover:bg-black/70 text-white"
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
            >
              {isPlaying ? (
                <Pause className="h-8 w-8" aria-hidden="true" />
              ) : (
                <Play className="h-8 w-8 ml-1" aria-hidden="true" />
              )}
            </Button>
          </div>

          {/* Bottom controls */}
          <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
            {/* Progress bar */}
            <div className="flex items-center gap-2 text-white text-sm">
              <span aria-label={`Current time: ${formatTimeForScreenReader(currentTime)}`}>
                {formatTime(currentTime)}
              </span>
              <div className="flex-1">
                <Progress
                  value={progressPercentage}
                  className="h-1 cursor-pointer"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const percentage = ((e.clientX - rect.left) / rect.width) * 100;
                    handleSeek(percentage);
                  }}
                  aria-label={`Video progress: ${Math.round(progressPercentage)}%`}
                  role="slider"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(progressPercentage)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowLeft') {
                      e.preventDefault();
                      handleSeek(Math.max(0, progressPercentage - 5));
                    } else if (e.key === 'ArrowRight') {
                      e.preventDefault();
                      handleSeek(Math.min(100, progressPercentage + 5));
                    }
                  }}
                />
              </div>
              <span aria-label={`Total duration: ${formatTimeForScreenReader(duration)}`}>
                {formatTime(duration)}
              </span>
            </div>

            {/* Control buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePlay}
                  className="text-white hover:bg-white/20"
                  aria-label={isPlaying ? 'Pause video' : 'Play video'}
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Play className="h-4 w-4" aria-hidden="true" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className="text-white hover:bg-white/20"
                  aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Volume2 className="h-4 w-4" aria-hidden="true" />
                  )}
                </Button>

                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                    aria-label={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  aria-label="Video settings"
                >
                  <Settings className="h-4 w-4" aria-hidden="true" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFullscreen}
                  className="text-white hover:bg-white/20"
                  aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                >
                  <Maximize className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}