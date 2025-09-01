import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LiveWatch from '../LiveWatch';

// Mock the environment configuration
const mockEnv = vi.hoisted(() => ({
  ENV: {
    LIVE_ENABLED: true,
  },
}));

vi.mock('../../../lib/env', () => mockEnv);

// Mock the mockApi
const mockApi = vi.hoisted(() => ({
  mockApi: {
    getLiveStream: vi.fn(),
  },
}));

vi.mock('../../../lib/mockData', () => mockApi);

// Mock the hooks
vi.mock('../../../hooks/useStreamStatus', () => ({
  useStreamStatus: vi.fn(() => ({
    status: 'live',
    isConnected: true,
    error: null,
    reconnect: vi.fn(),
    disconnect: vi.fn(),
  })),
}));

// Mock useParams to return test-stream id
vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'test-stream' }),
  Navigate: ({ to }: { to: string }) => <div>Redirecting to {to}</div>,
}));

// Mock the components
vi.mock('../../../components/live/LivePlayer', () => ({
  default: ({ streamId }: { streamId: string }) => (
    <div data-testid={`live-player-${streamId}`}>Live Player</div>
  ),
}));

vi.mock('../../../components/live/LiveTipTicker', () => ({
  default: ({ streamId }: { streamId: string }) => (
    <div data-testid={`tip-ticker-${streamId}`}>Tip Ticker</div>
  ),
}));

vi.mock('../../../components/chat/LiveChat', () => ({
  LiveChat: ({ streamId }: { streamId: string }) => (
    <div data-testid={`live-chat-${streamId}`}>Live Chat</div>
  ),
}));

const renderComponent = () => {
  return render(<LiveWatch />);
};

describe('LiveWatch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv.ENV.LIVE_ENABLED = true;
  });

  it('redirects to home when live streaming is disabled', () => {
    mockEnv.ENV.LIVE_ENABLED = false;
    
    renderComponent();
    
    expect(screen.getByText('Redirecting to /')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    mockApi.mockApi.getLiveStream.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    renderComponent();
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('displays live stream with player and chat when stream is live', async () => {
    const mockStream = {
      id: 'test-stream',
      title: 'Test Live Stream',
      status: 'live',
      creator: { id: '1', handle: 'testcreator' },
      hlsUrl: 'https://example.com/stream.m3u8',
      poster: 'https://example.com/poster.jpg',
      viewers: 100,
      dvrWindowSec: 3600,
    };

    mockApi.mockApi.getLiveStream.mockResolvedValue(mockStream);
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Test Live Stream')).toBeInTheDocument();
      expect(screen.getByText('@testcreator')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('watching')).toBeInTheDocument();
      expect(screen.getByText('LIVE')).toBeInTheDocument();
      expect(screen.getByTestId('live-player-test-stream')).toBeInTheDocument();
      expect(screen.getByTestId('live-chat-test-stream')).toBeInTheDocument();
      expect(screen.getByTestId('tip-ticker-test-stream')).toBeInTheDocument();
    });
  });

  it('shows stream not found error when stream does not exist', async () => {
    mockApi.mockApi.getLiveStream.mockResolvedValue(null);
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Stream Not Found')).toBeInTheDocument();
      expect(screen.getByText('This stream does not exist or is no longer available.')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });

  it('shows error state when API call fails', async () => {
    mockApi.mockApi.getLiveStream.mockRejectedValue(new Error('API Error'));
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Error Loading Stream')).toBeInTheDocument();
      expect(screen.getByText('Failed to load stream')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });
});