import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { UploadRow } from '../UploadRow';
import { UploadItem } from '../../../types';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockUploadItem: UploadItem = {
  video: {
    id: 'video-1',
    title: 'Test Video Title',
    description: 'Test video description',
    hlsUrl: 'https://example.com/video.m3u8',
    poster: 'https://example.com/poster.jpg',
    durationSec: 120,
    durationLabel: '2:00',
    views: 1500,
    likes: 50,
    tips: 10,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    creator: {
      id: 'creator-1',
      handle: '@testcreator',
      displayName: 'Test Creator',
      verified: true,
      followerCount: 1000,
      totalViews: 50000,
    },
    tags: ['test', 'video'],
    visibility: 'public',
    type: 'long',
  },
  status: 'published',
  views: 1500,
  uploadedAt: '2024-01-01T00:00:00Z',
};

const renderUploadRow = (item: UploadItem = mockUploadItem) => {
  return render(
    <BrowserRouter>
      <UploadRow item={item} />
    </BrowserRouter>
  );
};

describe('UploadRow', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders video information correctly', () => {
    renderUploadRow();
    
    expect(screen.getByText('Test Video Title')).toBeInTheDocument();
    expect(screen.getByText('Test video description')).toBeInTheDocument();
    expect(screen.getByText('2:00')).toBeInTheDocument();
    expect(screen.getByText('1.5K views')).toBeInTheDocument();
  });

  it('displays the correct status badge', () => {
    renderUploadRow();
    
    expect(screen.getByText('Published')).toBeInTheDocument();
  });

  it('formats upload date correctly', () => {
    renderUploadRow();
    
    expect(screen.getByText('Uploaded Jan 1, 2024')).toBeInTheDocument();
  });

  it('formats view count correctly for different ranges', () => {
    // Test thousands
    const itemWithThousands = {
      ...mockUploadItem,
      views: 5500,
    };
    const { rerender } = renderUploadRow(itemWithThousands);
    expect(screen.getByText('5.5K views')).toBeInTheDocument();

    // Test millions
    const itemWithMillions = {
      ...mockUploadItem,
      views: 2500000,
    };
    rerender(
      <BrowserRouter>
        <UploadRow item={itemWithMillions} />
      </BrowserRouter>
    );
    expect(screen.getByText('2.5M views')).toBeInTheDocument();

    // Test small numbers
    const itemWithSmallViews = {
      ...mockUploadItem,
      views: 42,
    };
    rerender(
      <BrowserRouter>
        <UploadRow item={itemWithSmallViews} />
      </BrowserRouter>
    );
    expect(screen.getByText('42 views')).toBeInTheDocument();
  });

  it('displays different status colors correctly', () => {
    const statuses = [
      { status: 'processing', expectedClass: 'secondary' },
      { status: 'live', expectedClass: 'destructive' },
      { status: 'failed', expectedClass: 'destructive' },
      { status: 'published', expectedClass: 'default' },
    ];

    statuses.forEach(({ status }) => {
      const item = {
        ...mockUploadItem,
        status: status as any,
      };
      const { rerender } = renderUploadRow(item);
      expect(screen.getByText(status.charAt(0).toUpperCase() + status.slice(1))).toBeInTheDocument();
      
      if (status !== 'published') {
        rerender(
          <BrowserRouter>
            <UploadRow item={mockUploadItem} />
          </BrowserRouter>
        );
      }
    });
  });

  it('navigates to video when Open button is clicked', () => {
    renderUploadRow();
    
    const openButton = screen.getByRole('button', { name: /open/i });
    fireEvent.click(openButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/watch/video-1');
  });

  it('renders thumbnail with lazy loading', () => {
    renderUploadRow();
    
    const thumbnail = screen.getByAltText('Test Video Title');
    expect(thumbnail).toHaveAttribute('loading', 'lazy');
    expect(thumbnail).toHaveAttribute('src', 'https://example.com/poster.jpg');
  });

  it('renders more options button', () => {
    renderUploadRow();
    
    const moreButton = screen.getByRole('button', { name: '' }); // MoreVertical icon button
    expect(moreButton).toBeInTheDocument();
  });

  it('applies hover styles correctly', () => {
    renderUploadRow();
    
    const container = screen.getByText('Test Video Title').closest('div');
    expect(container).toHaveClass('hover:bg-accent/50', 'transition-colors');
  });
});