import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../utils/test-utils';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';
import Watch from '../../pages/Watch/Watch';
import { mockVideos } from '../mocks/mockData';

// Mock react-router-dom params
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'video-1' }),
    useNavigate: () => vi.fn(),
  };
});

describe('Tipping Workflow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should complete full tipping workflow', async () => {
    // Mock successful tip
    server.use(
      http.post('https://bff.example.com/tips', () => {
        return HttpResponse.json({
          id: 'tip-123',
          amount: 5.00,
          currency: 'USDC',
          videoId: 'video-1',
          creatorId: 'creator-1',
          timestamp: new Date().toISOString(),
          status: 'completed',
        });
      })
    );

    render(<Watch />);

    // Wait for video to load
    await waitFor(() => {
      expect(screen.getByText(mockVideos[0].title)).toBeInTheDocument();
    });

    // Click tip button
    const tipButton = screen.getByRole('button', { name: /tip/i });
    fireEvent.click(tipButton);

    // Should open tip modal
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /send tip/i })).toBeInTheDocument();
    });

    // Select tip amount
    const fiveDollarButton = screen.getByRole('button', { name: /\$5/i });
    fireEvent.click(fiveDollarButton);

    // Add optional message
    const messageInput = screen.getByLabelText(/message/i);
    fireEvent.change(messageInput, { 
      target: { value: 'Great video! Keep it up!' } 
    });

    // Send tip
    const sendTipButton = screen.getByRole('button', { name: /send tip/i });
    fireEvent.click(sendTipButton);

    // Should show loading state
    expect(screen.getByText(/sending tip/i)).toBeInTheDocument();

    // Should show success message
    await waitFor(() => {
      expect(screen.getByText(/tip sent successfully/i)).toBeInTheDocument();
    });

    // Should close modal
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // Should show tip confirmation in UI
    expect(screen.getByText(/you tipped \$5/i)).toBeInTheDocument();
  });

  it('should handle insufficient balance error', async () => {
    // Mock insufficient balance error
    server.use(
      http.post('https://bff.example.com/tips', () => {
        return HttpResponse.json(
          { error: 'Insufficient balance' },
          { status: 400 }
        );
      })
    );

    render(<Watch />);

    await waitFor(() => {
      expect(screen.getByText(mockVideos[0].title)).toBeInTheDocument();
    });

    // Open tip modal and try to send large tip
    const tipButton = screen.getByRole('button', { name: /tip/i });
    fireEvent.click(tipButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Enter custom large amount
    const customAmountInput = screen.getByLabelText(/custom amount/i);
    fireEvent.change(customAmountInput, { target: { value: '1000' } });

    const sendTipButton = screen.getByRole('button', { name: /send tip/i });
    fireEvent.click(sendTipButton);

    // Should show insufficient balance error
    await waitFor(() => {
      expect(screen.getByText(/insufficient balance/i)).toBeInTheDocument();
    });

    // Should show add funds button
    expect(screen.getByRole('button', { name: /add funds/i })).toBeInTheDocument();
  });

  it('should validate tip amounts', async () => {
    render(<Watch />);

    await waitFor(() => {
      expect(screen.getByText(mockVideos[0].title)).toBeInTheDocument();
    });

    const tipButton = screen.getByRole('button', { name: /tip/i });
    fireEvent.click(tipButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Try to send zero amount
    const customAmountInput = screen.getByLabelText(/custom amount/i);
    fireEvent.change(customAmountInput, { target: { value: '0' } });

    const sendTipButton = screen.getByRole('button', { name: /send tip/i });
    fireEvent.click(sendTipButton);

    // Should show validation error
    expect(screen.getByText(/amount must be greater than 0/i)).toBeInTheDocument();

    // Try negative amount
    fireEvent.change(customAmountInput, { target: { value: '-5' } });
    fireEvent.click(sendTipButton);

    expect(screen.getByText(/amount must be greater than 0/i)).toBeInTheDocument();

    // Try very large amount
    fireEvent.change(customAmountInput, { target: { value: '10000' } });
    fireEvent.click(sendTipButton);

    expect(screen.getByText(/amount too large/i)).toBeInTheDocument();
  });

  it('should show real-time tip notifications', async () => {
    // Mock WebSocket for real-time notifications
    const mockSocket = {
      on: vi.fn(),
      emit: vi.fn(),
      disconnect: vi.fn(),
    };

    vi.doMock('socket.io-client', () => ({
      io: () => mockSocket,
    }));

    render(<Watch />);

    await waitFor(() => {
      expect(screen.getByText(mockVideos[0].title)).toBeInTheDocument();
    });

    // Simulate receiving a tip notification via WebSocket
    const tipNotification = {
      type: 'tip_received',
      data: {
        amount: 10.00,
        currency: 'USDC',
        message: 'Amazing content!',
        tipper: {
          handle: 'generous_viewer',
          displayName: 'Generous Viewer',
        },
      },
    };

    // Trigger the WebSocket callback
    const onCallback = mockSocket.on.mock.calls.find(call => call[0] === 'tip_received')?.[1];
    if (onCallback) {
      onCallback(tipNotification.data);
    }

    // Should show tip notification overlay
    await waitFor(() => {
      expect(screen.getByText(/generous_viewer tipped \$10/i)).toBeInTheDocument();
    });

    // Should show tip message
    expect(screen.getByText('Amazing content!')).toBeInTheDocument();
  });

  it('should handle tip escrow and compliance', async () => {
    // Mock tip with escrow
    server.use(
      http.post('https://bff.example.com/tips', () => {
        return HttpResponse.json({
          id: 'tip-123',
          amount: 5.00,
          currency: 'USDC',
          videoId: 'video-1',
          creatorId: 'creator-1',
          timestamp: new Date().toISOString(),
          status: 'escrowed',
          escrowReleaseDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        });
      })
    );

    render(<Watch />);

    await waitFor(() => {
      expect(screen.getByText(mockVideos[0].title)).toBeInTheDocument();
    });

    // Send tip
    const tipButton = screen.getByRole('button', { name: /tip/i });
    fireEvent.click(tipButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const fiveDollarButton = screen.getByRole('button', { name: /\$5/i });
    fireEvent.click(fiveDollarButton);

    const sendTipButton = screen.getByRole('button', { name: /send tip/i });
    fireEvent.click(sendTipButton);

    // Should show escrow information
    await waitFor(() => {
      expect(screen.getByText(/tip sent successfully/i)).toBeInTheDocument();
      expect(screen.getByText(/funds will be released in 3 days/i)).toBeInTheDocument();
    });
  });

  it('should support anonymous tipping', async () => {
    render(<Watch />);

    await waitFor(() => {
      expect(screen.getByText(mockVideos[0].title)).toBeInTheDocument();
    });

    const tipButton = screen.getByRole('button', { name: /tip/i });
    fireEvent.click(tipButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Enable anonymous tipping
    const anonymousCheckbox = screen.getByLabelText(/send anonymously/i);
    fireEvent.click(anonymousCheckbox);

    const fiveDollarButton = screen.getByRole('button', { name: /\$5/i });
    fireEvent.click(fiveDollarButton);

    const sendTipButton = screen.getByRole('button', { name: /send tip/i });
    fireEvent.click(sendTipButton);

    // Should send anonymous tip
    await waitFor(() => {
      expect(screen.getByText(/anonymous tip sent/i)).toBeInTheDocument();
    });
  });

  it('should handle network errors gracefully', async () => {
    // Mock network error
    server.use(
      http.post('https://bff.example.com/tips', () => {
        return HttpResponse.error();
      })
    );

    render(<Watch />);

    await waitFor(() => {
      expect(screen.getByText(mockVideos[0].title)).toBeInTheDocument();
    });

    const tipButton = screen.getByRole('button', { name: /tip/i });
    fireEvent.click(tipButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const fiveDollarButton = screen.getByRole('button', { name: /\$5/i });
    fireEvent.click(fiveDollarButton);

    const sendTipButton = screen.getByRole('button', { name: /send tip/i });
    fireEvent.click(sendTipButton);

    // Should show network error
    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });

    // Should show retry button
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('should update wallet balance after tipping', async () => {
    // Mock wallet balance update
    let currentBalance = 125.50;
    
    server.use(
      http.get('https://bff.example.com/wallet/balance', () => {
        return HttpResponse.json({
          usdc: currentBalance,
          pendingEarnings: 25.75,
          availableForWithdraw: currentBalance - 25.75,
          lastUpdated: new Date().toISOString(),
        });
      }),
      http.post('https://bff.example.com/tips', () => {
        currentBalance -= 5.00; // Deduct tip amount
        return HttpResponse.json({
          id: 'tip-123',
          amount: 5.00,
          currency: 'USDC',
          videoId: 'video-1',
          creatorId: 'creator-1',
          timestamp: new Date().toISOString(),
          status: 'completed',
        });
      })
    );

    render(<Watch />);

    // Should show initial balance
    await waitFor(() => {
      expect(screen.getByText(/\$125\.50/)).toBeInTheDocument();
    });

    // Send tip
    const tipButton = screen.getByRole('button', { name: /tip/i });
    fireEvent.click(tipButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const fiveDollarButton = screen.getByRole('button', { name: /\$5/i });
    fireEvent.click(fiveDollarButton);

    const sendTipButton = screen.getByRole('button', { name: /send tip/i });
    fireEvent.click(sendTipButton);

    // Should update balance after tip
    await waitFor(() => {
      expect(screen.getByText(/\$120\.50/)).toBeInTheDocument();
    });
  });
});