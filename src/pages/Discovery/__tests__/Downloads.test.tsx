import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Downloads from '../Downloads';
import * as downloadManager from '../../../lib/downloadManager';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock the download manager
jest.mock('../../../lib/downloadManager', () => ({
  isDownloadSupported: jest.fn(),
  getCachedVideos: jest.fn(),
  getCacheSize: jest.fn(),
  clearAllCache: jest.fn(),
  formatBytes: jest.fn(),
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

// Mock DownloadButton component
jest.mock('../../../components/common/DownloadButton', () => ({
  DownloadButton: ({ video }: any) => (
    <button data-testid={`download-button-${video.id}`}>Download Button</button>
  ),
}));

const mockCachedVideos = [
  {
    id: 'video-1',
    title: 'Cached Video 1',
    poster: 'https://example.com/poster1.jpg',
    hlsUrl: 'https://example.com/video1.m3u8',
    durationLabel: '5:30',
    creator: {
      handle: '@creator1',
      displayName: 'Creator 1',
    },
    cachedAt: '2024-01-01T00:00:00Z',
    size: 1024000,
  },
  {
    id: 'video-2',
    title: 'Cached Video 2',
    poster: 'https://example.com/poster2.jpg',
    hlsUrl: 'https://example.com/video2.m3u8',
    durationLabel: '3:45',
    creator: {
      handle: '@creator2',
      displayName: 'Creator 2',
    },
    cachedAt: '2024-01-02T00:00:00Z',
    size: 2048000,
  },
];

const renderDownloads = () => {
  return render(
    <BrowserRouter>
      <Downloads />
    </BrowserRouter>
  );
};

describe('Downloads', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (downloadManager.isDownloadSupported as jest.Mock).mockReturnValue(true);
    (downloadManager.getCachedVideos as jest.Mock).mockResolvedValue(mockCachedVideos);
    (downloadManager.getCacheSize as jest.Mock).mockResolvedValue(3072000);
    (downloadManager.formatBytes as jest.Mock).mockImplementation((bytes) => `${bytes} bytes`);
  });

  it('renders page header correctly', async () => {
    renderDownloads();
    
    expect(screen.getByText('Downloads')).toBeInTheDocument();
    expect(screen.getByText('Offline video downloads (Prototype)')).toBeInTheDocument();
  });

  it('displays cached videos correctly', async () => {
    renderDownloads();
    
    await waitFor(() => {
      expect(screen.getByText('Cached Video 1')).toBeInTheDocument();
      expect(screen.getByText('Cached Video 2')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Creator 1 • 5:30')).toBeInTheDocument();
    expect(screen.getByText('Creator 2 • 3:45')).toBeInTheDocument();
  });

  it('displays storage information correctly', async () => {
    renderDownloads();
    
    await waitFor(() => {
      expect(screen.getByText('Storage Used')).toBeInTheDocument();
      expect(screen.getByText('3072000 bytes • 2 videos')).toBeInTheDocument();
    });
  });

  it('shows not supported message when downloads are not supported', () => {
    (downloadManager.isDownloadSupported as jest.Mock).mockReturnValue(false);
    
    renderDownloads();
    
    expect(screen.getByText('Downloads not supported')).toBeInTheDocument();
    expect(screen.getByText(/Your browser does not support offline downloads/)).toBeInTheDocument();
  });

  it('shows empty state when no videos are cached', async () => {
    (downloadManager.getCachedVideos as jest.Mock).mockResolvedValue([]);
    (downloadManager.getCacheSize as jest.Mock).mockResolvedValue(0);
    
    renderDownloads();
    
    await waitFor(() => {
      expect(screen.getByText('No downloads yet')).toBeInTheDocument();
      expect(screen.getByText(/Download videos to watch them offline/)).toBeInTheDocument();
    });
    
    expect(screen.getByText('Browse Videos')).toBeInTheDocument();
  });

  it('handles refresh button correctly', async () => {
    renderDownloads();
    
    await waitFor(() => {
      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);
    });
    
    // Should call the load functions again
    expect(downloadManager.getCachedVideos).toHaveBeenCalledTimes(2);
    expect(downloadManager.getCacheSize).toHaveBeenCalledTimes(2);
  });

  it('handles clear all button correctly', async () => {
    (downloadManager.clearAllCache as jest.Mock).mockResolvedValue(undefined);
    
    // Mock window.confirm
    const originalConfirm = window.confirm;
    window.confirm = jest.fn().mockReturnValue(true);
    
    renderDownloads();
    
    await waitFor(() => {
      const clearButton = screen.getByText('Clear All');
      fireEvent.click(clearButton);
    });
    
    expect(downloadManager.clearAllCache).toHaveBeenCalled();
    
    await waitFor(() => {
      expect(mockShowSuccess).toHaveBeenCalledWith(
        'All downloads cleared',
        'All cached videos have been removed'
      );
    });
    
    window.confirm = originalConfirm;
  });

  it('cancels clear all when user declines confirmation', async () => {
    // Mock window.confirm to return false
    const originalConfirm = window.confirm;
    window.confirm = jest.fn().mockReturnValue(false);
    
    renderDownloads();
    
    await waitFor(() => {
      const clearButton = screen.getByText('Clear All');
      fireEvent.click(clearButton);
    });
    
    expect(downloadManager.clearAllCache).not.toHaveBeenCalled();
    
    window.confirm = originalConfirm;
  });

  it('handles clear all error correctly', async () => {
    (downloadManager.clearAllCache as jest.Mock).mockRejectedValue(new Error('Clear failed'));
    
    // Mock window.confirm
    const originalConfirm = window.confirm;
    window.confirm = jest.fn().mockReturnValue(true);
    
    renderDownloads();
    
    await waitFor(() => {
      const clearButton = screen.getByText('Clear All');
      fireEvent.click(clearButton);
    });
    
    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith(
        'Failed to clear downloads',
        'Could not remove cached videos'
      );
    });
    
    window.confirm = originalConfirm;
  });

  it('navigates to video when watch button is clicked', async () => {
    renderDownloads();
    
    await waitFor(() => {
      const watchButtons = screen.getAllByText('Watch');
      fireEvent.click(watchButtons[0]);
    });
    
    expect(mockNavigate).toHaveBeenCalledWith('/watch/video-1');
  });

  it('navigates to home when browse videos button is clicked', async () => {
    (downloadManager.getCachedVideos as jest.Mock).mockResolvedValue([]);
    (downloadManager.getCacheSize as jest.Mock).mockResolvedValue(0);
    
    renderDownloads();
    
    await waitFor(() => {
      const browseButton = screen.getByText('Browse Videos');
      fireEvent.click(browseButton);
    });
    
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('shows loading state initially', () => {
    (downloadManager.getCachedVideos as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );
    
    renderDownloads();
    
    // Should show loading spinner or skeleton
    expect(document.querySelector('.animate-spin') || 
           screen.queryByText('Loading')).toBeTruthy();
  });

  it('handles loading error gracefully', async () => {
    (downloadManager.getCachedVideos as jest.Mock).mockRejectedValue(new Error('Load failed'));
    
    renderDownloads();
    
    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith(
        'Failed to load downloads',
        'Could not retrieve cached videos'
      );
    });
  });

  it('renders download buttons for each video', async () => {
    renderDownloads();
    
    await waitFor(() => {
      expect(screen.getByTestId('download-button-video-1')).toBeInTheDocument();
      expect(screen.getByTestId('download-button-video-2')).toBeInTheDocument();
    });
  });

  it('displays video thumbnails with lazy loading', async () => {
    renderDownloads();
    
    await waitFor(() => {
      const thumbnails = screen.getAllByRole('img');
      thumbnails.forEach(img => {
        expect(img).toHaveAttribute('loading', 'lazy');
      });
    });
  });

  it('shows correct singular/plural text for video count', async () => {
    // Test with single video
    (downloadManager.getCachedVideos as jest.Mock).mockResolvedValue([mockCachedVideos[0]]);
    
    const { rerender } = renderDownloads();
    
    await waitFor(() => {
      expect(screen.getByText(/1 video$/)).toBeInTheDocument();
    });
    
    // Test with multiple videos
    (downloadManager.getCachedVideos as jest.Mock).mockResolvedValue(mockCachedVideos);
    
    rerender(
      <BrowserRouter>
        <Downloads />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/2 videos$/)).toBeInTheDocument();
    });
  });

  it('does not show clear all button when no videos are cached', async () => {
    (downloadManager.getCachedVideos as jest.Mock).mockResolvedValue([]);
    
    renderDownloads();
    
    await waitFor(() => {
      expect(screen.queryByText('Clear All')).not.toBeInTheDocument();
    });
  });
});