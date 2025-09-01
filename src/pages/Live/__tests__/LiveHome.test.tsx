import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LiveHome from '../LiveHome';

// Mock the environment configuration
const mockEnv = vi.hoisted(() => ({
  ENV: {
    LIVE_ENABLED: true,
  },
}));

vi.mock('../../../lib/env', () => mockEnv);

// Mock the mockApi
const mockApi = vi.hoisted(() => ({
  mockApi: {
    getLiveFeed: vi.fn(),
  },
}));

vi.mock('../../../lib/mockData', () => mockApi);

// Mock the LiveCard component
vi.mock('../../../components/live', () => ({
  LiveCard: ({ stream }: { stream: any }) => (
    <div data-testid={`live-card-${stream.id}`}>
      <h3>{stream.title}</h3>
      <span>@{stream.creator.handle}</span>
    </div>
  ),
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('LiveHome', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv.ENV.LIVE_ENABLED = true;
  });

  it('shows feature not available when live streaming is disabled', async () => {
    mockEnv.ENV.LIVE_ENABLED = false;
    
    renderWithRouter(<LiveHome />);
    
    expect(screen.getByText('Live Streaming Not Available')).toBeInTheDocument();
    expect(screen.getByText('Live streaming features are currently disabled.')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    mockApi.mockApi.getLiveFeed.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    renderWithRouter(<LiveHome />);
    
    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('displays live and upcoming streams when data is loaded', async () => {
    const mockData = {
      now: [
        {
          id: 'live-1',
          title: 'Live Stream 1',
          status: 'live',
          creator: { id: '1', handle: 'creator1' },
          viewers: 100,
        },
      ],
      upcoming: [
        {
          id: 'upcoming-1',
          title: 'Upcoming Stream 1',
          status: 'preview',
          creator: { id: '2', handle: 'creator2' },
          scheduled: true,
        },
      ],
    };

    mockApi.mockApi.getLiveFeed.mockResolvedValue(mockData);
    
    renderWithRouter(<LiveHome />);
    
    await waitFor(() => {
      expect(screen.getByText('Live now')).toBeInTheDocument();
      expect(screen.getByText('Upcoming')).toBeInTheDocument();
      expect(screen.getByTestId('live-card-live-1')).toBeInTheDocument();
      expect(screen.getByTestId('live-card-upcoming-1')).toBeInTheDocument();
    });
  });

  it('shows no streams message when no data is available', async () => {
    mockApi.mockApi.getLiveFeed.mockResolvedValue({
      now: [],
      upcoming: [],
    });
    
    renderWithRouter(<LiveHome />);
    
    await waitFor(() => {
      expect(screen.getByText('No Live Streams')).toBeInTheDocument();
      expect(screen.getByText('There are no live or upcoming streams at the moment.')).toBeInTheDocument();
    });
  });

  it('shows error state when API call fails', async () => {
    mockApi.mockApi.getLiveFeed.mockRejectedValue(new Error('API Error'));
    
    renderWithRouter(<LiveHome />);
    
    await waitFor(() => {
      expect(screen.getByText('Error Loading Streams')).toBeInTheDocument();
      expect(screen.getByText('Failed to load live streams')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });

  it('only shows live section when no upcoming streams', async () => {
    mockApi.mockApi.getLiveFeed.mockResolvedValue({
      now: [
        {
          id: 'live-1',
          title: 'Live Stream 1',
          status: 'live',
          creator: { id: '1', handle: 'creator1' },
          viewers: 100,
        },
      ],
      upcoming: [],
    });
    
    renderWithRouter(<LiveHome />);
    
    await waitFor(() => {
      expect(screen.getByText('Live now')).toBeInTheDocument();
      expect(screen.queryByText('Upcoming')).not.toBeInTheDocument();
    });
  });

  it('only shows upcoming section when no live streams', async () => {
    mockApi.mockApi.getLiveFeed.mockResolvedValue({
      now: [],
      upcoming: [
        {
          id: 'upcoming-1',
          title: 'Upcoming Stream 1',
          status: 'preview',
          creator: { id: '2', handle: 'creator2' },
          scheduled: true,
        },
      ],
    });
    
    renderWithRouter(<LiveHome />);
    
    await waitFor(() => {
      expect(screen.queryByText('Live now')).not.toBeInTheDocument();
      expect(screen.getByText('Upcoming')).toBeInTheDocument();
    });
  });
});