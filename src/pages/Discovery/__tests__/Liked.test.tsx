import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import Liked from '../Liked';
import { ENV } from '../../../lib/env';

// Mock fetch
global.fetch = jest.fn();

const mockVideosResponse = {
  videos: [
    {
      id: 'video-1',
      title: 'Liked Video 1',
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
      liked: true,
    },
    {
      id: 'video-2',
      title: 'Liked Video 2',
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
      liked: true,
    },
  ],
  hasMore: false,
};

const renderLiked = () => {
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
        <Liked />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Liked', () => {
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

    renderLiked();
    
    expect(screen.getByText('Liked Videos')).toBeInTheDocument();
    expect(screen.getByText('Videos you\'ve liked and enjoyed')).toBeInTheDocument();
  });

  it('fetches and displays liked videos correctly', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockVideosResponse,
    });

    renderLiked();
    
    await waitFor(() => {
      expect(screen.getByText('Liked Video 1')).toBeInTheDocument();
      expect(screen.getByText('Liked Video 2')).toBeInTheDocument();
    });
  });

  it('makes API call with correct parameters', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockVideosResponse,
    });

    renderLiked();
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `${ENV.API_BASE}/bff/liked?page=1&limit=20`,
        {
          cache: 'no-store',
          headers: {
            'Authorization': 'Bearer mock-token',
          },
        }
      );
    });
  });

  it('displays empty state when no videos are liked', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ videos: [], hasMore: false }),
    });

    renderLiked();
    
    await waitFor(() => {
      expect(screen.getByText('No liked videos')).toBeInTheDocument();
      expect(screen.getByText('Like videos to save them to this collection for easy access later.')).toBeInTheDocument();
    });
  });

  it('displays error state when API call fails', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    renderLiked();
    
    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Try again')).toBeInTheDocument();
    });
  });

  it('displays loading skeleton initially', () => {
    (fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    renderLiked();
    
    // Check for loading skeleton elements
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it('uses cache: no-store for personalized content', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockVideosResponse,
    });

    renderLiked();
    
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

    renderLiked();
    
    await waitFor(() => {
      // Check that videos are rendered in a grid layout
      const gridContainer = document.querySelector('.grid');
      expect(gridContainer).toBeInTheDocument();
      expect(gridContainer).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3', 'xl:grid-cols-4');
    });
  });

  it('handles network errors gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    renderLiked();
    
    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  it('shows proper container layout structure', () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockVideosResponse,
    });

    renderLiked();
    
    // Check for proper container structure
    const containers = document.querySelectorAll('.container');
    expect(containers.length).toBeGreaterThan(0);
    
    // Check for min-height on main container
    const mainContainer = document.querySelector('.min-h-screen');
    expect(mainContainer).toBeInTheDocument();
  });
});