import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useStreamStatus } from '../useStreamStatus';
import type { StreamStatus } from '../../types/live';

// Mock socket.io-client
const mockSocket = {
  emit: vi.fn(),
  on: vi.fn(),
  disconnect: vi.fn(),
};

const mockIo = vi.fn(() => mockSocket);

vi.mock('socket.io-client', () => ({
  io: mockIo,
}));

// Mock environment
vi.mock('../../lib/env', () => ({
  getEnv: vi.fn((key: string) => {
    if (key === 'VITE_WS_URL' || key === 'NEXT_PUBLIC_WS_URL') {
      return 'ws://localhost:3001';
    }
    return undefined;
  }),
}));

// Mock constants
vi.mock('../../constants/live', () => ({
  WS_EVENTS: {
    CONTROL_STATUS: 'status',
  },
  CHAT_CONFIG: {
    RECONNECT_ATTEMPTS: 5,
    RECONNECT_DELAY_MS: 1000,
  },
}));

describe('useStreamStatus', () => {
  const mockStreamId = 'test-stream-123';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Reset socket mock
    mockSocket.emit.mockClear();
    mockSocket.on.mockClear();
    mockSocket.disconnect.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with default preview status', () => {
    const { result } = renderHook(() => useStreamStatus(mockStreamId));

    expect(result.current.status).toBe('preview');
    expect(result.current.isConnected).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('initializes with provided initial status', () => {
    const { result } = renderHook(() => useStreamStatus(mockStreamId, 'live'));

    expect(result.current.status).toBe('live');
  });

  it('connects to WebSocket on mount', () => {
    renderHook(() => useStreamStatus(mockStreamId));

    expect(mockIo).toHaveBeenCalledWith('ws://localhost:3001', {
      transports: ['websocket', 'polling'],
      timeout: 5000,
      reconnection: false,
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('join_stream_status', {
      streamId: mockStreamId,
    });
  });

  it('sets up event listeners', () => {
    renderHook(() => useStreamStatus(mockStreamId));

    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('status', expect.any(Function));
  });

  it('updates connection status on connect', () => {
    const { result } = renderHook(() => useStreamStatus(mockStreamId));

    // Simulate connect event
    const connectHandler = mockSocket.on.mock.calls.find(
      call => call[0] === 'connect'
    )?.[1];

    act(() => {
      connectHandler?.();
    });

    expect(result.current.isConnected).toBe(true);
    expect(result.current.error).toBe(null);
  });

  it('updates connection status on disconnect', () => {
    const { result } = renderHook(() => useStreamStatus(mockStreamId));

    // First connect
    const connectHandler = mockSocket.on.mock.calls.find(
      call => call[0] === 'connect'
    )?.[1];

    act(() => {
      connectHandler?.();
    });

    expect(result.current.isConnected).toBe(true);

    // Then disconnect
    const disconnectHandler = mockSocket.on.mock.calls.find(
      call => call[0] === 'disconnect'
    )?.[1];

    act(() => {
      disconnectHandler?.('transport close');
    });

    expect(result.current.isConnected).toBe(false);
  });

  it('handles connection errors', () => {
    const { result } = renderHook(() => useStreamStatus(mockStreamId));

    const errorHandler = mockSocket.on.mock.calls.find(
      call => call[0] === 'connect_error'
    )?.[1];

    act(() => {
      errorHandler?.(new Error('Connection failed'));
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.error).toBe('Connection failed');
  });

  it('updates stream status on status event', () => {
    const { result } = renderHook(() => useStreamStatus(mockStreamId));

    const statusHandler = mockSocket.on.mock.calls.find(
      call => call[0] === 'status'
    )?.[1];

    const statusUpdate = {
      streamId: mockStreamId,
      status: 'live' as StreamStatus,
      timestamp: Date.now(),
    };

    act(() => {
      statusHandler?.(statusUpdate);
    });

    expect(result.current.status).toBe('live');
  });

  it('ignores status updates for different streams', () => {
    const { result } = renderHook(() => useStreamStatus(mockStreamId));

    const statusHandler = mockSocket.on.mock.calls.find(
      call => call[0] === 'status'
    )?.[1];

    const statusUpdate = {
      streamId: 'different-stream',
      status: 'live' as StreamStatus,
      timestamp: Date.now(),
    };

    act(() => {
      statusHandler?.(statusUpdate);
    });

    // Status should remain unchanged
    expect(result.current.status).toBe('preview');
  });

  it('provides disconnect function', () => {
    const { result } = renderHook(() => useStreamStatus(mockStreamId));

    act(() => {
      result.current.disconnect();
    });

    expect(mockSocket.disconnect).toHaveBeenCalled();
    expect(result.current.isConnected).toBe(false);
  });

  it('provides reconnect function', () => {
    const { result } = renderHook(() => useStreamStatus(mockStreamId));

    // First disconnect
    act(() => {
      result.current.disconnect();
    });

    // Clear previous calls
    mockSocket.disconnect.mockClear();
    mockIo.mockClear();

    // Then reconnect
    act(() => {
      result.current.reconnect();
    });

    expect(mockSocket.disconnect).toHaveBeenCalled();
    expect(mockIo).toHaveBeenCalledTimes(1);
  });

  it('attempts reconnection on unexpected disconnect', async () => {
    renderHook(() => useStreamStatus(mockStreamId));

    const disconnectHandler = mockSocket.on.mock.calls.find(
      call => call[0] === 'disconnect'
    )?.[1];

    // Clear initial connection call
    mockIo.mockClear();

    // Simulate unexpected disconnect
    act(() => {
      disconnectHandler?.('transport close');
    });

    // Fast-forward timer for reconnection delay
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Should attempt to reconnect
    expect(mockIo).toHaveBeenCalledTimes(1);
  });

  it('does not reconnect on manual disconnect', () => {
    renderHook(() => useStreamStatus(mockStreamId));

    const disconnectHandler = mockSocket.on.mock.calls.find(
      call => call[0] === 'disconnect'
    )?.[1];

    // Clear initial connection call
    mockIo.mockClear();

    // Simulate manual disconnect
    act(() => {
      disconnectHandler?.('io client disconnect');
    });

    // Fast-forward timer
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Should not attempt to reconnect
    expect(mockIo).not.toHaveBeenCalled();
  });

  it('handles missing WebSocket URL gracefully', () => {
    // Mock getEnv to return undefined
    const { getEnv } = require('../../lib/env');
    getEnv.mockReturnValue(undefined);

    const { result } = renderHook(() => useStreamStatus(mockStreamId));

    expect(result.current.error).toBe('WebSocket not configured');
    expect(mockIo).not.toHaveBeenCalled();

    // Restore mock
    getEnv.mockImplementation((key: string) => {
      if (key === 'VITE_WS_URL' || key === 'NEXT_PUBLIC_WS_URL') {
        return 'ws://localhost:3001';
      }
      return undefined;
    });
  });

  it('stops reconnection attempts after max attempts', () => {
    const { result } = renderHook(() => useStreamStatus(mockStreamId));

    const errorHandler = mockSocket.on.mock.calls.find(
      call => call[0] === 'connect_error'
    )?.[1];

    // Clear initial connection call
    mockIo.mockClear();

    // Simulate 5 connection errors (max attempts)
    for (let i = 0; i < 5; i++) {
      act(() => {
        errorHandler?.(new Error('Connection failed'));
      });

      act(() => {
        vi.advanceTimersByTime(1000 * Math.pow(2, i));
      });
    }

    // Should have attempted 5 reconnections
    expect(mockIo).toHaveBeenCalledTimes(5);

    // One more error should not trigger another reconnection
    act(() => {
      errorHandler?.(new Error('Connection failed'));
    });

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    // Still should be 5 attempts
    expect(mockIo).toHaveBeenCalledTimes(5);
    expect(result.current.error).toBe('Connection lost');
  });

  it('cleans up on unmount', () => {
    const { unmount } = renderHook(() => useStreamStatus(mockStreamId));

    unmount();

    expect(mockSocket.disconnect).toHaveBeenCalled();
  });
});