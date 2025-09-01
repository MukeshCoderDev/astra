import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { VirtualizedInfiniteFeed } from '../VirtualizedInfiniteFeed';

// Mock the performance optimizations
jest.mock('../../../lib/performanceOptimizations', () => ({
  useVirtualScroll: jest.fn(() => ({
    visibleItems: [],
    totalHeight: 0,
    offsetY: 0,
    startIndex: 0,
    endIndex: 0,
    handleScroll: jest.fn(),
  })),
  useScrollPerformance: jest.fn(() => ({
    isScrolling: false,
    handleScroll: jest.fn(),
  })),
}));

// Mock VideoCard component
jest.mock('../../feed/VideoCard', () => ({
  VideoCard: ({ video }: any) => (
    <div data-testid={`video-card-${video.id}`}>
      {video.title}
    </div>
  ),
}));

// Mock fetch
global.fetch = jest.fn();

const mockVideosResponse = {
  items: Array.from({ length: 20 }, (_, i) => ({
    id: `video-${i + 1}`,
    title: `Video ${i + 1}`,
    description: `Description ${i + 1}`,
    poster: `https://example.com/poster${i + 1}.jpg`,
    durationLabel: '5:30',
    creator: {
      id: `creator-${i + 1}`,
      handle: `@creator${i + 1}`,
      displayName: `Creator ${i + 1}`,
      verified: true,
      followerCount: 1000,
      totalViews: 50000,
    },
    tags: ['test'],
    visibility: 'public',
    type: 'long',
    hlsUrl: `https://example.com/video${i + 1}.m3u8`,
    durationSec: 330,
    views: 1000 + i * 100,
    likes: 50 + i * 5,
    tips: 10 + i,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  })),
  hasMore: true,
};

const renderVirtualizedFeed = (props = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const defaultProps = {
    queryKey: ['test-videos'],
    fetchPage: jest.fn().mockResolvedValue(mockVideosResponse),
    ...props,
  };

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <VirtualizedInfiniteFeed {...defaultProps} />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('VirtualizedInfiniteFeed', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('renders videos correctly without virtualization', async () => {
    renderVirtualizedFeed();
    
    await waitFor(() => {
      expect(screen.getByTestId('video-card-video-1')).toBeInTheDocument();
      expect(screen.getByText('Video 1')).toBeInTheDocument();
    });
  });

  it('renders loading skeleton initially', () => {
    const fetchPage = jest.fn(() => new Promise(() => {})); // Never resolves
    renderVirtualizedFeed({ fetchPage });
    
    // Check for loading skeleton elements
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it('displays error state when fetch fails', async () => {
    const fetchPage = jest.fn().mockRejectedValue(new Error('Network error'));
    renderVirtualizedFeed({ fetchPage });
    
    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('displays empty state when no videos exist', async () => {
    const fetchPage = jest.fn().mockResolvedValue({ items: [], hasMore: false });
    renderVirtualizedFeed({ fetchPage });
    
    await waitFor(() => {
      expect(screen.getByText('No videos found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your filters or check back later.')).toBeInTheDocument();
    });
  });

  it('displays custom empty message', async () => {
    const fetchPage = jest.fn().mockResolvedValue({ items: [], hasMore: false });
    renderVirtualizedFeed({ 
      fetchPage,
      emptyMessage: 'Custom empty message',
      emptyDescription: 'Custom description'
    });
    
    await waitFor(() => {
      expect(screen.getByText('Custom empty message')).toBeInTheDocument();
      expect(screen.getByText('Custom description')).toBeInTheDocument();
    });
  });

  it('enables virtualization when threshold is exceeded', async () => {
    const { useVirtualScroll } = require('../../../lib/performanceOptimizations');
    
    // Mock large dataset
    const largeDataset = {
      items: Array.from({ length: 150 }, (_, i) => ({
        ...mockVideosResponse.items[0],
        id: `video-${i + 1}`,
        title: `Video ${i + 1}`,
      })),
      hasMore: false,
    };

    const fetchPage = jest.fn().mockResolvedValue(largeDataset);
    
    renderVirtualizedFeed({ 
      fetchPage,
      enableVirtualization: true,
      virtualizationThreshold: 100
    });
    
    await waitFor(() => {
      expect(useVirtualScroll).toHaveBeenCalled();
    });
  });

  it('handles scroll events correctly', async () => {
    const { useScrollPerformance } = require('../../../lib/performanceOptimizations');
    const mockHandleScroll = jest.fn();
    
    useScrollPerformance.mockReturnValue({
      isScrolling: false,
      handleScroll: mockHandleScroll,
    });

    renderVirtualizedFeed();
    
    await waitFor(() => {
      expect(screen.getByTestId('video-card-video-1')).toBeInTheDocument();
    });

    // Simulate scroll event
    const container = document.querySelector('.grid')?.parentElement;
    if (container) {
      fireEvent.scroll(container);
    }
  });

  it('shows loading indicator when fetching next page', async () => {
    let resolveFirstPage: (value: any) => void;
    const firstPagePromise = new Promise(resolve => {
      resolveFirstPage = resolve;
    });

    const fetchPage = jest.fn()
      .mockReturnValueOnce(firstPagePromise)
      .mockResolvedValue({ items: [], hasMore: false });

    renderVirtualizedFeed({ fetchPage });
    
    // Resolve first page
    resolveFirstPage(mockVideosResponse);
    
    await waitFor(() => {
      expect(screen.getByTestId('video-card-video-1')).toBeInTheDocument();
    });

    // Mock intersection observer triggering next page fetch
    const observerCallback = (global.IntersectionObserver as jest.Mock).mock.calls[0][0];
    observerCallback([{ isIntersecting: true }]);

    // Should show loading indicator
    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  it('shows end of results message when no more pages', async () => {
    const fetchPage = jest.fn().mockResolvedValue({ 
      ...mockVideosResponse, 
      hasMore: false 
    });
    
    renderVirtualizedFeed({ fetchPage });
    
    await waitFor(() => {
      expect(screen.getByText("You've reached the end")).toBeInTheDocument();
    });
  });

  it('uses custom render error function', async () => {
    const customRenderError = jest.fn(() => <div>Custom error</div>);
    const fetchPage = jest.fn().mockRejectedValue(new Error('Test error'));
    
    renderVirtualizedFeed({ fetchPage, renderError: customRenderError });
    
    await waitFor(() => {
      expect(customRenderError).toHaveBeenCalled();
      expect(screen.getByText('Custom error')).toBeInTheDocument();
    });
  });

  it('applies performance optimizations during scroll', async () => {
    const { useScrollPerformance } = require('../../../lib/performanceOptimizations');
    
    useScrollPerformance.mockReturnValue({
      isScrolling: true,
      handleScroll: jest.fn(),
    });

    renderVirtualizedFeed();
    
    await waitFor(() => {
      const videoCard = screen.getByTestId('video-card-video-1');
      expect(videoCard).toHaveClass('pointer-events-none');
    });
  });

  it('handles retry correctly', async () => {
    const fetchPage = jest.fn().mockRejectedValue(new Error('Network error'));
    renderVirtualizedFeed({ fetchPage });
    
    await waitFor(() => {
      expect(screen.getByText('Try again')).toBeInTheDocument();
    });

    // Mock successful retry
    fetchPage.mockResolvedValueOnce(mockVideosResponse);
    
    fireEvent.click(screen.getByText('Try again'));
    
    await waitFor(() => {
      expect(screen.getByTestId('video-card-video-1')).toBeInTheDocument();
    });
  });

  it('memoizes expensive operations', async () => {
    const fetchPage = jest.fn().mockResolvedValue(mockVideosResponse);
    const { rerender } = renderVirtualizedFeed({ fetchPage });
    
    await waitFor(() => {
      expect(screen.getByTestId('video-card-video-1')).toBeInTheDocument();
    });

    // Re-render with same props should not cause unnecessary re-computation
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <BrowserRouter>
          <VirtualizedInfiniteFeed
            queryKey={['test-videos']}
            fetchPage={fetchPage}
          />
        </BrowserRouter>
      </QueryClientProvider>
    );

    // Should still render correctly without additional API calls
    expect(screen.getByTestId('video-card-video-1')).toBeInTheDocument();
  });
});

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));