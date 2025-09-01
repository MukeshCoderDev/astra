import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LivePlayer from '../LivePlayer';
import { metricsApi } from '../../../lib/api';

// Mock HLS.js
const mockHls = {
  isSupported: vi.fn(() => true),
  loadSource: vi.fn(),
  attachMedia: vi.fn(),
  destroy: vi.fn(),
  startLoad: vi.fn(),
  recoverMediaError: vi.fn(),
  on: vi.fn(),
  Events: {
    MEDIA_ATTACHED: 'hlsMediaAttached',
    MANIFEST_PARSED: 'hlsManifestParsed',
    FRAG_LOADED: 'hlsFragLoaded',
    ERROR: 'hlsError'
  },
  ErrorTypes: {
    NETWORK_ERROR: 'networkError',
    MEDIA_ERROR: 'mediaError'
  }
};

vi.mock('hls.js', () => ({
  default: vi.fn(() => mockHls)
}));

// Mock metrics API
vi.mock('../../../lib/api', () => ({
  metricsApi: {
    reportJoinTime: vi.fn()
  }
}));

// Mock performance.now
const mockPerformanceNow = vi.fn(() => 1000);
Object.defineProperty(global, 'performance', {
  value: { now: mockPerformanceNow }
});

// Mock video element methods
const mockVideoElement = {
  play: vi.fn(() => Promise.resolve()),
  pause: vi.fn(),
  load: vi.fn(),
  canPlayType: vi.fn(() => ''),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  seekable: {
    length: 1,
    end: vi.fn(() => 100)
  },
  currentTime: 95,
  duration: 100
};

// Mock HTMLVideoElement
Object.defineProperty(HTMLVideoElement.prototype, 'play', {
  value: mockVideoElement.play
});

describe('LivePlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPerformanceNow.mockReturnValue(1000);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render video element with correct attributes', () => {
    render(
      <LivePlayer 
        src="https://example.com/stream.m3u8" 
        poster="https://example.com/poster.jpg"
      />
    );

    const video = screen.getByRole('generic').querySelector('video');
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute('poster', 'https://example.com/poster.jpg');
    expect(video).toHaveAttribute('playsInline');
    expect(video).toHaveAttribute('autoPlay');
    expect(video).toHaveAttribute('muted');
  });

  it('should show loading state initially', () => {
    render(<LivePlayer src="https://example.com/stream.m3u8" />);
    
    expect(screen.getByText('Loading stream...')).toBeInTheDocument();
  });

  it('should initialize HLS when supported', () => {
    const HlsConstructor = vi.mocked(require('hls.js').default);
    
    render(<LivePlayer src="https://example.com/stream.m3u8" />);
    
    expect(HlsConstructor).toHaveBeenCalledWith(
      expect.objectContaining({
        lowLatencyMode: true,
        maxBufferLength: 6
      })
    );
    expect(mockHls.loadSource).toHaveBeenCalledWith('https://example.com/stream.m3u8');
    expect(mockHls.attachMedia).toHaveBeenCalled();
  });

  it('should show LIVE badge and status', () => {
    render(<LivePlayer src="https://example.com/stream.m3u8" />);
    
    expect(screen.getByText('LIVE')).toBeInTheDocument();
  });

  it('should show "Go Live" button when behind threshold', async () => {
    render(<LivePlayer src="https://example.com/stream.m3u8" />);
    
    // Mock being behind by 6 seconds (above threshold)
    const video = screen.getByRole('generic').querySelector('video');
    if (video) {
      Object.defineProperty(video, 'seekable', {
        value: {
          length: 1,
          end: () => 100
        }
      });
      Object.defineProperty(video, 'currentTime', { value: 94 });
    }

    // Trigger time update
    await waitFor(() => {
      expect(screen.getByText('Go Live')).toBeInTheDocument();
    });
  });

  it('should handle Go Live button click', async () => {
    render(<LivePlayer src="https://example.com/stream.m3u8" />);
    
    // Mock video element
    const video = screen.getByRole('generic').querySelector('video');
    const mockSeek = vi.fn();
    
    if (video) {
      Object.defineProperty(video, 'seekable', {
        value: {
          length: 1,
          end: () => 100
        }
      });
      Object.defineProperty(video, 'currentTime', { 
        value: 94,
        set: mockSeek
      });
    }

    // Wait for Go Live button to appear
    await waitFor(() => {
      expect(screen.getByText('Go Live')).toBeInTheDocument();
    });

    // Click Go Live button
    fireEvent.click(screen.getByText('Go Live'));
    
    expect(mockSeek).toHaveBeenCalledWith(99.5); // liveEdge - 0.5s buffer
  });

  it('should show DVR controls when dvrWindowSec is provided', () => {
    render(
      <LivePlayer 
        src="https://example.com/stream.m3u8" 
        dvrWindowSec={3600}
      />
    );
    
    const slider = screen.getByRole('slider', { name: 'DVR timeline' });
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveAttribute('max', '3600');
  });

  it('should handle DVR seeking', () => {
    render(
      <LivePlayer 
        src="https://example.com/stream.m3u8" 
        dvrWindowSec={3600}
      />
    );
    
    const video = screen.getByRole('generic').querySelector('video');
    const mockSeek = vi.fn();
    
    if (video) {
      Object.defineProperty(video, 'seekable', {
        value: {
          length: 1,
          end: () => 100
        }
      });
      Object.defineProperty(video, 'currentTime', { 
        value: 95,
        set: mockSeek
      });
    }

    const slider = screen.getByRole('slider', { name: 'DVR timeline' });
    fireEvent.change(slider, { target: { value: '10' } });
    
    expect(mockSeek).toHaveBeenCalledWith(90); // liveEdge - seekValue
  });

  it('should report join time metrics', async () => {
    mockPerformanceNow
      .mockReturnValueOnce(1000) // Start time
      .mockReturnValueOnce(1500); // End time

    render(
      <LivePlayer 
        src="https://example.com/stream.m3u8" 
        streamId="test-stream"
      />
    );

    // Simulate loadeddata event
    const video = screen.getByRole('generic').querySelector('video');
    if (video) {
      fireEvent.loadedData(video);
    }

    await waitFor(() => {
      expect(metricsApi.reportJoinTime).toHaveBeenCalledWith({
        type: 'live',
        streamId: 'test-stream',
        ms: 500,
        timestamp: expect.any(Number),
        userAgent: expect.any(String)
      });
    });
  });

  it('should handle HLS errors gracefully', () => {
    const HlsConstructor = vi.mocked(require('hls.js').default);
    let errorCallback: Function;
    
    mockHls.on.mockImplementation((event, callback) => {
      if (event === mockHls.Events.ERROR) {
        errorCallback = callback;
      }
    });

    render(<LivePlayer src="https://example.com/stream.m3u8" />);
    
    // Simulate network error
    errorCallback('error', {
      fatal: true,
      type: mockHls.ErrorTypes.NETWORK_ERROR
    });

    expect(screen.getByText('Network error. Please check your connection.')).toBeInTheDocument();
    expect(mockHls.startLoad).toHaveBeenCalled();
  });

  it('should show retry button on error', async () => {
    render(<LivePlayer src="https://example.com/stream.m3u8" />);
    
    // Simulate error
    const video = screen.getByRole('generic').querySelector('video');
    if (video) {
      fireEvent.error(video);
    }

    await waitFor(() => {
      expect(screen.getByText('Failed to load video stream.')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  it('should handle native HLS support fallback', () => {
    // Mock HLS not supported but native support available
    mockHls.isSupported.mockReturnValue(false);
    mockVideoElement.canPlayType.mockReturnValue('probably');

    render(<LivePlayer src="https://example.com/stream.m3u8" />);
    
    const video = screen.getByRole('generic').querySelector('video');
    expect(video).toHaveAttribute('src', 'https://example.com/stream.m3u8');
  });

  it('should show error when HLS is not supported', () => {
    mockHls.isSupported.mockReturnValue(false);
    mockVideoElement.canPlayType.mockReturnValue('');

    render(<LivePlayer src="https://example.com/stream.m3u8" />);
    
    expect(screen.getByText('HLS is not supported in this browser.')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <LivePlayer 
        src="https://example.com/stream.m3u8" 
        className="custom-class"
      />
    );
    
    const container = screen.getByRole('generic');
    expect(container).toHaveClass('custom-class');
  });

  it('should cleanup HLS instance on unmount', () => {
    const { unmount } = render(<LivePlayer src="https://example.com/stream.m3u8" />);
    
    unmount();
    
    expect(mockHls.destroy).toHaveBeenCalled();
  });
});