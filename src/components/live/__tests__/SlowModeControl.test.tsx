import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import SlowModeControl from '../SlowModeControl';
import { liveApi } from '../../../lib/api';
import type { SlowModeConfig } from '../../../types/live';

// Mock the API
vi.mock('../../../lib/api', () => ({
  liveApi: {
    setSlowMode: vi.fn(),
  },
}));

const mockSetSlowMode = vi.mocked(liveApi.setSlowMode);

describe('SlowModeControl', () => {
  const mockStreamId = 'test-stream-123';
  const mockOnUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockSetSlowMode.mockResolvedValue({ ok: true, data: {} });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('renders with default disabled state', () => {
    render(<SlowModeControl streamId={mockStreamId} />);
    
    expect(screen.getByText('Slow Mode')).toBeInTheDocument();
    expect(screen.getByText('Control how frequently viewers can send chat messages')).toBeInTheDocument();
    expect(screen.getByText('Disabled')).toBeInTheDocument();
    expect(screen.getByRole('switch')).not.toBeChecked();
  });

  it('renders with current config when provided', () => {
    const currentConfig: SlowModeConfig = {
      seconds: 30,
      enabled: true
    };

    render(
      <SlowModeControl 
        streamId={mockStreamId} 
        currentConfig={currentConfig}
        onUpdate={mockOnUpdate}
      />
    );
    
    expect(screen.getByText('30s Active')).toBeInTheDocument();
    expect(screen.getByRole('switch')).toBeChecked();
    expect(screen.getByText(/Users must wait 30 second cooldown between messages/)).toBeInTheDocument();
  });

  it('shows interval selection when enabled', async () => {
    render(<SlowModeControl streamId={mockStreamId} />);
    
    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(screen.getByText('Cooldown Period')).toBeInTheDocument();
      expect(screen.getByText('5s')).toBeInTheDocument();
      expect(screen.getByText('10s')).toBeInTheDocument();
      expect(screen.getByText('30s')).toBeInTheDocument();
      expect(screen.getByText('1m')).toBeInTheDocument();
      expect(screen.getByText('5m')).toBeInTheDocument();
      expect(screen.getByText('10m')).toBeInTheDocument();
    });
  });

  it('calls API when toggling slow mode on', async () => {
    render(<SlowModeControl streamId={mockStreamId} onUpdate={mockOnUpdate} />);
    
    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(mockSetSlowMode).toHaveBeenCalledWith(mockStreamId, 10);
      expect(mockOnUpdate).toHaveBeenCalledWith({
        seconds: 10,
        enabled: true
      });
    });
  });

  it('calls API when toggling slow mode off', async () => {
    const currentConfig: SlowModeConfig = {
      seconds: 30,
      enabled: true
    };

    render(
      <SlowModeControl 
        streamId={mockStreamId} 
        currentConfig={currentConfig}
        onUpdate={mockOnUpdate}
      />
    );
    
    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(mockSetSlowMode).toHaveBeenCalledWith(mockStreamId, 0);
      expect(mockOnUpdate).toHaveBeenCalledWith({
        seconds: 0,
        enabled: false
      });
    });
  });

  it('calls API when selecting different interval', async () => {
    const currentConfig: SlowModeConfig = {
      seconds: 10,
      enabled: true
    };

    render(
      <SlowModeControl 
        streamId={mockStreamId} 
        currentConfig={currentConfig}
        onUpdate={mockOnUpdate}
      />
    );
    
    const thirtySecButton = screen.getByRole('button', { name: /30s/ });
    fireEvent.click(thirtySecButton);

    await waitFor(() => {
      expect(mockSetSlowMode).toHaveBeenCalledWith(mockStreamId, 30);
      expect(mockOnUpdate).toHaveBeenCalledWith({
        seconds: 30,
        enabled: true
      });
    });
  });

  it('shows loading state during API call', async () => {
    // Make API call take longer
    mockSetSlowMode.mockImplementation(() => new Promise(resolve => 
      setTimeout(() => resolve({ ok: true, data: {} }), 100)
    ));

    render(<SlowModeControl streamId={mockStreamId} />);
    
    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);

    // Should show loading spinner
    expect(screen.getByRole('switch')).toBeDisabled();
    
    await waitFor(() => {
      expect(mockSetSlowMode).toHaveBeenCalled();
    });
  });

  it('shows success message after successful update', async () => {
    render(<SlowModeControl streamId={mockStreamId} />);
    
    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(screen.getByText('Slow mode updated successfully')).toBeInTheDocument();
    });
  });

  it('shows error message when API call fails', async () => {
    const errorMessage = 'Failed to update slow mode';
    mockSetSlowMode.mockResolvedValue({ 
      ok: false, 
      error: errorMessage,
      data: null 
    });

    render(<SlowModeControl streamId={mockStreamId} />);
    
    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('handles API network errors gracefully', async () => {
    const networkError = new Error('Network error');
    mockSetSlowMode.mockRejectedValue(networkError);

    render(<SlowModeControl streamId={mockStreamId} />);
    
    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('disables controls during loading', async () => {
    // Make API call take longer
    let resolvePromise: (value: any) => void;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    mockSetSlowMode.mockReturnValue(promise);

    render(<SlowModeControl streamId={mockStreamId} />);
    
    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);

    // Toggle should be disabled during loading
    expect(toggle).toBeDisabled();
    
    // Resolve the promise
    resolvePromise!({ ok: true, data: {} });
    
    await waitFor(() => {
      expect(mockSetSlowMode).toHaveBeenCalled();
    });
  });

  it('highlights selected interval button', () => {
    const currentConfig: SlowModeConfig = {
      seconds: 60,
      enabled: true
    };

    render(
      <SlowModeControl 
        streamId={mockStreamId} 
        currentConfig={currentConfig}
      />
    );
    
    const oneMinButton = screen.getByRole('button', { name: /1m/ });
    expect(oneMinButton).toHaveClass('ring-2', 'ring-primary');
  });

  it('shows current setting information', () => {
    const currentConfig: SlowModeConfig = {
      seconds: 300,
      enabled: true
    };

    render(
      <SlowModeControl 
        streamId={mockStreamId} 
        currentConfig={currentConfig}
      />
    );
    
    expect(screen.getByText('Current Setting: 5 minute cooldown')).toBeInTheDocument();
  });

  it('shows help text about how slow mode works', () => {
    render(<SlowModeControl streamId={mockStreamId} />);
    
    expect(screen.getByText('How Slow Mode Works')).toBeInTheDocument();
    expect(screen.getByText(/Users must wait the specified time between sending messages/)).toBeInTheDocument();
    expect(screen.getByText(/Moderators and the creator are not affected by slow mode/)).toBeInTheDocument();
    expect(screen.getByText(/Changes take effect immediately for all viewers/)).toBeInTheDocument();
    expect(screen.getByText(/Users will see a countdown timer when in cooldown/)).toBeInTheDocument();
  });

  it('updates config when currentConfig prop changes', () => {
    const { rerender } = render(
      <SlowModeControl streamId={mockStreamId} />
    );
    
    expect(screen.getByText('Disabled')).toBeInTheDocument();

    const newConfig: SlowModeConfig = {
      seconds: 60,
      enabled: true
    };

    rerender(
      <SlowModeControl 
        streamId={mockStreamId} 
        currentConfig={newConfig}
      />
    );
    
    expect(screen.getByText('1m Active')).toBeInTheDocument();
  });

  it('prevents multiple simultaneous API calls', async () => {
    // Make API call take longer
    let resolvePromise: (value: any) => void;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    mockSetSlowMode.mockReturnValue(promise);

    render(<SlowModeControl streamId={mockStreamId} />);
    
    const toggle = screen.getByRole('switch');
    
    // Click multiple times rapidly
    fireEvent.click(toggle);
    fireEvent.click(toggle);
    fireEvent.click(toggle);

    // Should only be called once due to loading state
    expect(mockSetSlowMode).toHaveBeenCalledTimes(1);
    
    // Resolve the promise
    resolvePromise!({ ok: true, data: {} });
    
    await waitFor(() => {
      expect(mockSetSlowMode).toHaveBeenCalledTimes(1);
    });
  });
});