import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DownloadButton } from '../DownloadButton';
import { Video } from '../../../types';
import * as downloadManager from '../../../lib/downloadManager';

// Mock the download manager
jest.mock('../../../lib/downloadManager', () => ({
  isDownloadSupported: jest.fn(),
  isVideoCached: jest.fn(),
  requestCache: jest.fn(),
  requestUncache: jest.fn(),
  onDownloadProgress: jest.fn(),
}));

// Mock toast provider
const mockShowSuccess = jest.fn();
const mockShowError = jest.fn();
jest.mock('../../../providers/ToastProvider', () => ({
  useToast: () => ({
    success: mockShowSuccess,
    error: mockShowError,
  }),
}));

const mockVideo: Video = {
  id: 'video-1',
  title: 'Test Video',
  description: 'Test description',
  hlsUrl: 'https://example.com/video.m3u8',
  poster: 'https://example.com/poster.jpg',
  durationSec: 300,
  durationLabel: '5:00',
  views: 1000,
  likes: 50,
  tips: 10,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  creator: {
    id: 'creator-1',
    handle: '@creator1',
    displayName: 'Creator 1',
    verified: true,
    followerCount: 1000,
    totalViews: 50000,
  },
  tags: ['test'],
  visibility: 'public',
  type: 'long',
};

const renderDownloadButton = (props = {}) => {
  return render(
    <BrowserRouter>
      <DownloadButton video={mockVideo} {...props} />
    </BrowserRouter>
  );
};

describe('DownloadButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (downloadManager.isDownloadSupported as jest.Mock).mockReturnValue(true);
    (downloadManager.isVideoCached as jest.Mock).mockResolvedValue(false);
    (downloadManager.onDownloadProgress as jest.Mock).mockReturnValue(() => {});
  });

  it('renders download button when video is not cached', async () => {
    renderDownloadButton();
    
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
    
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('');
    expect(button.querySelector('svg')).toBeInTheDocument(); // Download icon
  });

  it('renders downloaded state when video is cached', async () => {
    (downloadManager.isVideoCached as jest.Mock).mockResolvedValue(true);
    
    renderDownloadButton();
    
    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button.querySelector('[data-testid="check-circle"]') || 
             button.querySelector('.lucide-check-circle')).toBeInTheDocument();
    });
  });

  it('shows label when showLabel is true', async () => {
    renderDownloadButton({ showLabel: true });
    
    await waitFor(() => {
      expect(screen.getByText('Download')).toBeInTheDocument();
    });
  });

  it('does not render when downloads are not supported', () => {
    (downloadManager.isDownloadSupported as jest.Mock).mockReturnValue(false);
    
    const { container } = renderDownloadButton();
    expect(container.firstChild).toBeNull();
  });

  it('handles download request correctly', async () => {
    (downloadManager.requestCache as jest.Mock).mockResolvedValue(true);
    
    renderDownloadButton();
    
    await waitFor(() => {
      const button = screen.getByRole('button');
      fireEvent.click(button);
    });
    
    expect(downloadManager.requestCache).toHaveBeenCalledWith(
      'video-1',
      'https://example.com/video.m3u8'
    );
  });

  it('handles download error correctly', async () => {
    (downloadManager.requestCache as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    renderDownloadButton();
    
    await waitFor(() => {
      const button = screen.getByRole('button');
      fireEvent.click(button);
    });
    
    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith(
        'Download failed',
        'Network error'
      );
    });
  });

  it('handles remove request correctly', async () => {
    (downloadManager.isVideoCached as jest.Mock).mockResolvedValue(true);
    (downloadManager.requestUncache as jest.Mock).mockResolvedValue(true);
    
    renderDownloadButton();
    
    await waitFor(() => {
      const button = screen.getByRole('button');
      fireEvent.click(button);
    });
    
    expect(downloadManager.requestUncache).toHaveBeenCalledWith('video-1');
    
    await waitFor(() => {
      expect(mockShowSuccess).toHaveBeenCalledWith(
        'Download removed',
        'Video removed from offline storage'
      );
    });
  });

  it('shows progress during download', async () => {
    let progressCallback: (progress: any) => void = () => {};
    (downloadManager.onDownloadProgress as jest.Mock).mockImplementation((callback) => {
      progressCallback = callback;
      return () => {};
    });
    
    renderDownloadButton({ showLabel: true });
    
    // Simulate progress update
    await waitFor(() => {
      progressCallback({
        videoId: 'video-1',
        progress: 50,
        status: 'downloading',
      });
    });
    
    await waitFor(() => {
      expect(screen.getByText('Downloading... 50%')).toBeInTheDocument();
    });
  });

  it('shows completed state after successful download', async () => {
    let progressCallback: (progress: any) => void = () => {};
    (downloadManager.onDownloadProgress as jest.Mock).mockImplementation((callback) => {
      progressCallback = callback;
      return () => {};
    });
    
    renderDownloadButton({ showLabel: true });
    
    // Simulate completion
    await waitFor(() => {
      progressCallback({
        videoId: 'video-1',
        progress: 100,
        status: 'completed',
      });
    });
    
    await waitFor(() => {
      expect(screen.getByText('Downloaded')).toBeInTheDocument();
      expect(mockShowSuccess).toHaveBeenCalledWith(
        'Video downloaded successfully',
        'Video is now available offline'
      );
    });
  });

  it('shows failed state after download failure', async () => {
    let progressCallback: (progress: any) => void = () => {};
    (downloadManager.onDownloadProgress as jest.Mock).mockImplementation((callback) => {
      progressCallback = callback;
      return () => {};
    });
    
    renderDownloadButton({ showLabel: true });
    
    // Simulate failure
    await waitFor(() => {
      progressCallback({
        videoId: 'video-1',
        progress: 0,
        status: 'failed',
      });
    });
    
    await waitFor(() => {
      expect(screen.getByText('Failed')).toBeInTheDocument();
      expect(mockShowError).toHaveBeenCalledWith(
        'Download failed',
        'Failed to download video for offline viewing'
      );
    });
  });

  it('renders remove button when video is cached', async () => {
    (downloadManager.isVideoCached as jest.Mock).mockResolvedValue(true);
    
    renderDownloadButton();
    
    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2); // Main button + remove button
    });
  });

  it('disables button during loading', async () => {
    (downloadManager.requestCache as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );
    
    renderDownloadButton();
    
    await waitFor(() => {
      const button = screen.getByRole('button');
      fireEvent.click(button);
    });
    
    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  it('shows progress bar during download', async () => {
    let progressCallback: (progress: any) => void = () => {};
    (downloadManager.onDownloadProgress as jest.Mock).mockImplementation((callback) => {
      progressCallback = callback;
      return () => {};
    });
    
    renderDownloadButton();
    
    // Simulate progress update
    await waitFor(() => {
      progressCallback({
        videoId: 'video-1',
        progress: 75,
        status: 'downloading',
      });
    });
    
    await waitFor(() => {
      const progressBar = document.querySelector('[style*="width: 75%"]');
      expect(progressBar).toBeInTheDocument();
    });
  });
});