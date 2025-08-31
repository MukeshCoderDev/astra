import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../../test/utils/test-utils';
import { VideoCard } from '../VideoCard';
import { mockVideos } from '../../../test/mocks/mockData';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('VideoCard', () => {
  const mockVideo = mockVideos[0];

  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders video information correctly', () => {
    render(<VideoCard video={mockVideo} />);
    
    expect(screen.getByText(mockVideo.title)).toBeInTheDocument();
    expect(screen.getByText(mockVideo.creator.displayName)).toBeInTheDocument();
    expect(screen.getByText(`${mockVideo.views.toLocaleString()} views`)).toBeInTheDocument();
    expect(screen.getByText(mockVideo.durationLabel)).toBeInTheDocument();
  });

  it('displays video thumbnail with proper alt text', () => {
    render(<VideoCard video={mockVideo} />);
    
    const thumbnail = screen.getByRole('img', { name: new RegExp(mockVideo.title, 'i') });
    expect(thumbnail).toBeInTheDocument();
    expect(thumbnail).toHaveAttribute('src', mockVideo.poster);
  });

  it('shows creator avatar and verification badge', () => {
    render(<VideoCard video={mockVideo} />);
    
    const avatar = screen.getByRole('img', { name: new RegExp(mockVideo.creator.displayName, 'i') });
    expect(avatar).toBeInTheDocument();
    
    if (mockVideo.creator.verified) {
      expect(screen.getByLabelText(/verified creator/i)).toBeInTheDocument();
    }
  });

  it('navigates to watch page when clicked', () => {
    render(<VideoCard video={mockVideo} />);
    
    const card = screen.getByRole('article');
    fireEvent.click(card);
    
    expect(mockNavigate).toHaveBeenCalledWith(`/watch/${mockVideo.id}`);
  });

  it('navigates to creator profile when creator info is clicked', () => {
    render(<VideoCard video={mockVideo} />);
    
    const creatorInfo = screen.getByText(mockVideo.creator.displayName);
    fireEvent.click(creatorInfo);
    
    expect(mockNavigate).toHaveBeenCalledWith(`/profile/${mockVideo.creator.handle}`);
  });

  it('handles keyboard navigation', () => {
    render(<VideoCard video={mockVideo} />);
    
    const card = screen.getByRole('article');
    card.focus();
    expect(card).toHaveFocus();
    
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(mockNavigate).toHaveBeenCalledWith(`/watch/${mockVideo.id}`);
  });

  it('shows adult content warning when applicable', () => {
    const adultVideo = { ...mockVideo, adultContent: true };
    render(<VideoCard video={adultVideo} />);
    
    expect(screen.getByLabelText(/adult content/i)).toBeInTheDocument();
  });

  it('shows geo-blocked indicator when applicable', () => {
    const geoBlockedVideo = { ...mockVideo, geoBlocked: ['US', 'CA'] };
    render(<VideoCard video={geoBlockedVideo} />);
    
    expect(screen.getByLabelText(/geo-restricted/i)).toBeInTheDocument();
  });

  it('formats view count correctly', () => {
    const highViewVideo = { ...mockVideo, views: 1500000 };
    render(<VideoCard video={highViewVideo} />);
    
    expect(screen.getByText('1,500,000 views')).toBeInTheDocument();
  });

  it('shows proper duration formatting', () => {
    const longVideo = { ...mockVideo, durationSec: 3661, durationLabel: '1:01:01' };
    render(<VideoCard video={longVideo} />);
    
    expect(screen.getByText('1:01:01')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<VideoCard video={mockVideo} />);
    
    const card = screen.getByRole('article');
    expect(card).toHaveAttribute('tabIndex', '0');
    expect(card).toHaveAttribute('aria-label', expect.stringContaining(mockVideo.title));
  });

  it('handles missing poster gracefully', () => {
    const videoWithoutPoster = { ...mockVideo, poster: '' };
    render(<VideoCard video={videoWithoutPoster} />);
    
    const thumbnail = screen.getByRole('img');
    expect(thumbnail).toHaveAttribute('src', ''); // Should still render img element
  });

  it('truncates long titles appropriately', () => {
    const longTitleVideo = {
      ...mockVideo,
      title: 'This is a very long video title that should be truncated when displayed in the video card component to maintain proper layout and readability',
    };
    render(<VideoCard video={longTitleVideo} />);
    
    const titleElement = screen.getByText(longTitleVideo.title);
    expect(titleElement).toHaveClass('line-clamp-2'); // Assuming Tailwind line-clamp is used
  });
});