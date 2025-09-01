import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LiveCard from '../LiveCard';
import type { Stream } from '../../../types/live';

// Mock stream data
const mockLiveStream: Stream = {
  id: 'stream-1',
  title: 'Test Live Stream',
  poster: 'https://example.com/poster.jpg',
  viewers: 1250,
  status: 'live',
  creator: {
    id: 'creator-1',
    handle: 'testcreator'
  }
};

const mockUpcomingStream: Stream = {
  id: 'stream-2',
  title: 'Upcoming Stream',
  scheduled: true,
  startAt: '2024-01-01T15:30:00Z',
  status: 'preview',
  creator: {
    id: 'creator-2',
    handle: 'anothercreator'
  }
};

const mockEndedStream: Stream = {
  id: 'stream-3',
  title: 'Ended Stream',
  viewers: 500,
  status: 'ended',
  creator: {
    id: 'creator-3',
    handle: 'endedcreator'
  }
};

// Wrapper component for React Router
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('LiveCard', () => {
  it('should render live stream card correctly', () => {
    render(
      <RouterWrapper>
        <LiveCard stream={mockLiveStream} />
      </RouterWrapper>
    );

    // Check title and creator
    expect(screen.getByText('Test Live Stream')).toBeInTheDocument();
    expect(screen.getByText('@testcreator')).toBeInTheDocument();
    
    // Check live badge
    expect(screen.getByText('LIVE')).toBeInTheDocument();
    
    // Check viewer count
    expect(screen.getByText('1.3K watching')).toBeInTheDocument();
    
    // Check link
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/live/stream-1');
    expect(link).toHaveAttribute('aria-label', 'Watch Test Live Stream by testcreator');
  });

  it('should render upcoming stream card correctly', () => {
    render(
      <RouterWrapper>
        <LiveCard stream={mockUpcomingStream} />
      </RouterWrapper>
    );

    expect(screen.getByText('Upcoming Stream')).toBeInTheDocument();
    expect(screen.getByText('@anothercreator')).toBeInTheDocument();
    expect(screen.getByText('UPCOMING')).toBeInTheDocument();
    
    // Should show scheduled time
    expect(screen.getByText('3:30 PM')).toBeInTheDocument();
  });

  it('should render ended stream card correctly', () => {
    render(
      <RouterWrapper>
        <LiveCard stream={mockEndedStream} />
      </RouterWrapper>
    );

    expect(screen.getByText('Ended Stream')).toBeInTheDocument();
    expect(screen.getByText('ENDED')).toBeInTheDocument();
    expect(screen.getByText('500 viewers')).toBeInTheDocument();
  });

  it('should handle stream without poster image', () => {
    const streamWithoutPoster = { ...mockLiveStream, poster: undefined };
    
    render(
      <RouterWrapper>
        <LiveCard stream={streamWithoutPoster} />
      </RouterWrapper>
    );

    expect(screen.getByText('No thumbnail')).toBeInTheDocument();
  });

  it('should format viewer counts correctly', () => {
    const testCases = [
      { viewers: 50, expected: '50 watching' },
      { viewers: 1500, expected: '1.5K watching' },
      { viewers: 1500000, expected: '1.5M watching' }
    ];

    testCases.forEach(({ viewers, expected }) => {
      const stream = { ...mockLiveStream, viewers };
      const { unmount } = render(
        <RouterWrapper>
          <LiveCard stream={stream} />
        </RouterWrapper>
      );
      
      expect(screen.getByText(expected)).toBeInTheDocument();
      unmount();
    });
  });

  it('should hide viewers when showViewers is false', () => {
    render(
      <RouterWrapper>
        <LiveCard stream={mockLiveStream} showViewers={false} />
      </RouterWrapper>
    );

    expect(screen.queryByText('1.3K watching')).not.toBeInTheDocument();
  });

  it('should hide creator when showCreator is false', () => {
    render(
      <RouterWrapper>
        <LiveCard stream={mockLiveStream} showCreator={false} />
      </RouterWrapper>
    );

    expect(screen.queryByText('@testcreator')).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <RouterWrapper>
        <LiveCard stream={mockLiveStream} className="custom-class" />
      </RouterWrapper>
    );

    const link = screen.getByRole('link');
    expect(link).toHaveClass('custom-class');
  });

  it('should have proper accessibility attributes', () => {
    render(
      <RouterWrapper>
        <LiveCard stream={mockLiveStream} />
      </RouterWrapper>
    );

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('aria-label');
    
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('alt', 'Test Live Stream');
    expect(image).toHaveAttribute('loading', 'lazy');
  });

  it('should handle streams without viewer count', () => {
    const streamWithoutViewers = { ...mockLiveStream, viewers: undefined };
    
    render(
      <RouterWrapper>
        <LiveCard stream={streamWithoutViewers} />
      </RouterWrapper>
    );

    expect(screen.getByText('Test Live Stream')).toBeInTheDocument();
    expect(screen.queryByText(/watching/)).not.toBeInTheDocument();
  });

  it('should show live viewer indicator for live streams', () => {
    render(
      <RouterWrapper>
        <LiveCard stream={mockLiveStream} />
      </RouterWrapper>
    );

    // Should show both the badge viewer count and the bottom viewer count
    const viewerElements = screen.getAllByText(/1\.3K/);
    expect(viewerElements).toHaveLength(2);
    expect(screen.getByText('1.3K watching')).toBeInTheDocument();
  });

  it('should handle long titles with line clamping', () => {
    const longTitleStream = {
      ...mockLiveStream,
      title: 'This is a very long stream title that should be clamped to two lines maximum'
    };
    
    render(
      <RouterWrapper>
        <LiveCard stream={longTitleStream} />
      </RouterWrapper>
    );

    const titleElement = screen.getByText(longTitleStream.title);
    expect(titleElement).toHaveClass('line-clamp-2');
  });
});