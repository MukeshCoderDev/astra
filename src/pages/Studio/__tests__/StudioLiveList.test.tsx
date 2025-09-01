import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import StudioLiveList from '../StudioLiveList';
import { liveApi } from '../../../lib/api';
import { Stream } from '../../../types/live';

// Mock the API
vi.mock('../../../lib/api');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Mock environment
vi.mock('../../../lib/env', () => ({
  ENV: {
    LIVE_ENABLED: true,
  },
}));

const mockLiveApi = vi.mocked(liveApi);

const mockStreams: Stream[] = [
  {
    id: 'stream-1',
    title: 'Test Live Stream',
    status: 'live',
    creator: {
      id: 'creator-1',
      handle: '@testcreator',
    },
    viewerCount: 150,
    poster: 'https://example.com/poster1.jpg',
  },
  {
    id: 'stream-2',
    title: 'Upcoming Stream',
    status: 'preview',
    creator: {
      id: 'creator-1',
      handle: '@testcreator',
    },
    scheduled: true,
    startAt: '2024-12-01T20:00:00Z',
  },
  {
    id: 'stream-3',
    title: 'Ended Stream',
    status: 'ended',
    creator: {
      id: 'creator-1',
      handle: '@testcreator',
    },
    viewers: 250,
  },
];

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <StudioLiveList />
    </BrowserRouter>
  );
};

describe('StudioLiveList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    mockLiveApi.getCreatorStreams.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    renderComponent();
    
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders empty state when no streams exist', async () => {
    mockLiveApi.getCreatorStreams.mockResolvedValue({
      ok: true,
      data: [],
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('No live streams yet')).toBeInTheDocument();
    });

    expect(screen.getByText('Create your first live stream to start broadcasting to your audience')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create stream/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /schedule stream/i })).toBeInTheDocument();
  });

  it('renders streams list when streams exist', async () => {
    mockLiveApi.getCreatorStreams.mockResolvedValue({
      ok: true,
      data: mockStreams,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test Live Stream')).toBeInTheDocument();
    });

    expect(screen.getByText('Upcoming Stream')).toBeInTheDocument();
    expect(screen.getByText('Ended Stream')).toBeInTheDocument();
  });

  it('displays correct status badges for different stream states', async () => {
    mockLiveApi.getCreatorStreams.mockResolvedValue({
      ok: true,
      data: mockStreams,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('LIVE')).toBeInTheDocument();
    });

    expect(screen.getByText('PREVIEW')).toBeInTheDocument();
    expect(screen.getByText('ENDED')).toBeInTheDocument();
  });

  it('displays viewer count for live streams', async () => {
    mockLiveApi.getCreatorStreams.mockResolvedValue({
      ok: true,
      data: mockStreams,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
    });
  });

  it('displays scheduled time for upcoming streams', async () => {
    mockLiveApi.getCreatorStreams.mockResolvedValue({
      ok: true,
      data: mockStreams,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/12\/1\/2024/)).toBeInTheDocument();
    });
  });

  it('displays peak viewers for ended streams', async () => {
    mockLiveApi.getCreatorStreams.mockResolvedValue({
      ok: true,
      data: mockStreams,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('250')).toBeInTheDocument();
    });
  });

  it('renders error state when API call fails', async () => {
    mockLiveApi.getCreatorStreams.mockResolvedValue({
      ok: false,
      error: 'Failed to fetch streams',
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Error loading streams')).toBeInTheDocument();
    });

    expect(screen.getByText('Failed to fetch streams')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('handles API network errors', async () => {
    mockLiveApi.getCreatorStreams.mockRejectedValue(new Error('Network error'));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Error loading streams')).toBeInTheDocument();
    });

    expect(screen.getByText('Failed to load streams')).toBeInTheDocument();
  });

  it('renders header with correct title and actions', async () => {
    mockLiveApi.getCreatorStreams.mockResolvedValue({
      ok: true,
      data: [],
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Live Streams')).toBeInTheDocument();
    });

    expect(screen.getByText('Manage your live streams and create new broadcasts')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new stream/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /schedule/i })).toBeInTheDocument();
  });

  it('renders quick actions when streams exist', async () => {
    mockLiveApi.getCreatorStreams.mockResolvedValue({
      ok: true,
      data: mockStreams,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    });

    expect(screen.getAllByRole('button', { name: /new stream/i })).toHaveLength(2); // Header + Quick Actions
    expect(screen.getAllByRole('button', { name: /schedule/i })).toHaveLength(2); // Header + Quick Actions
    expect(screen.getByRole('button', { name: /studio settings/i })).toBeInTheDocument();
  });

  it('calls API with correct endpoint on mount', () => {
    mockLiveApi.getCreatorStreams.mockResolvedValue({
      ok: true,
      data: [],
    });

    renderComponent();

    expect(mockLiveApi.getCreatorStreams).toHaveBeenCalled();
  });

  it('handles stream card clicks', async () => {
    const mockNavigate = vi.fn();
    vi.mocked(require('react-router-dom').useNavigate).mockReturnValue(mockNavigate);

    mockLiveApi.getCreatorStreams.mockResolvedValue({
      ok: true,
      data: mockStreams,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test Live Stream')).toBeInTheDocument();
    });

    const streamCard = screen.getByText('Test Live Stream').closest('.cursor-pointer');
    fireEvent.click(streamCard!);

    expect(mockNavigate).toHaveBeenCalledWith('/studio/live/stream-1');
  });

  it('handles new stream button click', async () => {
    const mockNavigate = vi.fn();
    vi.mocked(require('react-router-dom').useNavigate).mockReturnValue(mockNavigate);

    mockLiveApi.getCreatorStreams.mockResolvedValue({
      ok: true,
      data: [],
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /new stream/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /new stream/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/studio/live/new');
  });

  it('handles schedule stream button click', async () => {
    const mockNavigate = vi.fn();
    vi.mocked(require('react-router-dom').useNavigate).mockReturnValue(mockNavigate);

    mockLiveApi.getCreatorStreams.mockResolvedValue({
      ok: true,
      data: [],
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /schedule/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /schedule/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/studio/live/new?scheduled=true');
  });
});