import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLiveChat } from '../useLiveChat';
import { liveApi } from '../../lib/api';
import type { Message } from '../../types/live';

// Mock socket.io-client
const mockSocket = {
  connected: false,
  connect: vi.fn(),
  disconnect: vi.fn(),
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
};

const mockIo = vi.fn(() => mockSocket);

vi.mock('socket.io-client', () => ({
  io: mockIo,
}));

// Mock API
vi.mock('../../lib/api', () => ({
  liveApi: {
    getChat: vi.fn(),
    sendMessage: vi.fn(),
  },
}));

// Mock environment
vi.mock('../../lib/env', () => ({
  ENV: {
    WS_URL: 'ws://localhost:3001',
  },
}));

describe('useLiveChat', () => {
  const streamId = 'test-stream-123';
  const mockMessage: Message = {
    id: 'msg-1',
    user: { id: 'user-1', handle: 'testuser' },
    text: 'Hello world!',
    ts: Math.floor(Date.now() / 1000),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket.connected = false;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useLiveChat(streamId));

    expect(result.current.connected).toBe(false);
    expect(result.current.failed).toBe(false);
    expect(result.current.messages).toEqual([]);
    expect(result.current.slowModeSec).toBe(0);
    expect(result.current.viewers).toBe(0);
    expect(result.current.loading).toBe(true);
  });

  it('should initialize WebSocket connection', () => {
    renderHook(() => useLiveChat(streamId));

    expect(mockIo).toHaveBeenCalledWith('ws://localhost:3001', {
      path: '/chat',
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });
  });

  it('should handle WebSocket connection success', async () => {
    const { result } = renderHook(() => useLiveChat(streamId));

    // Simulate connection
    act(() => {
      const connectCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'connect'
      )?.[1];
      connectCallback?.();
    });

    await waitFor(() => {
      expect(result.current.connected).toBe(true);
      expect(result.current.failed).toBe(false);
      expect(result.current.loading).toBe(false);
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('join', { room: streamId });
  });

  it('should handle WebSocket disconnection', async () => {
    const { result } = renderHook(() => useLiveChat(streamId));

    // First connect
    act(() => {
      const connectCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'connect'
      )?.[1];
      connectCallback?.();
    });

    // Then disconnect
    act(() => {
      const disconnectCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'disconnect'
      )?.[1];
      disconnectCallback?.('transport close');
    });

    await waitFor(() => {
      expect(result.current.connected).toBe(false);
      expect(result.current.failed).toBe(true);
    });
  });

  it('should handle incoming messages', async () => {
    const { result } = renderHook(() => useLiveChat(streamId));

    act(() => {
      const messageCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'message'
      )?.[1];
      messageCallback?.(mockMessage);
    });

    await waitFor(() => {
      expect(result.current.messages).toContain(mockMessage);
    });
  });

  it('should handle pinned messages', async () => {
    const { result } = renderHook(() => useLiveChat(streamId));

    // Add a regular message first
    act(() => {
      const messageCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'message'
      )?.[1];
      messageCallback?.(mockMessage);
    });

    // Pin the message
    act(() => {
      const pinnedCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'pinned'
      )?.[1];
      pinnedCallback?.(mockMessage);
    });

    await waitFor(() => {
      const pinnedMessage = result.current.messages.find(m => m.id === mockMessage.id);
      expect(pinnedMessage?.pinned).toBe(true);
    });
  });

  it('should handle slow mode updates', async () => {
    const { result } = renderHook(() => useLiveChat(streamId));

    act(() => {
      const slowModeCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'slow_mode'
      )?.[1];
      slowModeCallback?.({ seconds: 30 });
    });

    await waitFor(() => {
      expect(result.current.slowModeSec).toBe(30);
    });
  });

  it('should handle viewer count updates', async () => {
    const { result } = renderHook(() => useLiveChat(streamId));

    act(() => {
      const viewersCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'viewers'
      )?.[1];
      viewersCallback?.({ count: 150 });
    });

    await waitFor(() => {
      expect(result.current.viewers).toBe(150);
    });
  });

  it('should send messages via WebSocket when connected', async () => {
    mockSocket.connected = true;
    const { result } = renderHook(() => useLiveChat(streamId));

    await act(async () => {
      await result.current.send('Test message');
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('message', {
      room: streamId,
      text: 'Test message',
    });
  });

  it('should send messages via HTTP when WebSocket is not connected', async () => {
    mockSocket.connected = false;
    vi.mocked(liveApi.sendMessage).mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useLiveChat(streamId));

    await act(async () => {
      await result.current.send('Test message');
    });

    expect(liveApi.sendMessage).toHaveBeenCalledWith(streamId, 'Test message');
  });

  it('should validate message length', async () => {
    const { result } = renderHook(() => useLiveChat(streamId));
    const longMessage = 'a'.repeat(501); // Exceeds MAX_MESSAGE_LENGTH

    await expect(
      act(async () => {
        await result.current.send(longMessage);
      })
    ).rejects.toThrow('Message too long');
  });

  it('should ignore empty messages', async () => {
    const { result } = renderHook(() => useLiveChat(streamId));

    await act(async () => {
      await result.current.send('   '); // Only whitespace
    });

    expect(mockSocket.emit).not.toHaveBeenCalled();
    expect(liveApi.sendMessage).not.toHaveBeenCalled();
  });

  it('should start HTTP polling fallback on connection failure', async () => {
    vi.mocked(liveApi.getChat).mockResolvedValue({ 
      ok: true, 
      data: [mockMessage] 
    });

    const { result } = renderHook(() => useLiveChat(streamId));

    // Simulate connection error
    act(() => {
      const errorCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'connect_error'
      )?.[1];
      errorCallback?.(new Error('Connection failed'));
    });

    // Fast-forward polling interval
    act(() => {
      vi.advanceTimersByTime(4000);
    });

    await waitFor(() => {
      expect(liveApi.getChat).toHaveBeenCalledWith(streamId, expect.any(Number));
      expect(result.current.failed).toBe(true);
    });
  });

  it('should clear messages', async () => {
    const { result } = renderHook(() => useLiveChat(streamId));

    // Add a message first
    act(() => {
      const messageCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'message'
      )?.[1];
      messageCallback?.(mockMessage);
    });

    // Clear messages
    act(() => {
      result.current.clearMessages();
    });

    await waitFor(() => {
      expect(result.current.messages).toEqual([]);
    });
  });

  it('should handle reconnection with exponential backoff', async () => {
    const { result } = renderHook(() => useLiveChat(streamId));

    // Simulate connection failure
    act(() => {
      const errorCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'connect_error'
      )?.[1];
      errorCallback?.(new Error('Connection failed'));
    });

    // Trigger reconnect
    act(() => {
      result.current.reconnect();
    });

    // Fast-forward to trigger reconnection
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it('should limit messages to maximum display count', async () => {
    const { result } = renderHook(() => useLiveChat(streamId));

    // Add more messages than the limit
    for (let i = 0; i < 150; i++) {
      act(() => {
        const messageCallback = mockSocket.on.mock.calls.find(
          call => call[0] === 'message'
        )?.[1];
        messageCallback?.({
          id: `msg-${i}`,
          user: { id: 'user-1', handle: 'testuser' },
          text: `Message ${i}`,
          ts: Math.floor(Date.now() / 1000) + i,
        });
      });
    }

    await waitFor(() => {
      expect(result.current.messages.length).toBe(100); // MAX_MESSAGES_DISPLAYED
    });
  });

  it('should prevent duplicate messages', async () => {
    const { result } = renderHook(() => useLiveChat(streamId));

    // Add the same message twice
    act(() => {
      const messageCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'message'
      )?.[1];
      messageCallback?.(mockMessage);
      messageCallback?.(mockMessage);
    });

    await waitFor(() => {
      expect(result.current.messages.length).toBe(1);
    });
  });

  it('should cleanup on unmount', () => {
    const { unmount } = renderHook(() => useLiveChat(streamId));

    unmount();

    expect(mockSocket.disconnect).toHaveBeenCalled();
  });
});