import {
  isDownloadSupported,
  requestCache,
  requestUncache,
  getCachedVideos,
  isVideoCached,
  getCacheSize,
  clearAllCache,
  formatBytes,
  estimateVideoSize,
} from '../downloadManager';

// Mock service worker and caches
const mockServiceWorker = {
  ready: Promise.resolve({
    active: {
      postMessage: jest.fn(),
    },
  }),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

const mockCaches = {
  open: jest.fn(),
  delete: jest.fn(),
  keys: jest.fn(),
};

const mockCache = {
  match: jest.fn(),
  put: jest.fn(),
  keys: jest.fn(),
};

// Mock navigator
Object.defineProperty(global, 'navigator', {
  value: {
    serviceWorker: mockServiceWorker,
    storage: {
      estimate: jest.fn(),
    },
  },
  writable: true,
});

Object.defineProperty(global, 'caches', {
  value: mockCaches,
  writable: true,
});

Object.defineProperty(global, 'MessageChannel', {
  value: class MessageChannel {
    port1 = { onmessage: null };
    port2 = {};
  },
  writable: true,
});

describe('downloadManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCaches.open.mockResolvedValue(mockCache);
  });

  describe('isDownloadSupported', () => {
    it('returns true when service worker and caches are supported', () => {
      expect(isDownloadSupported()).toBe(true);
    });

    it('returns false when service worker is not supported', () => {
      const originalServiceWorker = global.navigator.serviceWorker;
      // @ts-ignore
      delete global.navigator.serviceWorker;
      
      expect(isDownloadSupported()).toBe(false);
      
      global.navigator.serviceWorker = originalServiceWorker;
    });

    it('returns false when caches are not supported', () => {
      const originalCaches = global.caches;
      // @ts-ignore
      delete global.caches;
      
      expect(isDownloadSupported()).toBe(false);
      
      global.caches = originalCaches;
    });
  });

  describe('requestCache', () => {
    it('successfully requests video caching', async () => {
      const mockPostMessage = jest.fn();
      mockServiceWorker.ready = Promise.resolve({
        active: { postMessage: mockPostMessage },
      });

      // Mock successful response
      setTimeout(() => {
        const messageChannel = mockPostMessage.mock.calls[0][1][0];
        messageChannel.port1.onmessage({ data: { success: true } });
      }, 0);

      const result = await requestCache('video-1', 'https://example.com/video.m3u8');
      
      expect(result).toBe(true);
      expect(mockPostMessage).toHaveBeenCalledWith(
        {
          type: 'CACHE_VIDEO',
          videoId: 'video-1',
          hlsUrl: 'https://example.com/video.m3u8',
        },
        expect.any(Array)
      );
    });

    it('throws error when caching fails', async () => {
      const mockPostMessage = jest.fn();
      mockServiceWorker.ready = Promise.resolve({
        active: { postMessage: mockPostMessage },
      });

      // Mock error response
      setTimeout(() => {
        const messageChannel = mockPostMessage.mock.calls[0][1][0];
        messageChannel.port1.onmessage({ data: { success: false, error: 'Network error' } });
      }, 0);

      await expect(requestCache('video-1', 'https://example.com/video.m3u8'))
        .rejects.toThrow('Network error');
    });

    it('throws error when downloads are not supported', async () => {
      const originalServiceWorker = global.navigator.serviceWorker;
      // @ts-ignore
      delete global.navigator.serviceWorker;

      await expect(requestCache('video-1', 'https://example.com/video.m3u8'))
        .rejects.toThrow('Downloads are not supported in this browser');

      global.navigator.serviceWorker = originalServiceWorker;
    });
  });

  describe('requestUncache', () => {
    it('successfully requests video uncaching', async () => {
      const mockPostMessage = jest.fn();
      mockServiceWorker.ready = Promise.resolve({
        active: { postMessage: mockPostMessage },
      });

      // Mock successful response
      setTimeout(() => {
        const messageChannel = mockPostMessage.mock.calls[0][1][0];
        messageChannel.port1.onmessage({ data: { success: true } });
      }, 0);

      const result = await requestUncache('video-1');
      
      expect(result).toBe(true);
      expect(mockPostMessage).toHaveBeenCalledWith(
        {
          type: 'UNCACHE_VIDEO',
          videoId: 'video-1',
        },
        expect.any(Array)
      );
    });

    it('returns false when downloads are not supported', async () => {
      const originalServiceWorker = global.navigator.serviceWorker;
      // @ts-ignore
      delete global.navigator.serviceWorker;

      const result = await requestUncache('video-1');
      expect(result).toBe(false);

      global.navigator.serviceWorker = originalServiceWorker;
    });
  });

  describe('getCachedVideos', () => {
    it('returns cached videos list', async () => {
      const mockRequests = [
        { url: 'https://example.com/cached-video-metadata?videoId=video-1' },
        { url: 'https://example.com/cached-video-metadata?videoId=video-2' },
      ];

      const mockResponses = [
        {
          json: () => Promise.resolve({
            id: 'video-1',
            title: 'Video 1',
            poster: 'https://example.com/poster1.jpg',
            hlsUrl: 'https://example.com/video1.m3u8',
            durationLabel: '5:30',
            creator: { handle: '@creator1', displayName: 'Creator 1' },
            cachedAt: '2024-01-01T00:00:00Z',
          }),
        },
        {
          json: () => Promise.resolve({
            id: 'video-2',
            title: 'Video 2',
            poster: 'https://example.com/poster2.jpg',
            hlsUrl: 'https://example.com/video2.m3u8',
            durationLabel: '3:45',
            creator: { handle: '@creator2', displayName: 'Creator 2' },
            cachedAt: '2024-01-02T00:00:00Z',
          }),
        },
      ];

      mockCache.keys.mockResolvedValue(mockRequests);
      mockCache.match.mockImplementation((request) => {
        const url = new URL(request.url);
        const videoId = url.searchParams.get('videoId');
        return Promise.resolve(mockResponses.find(r => r.json().then(data => data.id === videoId)));
      });

      const videos = await getCachedVideos();
      
      expect(videos).toHaveLength(2);
      expect(videos[0].title).toBe('Video 2'); // Should be sorted by cachedAt desc
      expect(videos[1].title).toBe('Video 1');
    });

    it('returns empty array when downloads are not supported', async () => {
      const originalCaches = global.caches;
      // @ts-ignore
      delete global.caches;

      const videos = await getCachedVideos();
      expect(videos).toEqual([]);

      global.caches = originalCaches;
    });

    it('handles errors gracefully', async () => {
      mockCaches.open.mockRejectedValue(new Error('Cache error'));

      const videos = await getCachedVideos();
      expect(videos).toEqual([]);
    });
  });

  describe('isVideoCached', () => {
    it('returns true when video is cached', async () => {
      mockCache.match.mockResolvedValue({ json: () => ({}) });

      const result = await isVideoCached('video-1');
      expect(result).toBe(true);
    });

    it('returns false when video is not cached', async () => {
      mockCache.match.mockResolvedValue(null);

      const result = await isVideoCached('video-1');
      expect(result).toBe(false);
    });

    it('returns false when downloads are not supported', async () => {
      const originalCaches = global.caches;
      // @ts-ignore
      delete global.caches;

      const result = await isVideoCached('video-1');
      expect(result).toBe(false);

      global.caches = originalCaches;
    });
  });

  describe('getCacheSize', () => {
    it('returns cache size when storage API is supported', async () => {
      global.navigator.storage.estimate = jest.fn().mockResolvedValue({ usage: 1024000 });

      const size = await getCacheSize();
      expect(size).toBe(1024000);
    });

    it('returns 0 when storage API is not supported', async () => {
      const originalStorage = global.navigator.storage;
      // @ts-ignore
      delete global.navigator.storage;

      const size = await getCacheSize();
      expect(size).toBe(0);

      global.navigator.storage = originalStorage;
    });

    it('handles errors gracefully', async () => {
      global.navigator.storage.estimate = jest.fn().mockRejectedValue(new Error('Storage error'));

      const size = await getCacheSize();
      expect(size).toBe(0);
    });
  });

  describe('clearAllCache', () => {
    it('successfully clears all caches', async () => {
      await clearAllCache();

      expect(mockCaches.delete).toHaveBeenCalledWith('astra-downloads-v1');
      expect(mockCaches.delete).toHaveBeenCalledWith('astra-manifests-v1');
    });

    it('handles errors gracefully', async () => {
      mockCaches.delete.mockRejectedValue(new Error('Delete error'));

      await expect(clearAllCache()).rejects.toThrow('Delete error');
    });
  });

  describe('formatBytes', () => {
    it('formats bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1048576)).toBe('1 MB');
      expect(formatBytes(1073741824)).toBe('1 GB');
      expect(formatBytes(1536)).toBe('1.5 KB');
    });
  });

  describe('estimateVideoSize', () => {
    it('estimates video size correctly for different qualities', () => {
      const duration = 300; // 5 minutes

      expect(estimateVideoSize(duration, 'low')).toBe(18750000); // 500kbps
      expect(estimateVideoSize(duration, 'medium')).toBe(56250000); // 1.5Mbps
      expect(estimateVideoSize(duration, 'high')).toBe(112500000); // 3Mbps
    });

    it('uses medium quality as default', () => {
      const duration = 300;
      expect(estimateVideoSize(duration)).toBe(estimateVideoSize(duration, 'medium'));
    });
  });
});