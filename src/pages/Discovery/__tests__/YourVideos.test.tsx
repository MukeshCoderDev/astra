import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import YourVideos from '../YourVideos';
import { ENV } from '../../../lib/env';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock fetch
global.fetch = jest.fn();

const mockVideosResponse = {
  videos: [
    {
      video: {
        id: 'video-1',
        title: 'Test Video 1',
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
      },
      status: 'published',
      views: 1000,
      uploadedAt: '2024-01-01T00:00:00Z',
    },
    {
      video: {
        id: 'video-2',
        title: 'Test Video 2',
        description: 'Description 2',
        poster: 'https://example.com/poster2.jpg',
        durationLabel: '3:45',
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
        hlsUrl: 'https://example.com/video2.m3u8',
        durationSec: 225,
        views: 500,
        likes: 25,
        tips: 5,
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      },
      status: 'processing',
      views: 500,
      uploadedAt: '2024-01-02T00:00:00Z',
    },
  ],
  hasMore: false,
};

const renderYourVideos = () => {
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
        <YourVideos />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('YourVideos', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    mockNavigate.mockClear();
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

    renderYourVideos();
    
    expect(screen.getByText('Your Videos')).toBeInTheDocument();
    expect(screen.getByText('Manage and track your uploaded content')).toBeInTheDocument();
    expect(screen.getByText('Upload new video')).toBeInTheDocument();
  });

  it('renders table headers correctly', () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockVideosResponse,
    });

    renderYourVideos();
    
    expect(screen.getByText('Video')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Views')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('fetches and displays videos correctly', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockVideosResponse,
    });

    renderYourVideos();
    
    await waitFor(() => {
      expect(screen.getByText('Test Video 1')).toBeInTheDocument();
      expect(screen.getByText('Test Video 2')).toBeInTheDocument();
    });

    expect(screen.getByText('Published')).toBeInTheDocument();
    expect(screen.getByText('Processing')).toBeInTheDocument();
  });

  it('makes API call with correct parameters', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockVideosResponse,
    });

    renderYourVideos();
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `${ENV.API_BASE}/creator/videos?page=1&limit=20`,
        {
          cache: 'no-store',
          headers: {
            'Authorization': 'Bearer mock-token',
          },
        }
      );
    });
  });

  it('displays empty state when no videos exist', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ videos: [], hasMore: false }),
    });

    renderYourVideos();
    
    await waitFor(() => {
      expect(screen.getByText('No uploads yet')).toBeInTheDocument();
      expect(screen.getByText('Upload your first video to start building your content library.')).toBeInTheDocument();
    });
  });

  it('displays error state when API call fails', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    renderYourVideos();
    
    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Try again')).toBeInTheDocument();
    });
  });

  it('displays loading skeleton initially', () => {
    (fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    renderYourVideos();
    
    // Check for loading skeleton elements
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it('navigates to upload page when upload button is clicked', () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockVideosResponse,
    });

    renderYourVideos();
    
    const uploadButton = screen.getByText('Upload new video');
    uploadButton.click();
    
    expect(mockNavigate).toHaveBeenCalledWith('/upload');
  });

  it('uses cache: no-store for personalized content', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockVideosResponse,
    });

    renderYourVideos();
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          cache: 'no-store',
        })
      );
    });
  });
});