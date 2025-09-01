import { renderHook, act } from '@testing-library/react';
import {
  debounce,
  throttle,
  useDebounce,
  useThrottle,
  preloadImages,
  getOptimizedImageUrl,
  PerformanceMonitor,
} from '../performanceOptimizations';

// Mock performance API
const mockPerformance = {
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn(),
  now: jest.fn(() => Date.now()),
};

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true,
});

describe('performanceOptimizations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('debounce', () => {
    it('delays function execution', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('test');
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledWith('test');
    });

    it('cancels previous calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('first');
      debouncedFn('second');
      
      jest.advanceTimersByTime(100);
      
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('second');
    });
  });

  describe('throttle', () => {
    it('limits function calls', () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn('first');
      throttledFn('second');
      throttledFn('third');

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('first');

      jest.advanceTimersByTime(100);
      
      throttledFn('fourth');
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenCalledWith('fourth');
    });
  });

  describe('useDebounce', () => {
    it('debounces callback in React component', () => {
      const mockCallback = jest.fn();
      const { result } = renderHook(() => useDebounce(mockCallback, 100));

      act(() => {
        result.current('test');
      });

      expect(mockCallback).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(mockCallback).toHaveBeenCalledWith('test');
    });

    it('cancels previous debounced calls', () => {
      const mockCallback = jest.fn();
      const { result } = renderHook(() => useDebounce(mockCallback, 100));

      act(() => {
        result.current('first');
        result.current('second');
      });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith('second');
    });
  });

  describe('useThrottle', () => {
    it('throttles callback in React component', () => {
      const mockCallback = jest.fn();
      const { result } = renderHook(() => useThrottle(mockCallback, 100));

      act(() => {
        result.current('first');
        result.current('second');
      });

      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith('first');

      act(() => {
        jest.advanceTimersByTime(100);
        result.current('third');
      });

      expect(mockCallback).toHaveBeenCalledTimes(2);
      expect(mockCallback).toHaveBeenCalledWith('third');
    });
  });

  describe('preloadImages', () => {
    it('preloads images successfully', async () => {
      const mockImage = {
        onload: null as any,
        onerror: null as any,
        src: '',
      };

      // Mock Image constructor
      global.Image = jest.fn(() => mockImage) as any;

      const urls = ['image1.jpg', 'image2.jpg'];
      const preloadPromise = preloadImages(urls);

      // Simulate successful image loads
      setTimeout(() => {
        mockImage.onload();
      }, 0);

      await expect(preloadPromise).resolves.toBeDefined();
      expect(global.Image).toHaveBeenCalledTimes(2);
    });

    it('handles image load errors', async () => {
      const mockImage = {
        onload: null as any,
        onerror: null as any,
        src: '',
      };

      global.Image = jest.fn(() => mockImage) as any;

      const urls = ['invalid-image.jpg'];
      const preloadPromise = preloadImages(urls);

      // Simulate image load error
      setTimeout(() => {
        mockImage.onerror();
      }, 0);

      await expect(preloadPromise).rejects.toThrow('Failed to load image');
    });
  });

  describe('getOptimizedImageUrl', () => {
    it('adds optimization parameters to URL', () => {
      const originalUrl = 'https://example.com/image.jpg';
      const optimizedUrl = getOptimizedImageUrl(originalUrl, 800, 600, 90);

      expect(optimizedUrl).toContain('w=800');
      expect(optimizedUrl).toContain('h=600');
      expect(optimizedUrl).toContain('q=90');
    });

    it('returns original URL when no parameters provided', () => {
      const originalUrl = 'https://example.com/image.jpg';
      const optimizedUrl = getOptimizedImageUrl(originalUrl);

      expect(optimizedUrl).toContain('q=80'); // Default quality
    });
  });

  describe('PerformanceMonitor', () => {
    let monitor: PerformanceMonitor;

    beforeEach(() => {
      monitor = PerformanceMonitor.getInstance();
      monitor.clearMetrics();
    });

    it('measures timing correctly', () => {
      mockPerformance.getEntriesByName.mockReturnValue([{ duration: 100 }]);

      monitor.startTiming('test');
      const duration = monitor.endTiming('test');

      expect(mockPerformance.mark).toHaveBeenCalledWith('test-start');
      expect(mockPerformance.mark).toHaveBeenCalledWith('test-end');
      expect(mockPerformance.measure).toHaveBeenCalledWith('test', 'test-start', 'test-end');
      expect(duration).toBe(100);
    });

    it('calculates average time correctly', () => {
      mockPerformance.getEntriesByName.mockReturnValue([{ duration: 100 }]);

      monitor.startTiming('test');
      monitor.endTiming('test');
      
      mockPerformance.getEntriesByName.mockReturnValue([{ duration: 200 }]);
      monitor.startTiming('test');
      monitor.endTiming('test');

      const average = monitor.getAverageTime('test');
      expect(average).toBe(150); // (100 + 200) / 2
    });

    it('returns 0 for unknown metrics', () => {
      const average = monitor.getAverageTime('unknown');
      expect(average).toBe(0);
    });

    it('clears metrics correctly', () => {
      mockPerformance.getEntriesByName.mockReturnValue([{ duration: 100 }]);
      
      monitor.startTiming('test');
      monitor.endTiming('test');
      
      expect(monitor.getAverageTime('test')).toBe(100);
      
      monitor.clearMetrics('test');
      expect(monitor.getAverageTime('test')).toBe(0);
    });

    it('is a singleton', () => {
      const monitor1 = PerformanceMonitor.getInstance();
      const monitor2 = PerformanceMonitor.getInstance();
      
      expect(monitor1).toBe(monitor2);
    });
  });

  describe('performance when performance API is not available', () => {
    it('handles missing performance API gracefully', () => {
      const originalPerformance = global.performance;
      // @ts-ignore
      delete global.performance;

      const monitor = PerformanceMonitor.getInstance();
      monitor.startTiming('test');
      const duration = monitor.endTiming('test');

      expect(duration).toBe(0);

      global.performance = originalPerformance;
    });
  });
});