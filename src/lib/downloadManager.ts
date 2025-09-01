/**
 * Download management utilities for offline video caching
 */

export interface CachedVideo {
  id: string;
  title: string;
  poster: string;
  hlsUrl: string;
  durationLabel: string;
  creator: {
    handle: string;
    displayName: string;
  };
  cachedAt: string;
  size?: number;
}

export interface DownloadProgress {
  videoId: string;
  progress: number;
  status: 'downloading' | 'completed' | 'failed' | 'cancelled';
}

const DOWNLOAD_CACHE_NAME = 'astra-downloads-v1';
const MANIFEST_CACHE_NAME = 'astra-manifests-v1';

/**
 * Check if service worker is available and supports caching
 */
export function isDownloadSupported(): boolean {
  return 'serviceWorker' in navigator && 'caches' in window;
}

/**
 * Request to cache a video for offline viewing
 */
export async function requestCache(videoId: string, hlsUrl: string): Promise<boolean> {
  if (!isDownloadSupported()) {
    throw new Error('Downloads are not supported in this browser');
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Send message to service worker to start caching
    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.success) {
          resolve(true);
        } else {
          reject(new Error(event.data.error || 'Failed to cache video'));
        }
      };

      registration.active?.postMessage({
        type: 'CACHE_VIDEO',
        videoId,
        hlsUrl,
      }, [messageChannel.port2]);
    });
  } catch (error) {
    console.error('Failed to request video cache:', error);
    throw error;
  }
}

/**
 * Request to remove cached video
 */
export async function requestUncache(videoId: string): Promise<boolean> {
  if (!isDownloadSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.success) {
          resolve(true);
        } else {
          reject(new Error(event.data.error || 'Failed to remove cached video'));
        }
      };

      registration.active?.postMessage({
        type: 'UNCACHE_VIDEO',
        videoId,
      }, [messageChannel.port2]);
    });
  } catch (error) {
    console.error('Failed to request video uncache:', error);
    throw error;
  }
}

/**
 * Get list of cached videos
 */
export async function getCachedVideos(): Promise<CachedVideo[]> {
  if (!isDownloadSupported()) {
    return [];
  }

  try {
    const cache = await caches.open(MANIFEST_CACHE_NAME);
    const requests = await cache.keys();
    const cachedVideos: CachedVideo[] = [];

    for (const request of requests) {
      const url = new URL(request.url);
      const videoId = url.searchParams.get('videoId');
      
      if (videoId) {
        const response = await cache.match(request);
        if (response) {
          const metadata = await response.json();
          cachedVideos.push({
            id: videoId,
            title: metadata.title || 'Unknown Video',
            poster: metadata.poster || '',
            hlsUrl: metadata.hlsUrl || '',
            durationLabel: metadata.durationLabel || '0:00',
            creator: metadata.creator || { handle: '', displayName: 'Unknown' },
            cachedAt: metadata.cachedAt || new Date().toISOString(),
            size: metadata.size,
          });
        }
      }
    }

    return cachedVideos.sort((a, b) => 
      new Date(b.cachedAt).getTime() - new Date(a.cachedAt).getTime()
    );
  } catch (error) {
    console.error('Failed to get cached videos:', error);
    return [];
  }
}

/**
 * Check if a specific video is cached
 */
export async function isVideoCached(videoId: string): Promise<boolean> {
  if (!isDownloadSupported()) {
    return false;
  }

  try {
    const cache = await caches.open(MANIFEST_CACHE_NAME);
    const request = new Request(`/cached-video-metadata?videoId=${videoId}`);
    const response = await cache.match(request);
    return !!response;
  } catch (error) {
    console.error('Failed to check if video is cached:', error);
    return false;
  }
}

/**
 * Get estimated cache size
 */
export async function getCacheSize(): Promise<number> {
  if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
    return 0;
  }

  try {
    const estimate = await navigator.storage.estimate();
    return estimate.usage || 0;
  } catch (error) {
    console.error('Failed to get cache size:', error);
    return 0;
  }
}

/**
 * Clear all cached videos
 */
export async function clearAllCache(): Promise<void> {
  if (!isDownloadSupported()) {
    return;
  }

  try {
    await Promise.all([
      caches.delete(DOWNLOAD_CACHE_NAME),
      caches.delete(MANIFEST_CACHE_NAME),
    ]);
  } catch (error) {
    console.error('Failed to clear cache:', error);
    throw error;
  }
}

/**
 * Listen for download progress updates
 */
export function onDownloadProgress(callback: (progress: DownloadProgress) => void): () => void {
  const handleMessage = (event: MessageEvent) => {
    if (event.data && event.data.type === 'DOWNLOAD_PROGRESS') {
      callback(event.data.progress);
    }
  };

  navigator.serviceWorker?.addEventListener('message', handleMessage);

  return () => {
    navigator.serviceWorker?.removeEventListener('message', handleMessage);
  };
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Estimate video size based on duration and quality
 */
export function estimateVideoSize(durationSec: number, quality: 'low' | 'medium' | 'high' = 'medium'): number {
  // Rough estimates in bytes per second
  const bitrateMap = {
    low: 500000 / 8,    // 500 kbps
    medium: 1500000 / 8, // 1.5 Mbps  
    high: 3000000 / 8,   // 3 Mbps
  };

  return durationSec * bitrateMap[quality];
}