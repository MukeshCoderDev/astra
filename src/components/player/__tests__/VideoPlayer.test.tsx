import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../test/utils/test-utils';
import { VideoPlayer } from '../VideoPlayer';
import { createMockHls, createMockVideoElement } from '../../../test/utils/test-utils';

// Mock HLS.js
vi.mock('hls.js', () => ({
  default: vi.fn().mockImplementation(() => createMockHls()),
  isSupported: vi.fn().mockReturnValue(true),
}));

describe('VideoPlayer', () => {
  const mockProps = {
    src: 'https://example.com/video.m3u8',
    poster: 'https://example.com/poster.jpg',
    title: 'Test Video',
    onPlay: vi.fn(),
    onPause: vi.fn(),
    onEnded: vi.fn(),
    onTimeUpdate: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock video element methods
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    HTMLMediaElement.prototype.pause = vi.fn();
    HTMLMediaElement.prototype.load = vi.fn();
  });

  it('renders video element with correct attributes', () => {
    render(<VideoPlayer {...mockProps} />);
    
    const video = screen.getByRole('video');
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute('poster', mockProps.poster);
    expect(video).toHaveAttribute('aria-label', mockProps.title);
  });

  it('shows play button initially', () => {
    render(<VideoPlayer {...mockProps} />);
    
    const playButton = screen.getByRole('button', { name: /play/i });
    expect(playButton).toBeInTheDocument();
  });

  it('toggles play/pause when play button is clicked', async () => {
    render(<VideoPlayer {...mockProps} />);
    
    const playButton = screen.getByRole('button', { name: /play/i });
    fireEvent.click(playButton);
    
    await waitFor(() => {
      expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
    });
  });

  it('shows loading state during video loading', () => {
    render(<VideoPlayer {...mockProps} />);
    
    const video = screen.getByRole('video');
    fireEvent.loadStart(video);
    
    expect(screen.getByLabelText(/loading/i)).toBeInTheDocument();
  });

  it('displays video controls when video is playing', async () => {
    render(<VideoPlayer {...mockProps} />);
    
    const video = screen.getByRole('video');
    fireEvent.play(video);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });
  });

  it('shows progress bar and time display', () => {
    render(<VideoPlayer {...mockProps} />);
    
    const video = screen.getByRole('video');
    Object.defineProperty(video, 'duration', { value: 100, writable: true });
    Object.defineProperty(video, 'currentTime', { value: 25, writable: true });
    
    fireEvent.loadedMetadata(video);
    fireEvent.timeUpdate(video);
    
    expect(screen.getByRole('slider', { name: /progress/i })).toBeInTheDocument();
    expect(screen.getByText(/0:25/)).toBeInTheDocument();
    expect(screen.getByText(/1:40/)).toBeInTheDocument();
  });

  it('handles volume control', () => {
    render(<VideoPlayer {...mockProps} />);
    
    const volumeButton = screen.getByRole('button', { name: /volume/i });
    expect(volumeButton).toBeInTheDocument();
    
    fireEvent.click(volumeButton);
    
    const volumeSlider = screen.getByRole('slider', { name: /volume/i });
    expect(volumeSlider).toBeInTheDocument();
  });

  it('supports fullscreen toggle', () => {
    render(<VideoPlayer {...mockProps} />);
    
    const fullscreenButton = screen.getByRole('button', { name: /fullscreen/i });
    expect(fullscreenButton).toBeInTheDocument();
  });

  it('handles keyboard shortcuts', () => {
    render(<VideoPlayer {...mockProps} />);
    
    const video = screen.getByRole('video');
    
    // Space bar should toggle play/pause
    fireEvent.keyDown(video, { key: ' ' });
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
    
    // Arrow keys should seek
    fireEvent.keyDown(video, { key: 'ArrowRight' });
    fireEvent.keyDown(video, { key: 'ArrowLeft' });
    
    // M should toggle mute
    fireEvent.keyDown(video, { key: 'm' });
    
    // F should toggle fullscreen
    fireEvent.keyDown(video, { key: 'f' });
  });

  it('calls callback functions at appropriate times', () => {
    render(<VideoPlayer {...mockProps} />);
    
    const video = screen.getByRole('video');
    
    fireEvent.play(video);
    expect(mockProps.onPlay).toHaveBeenCalled();
    
    fireEvent.pause(video);
    expect(mockProps.onPause).toHaveBeenCalled();
    
    fireEvent.ended(video);
    expect(mockProps.onEnded).toHaveBeenCalled();
    
    fireEvent.timeUpdate(video);
    expect(mockProps.onTimeUpdate).toHaveBeenCalled();
  });

  it('handles HLS stream initialization', async () => {
    const mockHls = createMockHls();
    vi.mocked(require('hls.js').default).mockImplementation(() => mockHls);
    
    render(<VideoPlayer {...mockProps} />);
    
    await waitFor(() => {
      expect(mockHls.loadSource).toHaveBeenCalledWith(mockProps.src);
      expect(mockHls.attachMedia).toHaveBeenCalled();
    });
  });

  it('falls back to native video when HLS is not supported', () => {
    vi.mocked(require('hls.js').isSupported).mockReturnValue(false);
    
    render(<VideoPlayer {...mockProps} />);
    
    const video = screen.getByRole('video');
    expect(video).toHaveAttribute('src', mockProps.src);
  });

  it('handles errors gracefully', () => {
    render(<VideoPlayer {...mockProps} />);
    
    const video = screen.getByRole('video');
    fireEvent.error(video);
    
    expect(screen.getByText(/error loading video/i)).toBeInTheDocument();
  });

  it('cleans up HLS instance on unmount', () => {
    const mockHls = createMockHls();
    vi.mocked(require('hls.js').default).mockImplementation(() => mockHls);
    
    const { unmount } = render(<VideoPlayer {...mockProps} />);
    unmount();
    
    expect(mockHls.destroy).toHaveBeenCalled();
  });

  it('has proper accessibility attributes', () => {
    render(<VideoPlayer {...mockProps} />);
    
    const video = screen.getByRole('video');
    expect(video).toHaveAttribute('aria-label', mockProps.title);
    
    const controls = screen.getByRole('group', { name: /video controls/i });
    expect(controls).toBeInTheDocument();
  });

  it('supports autoplay when specified', () => {
    render(<VideoPlayer {...mockProps} autoplay />);
    
    const video = screen.getByRole('video');
    expect(video).toHaveAttribute('autoplay');
  });

  it('supports muted playback', () => {
    render(<VideoPlayer {...mockProps} muted />);
    
    const video = screen.getByRole('video');
    expect(video).toHaveAttribute('muted');
  });
});