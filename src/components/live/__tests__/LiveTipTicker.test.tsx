import { render, screen, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import LiveTipTicker from '../LiveTipTicker';
import type { TipEvent } from '../../../types/live';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
}));

// Mock the useLiveTipEvents hook
const mockAddTip = vi.fn();
vi.mock('../../../hooks/useLiveTipEvents', () => ({
  useLiveTipEvents: vi.fn((streamId: string, onTip: (tip: TipEvent) => void) => {
    mockAddTip.mockImplementation(onTip);
  }),
}));

// Mock constants
vi.mock('../../../constants/live', () => ({
  PERFORMANCE_TARGETS: {
    TIP_ANIMATION_DURATION_MS: 8000,
  },
}));

describe('LiveTipTicker', () => {
  const mockStreamId = 'test-stream-123';
  
  const createMockTip = (overrides: Partial<TipEvent> = {}): TipEvent => ({
    id: `tip-${Date.now()}-${Math.random()}`,
    streamId: mockStreamId,
    user: {
      id: 'user-123',
      handle: 'testuser',
      avatar: undefined,
    },
    amount: 25.50,
    currency: 'USDC',
    message: 'Great stream!',
    timestamp: Date.now(),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders without crashing', () => {
    render(<LiveTipTicker streamId={mockStreamId} />);
    expect(screen.getByRole('generic')).toBeInTheDocument();
  });

  it('displays tip with correct formatting', async () => {
    render(<LiveTipTicker streamId={mockStreamId} />);
    
    const mockTip = createMockTip({
      amount: 50.75,
      currency: 'USDC',
      user: { id: 'user-1', handle: 'johndoe' },
      message: 'Amazing content!',
    });

    act(() => {
      mockAddTip(mockTip);
    });

    await waitFor(() => {
      expect(screen.getByText('johndoe')).toBeInTheDocument();
      expect(screen.getByText('tipped')).toBeInTheDocument();
      expect(screen.getByText('$50.75')).toBeInTheDocument();
      expect(screen.getByText('"Amazing content!"')).toBeInTheDocument();
    });
  });

  it('handles tips without messages', async () => {
    render(<LiveTipTicker streamId={mockStreamId} />);
    
    const mockTip = createMockTip({
      message: undefined,
      user: { id: 'user-2', handle: 'alice' },
    });

    act(() => {
      mockAddTip(mockTip);
    });

    await waitFor(() => {
      expect(screen.getByText('alice')).toBeInTheDocument();
      expect(screen.getByText('$25.50')).toBeInTheDocument();
      expect(screen.queryByText('"')).not.toBeInTheDocument();
    });
  });

  it('formats different currencies correctly', async () => {
    render(<LiveTipTicker streamId={mockStreamId} />);
    
    // Test USDC formatting
    const usdcTip = createMockTip({
      amount: 100,
      currency: 'USDC',
    });

    act(() => {
      mockAddTip(usdcTip);
    });

    await waitFor(() => {
      expect(screen.getByText('$100.00')).toBeInTheDocument();
    });

    // Test other currency formatting
    const btcTip = createMockTip({
      id: 'tip-btc',
      amount: 0.001,
      currency: 'BTC',
    });

    act(() => {
      mockAddTip(btcTip);
    });

    await waitFor(() => {
      expect(screen.getByText('0.001 BTC')).toBeInTheDocument();
    });
  });

  it('handles user without handle gracefully', async () => {
    render(<LiveTipTicker streamId={mockStreamId} />);
    
    const mockTip = createMockTip({
      user: {
        id: 'user-abcd1234',
        handle: '',
      },
    });

    act(() => {
      mockAddTip(mockTip);
    });

    await waitFor(() => {
      expect(screen.getByText('User 1234')).toBeInTheDocument();
    });
  });

  it('removes tips after animation duration', async () => {
    render(<LiveTipTicker streamId={mockStreamId} />);
    
    const mockTip = createMockTip({
      user: { id: 'user-1', handle: 'testuser' },
    });

    act(() => {
      mockAddTip(mockTip);
    });

    // Tip should be visible initially
    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument();
    });

    // Fast-forward time to after animation duration
    act(() => {
      vi.advanceTimersByTime(8000);
    });

    // Tip should be removed
    await waitFor(() => {
      expect(screen.queryByText('testuser')).not.toBeInTheDocument();
    });
  });

  it('queues multiple tips and shows them sequentially', async () => {
    render(<LiveTipTicker streamId={mockStreamId} maxVisible={1} />);
    
    const tip1 = createMockTip({
      id: 'tip-1',
      user: { id: 'user-1', handle: 'user1' },
    });
    
    const tip2 = createMockTip({
      id: 'tip-2',
      user: { id: 'user-2', handle: 'user2' },
    });

    // Add first tip
    act(() => {
      mockAddTip(tip1);
    });

    await waitFor(() => {
      expect(screen.getByText('user1')).toBeInTheDocument();
    });

    // Add second tip while first is still showing
    act(() => {
      mockAddTip(tip2);
    });

    // Only first tip should be visible (maxVisible=1)
    expect(screen.getByText('user1')).toBeInTheDocument();
    expect(screen.queryByText('user2')).not.toBeInTheDocument();

    // Fast-forward to remove first tip
    act(() => {
      vi.advanceTimersByTime(8000);
    });

    // Second tip should now be visible
    await waitFor(() => {
      expect(screen.queryByText('user1')).not.toBeInTheDocument();
      expect(screen.getByText('user2')).toBeInTheDocument();
    });
  });

  it('respects maxVisible prop', async () => {
    render(<LiveTipTicker streamId={mockStreamId} maxVisible={2} />);
    
    const tips = [
      createMockTip({ id: 'tip-1', user: { id: 'user-1', handle: 'user1' } }),
      createMockTip({ id: 'tip-2', user: { id: 'user-2', handle: 'user2' } }),
      createMockTip({ id: 'tip-3', user: { id: 'user-3', handle: 'user3' } }),
    ];

    // Add all tips quickly
    act(() => {
      tips.forEach(tip => mockAddTip(tip));
    });

    // Only first 2 should be visible
    await waitFor(() => {
      expect(screen.getByText('user1')).toBeInTheDocument();
      expect(screen.getByText('user2')).toBeInTheDocument();
      expect(screen.queryByText('user3')).not.toBeInTheDocument();
    });
  });

  it('applies custom className', () => {
    render(<LiveTipTicker streamId={mockStreamId} className="custom-class" />);
    
    const container = screen.getByRole('generic');
    expect(container).toHaveClass('custom-class');
  });

  it('positions ticker at top by default', () => {
    render(<LiveTipTicker streamId={mockStreamId} />);
    
    const container = screen.getByRole('generic');
    expect(container).toHaveClass('top-20');
    expect(container).not.toHaveClass('bottom-20');
  });

  it('positions ticker at bottom when specified', () => {
    render(<LiveTipTicker streamId={mockStreamId} position="bottom" />);
    
    const container = screen.getByRole('generic');
    expect(container).toHaveClass('bottom-20');
    expect(container).not.toHaveClass('top-20');
  });

  it('includes dollar sign icon', async () => {
    render(<LiveTipTicker streamId={mockStreamId} />);
    
    const mockTip = createMockTip();

    act(() => {
      mockAddTip(mockTip);
    });

    await waitFor(() => {
      // Check for the DollarSign icon (Lucide icons render as SVG)
      const icon = screen.getByRole('generic').querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });
});