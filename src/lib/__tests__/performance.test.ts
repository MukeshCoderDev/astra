// Unit tests for performance optimization utilities

import { describe, test, expect, beforeEach, beforeAll, vi } from 'vitest';
import { 
  PerformanceTracker, 
  CDNOptimizer, 
  NetworkMonitor, 
  joinTimeOptimizer 
} from '../performance';
import { PERFORMANCE_TARGETS } from '../../constants/live';

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => 1000),
  mark: vi.fn(),
  measure: vi.fn(),
};

// Mock fetch
global.fetch = vi.fn() as any;

// Mock document
const mockDocument = {
  head: {
    appendChild: vi.fn(),
    removeChild: vi.fn(),
    contains: vi.fn(() => true),
  },
  createElement: vi.fn(() => ({
    rel: '',
    href: '',
    crossOrigin: '',
    as: '',
  })),
  querySelector: vi.fn(),
};

// Mock navigator
const mockNavigator = {
  userAgent: 'test-agent',
  connection: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
    saveData: false,
  },
};

// Setup mocks
beforeAll(() => {
  (global as any).performance = mockPerformance;
  (global as any).document = mockDocument;
  (global as any).navigator = mockNavigator;
});

describe('PerformanceTracker', () => {
  let tracker: PerformanceTracker;

  beforeEach(() => {
    tracker = new PerformanceTracker();
    vi.clearAllMocks();
    mockPerformance.now.mockReturnValue(1000);
  });

  test('should mark performance points', () => {
    tracker.mark('test-mark');
    expect(mockPerformance.now).toHaveBeenCalled();
  });

  test('should measure time between marks', () => {
    mockPerformance.now
      .mockReturnValueOnce(1000) // First mark
      .mockReturnValueOnce(1500); // Second mark

    tracker.mark('start');
    tracker.mark('end');
    
    const duration = tracker.measure('test-measure', 'start', 'end');
    expect(duration).toBe(500);
  });

  test('should handle missing start mark', () => {
    const duration = tracker.measure('test-measure', 'missing-mark');
    expect(duration).toBe(0);
  });

  test('should get all measurements', () => {
    mockPerformance.now
      .mockReturnValueOnce(1000)
      .mockReturnValueOnce(1200);

    tracker.mark('start');
    tracker.mark('end');
    tracker.measure('test', 'start', 'end');

    const measures = tracker.getMeasures();
    expect(measures).toHaveProperty('test', 200);
  });

  test('should clear marks and measures', () => {
    tracker.mark('test');
    tracker.measure('test-measure', 'test');
    tracker.clear();

    const measures = tracker.getMeasures();
    expect(Object.keys(measures)).toHaveLength(0);
  });
});

describe('CDNOptimizer', () => {
  let optimizer: CDNOptimizer;

  beforeEach(() => {
    optimizer = new CDNOptimizer();
    vi.clearAllMocks();
  });

  test('should preconnect to CDN', () => {
    const url = 'https://cdn.example.com/stream.m3u8';
    
    optimizer.preconnect(url);
    
    expect(mockDocument.createElement).toHaveBeenCalledWith('link');
    expect(mockDocument.head.appendChild).toHaveBeenCalled();
  });

  test('should skip duplicate preconnections', () => {
    const url = 'https://cdn.example.com/stream.m3u8';
    
    optimizer.preconnect(url);
    optimizer.preconnect(url); // Should skip this one
    
    // Should only create links once
    expect(mockDocument.createElement).toHaveBeenCalledTimes(2); // preconnect + dns-prefetch
  });

  test('should handle invalid URLs gracefully', () => {
    const invalidUrl = 'not-a-url';
    
    expect(() => optimizer.preconnect(invalidUrl)).not.toThrow();
  });

  test('should preload manifest successfully', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
    } as Response);

    const result = await optimizer.preloadManifest('https://example.com/manifest.m3u8');
    
    expect(result).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com/manifest.m3u8',
      expect.objectContaining({
        method: 'HEAD',
        cache: 'force-cache',
      })
    );
  });

  test('should handle manifest preload failure', async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

    const result = await optimizer.preloadManifest('https://example.com/manifest.m3u8');
    
    expect(result).toBe(false);
  });

  test('should prefetch resources', () => {
    const urls = ['https://example.com/resource1', 'https://example.com/resource2'];
    
    optimizer.prefetchResources(urls);
    
    expect(mockDocument.createElement).toHaveBeenCalledTimes(2);
    expect(mockDocument.head.appendChild).toHaveBeenCalledTimes(2);
  });
});

describe('NetworkMonitor', () => {
  let monitor: NetworkMonitor;

  beforeEach(() => {
    monitor = new NetworkMonitor();
  });

  test('should get connection information', () => {
    const info = monitor.getConnectionInfo();
    
    expect(info).toEqual({
      type: 'unknown',
      effectiveType: '4g',
      downlink: 10,
      rtt: 50,
      saveData: false,
    });
  });

  test('should handle missing connection API', () => {
    const originalConnection = mockNavigator.connection;
    delete (mockNavigator as any).connection;

    const info = monitor.getConnectionInfo();
    
    expect(info).toEqual({
      type: 'unknown',
      effectiveType: 'unknown',
      downlink: 0,
      rtt: 0,
      saveData: false,
    });

    (mockNavigator as any).connection = originalConnection;
  });

  test('should determine if connection is good for streaming', () => {
    expect(monitor.isGoodForLiveStreaming()).toBe(true);

    // Test with poor connection
    mockNavigator.connection.downlink = 0.5;
    expect(monitor.isGoodForLiveStreaming()).toBe(false);

    // Test with high RTT
    mockNavigator.connection.downlink = 10;
    mockNavigator.connection.rtt = 400;
    expect(monitor.isGoodForLiveStreaming()).toBe(false);

    // Test with save data mode
    mockNavigator.connection.rtt = 50;
    mockNavigator.connection.saveData = true;
    expect(monitor.isGoodForLiveStreaming()).toBe(false);
  });

  test('should recommend quality based on connection', () => {
    // High quality connection
    mockNavigator.connection.downlink = 10;
    mockNavigator.connection.saveData = false;
    expect(monitor.getRecommendedQuality()).toBe('high');

    // Medium quality connection
    mockNavigator.connection.downlink = 2;
    expect(monitor.getRecommendedQuality()).toBe('medium');

    // Low quality connection
    mockNavigator.connection.downlink = 0.5;
    expect(monitor.getRecommendedQuality()).toBe('low');

    // Save data mode
    mockNavigator.connection.downlink = 10;
    mockNavigator.connection.saveData = true;
    expect(monitor.getRecommendedQuality()).toBe('low');
  });
});

describe('joinTimeOptimizer', () => {
  test('should optimize HLS config for slow connections', () => {
    const baseConfig = {
      maxBufferLength: 6,
      maxMaxBufferLength: 12,
      manifestLoadingTimeOut: 5000,
      fragLoadingTimeOut: 10000,
    };

    const slowNetworkInfo = {
      effectiveType: '2g',
      rtt: 300,
    };

    const optimized = joinTimeOptimizer.optimizeHLSConfig(baseConfig, slowNetworkInfo);

    expect(optimized.maxBufferLength).toBe(3);
    expect(optimized.maxMaxBufferLength).toBe(6);
    expect(optimized.manifestLoadingTimeOut).toBe(8000);
    expect(optimized.fragLoadingTimeOut).toBe(15000);
  });

  test('should optimize HLS config for fast connections', () => {
    const baseConfig = {
      maxBufferLength: 6,
      maxMaxBufferLength: 12,
    };

    const fastNetworkInfo = {
      effectiveType: '4g',
      rtt: 50,
    };

    const optimized = joinTimeOptimizer.optimizeHLSConfig(baseConfig, fastNetworkInfo);

    expect(optimized.maxBufferLength).toBe(8);
    expect(optimized.maxMaxBufferLength).toBe(16);
  });

  test('should evaluate join time performance', () => {
    // Excellent performance
    let evaluation = joinTimeOptimizer.evaluateJoinTime(500);
    expect(evaluation.status).toBe('excellent');

    // Good performance
    evaluation = joinTimeOptimizer.evaluateJoinTime(1500);
    expect(evaluation.status).toBe('good');

    // Acceptable performance
    evaluation = joinTimeOptimizer.evaluateJoinTime(2500);
    expect(evaluation.status).toBe('acceptable');

    // Slow performance
    evaluation = joinTimeOptimizer.evaluateJoinTime(4000);
    expect(evaluation.status).toBe('slow');

    // Critical performance
    evaluation = joinTimeOptimizer.evaluateJoinTime(6000);
    expect(evaluation.status).toBe('critical');
  });
});