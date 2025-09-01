/**
 * Graceful degradation utilities for handling API failures
 */

import { Video, HistoryItem, Playlist, UploadItem } from '../types';

/**
 * Fallback data generators for when APIs fail
 */
export class FallbackDataGenerator {
  /**
   * Generate fallback video data
   */
  static generateFallbackVideos(count: number = 8): Video[] {
    const fallbackVideos: Video[] = [];
    
    for (let i = 0; i < count; i++) {
      fallbackVideos.push({
        id: `fallback-${i}`,
        title: `Sample Video ${i + 1}`,
        hlsUrl: '/placeholder-video.m3u8',
        poster: `/placeholder-thumbnail-${(i % 4) + 1}.jpg`,
        durationSec: 300 + (i * 60),
        durationLabel: `${Math.floor((300 + i * 60) / 60)}:${String((300 + i * 60) % 60).padStart(2, '0')}`,
        views: Math.floor(Math.random() * 10000) + 100,
        age: `${Math.floor(Math.random() * 30) + 1} days ago`,
        creator: {
          id: `creator-${i % 3}`,
          handle: `@creator${i % 3 + 1}`,
        },
        liked: false,
        watchLater: false,
        tags: ['sample', 'fallback'],
      });
    }
    
    return fallbackVideos;
  }

  /**
   * Generate fallback history data
   */
  static generateFallbackHistory(count: number = 6): HistoryItem[] {
    const videos = this.generateFallbackVideos(count);
    
    return videos.map((video, index) => ({
      id: `history-${video.id}`,
      video,
      watchedAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
      progressPct: Math.floor(Math.random() * 80) + 20,
    }));
  }

  /**
   * Generate fallback playlist data
   */
  static generateFallbackPlaylists(count: number = 4): Playlist[] {
    const playlists: Playlist[] = [];
    
    for (let i = 0; i < count; i++) {
      playlists.push({
        id: `playlist-${i}`,
        title: `Sample Playlist ${i + 1}`,
        videoCount: Math.floor(Math.random() * 20) + 5,
        updatedAt: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString(),
        cover: `/placeholder-thumbnail-${(i % 4) + 1}.jpg`,
      });
    }
    
    return playlists;
  }

  /**
   * Generate fallback upload data
   */
  static generateFallbackUploads(count: number = 5): UploadItem[] {
    const videos = this.generateFallbackVideos(count);
    const statuses: Array<'processing' | 'live' | 'published' | 'failed'> = 
      ['published', 'published', 'live', 'processing', 'failed'];
    
    return videos.map((video, index) => ({
      video,
      status: statuses[index % statuses.length],
      views: Math.floor(Math.random() * 5000) + 50,
      uploadedAt: new Date(Date.now() - index * 2 * 24 * 60 * 60 * 1000).toISOString(),
    }));
  }
}

/**
 * API wrapper with graceful degradation
 */
export class GracefulAPI {
  /**
   * Fetch with automatic fallback to mock data
   */
  static async fetchWithFallback<T>(
    url: string,
    options: RequestInit = {},
    fallbackGenerator: () => T,
    fallbackDelay: number = 1000
  ): Promise<T> {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.warn(`API call failed for ${url}, using fallback data:`, error);
      
      // Add a small delay to simulate network request
      await new Promise(resolve => setTimeout(resolve, fallbackDelay));
      
      return fallbackGenerator();
    }
  }

  /**
   * Fetch videos with fallback
   */
  static async fetchVideos(
    endpoint: string,
    options: RequestInit = {},
    count: number = 8
  ): Promise<{ items: Video[]; hasMore: boolean; nextPage?: number }> {
    return this.fetchWithFallback(
      endpoint,
      options,
      () => ({
        items: FallbackDataGenerator.generateFallbackVideos(count),
        hasMore: false,
        nextPage: undefined,
      })
    );
  }

  /**
   * Fetch history with fallback
   */
  static async fetchHistory(
    endpoint: string,
    options: RequestInit = {},
    count: number = 6
  ): Promise<{ items: HistoryItem[]; hasMore: boolean; nextPage?: number }> {
    return this.fetchWithFallback(
      endpoint,
      options,
      () => ({
        items: FallbackDataGenerator.generateFallbackHistory(count),
        hasMore: false,
        nextPage: undefined,
      })
    );
  }

  /**
   * Fetch playlists with fallback
   */
  static async fetchPlaylists(
    endpoint: string,
    options: RequestInit = {},
    count: number = 4
  ): Promise<{ items: Playlist[]; hasMore: boolean; nextPage?: number }> {
    return this.fetchWithFallback(
      endpoint,
      options,
      () => ({
        items: FallbackDataGenerator.generateFallbackPlaylists(count),
        hasMore: false,
        nextPage: undefined,
      })
    );
  }
}

/**
 * Feature availability checker
 */
export class FeatureAvailability {
  private static cache = new Map<string, { available: boolean; lastCheck: number }>();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Check if a feature/API endpoint is available
   */
  static async isAvailable(endpoint: string): Promise<boolean> {
    const cached = this.cache.get(endpoint);
    const now = Date.now();
    
    // Return cached result if still valid
    if (cached && (now - cached.lastCheck) < this.CACHE_DURATION) {
      return cached.available;
    }

    try {
      const response = await fetch(endpoint, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000), // 5 second timeout for availability check
      });
      
      const available = response.ok;
      this.cache.set(endpoint, { available, lastCheck: now });
      return available;
    } catch (error) {
      console.warn(`Feature availability check failed for ${endpoint}:`, error);
      this.cache.set(endpoint, { available: false, lastCheck: now });
      return false;
    }
  }

  /**
   * Clear availability cache
   */
  static clearCache(): void {
    this.cache.clear();
  }
}

/**
 * Progressive enhancement utilities
 */
export class ProgressiveEnhancement {
  /**
   * Check if browser supports required features
   */
  static checkBrowserSupport(): {
    intersectionObserver: boolean;
    serviceWorker: boolean;
    webGL: boolean;
    localStorage: boolean;
  } {
    return {
      intersectionObserver: 'IntersectionObserver' in window,
      serviceWorker: 'serviceWorker' in navigator,
      webGL: !!document.createElement('canvas').getContext('webgl'),
      localStorage: (() => {
        try {
          const test = '__localStorage_test__';
          localStorage.setItem(test, test);
          localStorage.removeItem(test);
          return true;
        } catch {
          return false;
        }
      })(),
    };
  }

  /**
   * Get optimal configuration based on browser capabilities
   */
  static getOptimalConfig() {
    const support = this.checkBrowserSupport();
    
    return {
      useIntersectionObserver: support.intersectionObserver,
      enableOfflineFeatures: support.serviceWorker,
      enableAdvancedGraphics: support.webGL,
      enablePersistence: support.localStorage,
      // Reduce features for older browsers
      maxConcurrentRequests: support.intersectionObserver ? 6 : 3,
      enableVirtualization: support.intersectionObserver,
    };
  }
}