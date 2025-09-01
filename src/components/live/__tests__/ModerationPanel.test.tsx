import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ModerationPanel from '../ModerationPanel';
import { liveApi } from '../../../lib/api';
import type { ModerationRequest } from '../../../types/live';

// Mock the API
vi.mock('../../../lib/api', () => ({
  liveApi: {
    moderate: vi.fn(),
  },
}));

const mockModerate = vi.mocked(liveApi.moderate);

describe('ModerationPanel', () => {
  const mockStreamId = 'test-stream-123';
  const mockOnModerationComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockModerate.mockResolvedValue({ ok: true, data: {} });
  });

  it('renders with moderation tools header', () => {
    render(<ModerationPanel streamId={mockStreamId} />);
    
    expect(screen.getByText('Moderation Tools')).toBeInTheDocument();
    expect(screen.getByText('Quick actions for managing chat behavior')).toBeInTheDocument();
  });

  it('renders all quick action buttons', () => {
    render(<ModerationPanel streamId={mockStreamId} />);
    
    expect(screen.getByText('Timeout User')).toBeInTheDocument();
    expect(screen.getByText('Ban User')).toBeInTheDocument();
    expect(screen.getByText('Delete Message')).toBeInTheDocument();
    
    expect(screen.getByText('Temporarily prevent user from chatting')).toBeInTheDocument();
    expect(screen.getByText('Permanently block user from this stream')).toBeInTheDocument();
    expect(screen.getByText('Remove specific message from chat')).toBeInTheDocument();
  });

  it('shows moderation guidelines', () => {
    render(<ModerationPanel streamId={mockStreamId} />);
    
    expect(screen.getByText('Moderation Guidelines')).toBeInTheDocument();
    expect(screen.getByText(/Timeout.*Temporarily prevents user from chatting/)).toBeInTheDocument();
    expect(screen.getByText(/Ban.*Permanently blocks user from this stream/)).toBeInTheDocument();
    expect(screen.getByText(/Delete.*Removes specific message from chat history/)).toBeInTheDocument();
  });

  it('opens dialog when clicking timeout action', async () => {
    render(<ModerationPanel streamId={mockStreamId} />);
    
    const timeoutButton = screen.getByText('Timeout User').closest('button');
    fireEvent.click(timeoutButton!);

    await waitFor(() => {
      expect(screen.getByText('Timeout User')).toBeInTheDocument();
      expect(screen.getByLabelText('User ID or Handle *')).toBeInTheDocument();
      expect(screen.getByLabelText('Timeout Duration')).toBeInTheDocument();
    });
  });

  it('opens dialog when clicking ban action', async () => {
    render(<ModerationPanel streamId={mockStreamId} />);
    
    const banButton = screen.getByText('Ban User').closest('button');
    fireEvent.click(banButton!);

    await waitFor(() => {
      expect(screen.getByText('Ban User')).toBeInTheDocument();
      expect(screen.getByLabelText('User ID or Handle *')).toBeInTheDocument();
      expect(screen.getByText(/Warning.*Banning a user is permanent/)).toBeInTheDocument();
    });
  });

  it('opens dialog when clicking delete action', async () => {
    render(<ModerationPanel streamId={mockStreamId} />);
    
    const deleteButton = screen.getByText('Delete Message').closest('button');
    fireEvent.click(deleteButton!);

    await waitFor(() => {
      expect(screen.getByText('Delete Message')).toBeInTheDocument();
      expect(screen.getByLabelText('User ID or Handle *')).toBeInTheDocument();
      expect(screen.getByLabelText('Message ID (optional)')).toBeInTheDocument();
    });
  });

  it('shows timeout duration options for timeout action', async () => {
    render(<ModerationPanel streamId={mockStreamId} />);
    
    const timeoutButton = screen.getByText('Timeout User').closest('button');
    fireEvent.click(timeoutButton!);

    await waitFor(() => {
      expect(screen.getByText('1 minute')).toBeInTheDocument();
      expect(screen.getByText('5 minutes')).toBeInTheDocument();
      expect(screen.getByText('10 minutes')).toBeInTheDocument();
      expect(screen.getByText('30 minutes')).toBeInTheDocument();
      expect(screen.getByText('1 hour')).toBeInTheDocument();
      expect(screen.getByText('24 hours')).toBeInTheDocument();
    });
  });

  it('submits timeout action with correct data', async () => {
    render(<ModerationPanel streamId={mockStreamId} onModerationComplete={mockOnModerationComplete} />);
    
    // Open timeout dialog
    const timeoutButton = screen.getByText('Timeout User').closest('button');
    fireEvent.click(timeoutButton!);

    await waitFor(() => {
      expect(screen.getByLabelText('User ID or Handle *')).toBeInTheDocument();
    });

    // Fill form
    const userInput = screen.getByLabelText('User ID or Handle *');
    fireEvent.change(userInput, { target: { value: 'testuser123' } });

    const reasonInput = screen.getByLabelText('Reason (optional)');
    fireEvent.change(reasonInput, { target: { value: 'Spam messages' } });

    // Select 10 minutes duration
    const tenMinButton = screen.getByText('10 minutes');
    fireEvent.click(tenMinButton);

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Timeout User/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockModerate).toHaveBeenCalledWith(mockStreamId, {
        action: 'timeout',
        targetUserId: 'testuser123',
        durationSec: 600,
        reason: 'Spam messages'
      });
      expect(mockOnModerationComplete).toHaveBeenCalledWith({
        action: 'timeout',
        targetUserId: 'testuser123',
        durationSec: 600,
        reason: 'Spam messages'
      });
    });
  });

  it('submits ban action with correct data', async () => {
    render(<ModerationPanel streamId={mockStreamId} onModerationComplete={mockOnModerationComplete} />);
    
    // Open ban dialog
    const banButton = screen.getByText('Ban User').closest('button');
    fireEvent.click(banButton!);

    await waitFor(() => {
      expect(screen.getByLabelText('User ID or Handle *')).toBeInTheDocument();
    });

    // Fill form
    const userInput = screen.getByLabelText('User ID or Handle *');
    fireEvent.change(userInput, { target: { value: '@baduser' } });

    const reasonInput = screen.getByLabelText('Reason (optional)');
    fireEvent.change(reasonInput, { target: { value: 'Harassment' } });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Ban User/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockModerate).toHaveBeenCalledWith(mockStreamId, {
        action: 'ban',
        targetUserId: '@baduser',
        reason: 'Harassment'
      });
      expect(mockOnModerationComplete).toHaveBeenCalledWith({
        action: 'ban',
        targetUserId: '@baduser',
        reason: 'Harassment'
      });
    });
  });

  it('submits delete action with message ID', async () => {
    render(<ModerationPanel streamId={mockStreamId} onModerationComplete={mockOnModerationComplete} />);
    
    // Open delete dialog
    const deleteButton = screen.getByText('Delete Message').closest('button');
    fireEvent.click(deleteButton!);

    await waitFor(() => {
      expect(screen.getByLabelText('User ID or Handle *')).toBeInTheDocument();
    });

    // Fill form
    const userInput = screen.getByLabelText('User ID or Handle *');
    fireEvent.change(userInput, { target: { value: 'spammer' } });

    const messageInput = screen.getByLabelText('Message ID (optional)');
    fireEvent.change(messageInput, { target: { value: 'msg-123' } });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Delete Message/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockModerate).toHaveBeenCalledWith(mockStreamId, {
        action: 'delete',
        targetUserId: 'spammer',
        messageId: 'msg-123'
      });
    });
  });

  it('shows error when user ID is empty', async () => {
    render(<ModerationPanel streamId={mockStreamId} />);
    
    // Open timeout dialog
    const timeoutButton = screen.getByText('Timeout User').closest('button');
    fireEvent.click(timeoutButton!);

    await waitFor(() => {
      expect(screen.getByLabelText('User ID or Handle *')).toBeInTheDocument();
    });

    // Submit without user ID
    const submitButton = screen.getByRole('button', { name: /Timeout User/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please provide a valid user ID')).toBeInTheDocument();
    });

    expect(mockModerate).not.toHaveBeenCalled();
  });

  it('shows success message after successful moderation', async () => {
    render(<ModerationPanel streamId={mockStreamId} />);
    
    // Open timeout dialog
    const timeoutButton = screen.getByText('Timeout User').closest('button');
    fireEvent.click(timeoutButton!);

    await waitFor(() => {
      expect(screen.getByLabelText('User ID or Handle *')).toBeInTheDocument();
    });

    // Fill and submit form
    const userInput = screen.getByLabelText('User ID or Handle *');
    fireEvent.change(userInput, { target: { value: 'testuser' } });

    const submitButton = screen.getByRole('button', { name: /Timeout User/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Timeout User completed successfully')).toBeInTheDocument();
    });
  });

  it('shows error message when API call fails', async () => {
    const errorMessage = 'Moderation failed';
    mockModerate.mockResolvedValue({ 
      ok: false, 
      error: errorMessage,
      data: null 
    });

    render(<ModerationPanel streamId={mockStreamId} />);
    
    // Open timeout dialog
    const timeoutButton = screen.getByText('Timeout User').closest('button');
    fireEvent.click(timeoutButton!);

    await waitFor(() => {
      expect(screen.getByLabelText('User ID or Handle *')).toBeInTheDocument();
    });

    // Fill and submit form
    const userInput = screen.getByLabelText('User ID or Handle *');
    fireEvent.change(userInput, { target: { value: 'testuser' } });

    const submitButton = screen.getByRole('button', { name: /Timeout User/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('handles network errors gracefully', async () => {
    const networkError = new Error('Network error');
    mockModerate.mockRejectedValue(networkError);

    render(<ModerationPanel streamId={mockStreamId} />);
    
    // Open timeout dialog
    const timeoutButton = screen.getByText('Timeout User').closest('button');
    fireEvent.click(timeoutButton!);

    await waitFor(() => {
      expect(screen.getByLabelText('User ID or Handle *')).toBeInTheDocument();
    });

    // Fill and submit form
    const userInput = screen.getByLabelText('User ID or Handle *');
    fireEvent.change(userInput, { target: { value: 'testuser' } });

    const submitButton = screen.getByRole('button', { name: /Timeout User/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('disables form during loading', async () => {
    // Make API call take longer
    let resolvePromise: (value: any) => void;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    mockModerate.mockReturnValue(promise);

    render(<ModerationPanel streamId={mockStreamId} />);
    
    // Open timeout dialog
    const timeoutButton = screen.getByText('Timeout User').closest('button');
    fireEvent.click(timeoutButton!);

    await waitFor(() => {
      expect(screen.getByLabelText('User ID or Handle *')).toBeInTheDocument();
    });

    // Fill and submit form
    const userInput = screen.getByLabelText('User ID or Handle *');
    fireEvent.change(userInput, { target: { value: 'testuser' } });

    const submitButton = screen.getByRole('button', { name: /Timeout User/ });
    fireEvent.click(submitButton);

    // Form should be disabled during loading
    expect(userInput).toBeDisabled();
    expect(submitButton).toBeDisabled();
    
    // Resolve the promise
    resolvePromise!({ ok: true, data: {} });
    
    await waitFor(() => {
      expect(mockModerate).toHaveBeenCalled();
    });
  });

  it('closes dialog and resets form after successful submission', async () => {
    render(<ModerationPanel streamId={mockStreamId} />);
    
    // Open timeout dialog
    const timeoutButton = screen.getByText('Timeout User').closest('button');
    fireEvent.click(timeoutButton!);

    await waitFor(() => {
      expect(screen.getByLabelText('User ID or Handle *')).toBeInTheDocument();
    });

    // Fill and submit form
    const userInput = screen.getByLabelText('User ID or Handle *');
    fireEvent.change(userInput, { target: { value: 'testuser' } });

    const submitButton = screen.getByRole('button', { name: /Timeout User/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      // Dialog should be closed (form elements no longer visible)
      expect(screen.queryByLabelText('User ID or Handle *')).not.toBeInTheDocument();
    });
  });

  it('cancels dialog without submitting', async () => {
    render(<ModerationPanel streamId={mockStreamId} />);
    
    // Open timeout dialog
    const timeoutButton = screen.getByText('Timeout User').closest('button');
    fireEvent.click(timeoutButton!);

    await waitFor(() => {
      expect(screen.getByLabelText('User ID or Handle *')).toBeInTheDocument();
    });

    // Click cancel
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      // Dialog should be closed
      expect(screen.queryByLabelText('User ID or Handle *')).not.toBeInTheDocument();
    });

    expect(mockModerate).not.toHaveBeenCalled();
  });

  it('trims whitespace from user input', async () => {
    render(<ModerationPanel streamId={mockStreamId} />);
    
    // Open timeout dialog
    const timeoutButton = screen.getByText('Timeout User').closest('button');
    fireEvent.click(timeoutButton!);

    await waitFor(() => {
      expect(screen.getByLabelText('User ID or Handle *')).toBeInTheDocument();
    });

    // Fill form with whitespace
    const userInput = screen.getByLabelText('User ID or Handle *');
    fireEvent.change(userInput, { target: { value: '  testuser  ' } });

    const submitButton = screen.getByRole('button', { name: /Timeout User/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockModerate).toHaveBeenCalledWith(mockStreamId, expect.objectContaining({
        targetUserId: 'testuser'
      }));
    });
  });

  it('prevents multiple simultaneous API calls', async () => {
    // Make API call take longer
    let resolvePromise: (value: any) => void;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    mockModerate.mockReturnValue(promise);

    render(<ModerationPanel streamId={mockStreamId} />);
    
    // Open timeout dialog
    const timeoutButton = screen.getByText('Timeout User').closest('button');
    fireEvent.click(timeoutButton!);

    await waitFor(() => {
      expect(screen.getByLabelText('User ID or Handle *')).toBeInTheDocument();
    });

    // Fill form
    const userInput = screen.getByLabelText('User ID or Handle *');
    fireEvent.change(userInput, { target: { value: 'testuser' } });

    const submitButton = screen.getByRole('button', { name: /Timeout User/ });
    
    // Click multiple times rapidly
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);

    // Should only be called once due to loading state
    expect(mockModerate).toHaveBeenCalledTimes(1);
    
    // Resolve the promise
    resolvePromise!({ ok: true, data: {} });
    
    await waitFor(() => {
      expect(mockModerate).toHaveBeenCalledTimes(1);
    });
  });
});