// Unit tests for resilience utilities

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  withRetry, 
  CircuitBreaker, 
  NetworkStatusMonitor,
  GracefulDegradation,
  errorRecoveryStrategies 
} from '../resilience';

describe('withRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should succeed on first attempt', async () => {
    const mockFn = vi.fn().mockResolvedValue('success');
    
    const result = await withRetry(mockFn);
    
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test('should retry on network errors', async () => {
    const mockFn = vi.fn()
      .mockRejectedValueOnce(new Error('NetworkError'))
      .mockResolvedValue('success');
    
    const result = await withRetry(mockFn, { maxAttempts: 3 });
    
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  test('should not retry on non-retryable errors', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('ValidationError'));
    
    await expect(withRetry(mockFn, {
      retryCondition: (error) => error.message.includes('Network')
    })).rejects.toThrow('ValidationError');
    
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test('should respect max attempts', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('NetworkError'));
    
    await expect(withRetry(mockFn, { maxAttempts: 2 })).rejects.toThrow('NetworkError');
    
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  test('should call onRetry callback', async () => {
    const mockFn = vi.fn()
      .mockRejectedValueOnce(new Error('NetworkError'))
      .mockResolvedValue('success');
    const onRetry = vi.fn();
    
    await withRetry(mockFn, { onRetry });
    
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
  });
});

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker({
      failureThreshold: 2,
      recoveryTimeout: 1000,
      monitoringPeriod: 5000,
    });
  });

  test('should start in closed state', () => {
    const state = circuitBreaker.getState();
    expect(state.state).toBe('closed');
    expect(state.failures).toBe(0);
  });

  test('should open after failure threshold', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Service error'));
    
    // First failure
    await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
    expect(circuitBreaker.getState().state).toBe('closed');
    
    // Second failure - should open circuit
    await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
    expect(circuitBreaker.getState().state).toBe('open');
  });

  test('should reject immediately when open', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Service error'));
    
    // Trigger failures to open circuit
    await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
    await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
    
    // Should now reject immediately
    await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('Circuit breaker is open');
    expect(mockFn).toHaveBeenCalledTimes(2); // Not called the third time
  });

  test('should reset on success', async () => {
    const mockFn = vi.fn()
      .mockRejectedValueOnce(new Error('Service error'))
      .mockResolvedValue('success');
    
    // One failure
    await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
    expect(circuitBreaker.getState().failures).toBe(1);
    
    // Success should reset
    const result = await circuitBreaker.execute(mockFn);
    expect(result).toBe('success');
    expect(circuitBreaker.getState().failures).toBe(0);
    expect(circuitBreaker.getState().state).toBe('closed');
  });
});

describe('NetworkStatusMonitor', () => {
  let monitor: NetworkStatusMonitor;
  let originalOnLine: boolean;

  beforeEach(() => {
    originalOnLine = navigator.onLine;
    monitor = new NetworkStatusMonitor();
  });

  afterEach(() => {
    monitor.destroy();
    Object.defineProperty(navigator, 'onLine', {
      value: originalOnLine,
      writable: true,
    });
  });

  test('should detect initial online status', () => {
    const status = monitor.getStatus();
    expect(status.isOnline).toBe(navigator.onLine);
  });

  test('should notify listeners on status change', () => {
    const listener = vi.fn();
    monitor.onStatusChange(listener);
    
    // Simulate going offline
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    window.dispatchEvent(new Event('offline'));
    
    expect(listener).toHaveBeenCalledWith(false);
  });

  test('should unsubscribe listeners', () => {
    const listener = vi.fn();
    const unsubscribe = monitor.onStatusChange(listener);
    
    unsubscribe();
    
    // Simulate status change
    window.dispatchEvent(new Event('online'));
    
    expect(listener).not.toHaveBeenCalled();
  });

  test('should wait for connection', async () => {
    // Start offline
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    
    const connectionPromise = monitor.waitForConnection(100);
    
    // Go online after a delay
    setTimeout(() => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
      window.dispatchEvent(new Event('online'));
    }, 50);
    
    const result = await connectionPromise;
    expect(result).toBe(true);
  });

  test('should timeout when waiting for connection', async () => {
    // Stay offline
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    
    const result = await monitor.waitForConnection(100);
    expect(result).toBe(false);
  });
});

describe('GracefulDegradation', () => {
  let degradation: GracefulDegradation;

  beforeEach(() => {
    degradation = new GracefulDegradation();
  });

  test('should register and check features', () => {
    degradation.registerFeature('webgl', () => true);
    
    expect(degradation.isFeatureAvailable('webgl')).toBe(true);
    expect(degradation.isFeatureAvailable('nonexistent')).toBe(false);
  });

  test('should use feature when available', () => {
    degradation.registerFeature('webgl', () => true);
    
    const feature = () => 'webgl-result';
    const result = degradation.getFeatureOrFallback('webgl', feature);
    
    expect(result).toBe('webgl-result');
  });

  test('should use fallback when feature unavailable', () => {
    degradation.registerFeature('webgl', () => false, () => 'canvas-fallback');
    
    const feature = () => 'webgl-result';
    const result = degradation.getFeatureOrFallback('webgl', feature);
    
    expect(result).toBe('canvas-fallback');
  });

  test('should use fallback when feature throws error', () => {
    degradation.registerFeature('webgl', () => true, () => 'canvas-fallback');
    
    const feature = () => { throw new Error('WebGL error'); };
    const result = degradation.getFeatureOrFallback('webgl', feature);
    
    expect(result).toBe('canvas-fallback');
  });
});

describe('errorRecoveryStrategies', () => {
  describe('websocketRecovery', () => {
    test('should reconnect successfully', async () => {
      const mockWs = {
        onopen: null as any,
        onerror: null as any,
        close: vi.fn(),
      };
      
      const createConnection = vi.fn().mockReturnValue(mockWs);
      const onReconnect = vi.fn();
      
      const reconnectPromise = errorRecoveryStrategies.websocketRecovery.reconnect(
        createConnection,
        onReconnect
      );
      
      // Simulate successful connection
      setTimeout(() => {
        if (mockWs.onopen) mockWs.onopen();
      }, 10);
      
      const result = await reconnectPromise;
      
      expect(result).toBe(mockWs);
      expect(onReconnect).toHaveBeenCalled();
    });

    test('should handle connection timeout', async () => {
      const mockWs = {
        onopen: null as any,
        onerror: null as any,
        close: vi.fn(),
      };
      
      const createConnection = vi.fn().mockReturnValue(mockWs);
      
      const reconnectPromise = errorRecoveryStrategies.websocketRecovery.reconnect(
        createConnection
      );
      
      // Don't trigger onopen - should timeout
      
      await expect(reconnectPromise).rejects.toThrow('WebSocket connection timeout');
      expect(mockWs.close).toHaveBeenCalled();
    });
  });

  describe('apiRecovery', () => {
    test('should retry on 500 errors', async () => {
      const mockRequest = vi.fn()
        .mockRejectedValueOnce({ status: 500 })
        .mockResolvedValue('success');
      
      const result = await errorRecoveryStrategies.apiRecovery.recoverFromError(
        { status: 500 },
        mockRequest
      );
      
      expect(result).toBe('success');
      expect(mockRequest).toHaveBeenCalledTimes(2);
    });

    test('should handle rate limiting', async () => {
      vi.useFakeTimers();
      
      const mockRequest = vi.fn().mockResolvedValue('success');
      
      const recoveryPromise = errorRecoveryStrategies.apiRecovery.recoverFromError(
        { status: 429, headers: { 'retry-after': '1' } },
        mockRequest
      );
      
      // Fast-forward time
      vi.advanceTimersByTime(1000);
      
      const result = await recoveryPromise;
      
      expect(result).toBe('success');
      expect(mockRequest).toHaveBeenCalled();
      
      vi.useRealTimers();
    });

    test('should not retry on 401 errors', async () => {
      const mockRequest = vi.fn();
      
      await expect(
        errorRecoveryStrategies.apiRecovery.recoverFromError(
          { status: 401 },
          mockRequest
        )
      ).rejects.toMatchObject({ status: 401 });
      
      expect(mockRequest).not.toHaveBeenCalled();
    });
  });
});