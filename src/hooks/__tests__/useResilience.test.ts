// Tests for resilience hooks

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { 
  useNetworkStatus, 
  useResilientApi, 
  useResilientWebSocket,
  useOfflineHandler,
  useErrorRecovery 
} from '../useResilience';

// Mock the resilience module
vi.mock('../../lib/resilience', () => ({
  withRetry: vi.fn((fn) => fn()),
  networkMonitor: {
    onStatusChange: vi.fn((callback) => {
      // Return unsubscribe function
      return () => {};
    }),
    waitForConnection: vi.fn(() => Promise.resolve(true)),
  },
  errorRecoveryStrategies: {
    websocketRecovery: {
      reconnect: vi.fn(() => Promise.resolve({})),
    },
  },
}));

// Mock ErrorBoundary
vi.mock('../../components/common/ErrorBoundary', () => ({
  useErrorHandler: () => ({
    reportError: vi.fn(),
  }),
}));

describe('useNetworkStatus', () => {
  let originalOnLine: boolean;

  beforeEach(() => {
    originalOnLine = navigator.onLine;
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', {
      value: originalOnLine,
      writable: true,
    });
  });

  test('should return initial online status', () => {
    const { result } = renderHook(() => useNetworkStatus());
    
    expect(result.current.isOnline).toBe(navigator.onLine);
    expect(result.current.reconnectAttempts).toBe(0);
  });

  test('should provide waitForConnection function', () => {
    const { result } = renderHook(() => useNetworkStatus());
    
    expect(typeof result.current.waitForConnection).toBe('function');
  });
});

describe('useResilientApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should handle successful API call', async () => {
    const { result } = renderHook(() => useResilientApi());
    
    const mockApiCall = vi.fn().mockResolvedValue('success');
    
    await act(async () => {
      const response = await result.current.execute(mockApiCall);
      expect(response).toBe('success');
    });
    
    expect(result.current.data).toBe('success');
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  test('should handle API call errors', async () => {
    const { result } = renderHook(() => useResilientApi());
    
    const mockError = new Error('API Error');
    const mockApiCall = vi.fn().mockRejectedValue(mockError);
    
    await act(async () => {
      try {
        await result.current.execute(mockApiCall);
      } catch (error) {
        // Expected to throw
      }
    });
    
    expect(result.current.error).toEqual(mockError);
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  test('should reset state', async () => {
    const { result } = renderHook(() => useResilientApi());
    
    // Set some state first
    const mockApiCall = vi.fn().mockResolvedValue('success');
    await act(async () => {
      await result.current.execute(mockApiCall);
    });
    
    // Reset
    act(() => {
      result.current.reset();
    });
    
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});

describe('useResilientWebSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should initialize with disconnected state', () => {
    const { result } = renderHook(() => 
      useResilientWebSocket('ws://localhost:8080')
    );
    
    expect(result.current.connectionState).toBe('disconnected');
    expect(result.current.isConnected).toBe(false);
    expect(result.current.reconnectAttempts).toBe(0);
  });

  test('should provide connection methods', () => {
    const { result } = renderHook(() => 
      useResilientWebSocket('ws://localhost:8080')
    );
    
    expect(typeof result.current.connect).toBe('function');
    expect(typeof result.current.disconnect).toBe('function');
    expect(typeof result.current.sendMessage).toBe('function');
  });

  test('should handle connection', async () => {
    const mockWs = { readyState: 1 }; // WebSocket.OPEN
    const { errorRecoveryStrategies } = await import('../../lib/resilience');
    vi.mocked(errorRecoveryStrategies.websocketRecovery.reconnect).mockResolvedValue(mockWs as any);

    const { result } = renderHook(() => 
      useResilientWebSocket('ws://localhost:8080')
    );
    
    await act(async () => {
      await result.current.connect();
    });
    
    expect(result.current.connectionState).toBe('connected');
    expect(result.current.isConnected).toBe(true);
  });
});

describe('useOfflineHandler', () => {
  let originalOnLine: boolean;

  beforeEach(() => {
    originalOnLine = navigator.onLine;
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', {
      value: originalOnLine,
      writable: true,
    });
  });

  test('should call onOffline when going offline', async () => {
    const onOffline = vi.fn();
    const onOnline = vi.fn();
    
    // Start online
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
    
    const { result, rerender } = renderHook(() => 
      useOfflineHandler({ onOffline, onOnline })
    );
    
    expect(result.current.isOnline).toBe(true);
    expect(result.current.wasOffline).toBe(false);
    
    // Go offline
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    
    // Mock the network status change
    const { networkMonitor } = await import('../../lib/resilience');
    const callback = vi.mocked(networkMonitor.onStatusChange).mock.calls[0]?.[0];
    if (callback) {
      act(() => {
        callback(false);
      });
    }
    
    rerender();
    
    await waitFor(() => {
      expect(onOffline).toHaveBeenCalled();
    });
  });
});

describe('useErrorRecovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should initialize with default state', () => {
    const { result } = renderHook(() => useErrorRecovery());
    
    expect(result.current.isRecovering).toBe(false);
    expect(result.current.recoveryAttempts).toBe(0);
    expect(result.current.lastError).toBeNull();
  });

  test('should handle successful recovery', async () => {
    const { result } = renderHook(() => useErrorRecovery());
    
    const mockRecoveryFn = vi.fn().mockResolvedValue(undefined);
    const mockError = new Error('Test error');
    
    await act(async () => {
      const success = await result.current.recover(mockRecoveryFn, mockError);
      expect(success).toBe(true);
    });
    
    expect(result.current.isRecovering).toBe(false);
    expect(result.current.lastError).toBeNull();
    expect(mockRecoveryFn).toHaveBeenCalled();
  });

  test('should handle failed recovery', async () => {
    const { result } = renderHook(() => useErrorRecovery());
    
    const mockRecoveryFn = vi.fn().mockRejectedValue(new Error('Recovery failed'));
    const mockError = new Error('Test error');
    
    await act(async () => {
      const success = await result.current.recover(mockRecoveryFn, mockError);
      expect(success).toBe(false);
    });
    
    expect(result.current.isRecovering).toBe(false);
    expect(result.current.lastError).toEqual(expect.any(Error));
  });

  test('should reset state', () => {
    const { result } = renderHook(() => useErrorRecovery());
    
    act(() => {
      result.current.reset();
    });
    
    expect(result.current.isRecovering).toBe(false);
    expect(result.current.recoveryAttempts).toBe(0);
    expect(result.current.lastError).toBeNull();
  });
});