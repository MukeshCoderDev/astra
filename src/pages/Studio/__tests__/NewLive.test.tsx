import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import NewLive from '../NewLive';
import { liveApi } from '../../../lib/api';

// Mock the API
vi.mock('../../../lib/api');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useSearchParams: () => [new URLSearchParams()],
  };
});

const mockLiveApi = vi.mocked(liveApi);

const renderComponent = (searchParams = '') => {
  // Mock useSearchParams to return specific params
  const mockSearchParams = new URLSearchParams(searchParams);
  vi.mocked(require('react-router-dom').useSearchParams).mockReturnValue([mockSearchParams]);
  
  return render(
    <BrowserRouter>
      <NewLive />
    </BrowserRouter>
  );
};

describe('NewLive', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders create stream form by default', () => {
    renderComponent();
    
    expect(screen.getByText('Create Live Stream')).toBeInTheDocument();
    expect(screen.getByText('Set up a new live stream and get your streaming keys')).toBeInTheDocument();
    expect(screen.getByLabelText('Stream Title *')).toBeInTheDocument();
  });

  it('renders schedule stream form when scheduled=true', () => {
    renderComponent('scheduled=true');
    
    expect(screen.getByText('Schedule Live Stream')).toBeInTheDocument();
    expect(screen.getByText('Set up a scheduled live stream for later broadcast')).toBeInTheDocument();
    expect(screen.getByLabelText('Start Time *')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    renderComponent();
    
    const submitButton = screen.getByRole('button', { name: /create stream/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Stream title is required')).toBeInTheDocument();
    });
  });

  it('validates scheduled stream start time', async () => {
    renderComponent('scheduled=true');
    
    const titleInput = screen.getByLabelText('Stream Title *');
    fireEvent.change(titleInput, { target: { value: 'Test Stream' } });
    
    const submitButton = screen.getByRole('button', { name: /schedule stream/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Start time is required for scheduled streams')).toBeInTheDocument();
    });
  });

  it('updates form fields correctly', () => {
    renderComponent();
    
    const titleInput = screen.getByLabelText('Stream Title *');
    fireEvent.change(titleInput, { target: { value: 'My Test Stream' } });
    
    expect(titleInput).toHaveValue('My Test Stream');
    expect(screen.getByText('14/100 characters')).toBeInTheDocument();
  });

  it('handles privacy setting changes', () => {
    renderComponent();
    
    const privacySelect = screen.getByRole('combobox');
    fireEvent.click(privacySelect);
    
    const unlistedOption = screen.getByText('Unlisted - Only people with the link');
    fireEvent.click(unlistedOption);
    
    // The select should now show the selected value
    expect(screen.getByText('Unlisted - Only people with the link')).toBeInTheDocument();
  });

  it('handles DVR window changes', () => {
    renderComponent();
    
    // Find DVR select by its label
    const dvrLabel = screen.getByText('DVR Window');
    const dvrSelect = dvrLabel.closest('div')?.querySelector('[role="combobox"]');
    
    if (dvrSelect) {
      fireEvent.click(dvrSelect);
      
      const fourHourOption = screen.getByText('4 hours');
      fireEvent.click(fourHourOption);
      
      expect(screen.getByText('4 hours')).toBeInTheDocument();
    }
  });

  it('toggles advanced settings switches', () => {
    renderComponent();
    
    const watermarkSwitch = screen.getByRole('switch', { name: /forensic watermark/i });
    const ageRestrictedSwitch = screen.getByRole('switch', { name: /age restricted/i });
    
    expect(watermarkSwitch).not.toBeChecked();
    expect(ageRestrictedSwitch).not.toBeChecked();
    
    fireEvent.click(watermarkSwitch);
    fireEvent.click(ageRestrictedSwitch);
    
    expect(watermarkSwitch).toBeChecked();
    expect(ageRestrictedSwitch).toBeChecked();
  });

  it('submits form with correct data', async () => {
    const mockNavigate = vi.fn();
    vi.mocked(require('react-router-dom').useNavigate).mockReturnValue(mockNavigate);
    
    mockLiveApi.createStream.mockResolvedValue({
      ok: true,
      data: { id: 'stream-123' },
    });
    
    renderComponent();
    
    const titleInput = screen.getByLabelText('Stream Title *');
    fireEvent.change(titleInput, { target: { value: 'Test Stream' } });
    
    const submitButton = screen.getByRole('button', { name: /create stream/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockLiveApi.createStream).toHaveBeenCalledWith({
        title: 'Test Stream',
        privacy: 'public',
        dvrWindowSec: 7200,
        watermark: false,
        ageRestricted: false,
      });
    });
    
    expect(mockNavigate).toHaveBeenCalledWith('/studio/live/stream-123');
  });

  it('submits scheduled stream with start time', async () => {
    const mockNavigate = vi.fn();
    vi.mocked(require('react-router-dom').useNavigate).mockReturnValue(mockNavigate);
    
    mockLiveApi.createStream.mockResolvedValue({
      ok: true,
      data: { id: 'stream-456' },
    });
    
    renderComponent('scheduled=true');
    
    const titleInput = screen.getByLabelText('Stream Title *');
    fireEvent.change(titleInput, { target: { value: 'Scheduled Stream' } });
    
    const startTimeInput = screen.getByLabelText('Start Time *');
    fireEvent.change(startTimeInput, { target: { value: '2024-12-01T20:00' } });
    
    const submitButton = screen.getByRole('button', { name: /schedule stream/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockLiveApi.createStream).toHaveBeenCalledWith({
        title: 'Scheduled Stream',
        privacy: 'public',
        dvrWindowSec: 7200,
        watermark: false,
        ageRestricted: false,
        startAt: '2024-12-01T20:00',
      });
    });
    
    expect(mockNavigate).toHaveBeenCalledWith('/studio/live/stream-456');
  });

  it('handles API errors', async () => {
    mockLiveApi.createStream.mockResolvedValue({
      ok: false,
      error: 'Stream creation failed',
    });
    
    renderComponent();
    
    const titleInput = screen.getByLabelText('Stream Title *');
    fireEvent.change(titleInput, { target: { value: 'Test Stream' } });
    
    const submitButton = screen.getByRole('button', { name: /create stream/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Stream creation failed')).toBeInTheDocument();
    });
  });

  it('handles network errors', async () => {
    mockLiveApi.createStream.mockRejectedValue(new Error('Network error'));
    
    renderComponent();
    
    const titleInput = screen.getByLabelText('Stream Title *');
    fireEvent.change(titleInput, { target: { value: 'Test Stream' } });
    
    const submitButton = screen.getByRole('button', { name: /create stream/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to create stream')).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    mockLiveApi.createStream.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    renderComponent();
    
    const titleInput = screen.getByLabelText('Stream Title *');
    fireEvent.change(titleInput, { target: { value: 'Test Stream' } });
    
    const submitButton = screen.getByRole('button', { name: /create stream/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Creating...')).toBeInTheDocument();
    });
  });

  it('handles back button click', () => {
    const mockNavigate = vi.fn();
    vi.mocked(require('react-router-dom').useNavigate).mockReturnValue(mockNavigate);
    
    renderComponent();
    
    const backButton = screen.getByRole('button', { name: '' }); // ArrowLeft icon button
    fireEvent.click(backButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/studio/live');
  });

  it('handles cancel button click', () => {
    const mockNavigate = vi.fn();
    vi.mocked(require('react-router-dom').useNavigate).mockReturnValue(mockNavigate);
    
    renderComponent();
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/studio/live');
  });

  it('displays helpful information card', () => {
    renderComponent();
    
    expect(screen.getByText('What happens next?')).toBeInTheDocument();
    expect(screen.getByText(/Your stream will be created with unique streaming keys/)).toBeInTheDocument();
    expect(screen.getByText(/Configure your streaming software/)).toBeInTheDocument();
  });

  it('shows scheduled stream specific information', () => {
    renderComponent('scheduled=true');
    
    expect(screen.getByText(/Your stream will automatically go live at the scheduled time/)).toBeInTheDocument();
  });

  it('enforces character limit on title', () => {
    renderComponent();
    
    const titleInput = screen.getByLabelText('Stream Title *');
    const longTitle = 'a'.repeat(150); // Exceeds 100 character limit
    
    fireEvent.change(titleInput, { target: { value: longTitle } });
    
    // Input should be limited to 100 characters
    expect(titleInput).toHaveValue('a'.repeat(100));
  });

  it('sets minimum datetime for scheduled streams', () => {
    renderComponent('scheduled=true');
    
    const startTimeInput = screen.getByLabelText('Start Time *') as HTMLInputElement;
    
    // Should have min attribute set to current date/time
    expect(startTimeInput.min).toBeTruthy();
    expect(new Date(startTimeInput.min).getTime()).toBeLessThanOrEqual(Date.now());
  });
});