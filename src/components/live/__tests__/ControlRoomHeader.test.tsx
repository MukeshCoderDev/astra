import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import ControlRoomHeader from '../ControlRoomHeader';
import { liveApi } from '../../../lib/api';

// Mock the API
vi.mock('../../../lib/api', () => ({
  liveApi: {
    startStream: vi.fn(),
    endStream: vi.fn(),
  },
}));

describe('ControlRoomHeader', () => {
  const defaultProps = {
    streamId: 'test-stream-123',
    title: 'Test Live Stream',
    status: 'preview' as const,
    viewerCount: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders stream title and preview status', () => {
    render(<ControlRoomHeader {...defaultProps} />);

    expect(screen.getByText('Test Live Stream')).toBeInTheDocument();
    expect(screen.getByText('PREVIEW')).toBeInTheDocument();
    expect(screen.getByText('Stream is ready to go live')).toBeInTheDocument();
    expect(screen.getByText('Ready to Go Live')).toBeInTheDocument();
  });

  it('shows Go Live button in preview status', () => {
    render(<ControlRoomHeader {...defaultProps} />);

    const goLiveButton = screen.getByRole('button', { name: /go live/i });
    expect(goLiveButton).toBeInTheDocument();
    expect(goLiveButton).not.toBeDisabled();
  });

  it('shows End Stream button in live status', () => {
    render(
      <ControlRoomHeader 
        {...defaultProps} 
        status="live" 
        viewerCount={150} 
      />
    );

    expect(screen.getByText('LIVE')).toBeInTheDocument();
    expect(screen.getByText('Stream is currently live')).toBeInTheDocument();
    expect(screen.getByText('Broadcasting Live')).toBeInTheDocument();
    
    const endStreamButton = screen.getByRole('button', { name: /end stream/i });
    expect(endStreamButton).toBeInTheDocument();
    expect(endStreamButton).not.toBeDisabled();
  });

  it('displays viewer count when live', () => {
    render(
      <ControlRoomHeader 
        {...defaultProps} 
        status="live" 
        viewerCount={1250} 
      />
    );

    expect(screen.getByText('1.3K viewers')).toBeInTheDocument();
    expect(screen.getByText('1.3K')).toBeInTheDocument(); // Badge
  });

  it('formats large viewer counts correctly', () => {
    render(
      <ControlRoomHeader 
        {...defaultProps} 
        status="live" 
        viewerCount={1500000} 
      />
    );

    expect(screen.getByText('1.5M viewers')).toBeInTheDocument();
  });

  it('shows ended status correctly', () => {
    render(
      <ControlRoomHeader 
        {...defaultProps} 
        status="ended" 
      />
    );

    expect(screen.getByText('ENDED')).toBeInTheDocument();
    expect(screen.getByText('Stream has ended')).toBeInTheDocument();
    expect(screen.getByText('Stream Ended')).toBeInTheDocument();
    expect(screen.getByText('Stream offline')).toBeInTheDocument();
    
    // Should not show action buttons
    expect(screen.queryByRole('button', { name: /go live/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /end stream/i })).not.toBeInTheDocument();
  });

  it('handles Go Live action successfully', async () => {
    const onStatusChange = vi.fn();
    (liveApi.startStream as any).mockResolvedValue({ ok: true });

    render(
      <ControlRoomHeader 
        {...defaultProps} 
        onStatusChange={onStatusChange}
      />
    );

    const goLiveButton = screen.getByRole('button', { name: /go live/i });
    fireEvent.click(goLiveButton);

    // Should show loading state
    expect(screen.getByRole('button', { name: /go live/i })).toBeDisabled();

    await waitFor(() => {
      expect(liveApi.startStream).toHaveBeenCalledWith('test-stream-123');
      expect(onStatusChange).toHaveBeenCalledWith('live');
    });
  });

  it('handles Go Live action failure', async () => {
    const onError = vi.fn();
    (liveApi.startStream as any).mockResolvedValue({ 
      ok: false, 
      error: 'Stream start failed' 
    });

    render(
      <ControlRoomHeader 
        {...defaultProps} 
        onError={onError}
      />
    );

    const goLiveButton = screen.getByRole('button', { name: /go live/i });
    fireEvent.click(goLiveButton);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('Stream start failed');
    });
  });

  it('handles End Stream action successfully', async () => {
    const onStatusChange = vi.fn();
    (liveApi.endStream as any).mockResolvedValue({ ok: true });

    render(
      <ControlRoomHeader 
        {...defaultProps} 
        status="live"
        onStatusChange={onStatusChange}
      />
    );

    const endStreamButton = screen.getByRole('button', { name: /end stream/i });
    fireEvent.click(endStreamButton);

    // Should show loading state
    expect(screen.getByRole('button', { name: /end stream/i })).toBeDisabled();

    await waitFor(() => {
      expect(liveApi.endStream).toHaveBeenCalledWith('test-stream-123');
      expect(onStatusChange).toHaveBeenCalledWith('ended');
    });
  });

  it('handles End Stream action failure', async () => {
    const onError = vi.fn();
    (liveApi.endStream as any).mockResolvedValue({ 
      ok: false, 
      error: 'Stream end failed' 
    });

    render(
      <ControlRoomHeader 
        {...defaultProps} 
        status="live"
        onError={onError}
      />
    );

    const endStreamButton = screen.getByRole('button', { name: /end stream/i });
    fireEvent.click(endStreamButton);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('Stream end failed');
    });
  });

  it('handles network errors gracefully', async () => {
    const onError = vi.fn();
    (liveApi.startStream as any).mockRejectedValue(new Error('Network error'));

    render(
      <ControlRoomHeader 
        {...defaultProps} 
        onError={onError}
      />
    );

    const goLiveButton = screen.getByRole('button', { name: /go live/i });
    fireEvent.click(goLiveButton);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('Network error');
    });
  });

  it('shows loading state correctly', () => {
    render(
      <ControlRoomHeader 
        {...defaultProps} 
        isLoading={true}
      />
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go live/i })).toBeDisabled();
  });

  it('prevents multiple simultaneous actions', async () => {
    (liveApi.startStream as any).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100))
    );

    render(<ControlRoomHeader {...defaultProps} />);

    const goLiveButton = screen.getByRole('button', { name: /go live/i });
    
    // Click multiple times rapidly
    fireEvent.click(goLiveButton);
    fireEvent.click(goLiveButton);
    fireEvent.click(goLiveButton);

    // Should only call API once
    await waitFor(() => {
      expect(liveApi.startStream).toHaveBeenCalledTimes(1);
    });
  });

  it('displays stream ID for debugging', () => {
    render(<ControlRoomHeader {...defaultProps} />);

    expect(screen.getByText('ID: test-stream-123')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ControlRoomHeader 
        {...defaultProps} 
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('shows correct status indicator colors', () => {
    const { rerender } = render(<ControlRoomHeader {...defaultProps} />);

    // Preview status - amber
    expect(document.querySelector('.bg-amber-500')).toBeInTheDocument();

    // Live status - red with pulse
    rerender(<ControlRoomHeader {...defaultProps} status="live" />);
    expect(document.querySelector('.bg-red-500.animate-pulse')).toBeInTheDocument();

    // Ended status - gray
    rerender(<ControlRoomHeader {...defaultProps} status="ended" />);
    expect(document.querySelector('.bg-gray-500')).toBeInTheDocument();
  });
});