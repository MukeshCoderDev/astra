import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import WatchLater from '../WatchLater';
import { ENV } from '../../../lib/env';

// Mock fetch
global.fetch = jest.fn();

const mockVideosResponse = {
  videos: [
    {
      id: 'video-1',
      title: 'Watch Later Video 1',
      description: 'Description 1',
      poster: 'https://example.com/poster1.jpg',
      durationLabel: '5:30',
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
      hlsUrl: 'https://example.com/video1.m3u8',
      durationSec: 330,
      views: 1000,
      likes: 50,
      tips: 10,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      watchLater: true,
    },
    {
      id: 'video-2',
      title: 'Watch Later Video 2',
      description: 'Description 2',
      poster: 'https://example.com/poster2.jpg',
      durationLabel: '3:45',
      creator: {
        id: 'creator-2',
        handle: '@creator2',
        displayName: 'Creator 2',
        verified: false,
        followerCount: 500,
        totalViews: 25000,
      },
      tags: ['test'],
      visibility: 'public',
      type: 'long',
      hlsUrl: 'https://example.com/video2.m3u8',
      durationSec: 225,
      views: 500,
      likes: 25,
      tips: 5,
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
      watchLater: true,
    },
  ],
  hasMore: false,
};

const renderWatchLater = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <WatchLater />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('WatchLater', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    localStorage.setItem('token', 'mock-token');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders page header correctly', () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockVideosResponse,
    });

    renderWatchLater();
    
    expect(screen.getByText('Watch Later')).toBeInTheDocument();
    expect(screen.getByText('Videos you\'ve saved to watch later')).toBeInTheDocument();
  });

  it('fetches and displays watch later videos correctly', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockVideosResponse,
    });

    renderWatchLater();
    
    await waitFor(() => {
      expect(screen.getByText('Watch Later Video 1')).toBeInTheDocument();
      expect(screen.getByText('Watch Later Video 2')).toBeInTheDocument();
    });
  });

  it('makes API call with correct parameters', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockVideosResponse,
    });

    renderWatchLater();
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `${ENV.API_BASE}/bff/watch-later?page=1&limit=20`,
        {
          cache: 'no-store',
          headers: {
            'Authorization': 'Bearer mock-token',
          },
        }
      );
    });
  });

  it('displays empty state when no videos are saved', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ videos: [], hasMore: false }),
    });

    renderWatchLater();
    
    await waitFor(() => {
      expect(screen.getByText('No videos saved')).toBeInTheDocument();
      expect(screen.getByText('Save videos to your Watch Later list to easily find them here.')).toBeInTheDocument();
    });
  });

  it('displays error state when API call fails', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    renderWatchLater();
    
    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Try again')).toBeInTheDocument();
    });
  });

  it('displays loading skeleton initially', () => {
    (fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWatchLater();
    
    // Check for loading skeleton elements
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it('uses cache: no-store for personalized content', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockVideosResponse,
    });

    renderWatchLater();
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          cache: 'no-store',
        })
      );
    });
  });

  it('renders videos in grid layout using VideoCard component', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockVideosResponse,
    });

    renderWatchLater();
    
    await waitFor(() => {
      // Check that videos are rendered in a grid layout
      const gridContainer = document.querySelector('.grid');
      expect(gridContainer).toBeInTheDocument();
      expect(gridContainer).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3', 'xl:grid-cols-4');
    });
  });

  it('handles network errors gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    renderWatchLater();
    
    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });
});