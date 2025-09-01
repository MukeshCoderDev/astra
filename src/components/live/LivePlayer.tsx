"use client";
import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { clsx } from 'clsx';
import LiveBadge from './LiveBadge';
import { HLS_CONFIG, PERFORMANCE_TARGETS } from '../../constants/live';
import { metricsApi } from '../../lib/api';
import { 
  performanceTracker, 
  cdnOptimizer, 
  networkMonitor, 
  performanceAnalytics,
  joinTimeOptimizer 
} from '../../lib/performance';
import { 
  useNetworkStatus, 
  useMediaErrorRecovery, 
  useErrorRecovery,
  useOfflineHandler 
} from '../../hooks/useResilience';
import { withRetry, errorRecoveryStrategies } from '../../lib/resilience';

/**
 * Props for LivePlayer component
 */
interface LivePlayerProps {
  /** HLS stream URL */
  src: string;
  /** Poster image URL */
  poster?: string;
  /** DVR window in seconds (0 = no DVR) */
  dvrWindowSec?: number;
  /** Stream ID for metrics */
  streamId?: string;
  /** Additional CSS classes */
  className?: string;
  /** Auto-play the stream */
  autoPlay?: boolean;
  /** Start muted */
  muted?: boolean;
}

/**
 * Live streaming video player with LL-HLS support
 * Features low-latency playback, DVR controls, and "Go Live" functionality
 */
export default function LivePlayer({
  src,
  poster,
  dvrWindowSec = 0,
  streamId,
  className,
  autoPlay = true,
  muted = true
}: LivePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [behind, setBehind] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Resilience hooks
  const { isOnline } = useNetworkStatus();
  const { mediaError, isRecovering: isMediaRecovering } = useMediaErrorRecovery(videoRef, src);
  const { recover: recoverFromError, isRecovering } = useErrorRecovery();
  
  // Offline handling
  useOfflineHandler({
    onOffline: () => {
      setError('You are currently offline. Stream will resume when connection is restored.');
    },
    onOnline: () => {
      if (error?.includes('offline')) {
        setError(null);
        // Attempt to reinitialize player
        initializePlayer();
      }
    },
  });

  /**
   * Preconnect to CDN endpoints for faster loading
   */
  const preconnectToCDN = useCallback((url: string) => {
    performanceTracker.mark('preconnect_start');
    cdnOptimizer.preconnect(url);
    performanceTracker.mark('preconnect_end');
  }, []);

  /**
   * Preload manifest for faster startup
   */
  const preloadManifest = useCallback(async (url: string): Promise<void> => {
    performanceTracker.mark('manifest_preload_start');
    const success = await cdnOptimizer.preloadManifest(url);
    performanceTracker.mark('manifest_preload_end');
    
    if (success) {
      console.log('Manifest preloaded successfully');
    }
  }, []);

  /**
   * Initialize HLS player with low-latency configuration and performance optimizations
   */
  const initializePlayer = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !src) return;

    // Check network connectivity
    if (!isOnline) {
      setError('No internet connection. Please check your network and try again.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Use retry logic for initialization
    try {
      await withRetry(
        async () => {
          await initializePlayerCore();
        },
        {
          maxAttempts: 3,
          baseDelay: 2000,
          retryCondition: (error) => {
            // Retry on network errors and timeouts
            return error?.name === 'NetworkError' || 
                   error?.message?.includes('timeout') ||
                   error?.message?.includes('network');
          },
          onRetry: (attempt, error) => {
            console.warn(`Player initialization retry ${attempt}:`, error);
            setError(`Connection failed. Retrying... (${attempt}/3)`);
          },
        }
      );
    } catch (finalError) {
      console.error('Failed to initialize player after retries:', finalError);
      setError('Failed to load stream. Please check your connection and try again.');
      setLoading(false);
    }
  }, [src, isOnline]);

  /**
   * Core player initialization logic
   */
  const initializePlayerCore = useCallback(async () => {

    // Initialize performance tracking
    performanceTracker.clear();
    performanceTracker.mark('init_start');

    // Get network information for optimization
    const networkInfo = networkMonitor.getConnectionInfo();
    
    // Step 1: Preconnect to CDN endpoints
    preconnectToCDN(src);
    const preconnectTime = performanceTracker.measure('preconnect_duration', 'preconnect_start', 'preconnect_end');

    // Step 2: Preload manifest
    await preloadManifest(src);
    const manifestTime = performanceTracker.measure('manifest_duration', 'manifest_preload_start', 'manifest_preload_end');

    // Record join time start for TTFF measurement
    performanceTracker.mark('join_time_start');

    try {
      performanceTracker.mark('hls_init_start');
      
      if (Hls.isSupported()) {
        // Clean up existing HLS instance
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }

        // Optimize HLS configuration based on network conditions
        const optimizedConfig = joinTimeOptimizer.optimizeHLSConfig(HLS_CONFIG, networkInfo);
        
        // Add debug mode in development
        if (process.env.NODE_ENV === 'development') {
          optimizedConfig.debug = true;
        }

        // Create new HLS instance with network-optimized config
        const hls = new Hls(optimizedConfig);
        hlsRef.current = hls;

        // Set up event listeners with performance tracking
        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          performanceTracker.mark('media_attached');
          console.log('HLS: Media attached');
        });

        hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
          performanceTracker.mark('manifest_parsed');
          performanceTracker.mark('hls_init_end');
          console.log('HLS: Manifest parsed', data);
          
          if (autoPlay) {
            video.play().catch(console.warn);
          }
        });

        hls.on(Hls.Events.FRAG_LOADED, (event, data) => {
          // Only set loading to false on first fragment
          if (loading) {
            performanceTracker.mark('first_fragment_loaded');
            setLoading(false);
            console.log('HLS: First fragment loaded', data);
          }
        });

        // Track buffer events for performance insights
        hls.on(Hls.Events.BUFFER_APPENDED, (event, data) => {
          if (!performanceTracker.getMeasures()['first_frame_time']) {
            performanceTracker.mark('first_frame_rendered');
          }
        });

        hls.on(Hls.Events.ERROR, async (event, data) => {
          console.error('HLS Error:', data);
          
          if (data.fatal) {
            const errorMessage = `HLS ${data.type} error: ${data.details}`;
            
            // Report error to metrics
            metricsApi.reportError({
              type: 'hls_error',
              message: errorMessage,
              details: data,
              streamId,
              timestamp: Date.now(),
            }).catch(() => {});

            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                // Attempt network error recovery
                const networkRecovered = await recoverFromError(
                  async () => {
                    if (!isOnline) {
                      throw new Error('Still offline');
                    }
                    hls.startLoad();
                    // Wait for recovery
                    await new Promise((resolve, reject) => {
                      const timeout = setTimeout(() => reject(new Error('Recovery timeout')), 10000);
                      const onRecover = () => {
                        clearTimeout(timeout);
                        hls.off(Hls.Events.FRAG_LOADED, onRecover);
                        resolve(void 0);
                      };
                      hls.on(Hls.Events.FRAG_LOADED, onRecover);
                    });
                  },
                  new Error('Network error during HLS playback'),
                  3
                );
                
                if (!networkRecovered) {
                  setError('Network connection failed. Please check your internet connection and try again.');
                }
                break;

              case Hls.ErrorTypes.MEDIA_ERROR:
                // Attempt media error recovery
                const mediaRecovered = await recoverFromError(
                  async () => {
                    hls.recoverMediaError();
                    // Wait for recovery
                    await new Promise((resolve, reject) => {
                      const timeout = setTimeout(() => reject(new Error('Media recovery timeout')), 5000);
                      const onRecover = () => {
                        clearTimeout(timeout);
                        hls.off(Hls.Events.FRAG_LOADED, onRecover);
                        resolve(void 0);
                      };
                      hls.on(Hls.Events.FRAG_LOADED, onRecover);
                    });
                  },
                  new Error('Media error during HLS playback'),
                  2
                );
                
                if (!mediaRecovered) {
                  setError('Media playback error. Trying to reinitialize...');
                  // Last resort: reinitialize the entire player
                  setTimeout(() => initializePlayer(), 2000);
                }
                break;

              default:
                setError('Playback error occurred. Click retry to attempt recovery.');
                hls.destroy();
                hlsRef.current = null;
                break;
            }
          } else {
            // Non-fatal errors - log but don't show to user
            console.warn('Non-fatal HLS error:', data);
          }
        });

        // Load and attach media
        hls.loadSource(src);
        hls.attachMedia(video);

      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        video.src = src;
        if (autoPlay) {
          video.play().catch(console.warn);
        }
      } else {
        setError('HLS is not supported in this browser.');
        return;
      }

      // Set up video event listeners with comprehensive performance tracking
      const handleLoadedData = () => {
        performanceTracker.mark('loaded_data');
        setLoading(false);
        
        // Calculate all performance metrics
        const joinTime = performanceTracker.measure('total_join_time', 'join_time_start', 'loaded_data');
        const totalInitTime = performanceTracker.measure('total_init_time', 'init_start', 'loaded_data');
        const preconnectTime = performanceTracker.measure('preconnect_time', 'preconnect_start', 'preconnect_end') || 0;
        const manifestTime = performanceTracker.measure('manifest_time', 'manifest_preload_start', 'manifest_preload_end') || 0;
        const hlsInitTime = performanceTracker.measure('hls_init_time', 'hls_init_start', 'hls_init_end') || 0;
        
        // Get network information
        const networkInfo = networkMonitor.getConnectionInfo();
        
        // Evaluate join time performance
        const evaluation = joinTimeOptimizer.evaluateJoinTime(joinTime);
        
        // Comprehensive performance metrics
        const detailedMetrics = {
          type: 'live' as const,
          streamId: streamId || 'unknown',
          ms: Math.round(joinTime),
          totalInitMs: Math.round(totalInitTime),
          preconnectMs: Math.round(preconnectTime),
          manifestPreloadMs: Math.round(manifestTime),
          hlsInitMs: Math.round(hlsInitTime),
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          connectionType: networkInfo.effectiveType,
          bandwidth: networkInfo.downlink,
          rtt: networkInfo.rtt,
          saveData: networkInfo.saveData,
          isLowLatency: true,
          bufferLength: HLS_CONFIG.maxBufferLength,
          performanceStatus: evaluation.status,
          networkSuitability: networkMonitor.isGoodForLiveStreaming(),
          recommendedQuality: networkMonitor.getRecommendedQuality(),
        };
        
        // Report to analytics
        performanceAnalytics.record({
          event: 'join_time_measured',
          ...detailedMetrics,
        });
        
        // Report to metrics API
        if (streamId) {
          metricsApi.reportJoinTime(detailedMetrics);
        }
        
        // Log performance in development
        if (process.env.NODE_ENV === 'development') {
          console.log('🚀 Join Time Performance:', {
            'Total Join Time': `${joinTime.toFixed(0)}ms`,
            'Target': `<${PERFORMANCE_TARGETS.MAX_JOIN_TIME_MS}ms`,
            'Status': `${evaluation.status.toUpperCase()} - ${evaluation.message}`,
            'Network': `${networkInfo.effectiveType} (${networkInfo.downlink}Mbps, ${networkInfo.rtt}ms RTT)`,
            'Breakdown': {
              'Preconnect': `${preconnectTime.toFixed(0)}ms`,
              'Manifest Preload': `${manifestTime.toFixed(0)}ms`,
              'HLS Init': `${hlsInitTime.toFixed(0)}ms`,
              'Total Init': `${totalInitTime.toFixed(0)}ms`,
            }
          });
        }
      };

      const handleTimeUpdate = () => {
        setCurrentTime(video.currentTime);
        setDuration(video.duration || 0);
      };

      const handleError = () => {
        setError('Failed to load video stream.');
        setLoading(false);
      };

      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('error', handleError);

      // Cleanup function
      return () => {
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('error', handleError);
      };

    } catch (error) {
      console.error('Failed to initialize player core:', error);
      throw error; // Re-throw for retry logic
    }
  }, [autoPlay, streamId, preconnectToCDN, preloadManifest, recoverFromError, isOnline]);

  /**
   * Calculate how far behind live edge the player is
   */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateBehindTime = () => {
      try {
        const seekable = video.seekable;
        if (seekable.length > 0) {
          const liveEdge = seekable.end(seekable.length - 1);
          const behindTime = Math.max(0, liveEdge - video.currentTime);
          setBehind(behindTime);
        }
      } catch (error) {
        // Ignore seekable errors
      }
    };

    const interval = setInterval(updateBehindTime, 1000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Jump to live edge
   */
  const goLive = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    try {
      const seekable = video.seekable;
      if (seekable.length > 0) {
        const liveEdge = seekable.end(seekable.length - 1);
        video.currentTime = Math.max(0, liveEdge - 0.5); // 0.5s buffer
      }
    } catch (error) {
      console.warn('Failed to seek to live edge:', error);
    }
  }, []);

  /**
   * Handle DVR seeking
   */
  const handleSeek = useCallback((value: number) => {
    const video = videoRef.current;
    if (!video || !dvrWindowSec) return;

    try {
      const seekable = video.seekable;
      if (seekable.length > 0) {
        const liveEdge = seekable.end(seekable.length - 1);
        const targetTime = Math.max(0, liveEdge - value);
        video.currentTime = targetTime;
      }
    } catch (error) {
      console.warn('Failed to seek:', error);
    }
  }, [dvrWindowSec]);

  // Initialize player when src changes
  useEffect(() => {
    initializePlayer();
    
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [initializePlayer]);

  // Performance monitoring effect
  useEffect(() => {
    if (!streamId || loading) return;

    const reportPerformanceMetrics = () => {
      const video = videoRef.current;
      const hls = hlsRef.current;
      
      if (!video || !hls) return;

      try {
        // Collect current performance metrics
        const metrics = {
          streamId,
          timestamp: Date.now(),
          buffered: video.buffered.length > 0 ? video.buffered.end(0) - video.currentTime : 0,
          currentTime: video.currentTime,
          readyState: video.readyState,
          networkState: video.networkState,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          // HLS-specific metrics
          currentLevel: hls.currentLevel,
          loadLevel: hls.loadLevel,
          nextLoadLevel: hls.nextLoadLevel,
          // Performance API metrics
          memoryUsage: (performance as any).memory ? {
            used: (performance as any).memory.usedJSHeapSize,
            total: (performance as any).memory.totalJSHeapSize,
            limit: (performance as any).memory.jsHeapSizeLimit,
          } : null,
        };

        // Report metrics (silent failure)
        metricsApi.reportJoinTime({
          type: 'performance_snapshot',
          streamId,
          ms: 0, // Not applicable for snapshots
          timestamp: Date.now(),
          ...metrics,
        }).catch(() => {});

      } catch (error) {
        console.warn('Failed to collect performance metrics:', error);
      }
    };

    // Report metrics every 30 seconds
    const interval = setInterval(reportPerformanceMetrics, PERFORMANCE_TARGETS.METRICS_REPORT_INTERVAL_MS);
    
    return () => clearInterval(interval);
  }, [streamId, loading]);

  // Calculate DVR position
  const dvrPosition = (() => {
    const video = videoRef.current;
    if (!video || !dvrWindowSec || !video.seekable.length) return 0;
    
    try {
      const liveEdge = video.seekable.end(video.seekable.length - 1);
      return Math.max(0, Math.min(dvrWindowSec, liveEdge - video.currentTime));
    } catch {
      return 0;
    }
  })();

  return (
    <div className={clsx('relative w-full bg-black rounded-lg overflow-hidden', className)}>
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full max-h-[70vh] object-contain"
        poster={poster}
        playsInline
        autoPlay={autoPlay}
        muted={muted}
        controls={false}
      />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="flex items-center gap-2 text-white">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            <span className="text-sm">Loading stream...</span>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {(error || mediaError) && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
          <div className="text-center text-white p-4 max-w-sm">
            <div className="text-red-400 mb-2">
              {isRecovering || isMediaRecovering ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-400 mx-auto"></div>
              ) : (
                '⚠️'
              )}
            </div>
            
            <div className="text-sm mb-3">
              {isRecovering || isMediaRecovering ? (
                'Attempting to recover...'
              ) : (
                error || (mediaError && `Media error: ${mediaError.message}`)
              )}
            </div>

            {/* Network status indicator */}
            {!isOnline && (
              <div className="text-xs text-yellow-400 mb-3 flex items-center justify-center gap-1">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                Offline - waiting for connection
              </div>
            )}

            <div className="flex gap-2 justify-center">
              <button
                onClick={() => initializePlayer()}
                disabled={isRecovering || isMediaRecovering || !isOnline}
                className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isRecovering || isMediaRecovering ? 'Recovering...' : 'Retry'}
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="px-3 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 transition-colors"
              >
                Reload Page
              </button>
            </div>

            {/* Additional help for persistent errors */}
            {error && !isRecovering && (
              <div className="text-xs text-gray-400 mt-3">
                <details>
                  <summary className="cursor-pointer">Troubleshooting</summary>
                  <div className="mt-2 text-left space-y-1">
                    <div>• Check your internet connection</div>
                    <div>• Try refreshing the page</div>
                    <div>• Disable ad blockers or VPN</div>
                    <div>• Try a different browser</div>
                  </div>
                </details>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Live Status Overlay */}
      <div className="absolute top-2 left-2 flex items-center gap-2">
        <LiveBadge />
        {dvrWindowSec > 0 ? (
          // DVR-enabled stream: Show time behind live
          <>
            <span className="text-xs bg-black/70 text-white rounded px-1.5 py-0.5">
              {behind < 2 ? 'LIVE' : `${Math.ceil(behind)}s behind`}
            </span>
            {behind >= PERFORMANCE_TARGETS.GO_LIVE_THRESHOLD_SEC && (
              <button
                onClick={goLive}
                className="text-xs bg-red-600 text-white px-2 py-0.5 rounded hover:bg-red-700 transition-colors"
              >
                Go Live
              </button>
            )}
          </>
        ) : (
          // True live stream: Just show LIVE badge
          <span className="text-xs bg-red-600 text-white rounded px-1.5 py-0.5 font-semibold">
            LIVE
          </span>
        )}
      </div>

      {/* DVR Scrub Bar - Only show for DVR-enabled streams */}
      {dvrWindowSec > 0 && (
        <div className="absolute bottom-2 left-2 right-2">
          <div className="bg-black/70 rounded px-3 py-2">
            <div className="flex items-center gap-3">
              {/* DVR Timeline */}
              <div className="flex-1 relative">
                <input
                  type="range"
                  min={0}
                  max={dvrWindowSec}
                  value={dvrPosition}
                  onChange={(e) => handleSeek(Number(e.target.value))}
                  className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                  aria-label="DVR timeline - seek within the last few hours"
                />
                {/* Live edge indicator */}
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full"></div>
              </div>
              
              {/* Time display */}
              <div className="flex items-center gap-2 text-xs text-white min-w-[4rem]">
                {behind < 2 ? (
                  <span className="text-red-400 font-semibold">LIVE</span>
                ) : (
                  <span>-{Math.floor(behind / 60)}:{(Math.floor(behind) % 60).toString().padStart(2, '0')}</span>
                )}
              </div>
            </div>
            
            {/* DVR info text */}
            <div className="text-xs text-gray-300 mt-1 text-center">
              {dvrWindowSec >= 3600 
                ? `${Math.floor(dvrWindowSec / 3600)}h DVR available`
                : `${Math.floor(dvrWindowSec / 60)}m DVR available`
              }
            </div>
          </div>
        </div>
      )}

      {/* Custom DVR Slider Styles */}
      <style jsx>{`
        .slider {
          background: linear-gradient(to right, #ef4444 0%, #ef4444 ${((dvrWindowSec - dvrPosition) / dvrWindowSec) * 100}%, #4b5563 ${((dvrWindowSec - dvrPosition) / dvrWindowSec) * 100}%, #4b5563 100%);
        }
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 14px;
          width: 14px;
          border-radius: 50%;
          background: #ffffff;
          border: 2px solid #ef4444;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .slider::-moz-range-thumb {
          height: 14px;
          width: 14px;
          border-radius: 50%;
          background: #ffffff;
          border: 2px solid #ef4444;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .slider::-webkit-slider-track {
          height: 4px;
          border-radius: 2px;
        }
        .slider::-moz-range-track {
          height: 4px;
          border-radius: 2px;
          background: transparent;
        }
      `}</style>
    </div>
  );
}