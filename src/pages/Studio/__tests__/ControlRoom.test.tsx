import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ControlRoom from '../ControlRoom';
import { liveApi } from '../../../lib/api';
import { useLiveControl } from '../../../hooks/useLiveControl';
import { Stream } from '../../../types/live';

// Mock the API and hooks
vi.mock('../../../lib/api');
vi.mock('../../../hooks/useLiveControl');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ id: 'stream-123' }),
  };
});

// Mock all the live components
vi.mock('../../../components/live/ControlRoomHeader', () => ({
  ControlRoomHeader: ({ stream, onGoLive, onEndStream }: any) => (
    <div data-testid="control-room-header">
      <span>Stream: {stream.title}</span>
      <button onClick={onGoLive}>Go Live</button>
      <button onClick={onEndStream}>End Stream</button>
    </div>
  ),
}));

vi.mock('../../../components/live/StreamKeyCard', () => ({
  StreamKeyCard: ({ stream }: any) => (
    <div data-testid="stream-key-card">Stream Keys for {stream.id}</div>
  ),
}));

vi.mock('../../../components/live/IngestEndpoints', () => ({
  IngestEndpoints: ({ stream }: any) => (
    <div data-testid="ingest-endpoints">Ingest for {stream.id}</div>
  ),
}));

vi.mock('../../../components/live/HealthPanel', () => ({
  HealthPanel: ({ streamId, metrics, isConnected }: any) => (
    <div data-testid="health-panel">
      Health for {streamId} - Connected: {isConnected ? 'Yes' : 'No'}
    </div>
  ),
}));

vi.mock('../../../components/live/ModerationPanel', () => ({
  ModerationPanel: ({ streamId }: any) => (
    <div data-testid="moderation-panel">Moderation for {streamId}</div>
  ),
}));

vi.mock('../../../components/live/SettingsPanel', () => ({
  SettingsPanel: ({ stream }: any) => (
    <div data-testid="settings-panel">Settings for {stream.id}</div>
  ),
}));

vi.mock('../../../components/live/ThumbnailPicker', () => ({
  ThumbnailPicker: ({ streamId }: any) => (
    <div data-testid="thumbnail-picker">Thumbnail for {streamId}</div>
  ),
}));

vi.mock('../../../components/chat/LiveChat', () => ({
  LiveChat: ({ streamId, isCreator }: any) => (
    <div data-testid="live-chat">
      Chat for {streamId} - Creator: {isCreator ? 'Yes' : 'No'}
    </div>
  ),
}));

const mockLiveApi = vi.mocked(liveApi);
const mockUseLiveControl = vi.mocked(useLiveControl);

const mockStream: Stream = {
  id: 'stream-123',
  title: 'Test Live Stream',
  status: 'preview',
  creator: {
    id: 'creator-1',
    handle: '@testcreator',
  },
  poster: 'https://example.com/poster.jpg',
  streamKeys: {
    primary: 'key-123',
    backup: 'key-456',
  },
  ingest: {
    rtmp: 'rtmp://example.com/live',
  },
  settings: {
    dvrWindowSec: 7200,
    watermark: false,
    ageRestricted: false,
  },
};

const mockHealthMetrics = {
  viewerCount: 150,
  bitrateKbps: 2500,
  fps: 30,
  dropRate: 0.1,
  timestamp: Date.now(),
};

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <ControlRoom />
    </BrowserRouter>
  );
};

describe('ControlRoom', () => {
  const mockConnect = vi.fn();
  const mockDisconnect = vi.fn();
  const mockGoLive = vi.fn();
  const mockEndStream = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseLiveControl.mockReturnValue({
      healthMetrics: mockHealthMetrics,
      isConnected: true,
      connect: mockConnect,
      disconnect: mockDisconnect,
      goLive: mockGoLive,
      endStream: mockEndStream,
    });
  });

  it('renders loading state initially', () => {
    mockLiveApi.getCreatorStream.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    renderComponent();
    
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders error state when stream not found', async () => {
    mockLiveApi.getCreatorStream.mockResolvedValue({
      ok: false,
      error: 'Stream not found',
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Stream Not Found')).toBeInTheDocument();
    });

    expect(screen.getByText('Stream not found')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to live streams/i })).toBeInTheDocument();
  });

  it('renders error state when no stream ID provided', async () => {
    vi.mocked(require('react-router-dom').useParams).mockReturnValue({ id: undefined });
    
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Stream Not Found')).toBeInTheDocument();
    });

    expect(screen.getByText('Stream ID is required')).toBeInTheDocument();
  });

  it('renders control room when stream loads successfully', async () => {
    mockLiveApi.getCreatorStream.mockResolvedValue({
      ok: true,
      data: mockStream,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('control-room-header')).toBeInTheDocument();
    });

    expect(screen.getByText('Stream: Test Live Stream')).toBeInTheDocument();
    expect(screen.getByTestId('stream-key-card')).toBeInTheDocument();
    expect(screen.getByTestId('ingest-endpoints')).toBeInTheDocument();
    expect(screen.getByTestId('health-panel')).toBeInTheDocument();
    expect(screen.getByTestId('moderation-panel')).toBeInTheDocument();
    expect(screen.getByTestId('settings-panel')).toBeInTheDocument();
    expect(screen.getByTestId('thumbnail-picker')).toBeInTheDocument();
  });

  it('shows live chat when stream is live', async () => {
    const liveStream = { ...mockStream, status: 'live' as const };
    mockLiveApi.getCreatorStream.mockResolvedValue({
      ok: true,
      data: liveStream,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('live-chat')).toBeInTheDocument();
    });

    expect(screen.getByText('Chat for stream-123 - Creator: Yes')).toBeInTheDocument();
  });

  it('does not show live chat when stream is not live', async () => {
    mockLiveApi.getCreatorStream.mockResolvedValue({
      ok: true,
      data: mockStream, // status is 'preview'
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('control-room-header')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('live-chat')).not.toBeInTheDocument();
  });

  it('connects to live control when stream loads', async () => {
    mockLiveApi.getCreatorStream.mockResolvedValue({
      ok: true,
      data: mockStream,
    });

    renderComponent();

    await waitFor(() => {
      expect(mockConnect).toHaveBeenCalled();
    });
  });

  it('disconnects from live control on unmount', async () => {
    mockLiveApi.getCreatorStream.mockResolvedValue({
      ok: true,
      data: mockStream,
    });

    const { unmount } = renderComponent();

    await waitFor(() => {
      expect(mockConnect).toHaveBeenCalled();
    });

    unmount();

    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('handles go live action', async () => {
    mockLiveApi.getCreatorStream.mockResolvedValue({
      ok: true,
      data: mockStream,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /go live/i })).toBeInTheDocument();
    });

    const goLiveButton = screen.getByRole('button', { name: /go live/i });
    fireEvent.click(goLiveButton);

    expect(mockGoLive).toHaveBeenCalled();
  });

  it('handles end stream action', async () => {
    mockLiveApi.getCreatorStream.mockResolvedValue({
      ok: true,
      data: mockStream,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /end stream/i })).toBeInTheDocument();
    });

    const endStreamButton = screen.getByRole('button', { name: /end stream/i });
    fireEvent.click(endStreamButton);

    expect(mockEndStream).toHaveBeenCalled();
  });

  it('shows connection status warning when disconnected', async () => {
    mockUseLiveControl.mockReturnValue({
      healthMetrics: mockHealthMetrics,
      isConnected: false, // Disconnected
      connect: mockConnect,
      disconnect: mockDisconnect,
      goLive: mockGoLive,
      endStream: mockEndStream,
    });

    mockLiveApi.getCreatorStream.mockResolvedValue({
      ok: true,
      data: mockStream,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/reconnecting to control room/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/some features may be limited/i)).toBeInTheDocument();
  });

  it('does not show connection warning when connected', async () => {
    mockLiveApi.getCreatorStream.mockResolvedValue({
      ok: true,
      data: mockStream,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('control-room-header')).toBeInTheDocument();
    });

    expect(screen.queryByText(/reconnecting to control room/i)).not.toBeInTheDocument();
  });

  it('handles back button click', async () => {
    const mockNavigate = vi.fn();
    vi.mocked(require('react-router-dom').useNavigate).mockReturnValue(mockNavigate);

    mockLiveApi.getCreatorStream.mockResolvedValue({
      ok: true,
      data: mockStream,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('control-room-header')).toBeInTheDocument();
    });

    const backButton = screen.getByRole('button', { name: '' }); // ArrowLeft icon button
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/studio/live');
  });

  it('handles back button click from error state', async () => {
    const mockNavigate = vi.fn();
    vi.mocked(require('react-router-dom').useNavigate).mockReturnValue(mockNavigate);

    mockLiveApi.getCreatorStream.mockResolvedValue({
      ok: false,
      error: 'Stream not found',
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /back to live streams/i })).toBeInTheDocument();
    });

    const backButton = screen.getByRole('button', { name: /back to live streams/i });
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/studio/live');
  });

  it('handles network errors', async () => {
    mockLiveApi.getCreatorStream.mockRejectedValue(new Error('Network error'));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Stream Not Found')).toBeInTheDocument();
    });

    expect(screen.getByText('Failed to load stream')).toBeInTheDocument();
  });

  it('passes correct props to child components', async () => {
    mockLiveApi.getCreatorStream.mockResolvedValue({
      ok: true,
      data: mockStream,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Stream Keys for stream-123')).toBeInTheDocument();
    });

    expect(screen.getByText('Ingest for stream-123')).toBeInTheDocument();
    expect(screen.getByText('Health for stream-123 - Connected: Yes')).toBeInTheDocument();
    expect(screen.getByText('Moderation for stream-123')).toBeInTheDocument();
    expect(screen.getByText('Settings for stream-123')).toBeInTheDocument();
    expect(screen.getByText('Thumbnail for stream-123')).toBeInTheDocument();
  });

  it('calls API with correct stream ID', () => {
    mockLiveApi.getCreatorStream.mockResolvedValue({
      ok: true,
      data: mockStream,
    });

    renderComponent();

    expect(mockLiveApi.getCreatorStream).toHaveBeenCalledWith('stream-123');
  });

  it('initializes live control hook with correct stream ID', () => {
    mockLiveApi.getCreatorStream.mockResolvedValue({
      ok: true,
      data: mockStream,
    });

    renderComponent();

    expect(mockUseLiveControl).toHaveBeenCalledWith('stream-123');
  });
});