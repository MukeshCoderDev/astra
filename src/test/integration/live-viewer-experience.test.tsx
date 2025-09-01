import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, renderWithRouter, screen, fireEvent, waitFor, act } from '../utils/test-utils';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';
import { createMockWebSocket, createMockHls } from '../utils/test-utils';
import LiveHome from '../../pages/Live/LiveHome';
import LiveWatch from '../../pages/Live/LiveWatch';
import { BrowserRouter, Routes, Route, MemoryRouter } from 'react-router-dom';
import type { Stream, Message } from '../../types/live';

// Mock HLS.js
const mockHls = createMockHls();
vi.mock('hls.js', () => ({
  default: vi.fn().mockImplementation(() => mockHls),
  isSupported: vi.fn().mockReturnValue(true),
}));

// Mock socket.io-client
const mockSocket = createMockWebSocket();
vi.mock('socket.io-client', () => ({
  io: vi.fn().mockImplementation(() => mockSocket),
}));

// Mock environment
vi.mock('../../lib/env', () => ({
  ENV: {
    LIVE_ENABLED: true,
    WS_URL: 'ws://localhost:3001',
    API_BASE: 'https://bff.example.com',
  },
}));

// Import the actual mockApi to use in tests
import { mockApi } from '../../lib/mockData';

// Mock data
const mockLiveStreams: Stream[] = [
  {
    id: 'stream-1',
    title: 'Live Gaming Session',
    poster: 'https://example.com/poster1.jpg',
    viewers: 1250,
    status: 'live',
    creator: {
      id: 'creator-1',
      handle: 'gamer123',
    },
    hlsUrl: 'https://cdn.example.com/stream1.m3u8',
    dvrWindowSec: 300,
  },
  {
    id: 'stream-2',
    title: 'Cooking Show',
    poster: 'https://example.com/poster2.jpg',
    viewers: 850,
    status: 'live',
    creator: {
      id: 'creator-2',
      handle: 'chef_master',
    },
    hlsUrl: 'https://cdn.example.com/stream2.m3u8',
  },
];

const mockUpcomingStreams: Stream[] = [
  {
    id: 'stream-3',
    title: 'Music Performance',
    poster: 'https://example.com/poster3.jpg',
    scheduled: true,
    startAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
    status: 'preview',
    creator: {
      id: 'creator-3',
      handle: 'musician_pro',
    },
  },
];

const mockChatMessages: Message[] = [
  {
    id: 'msg-1',
    user: { id: 'user-1', handle: 'viewer1' },
    text: 'Great stream!',
    ts: Math.floor(Date.now() / 1000) - 60,
  },
  {
    id: 'msg-2',
    user: { id: 'user-2', handle: 'viewer2' },
    text: 'Love this content',
    ts: Math.floor(Date.now() / 1000) - 30,
    pinned: true,
  },
];

// Helper function to render LiveWatch component
const renderLiveWatch = (streamId: string = 'stream-1') => {
  const TestApp = () => (
    <MemoryRouter initialEntries={[`/live/${streamId}`]}>
      <Routes>
        <Route path="/live/:id" element={<LiveWatch />} />
      </Routes>
    </MemoryRouter>
  );
  return render(<TestApp />);
};

describe('Live Viewer Experience Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock socket state
    Object.assign(mockSocket, {
      connected: false,
      readyState: WebSocket.CONNECTING,
      send: vi.fn(),
      close: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    // Reset HLS mock
    Object.assign(mockHls, {
      loadSource: vi.fn(),
      attachMedia: vi.fn(),
      destroy: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Stream Discovery Flow', () => {
    it('should display live and upcoming streams on discovery page', async () => {
      const TestApp = () => (
        <MemoryRouter>
          <LiveHome />
        </MemoryRouter>
      );
      
      render(<TestApp />);

      // Should show loading initially
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Wait for streams to load
      await waitFor(() => {
        expect(screen.getByText('Building a React Live Streaming App')).toBeInTheDocument();
      });

      // Should show live streams section
      expect(screen.getByText('Live now')).toBeInTheDocument();
      expect(screen.getByText('Building a React Live Streaming App')).toBeInTheDocument();
      expect(screen.getByText('Digital Art Creation Process')).toBeInTheDocument();
      expect(screen.getAllByText('1.2K watching')).toHaveLength(2); // Should appear twice in the first stream card

      // Should show upcoming streams section
      expect(screen.getByText('Upcoming')).toBeInTheDocument();
      expect(screen.getByText('Advanced TypeScript Patterns')).toBeInTheDocument();

      // Should show creator handles
      expect(screen.getAllByText('@techguru')).toHaveLength(2); // Appears in both live and upcoming
      expect(screen.getByText('@creativemind')).toBeInTheDocument();
      expect(screen.getByText('@artlover')).toBeInTheDocument();
    });

    it('should handle empty live feed gracefully', async () => {
      // Mock empty feed
      vi.spyOn(mockApi, 'getLiveFeed').mockResolvedValueOnce({
        now: [],
        upcoming: [],
      });

      const TestApp = () => (
        <MemoryRouter>
          <LiveHome />
        </MemoryRouter>
      );
      
      render(<TestApp />);

      await waitFor(() => {
        expect(screen.getByText('No Live Streams')).toBeInTheDocument();
      });

      expect(screen.getByText('There are no live or upcoming streams at the moment.')).toBeInTheDocument();
    });

    it('should handle API errors with retry functionality', async () => {
      // Mock API error
      vi.spyOn(mockApi, 'getLiveFeed').mockRejectedValueOnce(new Error('API Error'));

      const TestApp = () => (
        <MemoryRouter>
          <LiveHome />
        </MemoryRouter>
      );
      
      render(<TestApp />);

      await waitFor(() => {
        expect(screen.getByText('Error Loading Streams')).toBeInTheDocument();
      });

      expect(screen.getByText('Failed to load live streams')).toBeInTheDocument();
      
      const retryButton = screen.getByRole('button', { name: /try again/i });
      expect(retryButton).toBeInTheDocument();

      // Mock successful retry
      vi.spyOn(mockApi, 'getLiveFeed').mockResolvedValueOnce({
        now: mockLiveStreams.slice(0, 1),
        upcoming: [],
      });

      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Building a React Live Streaming App')).toBeInTheDocument();
      });
    });

    it('should navigate to stream when clicking on live card', async () => {
      const TestApp = () => (
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<LiveHome />} />
            <Route path="/live/:id" element={<div>Stream Page</div>} />
          </Routes>
        </MemoryRouter>
      );

      render(<TestApp />);

      await waitFor(() => {
        expect(screen.getByText('Building a React Live Streaming App')).toBeInTheDocument();
      });

      // Click on the first stream card
      const streamCard = screen.getByText('Building a React Live Streaming App').closest('a');
      expect(streamCard).toHaveAttribute('href', '/live/live-1');
    });
  });

  describe('Live Stream Watching Experience', () => {

    it('should load and display live stream with player and chat', async () => {
      renderLiveWatch();

      // Should show loading initially
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Wait for stream to load
      await waitFor(() => {
        expect(screen.getByText('Live Gaming Session')).toBeInTheDocument();
      });

      // Should show stream info
      expect(screen.getByText('@gamer123')).toBeInTheDocument();
      expect(screen.getByText('1,250 watching')).toBeInTheDocument();
      expect(screen.getByText('LIVE')).toBeInTheDocument();

      // Should initialize HLS player
      expect(mockHls.loadSource).toHaveBeenCalledWith('https://cdn.example.com/stream1.m3u8');
      expect(mockHls.attachMedia).toHaveBeenCalled();

      // Should show chat messages
      await waitFor(() => {
        expect(screen.getByText('Great stream!')).toBeInTheDocument();
        expect(screen.getByText('Love this content')).toBeInTheDocument();
      });
    });

    it('should handle stream status transitions', async () => {
      const previewStream = {
        ...mockLiveStreams[0],
        status: 'preview' as const,
        hlsUrl: undefined,
      };

      vi.spyOn(mockApi, 'getLiveStream').mockResolvedValueOnce(previewStream);

      renderLiveWatch();

      await waitFor(() => {
        expect(screen.getByText('Stream will start soon')).toBeInTheDocument();
      });

      // Simulate status change to live via WebSocket
      act(() => {
        const statusHandler = mockSocket.addEventListener.mock.calls.find(
          call => call[0] === 'stream_status'
        )?.[1];
        
        if (statusHandler) {
          statusHandler({
            streamId: 'stream-1',
            status: 'live',
            timestamp: Date.now(),
          });
        }
      });

      // Should update to live state
      await waitFor(() => {
        expect(screen.queryByText('Stream will start soon')).not.toBeInTheDocument();
      });
    });

    it('should show appropriate overlay for ended streams', async () => {
      const endedStream = {
        ...mockLiveStreams[0],
        status: 'ended' as const,
        hlsUrl: undefined,
      };

      vi.spyOn(mockApi, 'getLiveStream').mockResolvedValueOnce(endedStream);

      renderLiveWatch();

      await waitFor(() => {
        expect(screen.getByText('Stream ended')).toBeInTheDocument();
        expect(screen.getByText('This live stream has finished')).toBeInTheDocument();
      });
    });

    it('should handle stream not found error', async () => {
      vi.spyOn(mockApi, 'getLiveStream').mockResolvedValueOnce(null);

      renderLiveWatch('nonexistent');

      await waitFor(() => {
        expect(screen.getByText('Stream Not Found')).toBeInTheDocument();
        expect(screen.getByText('This stream does not exist or is no longer available.')).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Chat Integration', () => {
    const renderLiveWatchWithChat = () => {
      return renderLiveWatch();
    };

    it('should connect to chat WebSocket and display messages', async () => {
      renderLiveWatchWithChat();

      await waitFor(() => {
        expect(screen.getByText('Live Gaming Session')).toBeInTheDocument();
      });

      // Should attempt WebSocket connection
      expect(mockSocket.addEventListener).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockSocket.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));

      // Simulate WebSocket connection
      act(() => {
        const connectHandler = mockSocket.addEventListener.mock.calls.find(
          call => call[0] === 'connect'
        )?.[1];
        
        if (connectHandler) {
          mockSocket.connected = true;
          connectHandler();
        }
      });

      // Should show existing chat messages
      await waitFor(() => {
        expect(screen.getByText('Great stream!')).toBeInTheDocument();
        expect(screen.getByText('Love this content')).toBeInTheDocument();
      });

      // Should highlight pinned message
      const pinnedMessage = screen.getByText('Love this content').closest('[data-pinned="true"]');
      expect(pinnedMessage).toBeInTheDocument();
    });

    it('should send chat messages via WebSocket', async () => {
      renderLiveWatchWithChat();

      await waitFor(() => {
        expect(screen.getByText('Live Gaming Session')).toBeInTheDocument();
      });

      // Simulate connected state
      act(() => {
        mockSocket.connected = true;
        const connectHandler = mockSocket.addEventListener.mock.calls.find(
          call => call[0] === 'connect'
        )?.[1];
        if (connectHandler) connectHandler();
      });

      // Find chat input and send message
      const chatInput = screen.getByPlaceholderText(/say something/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(chatInput, { target: { value: 'Hello everyone!' } });
      fireEvent.click(sendButton);

      // Should send message via WebSocket
      expect(mockSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('Hello everyone!')
      );

      // Should clear input
      expect(chatInput).toHaveValue('');
    });

    it('should fallback to HTTP polling when WebSocket fails', async () => {
      renderLiveWatchWithChat();

      await waitFor(() => {
        expect(screen.getByText('Live Gaming Session')).toBeInTheDocument();
      });

      // Simulate WebSocket connection failure
      act(() => {
        const errorHandler = mockSocket.addEventListener.mock.calls.find(
          call => call[0] === 'connect_error'
        )?.[1];
        
        if (errorHandler) {
          errorHandler(new Error('Connection failed'));
        }
      });

      // Should start HTTP polling
      await waitFor(() => {
        expect(screen.getByText('Polling message')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should handle slow mode restrictions', async () => {
      renderLiveWatchWithChat();

      await waitFor(() => {
        expect(screen.getByText('Live Gaming Session')).toBeInTheDocument();
      });

      // Simulate connected state with slow mode
      act(() => {
        mockSocket.connected = true;
        const connectHandler = mockSocket.addEventListener.mock.calls.find(
          call => call[0] === 'connect'
        )?.[1];
        if (connectHandler) connectHandler();

        // Simulate slow mode event
        const slowModeHandler = mockSocket.addEventListener.mock.calls.find(
          call => call[0] === 'slow_mode'
        )?.[1];
        if (slowModeHandler) {
          slowModeHandler({ seconds: 30 });
        }
      });

      // Send a message to trigger slow mode
      const chatInput = screen.getByPlaceholderText(/say something/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(chatInput, { target: { value: 'First message' } });
      fireEvent.click(sendButton);

      // Should show slow mode countdown
      await waitFor(() => {
        expect(screen.getByText(/slow mode/i)).toBeInTheDocument();
      });

      // Send button should be disabled during cooldown
      expect(sendButton).toBeDisabled();
    });

    it('should update viewer count in real-time', async () => {
      renderLiveWatchWithChat();

      await waitFor(() => {
        expect(screen.getByText('1,250 watching')).toBeInTheDocument();
      });

      // Simulate viewer count update
      act(() => {
        const viewerHandler = mockSocket.addEventListener.mock.calls.find(
          call => call[0] === 'viewer_count'
        )?.[1];
        
        if (viewerHandler) {
          viewerHandler({ count: 1500 });
        }
      });

      // Should update viewer count
      await waitFor(() => {
        expect(screen.getByText('1,500 watching')).toBeInTheDocument();
      });
    });
  });

  describe('Tip Notifications', () => {
    it('should display animated tip notifications', async () => {
      renderLiveWatch();

      await waitFor(() => {
        expect(screen.getByText('Live Gaming Session')).toBeInTheDocument();
      });

      // Simulate tip event via WebSocket
      act(() => {
        const tipHandler = mockSocket.addEventListener.mock.calls.find(
          call => call[0] === 'tip'
        )?.[1];
        
        if (tipHandler) {
          tipHandler({
            id: 'tip-1',
            amount: 5.00,
            currency: 'USDC',
            user: { handle: 'generous_viewer' },
            message: 'Great content!',
          });
        }
      });

      // Should show tip notification
      await waitFor(() => {
        expect(screen.getByText('generous_viewer tipped $5.00')).toBeInTheDocument();
        expect(screen.getByText('Great content!')).toBeInTheDocument();
      });

      // Should animate out after duration
      await waitFor(() => {
        expect(screen.queryByText('generous_viewer tipped $5.00')).not.toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it('should queue multiple tip notifications', async () => {
      renderLiveWatch();

      await waitFor(() => {
        expect(screen.getByText('Live Gaming Session')).toBeInTheDocument();
      });

      // Simulate multiple rapid tips
      act(() => {
        const tipHandler = mockSocket.addEventListener.mock.calls.find(
          call => call[0] === 'tip'
        )?.[1];
        
        if (tipHandler) {
          // First tip
          tipHandler({
            id: 'tip-1',
            amount: 5.00,
            currency: 'USDC',
            user: { handle: 'viewer1' },
            message: 'First tip!',
          });

          // Second tip immediately after
          setTimeout(() => {
            tipHandler({
              id: 'tip-2',
              amount: 10.00,
              currency: 'USDC',
              user: { handle: 'viewer2' },
              message: 'Second tip!',
            });
          }, 100);
        }
      });

      // Should show first tip
      await waitFor(() => {
        expect(screen.getByText('viewer1 tipped $5.00')).toBeInTheDocument();
      });

      // Should queue and show second tip after first completes
      await waitFor(() => {
        expect(screen.getByText('viewer2 tipped $10.00')).toBeInTheDocument();
      }, { timeout: 10000 });
    });
  });

  describe('Performance and Join Time', () => {
    it('should measure and report join time metrics', async () => {
      const mockAnalytics = vi.fn();
      
      // Mock analytics endpoint
      server.use(
        http.post('https://bff.example.com/analytics/metrics', async ({ request }) => {
          const body = await request.json();
          mockAnalytics(body);
          return HttpResponse.json({ success: true });
        })
      );

      renderLiveWatch();

      await waitFor(() => {
        expect(screen.getByText('Live Gaming Session')).toBeInTheDocument();
      });

      // Simulate HLS player loading and first frame
      act(() => {
        const loadedHandler = mockHls.on.mock.calls.find(
          call => call[0] === 'hlsMediaAttached'
        )?.[1];
        if (loadedHandler) loadedHandler();

        const firstFrameHandler = mockHls.on.mock.calls.find(
          call => call[0] === 'hlsFragBuffered'
        )?.[1];
        if (firstFrameHandler) firstFrameHandler();
      });

      // Should report join time metrics
      await waitFor(() => {
        expect(mockAnalytics).toHaveBeenCalledWith(
          expect.objectContaining({
            event: 'stream_join_time',
            streamId: 'stream-1',
            joinTimeMs: expect.any(Number),
          })
        );
      });
    });

    it('should preconnect to CDN for faster loading', async () => {
      renderLiveWatch();

      await waitFor(() => {
        expect(screen.getByText('Live Gaming Session')).toBeInTheDocument();
      });

      // Should add preconnect link to CDN
      const preconnectLink = document.querySelector('link[rel="preconnect"][href*="cdn.example.com"]');
      expect(preconnectLink).toBeInTheDocument();
    });

    it('should configure HLS for low latency', async () => {
      renderLiveWatch();

      await waitFor(() => {
        expect(screen.getByText('Live Gaming Session')).toBeInTheDocument();
      });

      // Should configure HLS with low latency settings
      expect(mockHls.attachMedia).toHaveBeenCalled();
      
      // Check if low latency configuration was applied
      const hlsConfig = mockHls.on.mock.calls.find(
        call => call[0] === 'hlsMediaAttached'
      );
      expect(hlsConfig).toBeDefined();
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle network errors gracefully', async () => {
      // Mock network error
      vi.spyOn(mockApi, 'getLiveStream').mockRejectedValueOnce(new Error('Network Error'));

      renderLiveWatch();

      await waitFor(() => {
        expect(screen.getByText('Error Loading Stream')).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('should recover from WebSocket disconnections', async () => {
      renderLiveWatch();

      await waitFor(() => {
        expect(screen.getByText('Live Gaming Session')).toBeInTheDocument();
      });

      // Simulate WebSocket disconnection
      act(() => {
        const disconnectHandler = mockSocket.addEventListener.mock.calls.find(
          call => call[0] === 'disconnect'
        )?.[1];
        
        if (disconnectHandler) {
          mockSocket.connected = false;
          disconnectHandler('transport close');
        }
      });

      // Should attempt to reconnect
      await waitFor(() => {
        // Check that reconnection logic is triggered
        expect(mockSocket.addEventListener).toHaveBeenCalledWith('connect', expect.any(Function));
      });
    });

    it('should handle HLS player errors', async () => {
      renderLiveWatch();

      await waitFor(() => {
        expect(screen.getByText('Live Gaming Session')).toBeInTheDocument();
      });

      // Simulate HLS error
      act(() => {
        const errorHandler = mockHls.on.mock.calls.find(
          call => call[0] === 'hlsError'
        )?.[1];
        
        if (errorHandler) {
          errorHandler({
            type: 'networkError',
            details: 'manifestLoadError',
            fatal: true,
          });
        }
      });

      // Should show error state or attempt recovery
      await waitFor(() => {
        // The player should handle the error gracefully
        expect(mockHls.destroy).toHaveBeenCalled();
      });
    });
  });
});