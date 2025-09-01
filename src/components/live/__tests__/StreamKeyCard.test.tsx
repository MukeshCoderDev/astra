import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import StreamKeyCard from '../StreamKeyCard';
import { liveApi } from '../../../lib/api';

// Mock the API
vi.mock('../../../lib/api', () => ({
  liveApi: {
    rotateKeys: vi.fn(),
  },
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

describe('StreamKeyCard', () => {
  const defaultProps = {
    streamId: 'test-stream-123',
    streamKeys: {
      primary: 'sk_live_1234567890abcdef1234567890abcdef12345678',
      backup: 'sk_backup_abcdef1234567890abcdef1234567890abcdef12',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders stream keys with masking by default', () => {
    render(<StreamKeyCard {...defaultProps} />);

    expect(screen.getByText('Stream Keys')).toBeInTheDocument();
    expect(screen.getByText('Primary Stream Key')).toBeInTheDocument();
    expect(screen.getByText('Backup Stream Key')).toBeInTheDocument();
    expect(screen.getByText('Primary')).toBeInTheDocument();

    // Keys should be masked by default
    expect(screen.getByText(/sk_live_1•••••••••••••••••••••••••••••••••••45678/)).toBeInTheDocument();
    expect(screen.getByText(/sk_backu•••••••••••••••••••••••••••••••••••ef12/)).toBeInTheDocument();
  });

  it('shows full keys when visibility is toggled', () => {
    render(<StreamKeyCard {...defaultProps} />);

    const showButton = screen.getByRole('button', { name: /show/i });
    fireEvent.click(showButton);

    // Keys should be fully visible
    expect(screen.getByText('sk_live_1234567890abcdef1234567890abcdef12345678')).toBeInTheDocument();
    expect(screen.getByText('sk_backup_abcdef1234567890abcdef1234567890abcdef12')).toBeInTheDocument();

    // Button should change to "Hide"
    expect(screen.getByRole('button', { name: /hide/i })).toBeInTheDocument();
  });

  it('hides keys when visibility is toggled back', () => {
    render(<StreamKeyCard {...defaultProps} />);

    const showButton = screen.getByRole('button', { name: /show/i });
    fireEvent.click(showButton);

    const hideButton = screen.getByRole('button', { name: /hide/i });
    fireEvent.click(hideButton);

    // Keys should be masked again
    expect(screen.getByText(/sk_live_1•••••••••••••••••••••••••••••••••••45678/)).toBeInTheDocument();
    expect(screen.getByText(/sk_backu•••••••••••••••••••••••••••••••••••ef12/)).toBeInTheDocument();
  });

  it('copies primary key to clipboard', async () => {
    (navigator.clipboard.writeText as any).mockResolvedValue(undefined);

    render(<StreamKeyCard {...defaultProps} />);

    const copyButtons = screen.getAllByRole('button', { name: /copy/i });
    fireEvent.click(copyButtons[0]); // Primary key copy button

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'sk_live_1234567890abcdef1234567890abcdef12345678'
      );
    });

    // Should show "Copied" feedback
    expect(screen.getByText('Copied')).toBeInTheDocument();

    // Should reset after timeout
    vi.advanceTimersByTime(2000);
    await waitFor(() => {
      expect(screen.queryByText('Copied')).not.toBeInTheDocument();
    });
  });

  it('copies backup key to clipboard', async () => {
    (navigator.clipboard.writeText as any).mockResolvedValue(undefined);

    render(<StreamKeyCard {...defaultProps} />);

    const copyButtons = screen.getAllByRole('button', { name: /copy/i });
    fireEvent.click(copyButtons[1]); // Backup key copy button

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'sk_backup_abcdef1234567890abcdef1234567890abcdef12'
      );
    });
  });

  it('handles clipboard copy failure', async () => {
    const onError = vi.fn();
    (navigator.clipboard.writeText as any).mockRejectedValue(new Error('Clipboard error'));

    render(<StreamKeyCard {...defaultProps} onError={onError} />);

    const copyButtons = screen.getAllByRole('button', { name: /copy/i });
    fireEvent.click(copyButtons[0]);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('Failed to copy to clipboard');
    });
  });

  it('rotates keys successfully', async () => {
    const onKeysRotated = vi.fn();
    const newKeys = {
      primary: 'sk_live_newkey1234567890abcdef1234567890abcdef',
      backup: 'sk_backup_newkey1234567890abcdef1234567890abc',
    };

    (liveApi.rotateKeys as any).mockResolvedValue({
      ok: true,
      data: newKeys,
    });

    render(
      <StreamKeyCard 
        {...defaultProps} 
        onKeysRotated={onKeysRotated}
      />
    );

    const rotateButton = screen.getByRole('button', { name: /rotate/i });
    fireEvent.click(rotateButton);

    // Should show loading state
    expect(screen.getByRole('button', { name: /rotate/i })).toBeDisabled();

    await waitFor(() => {
      expect(liveApi.rotateKeys).toHaveBeenCalledWith('test-stream-123');
      expect(onKeysRotated).toHaveBeenCalledWith(newKeys);
    });
  });

  it('handles key rotation failure', async () => {
    const onError = vi.fn();
    (liveApi.rotateKeys as any).mockResolvedValue({
      ok: false,
      error: 'Key rotation failed',
    });

    render(
      <StreamKeyCard 
        {...defaultProps} 
        onError={onError}
      />
    );

    const rotateButton = screen.getByRole('button', { name: /rotate/i });
    fireEvent.click(rotateButton);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('Key rotation failed');
    });
  });

  it('handles network errors during rotation', async () => {
    const onError = vi.fn();
    (liveApi.rotateKeys as any).mockRejectedValue(new Error('Network error'));

    render(
      <StreamKeyCard 
        {...defaultProps} 
        onError={onError}
      />
    );

    const rotateButton = screen.getByRole('button', { name: /rotate/i });
    fireEvent.click(rotateButton);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('Network error');
    });
  });

  it('shows rotation warning during key rotation', async () => {
    (liveApi.rotateKeys as any).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ ok: true, data: {} }), 100))
    );

    render(<StreamKeyCard {...defaultProps} />);

    const rotateButton = screen.getByRole('button', { name: /rotate/i });
    fireEvent.click(rotateButton);

    // Should show rotation warning
    expect(screen.getByText('Rotating Stream Keys')).toBeInTheDocument();
    expect(screen.getByText(/Your stream keys are being rotated/)).toBeInTheDocument();

    // Complete the rotation
    vi.advanceTimersByTime(100);
    await waitFor(() => {
      expect(screen.queryByText('Rotating Stream Keys')).not.toBeInTheDocument();
    });
  });

  it('prevents multiple simultaneous rotations', async () => {
    (liveApi.rotateKeys as any).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ ok: true, data: {} }), 100))
    );

    render(<StreamKeyCard {...defaultProps} />);

    const rotateButton = screen.getByRole('button', { name: /rotate/i });
    
    // Click multiple times rapidly
    fireEvent.click(rotateButton);
    fireEvent.click(rotateButton);
    fireEvent.click(rotateButton);

    // Should only call API once
    await waitFor(() => {
      expect(liveApi.rotateKeys).toHaveBeenCalledTimes(1);
    });
  });

  it('disables buttons when loading', () => {
    render(<StreamKeyCard {...defaultProps} isLoading={true} />);

    expect(screen.getByRole('button', { name: /show/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /rotate/i })).toBeDisabled();
    
    const copyButtons = screen.getAllByRole('button', { name: /copy/i });
    copyButtons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  it('displays security best practices', () => {
    render(<StreamKeyCard {...defaultProps} />);

    expect(screen.getByText('Security Best Practices')).toBeInTheDocument();
    expect(screen.getByText(/Never share your stream keys publicly/)).toBeInTheDocument();
    expect(screen.getByText(/Rotate keys regularly for security/)).toBeInTheDocument();
    expect(screen.getByText(/Use the backup key if the primary key is compromised/)).toBeInTheDocument();
    expect(screen.getByText(/Keep your streaming software updated/)).toBeInTheDocument();
  });

  it('displays usage instructions', () => {
    render(<StreamKeyCard {...defaultProps} />);

    expect(screen.getByText('How to use:')).toBeInTheDocument();
    expect(screen.getByText(/Copy your primary stream key/)).toBeInTheDocument();
    expect(screen.getByText(/Open your streaming software/)).toBeInTheDocument();
    expect(screen.getByText(/Paste the key in the stream key field/)).toBeInTheDocument();
    expect(screen.getByText(/Set your RTMP server URL/)).toBeInTheDocument();
    expect(screen.getByText(/Start streaming from your software/)).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <StreamKeyCard 
        {...defaultProps} 
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles short keys correctly', () => {
    const shortKeys = {
      primary: 'short_key',
      backup: 'backup',
    };

    render(<StreamKeyCard {...defaultProps} streamKeys={shortKeys} />);

    // Should handle short keys without errors
    expect(screen.getByText('short_ke')).toBeInTheDocument();
    expect(screen.getByText('backup')).toBeInTheDocument();
  });
});