import { renderHook, act, waitFor } from '@testing-library/react';
import { useLiveControl } from '../useLiveControl';
import { ENV } from '../../lib/env';
import { liveApi } from '../../lib/api';
import { WS_EVENTS } from '../../constants/live';

// Mock socket.io-client
const mockSocket = {
  connected: false,
  on: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn(),
};

const mockIo = jest.fn(() => mockSocket);

jest.mock('socket.io-client', () => ({
  io: mockIo,
}));

// Mock environment
jest.mock('../../lib/env', () => ({
  ENV: {
    WS_URL: 'ws://localhost:3001',
  },
}));

// Mock API
jest.mock('../../lib/api', () => ({
  liveApi: {
    getCreatorStream: jest.fn(),
    getStats: jest.fn(),
  },
}));

describe('useLiveControl', () => {
  const streamId = 'test-stream-123';
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockSocket.connected = false;
    
    // Reset mock implementations
    (liveApi.getCreatorStream as jest.Mock).mockResolvedValue({
      ok: true,
      data: {
        healthMetrics: {
          viewerCount: 100,
          bitrateKbps: 2500,
          fps: 30,
          dropRate: 0.1,
          timestamp: Date.now(),
        },
        viewerCount: 100,
      },
    });
    
    (liveApi.getStats as jest.Mock).mockResolvedValue({
      ok: true,
      data: {
        viewerCount: 100,
        bitrateKbps: 2500,
        fps: 30,
        dropRate: 0.1,
      },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useLiveControl(streamId));

    expect(result.current.loading).toBe(true);
    expect(result.current.connected).toBe(false);
    expect(result.current.failed).toBe(false);
    expect(result.current.healthMetrics).toBeNull();
    expect(result.current.viewerCount).toBe(0);
  });

  it('should establish WebSocket connection on mount', () => {
    renderHook(() => useLiveControl(streamId));

    expect(mockIo).toHaveBeenCalledWith(ENV.WS_URL, {
      path: "/control",
      transports: ["websocket"],
      reconnectionAttempts: expect.any(Number),
      reconnectionDelay: expect.any(Number),
      timeout: 10000,
    });
  });

  it('should join control room on connection', () => {
    const { result } = renderHook(() => useLiveControl(streamId));

    // Simulate connection
    act(() => {
      const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
      connectHandler();
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('join_control', { streamId });
    expect(result.current.connected).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.failed).toBe(false);
  });

  it('should handle health metrics updates', () => {
    const { result } = renderHook(() => useLiveControl(streamId));

    const healthMetrics = {
      viewerCount: 150,
      bitrateKbps: 3000,
      fps: 60,
      dropRate: 0.05,
      timestamp: Date.now(),
    };

    act(() => {
      const healthHandler = mockSocket.on.mock.calls.find(call => call[0] === WS_EVENTS.CONTROL_HEALTH)[1];
      healthHandler(healthMetrics);
    });

    expect(result.current.healthMetrics).toEqual(healthMetrics);
    expect(result.current.viewerCount).toBe(150);
  });

  it('should handle viewer count updates', () => {
    const { result } = renderHook(() => useLiveControl(streamId));

    act(() => {
      const viewersHandler = mockSocket.on.mock.calls.find(call => call[0] === WS_EVENTS.CONTROL_VIEWERS)[1];
      viewersHandler({ count: 200 });
    });

    expect(result.current.viewerCount).toBe(200);
  });

  it('should start polling fallback on connection error', async () => {
    jest.useFakeTimers();
    
    const { result } = renderHook(() => useLiveControl(streamId));

    act(() => {
      const errorHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect_error')[1];
      errorHandler(new Error('Connection failed'));
    });

    expect(result.current.failed).toBe(true);
    expect(result.current.connected).toBe(false);

    // Fast-forward to trigger polling
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(liveApi.getCreatorStream).toHaveBeenCalledWith(streamId);
      expect(liveApi.getStats).toHaveBeenCalledWith(streamId);
    });

    jest.useRealTimers();
  });

  it('should handle polling fallback data', async () => {
    jest.useFakeTimers();
    
    const { result } = renderHook(() => useLiveControl(streamId));

    // Trigger connection error to start polling
    act(() => {
      const errorHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect_error')[1];
      errorHandler(new Error('Connection failed'));
    });

    // Fast-forward to trigger polling
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(result.current.healthMetrics).toEqual(expect.objectContaining({
        viewerCount: 100,
        bitrateKbps: 2500,
        fps: 30,
        dropRate: 0.1,
      }));
      expect(result.current.viewerCount).toBe(100);
      expect(result.current.loading).toBe(false);
    });

    jest.useRealTimers();
  });

  it('should handle reconnection attempts', () => {
    jest.useFakeTimers();
    
    const { result } = renderHook(() => useLiveControl(streamId));

    // Simulate connection failure
    act(() => {
      const errorHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect_error')[1];
      errorHandler(new Error('Connection failed'));
    });

    expect(result.current.failed).toBe(true);

    // Trigger manual reconnect
    act(() => {
      result.current.reconnect();
    });

    // Should attempt reconnection after delay
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockIo).toHaveBeenCalledTimes(2); // Initial + reconnect

    jest.useRealTimers();
  });

  it('should disconnect properly', () => {
    const { result } = renderHook(() => useLiveControl(streamId));

    act(() => {
      result.current.disconnect();
    });

    expect(mockSocket.disconnect).toHaveBeenCalled();
    expect(result.current.connected).toBe(false);
  });

  it('should cleanup on unmount', () => {
    const { unmount } = renderHook(() => useLiveControl(streamId));

    unmount();

    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it('should handle visibility change reconnection', () => {
    const { result } = renderHook(() => useLiveControl(streamId));

    // Set up failed state
    act(() => {
      const errorHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect_error')[1];
      errorHandler(new Error('Connection failed'));
    });

    // Mock document visibility change
    Object.defineProperty(document, 'visibilityState', {
      writable: true,
      value: 'visible',
    });

    // Trigger visibility change event
    act(() => {
      const event = new Event('visibilitychange');
      document.dispatchEvent(event);
    });

    // Should attempt reconnection
    expect(mockIo).toHaveBeenCalledTimes(2); // Initial + visibility reconnect
  });

  it('should not initialize WebSocket without WS_URL', () => {
    // Mock missing WS_URL
    (ENV as any).WS_URL = '';
    
    renderHook(() => useLiveControl(streamId));

    expect(mockIo).not.toHaveBeenCalled();
  });

  it('should handle API errors gracefully during polling', async () => {
    jest.useFakeTimers();
    
    // Mock API failure
    (liveApi.getCreatorStream as jest.Mock).mockRejectedValue(new Error('API Error'));
    (liveApi.getStats as jest.Mock).mockRejectedValue(new Error('API Error'));
    
    const { result } = renderHook(() => useLiveControl(streamId));

    // Trigger polling fallback
    act(() => {
      const errorHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect_error')[1];
      errorHandler(new Error('Connection failed'));
    });

    // Fast-forward to trigger polling
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(liveApi.getCreatorStream).toHaveBeenCalled();
    });

    // Should not crash on API errors
    expect(result.current.failed).toBe(true);

    jest.useRealTimers();
  });
});