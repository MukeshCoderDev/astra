import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import IngestEndpoints from '../IngestEndpoints';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

describe('IngestEndpoints', () => {
  const defaultProps = {
    ingest: {
      rtmp: 'rtmp://ingest.example.com/live',
      srt: 'srt://ingest.example.com:9999',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders ingest endpoints correctly', () => {
    render(<IngestEndpoints {...defaultProps} />);

    expect(screen.getByText('Ingest Endpoints')).toBeInTheDocument();
    expect(screen.getByText('Configure your streaming software with these server URLs')).toBeInTheDocument();
    
    expect(screen.getByText('RTMP Server')).toBeInTheDocument();
    expect(screen.getByText('SRT Server')).toBeInTheDocument();
    expect(screen.getByText('Recommended')).toBeInTheDocument();
    
    expect(screen.getByText('rtmp://ingest.example.com/live')).toBeInTheDocument();
    expect(screen.getByText('srt://ingest.example.com:9999')).toBeInTheDocument();
  });

  it('renders only RTMP when SRT is not available', () => {
    const propsWithoutSRT = {
      ingest: {
        rtmp: 'rtmp://ingest.example.com/live',
      },
    };

    render(<IngestEndpoints {...propsWithoutSRT} />);

    expect(screen.getByText('RTMP Server')).toBeInTheDocument();
    expect(screen.queryByText('SRT Server')).not.toBeInTheDocument();
    expect(screen.getByText('rtmp://ingest.example.com/live')).toBeInTheDocument();
  });

  it('copies RTMP endpoint to clipboard', async () => {
    (navigator.clipboard.writeText as any).mockResolvedValue(undefined);

    render(<IngestEndpoints {...defaultProps} />);

    const copyButtons = screen.getAllByRole('button', { name: /copy/i });
    fireEvent.click(copyButtons[0]); // RTMP copy button

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'rtmp://ingest.example.com/live'
      );
    });

    // Should show "Copied" feedback
    expect(screen.getByText('Copied')).toBeInTheDocument();

    // Should reset after timeout
    vi.advanceTimersByTime(2000);
    await waitFor(() => {
      expect(screen.queryByText('Copied')).not.toBeInTheDocument();
    });
  });

  it('copies SRT endpoint to clipboard', async () => {
    (navigator.clipboard.writeText as any).mockResolvedValue(undefined);

    render(<IngestEndpoints {...defaultProps} />);

    const copyButtons = screen.getAllByRole('button', { name: /copy/i });
    fireEvent.click(copyButtons[1]); // SRT copy button

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'srt://ingest.example.com:9999'
      );
    });
  });

  it('handles clipboard copy failure', async () => {
    const onError = vi.fn();
    (navigator.clipboard.writeText as any).mockRejectedValue(new Error('Clipboard error'));

    render(<IngestEndpoints {...defaultProps} onError={onError} />);

    const copyButtons = screen.getAllByRole('button', { name: /copy/i });
    fireEvent.click(copyButtons[0]);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('Failed to copy to clipboard');
    });
  });

  it('displays encoder setup instructions', () => {
    render(<IngestEndpoints {...defaultProps} />);

    expect(screen.getByText('Encoder Setup Instructions')).toBeInTheDocument();
    
    // OBS Studio instructions
    expect(screen.getByText('OBS Studio')).toBeInTheDocument();
    expect(screen.getByText('Most Popular')).toBeInTheDocument();
    expect(screen.getByText(/Open OBS Studio and go to Settings/)).toBeInTheDocument();
    expect(screen.getByText(/Set Service to "Custom..."/)).toBeInTheDocument();
    
    // XSplit instructions
    expect(screen.getByText('XSplit')).toBeInTheDocument();
    expect(screen.getByText(/Open XSplit and click "Broadcast"/)).toBeInTheDocument();
    
    // FFmpeg instructions
    expect(screen.getByText('FFmpeg')).toBeInTheDocument();
    expect(screen.getByText('Advanced')).toBeInTheDocument();
    expect(screen.getByText('Command line example:')).toBeInTheDocument();
  });

  it('displays FFmpeg command with correct RTMP URL', () => {
    render(<IngestEndpoints {...defaultProps} />);

    const ffmpegCommand = screen.getByText(/ffmpeg -i input.mp4/);
    expect(ffmpegCommand).toHaveTextContent('rtmp://ingest.example.com/live/YOUR_STREAM_KEY');
  });

  it('displays recommended streaming settings', () => {
    render(<IngestEndpoints {...defaultProps} />);

    expect(screen.getByText('Recommended Streaming Settings')).toBeInTheDocument();
    
    // Video settings
    expect(screen.getByText('Video:')).toBeInTheDocument();
    expect(screen.getByText(/Resolution: 1920x1080 or 1280x720/)).toBeInTheDocument();
    expect(screen.getByText(/Frame Rate: 30 or 60 FPS/)).toBeInTheDocument();
    expect(screen.getByText(/Bitrate: 2500-6000 kbps/)).toBeInTheDocument();
    
    // Audio settings
    expect(screen.getByText('Audio:')).toBeInTheDocument();
    expect(screen.getByText(/Codec: AAC/)).toBeInTheDocument();
    expect(screen.getByText(/Bitrate: 128-320 kbps/)).toBeInTheDocument();
    expect(screen.getByText(/Sample Rate: 44.1 or 48 kHz/)).toBeInTheDocument();
  });

  it('displays help resources', () => {
    render(<IngestEndpoints {...defaultProps} />);

    expect(screen.getByText('Need Help?')).toBeInTheDocument();
    expect(screen.getByText('OBS Setup Guide')).toBeInTheDocument();
    expect(screen.getByText('Streaming Best Practices')).toBeInTheDocument();
    expect(screen.getByText('Troubleshooting')).toBeInTheDocument();
  });

  it('disables copy buttons when loading', () => {
    render(<IngestEndpoints {...defaultProps} isLoading={true} />);

    const copyButtons = screen.getAllByRole('button', { name: /copy/i });
    copyButtons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  it('applies custom className', () => {
    const { container } = render(
      <IngestEndpoints 
        {...defaultProps} 
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('shows correct protocol descriptions', () => {
    render(<IngestEndpoints {...defaultProps} />);

    expect(screen.getByText('Standard RTMP protocol - compatible with most streaming software')).toBeInTheDocument();
    expect(screen.getByText('Secure Reliable Transport - better for unstable connections')).toBeInTheDocument();
  });

  it('handles multiple copy actions correctly', async () => {
    (navigator.clipboard.writeText as any).mockResolvedValue(undefined);

    render(<IngestEndpoints {...defaultProps} />);

    const copyButtons = screen.getAllByRole('button', { name: /copy/i });
    
    // Copy RTMP first
    fireEvent.click(copyButtons[0]);
    await waitFor(() => {
      expect(screen.getByText('Copied')).toBeInTheDocument();
    });

    // Copy SRT - should replace the first "Copied" state
    fireEvent.click(copyButtons[1]);
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('srt://ingest.example.com:9999');
    });

    // Should still show "Copied" but for SRT now
    expect(screen.getByText('Copied')).toBeInTheDocument();
  });

  it('renders with minimal props', () => {
    const minimalProps = {
      ingest: {
        rtmp: 'rtmp://minimal.example.com/live',
      },
    };

    render(<IngestEndpoints {...minimalProps} />);

    expect(screen.getByText('Ingest Endpoints')).toBeInTheDocument();
    expect(screen.getByText('rtmp://minimal.example.com/live')).toBeInTheDocument();
    expect(screen.queryByText('SRT Server')).not.toBeInTheDocument();
  });
});