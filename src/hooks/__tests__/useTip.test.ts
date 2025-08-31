import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTip } from '../useTip';
import { server } from '../../test/mocks/server';
import { http, HttpResponse } from 'msw';

// Create wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useTip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send tip successfully', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useTip(), { wrapper });

    const tipData = {
      videoId: 'video-1',
      creatorId: 'creator-1',
      amount: 5.00,
    };

    result.current.sendTip(tipData);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isSuccess).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should handle tip error', async () => {
    // Mock API error
    server.use(
      http.post('https://bff.example.com/tips', () => {
        return new HttpResponse(null, { status: 400 });
      })
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useTip(), { wrapper });

    const tipData = {
      videoId: 'video-1',
      creatorId: 'creator-1',
      amount: 5.00,
    };

    result.current.sendTip(tipData);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBeTruthy();
  });

  it('should validate tip amount', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useTip(), { wrapper });

    const invalidTipData = {
      videoId: 'video-1',
      creatorId: 'creator-1',
      amount: 0, // Invalid amount
    };

    result.current.sendTip(invalidTipData);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toContain('amount');
  });

  it('should handle insufficient balance', async () => {
    // Mock insufficient balance error
    server.use(
      http.post('https://bff.example.com/tips', () => {
        return HttpResponse.json(
          { error: 'Insufficient balance' },
          { status: 400 }
        );
      })
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useTip(), { wrapper });

    const tipData = {
      videoId: 'video-1',
      creatorId: 'creator-1',
      amount: 1000.00, // Large amount
    };

    result.current.sendTip(tipData);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toContain('Insufficient balance');
  });

  it('should reset state correctly', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useTip(), { wrapper });

    // Send a tip first
    const tipData = {
      videoId: 'video-1',
      creatorId: 'creator-1',
      amount: 5.00,
    };

    result.current.sendTip(tipData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Reset the state
    result.current.reset();

    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle network errors', async () => {
    // Mock network error
    server.use(
      http.post('https://bff.example.com/tips', () => {
        return HttpResponse.error();
      })
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useTip(), { wrapper });

    const tipData = {
      videoId: 'video-1',
      creatorId: 'creator-1',
      amount: 5.00,
    };

    result.current.sendTip(tipData);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeTruthy();
  });

  it('should provide loading state during tip submission', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useTip(), { wrapper });

    const tipData = {
      videoId: 'video-1',
      creatorId: 'creator-1',
      amount: 5.00,
    };

    expect(result.current.isLoading).toBe(false);

    result.current.sendTip(tipData);

    // Should be loading immediately after calling sendTip
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should handle concurrent tip requests', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useTip(), { wrapper });

    const tipData1 = {
      videoId: 'video-1',
      creatorId: 'creator-1',
      amount: 5.00,
    };

    const tipData2 = {
      videoId: 'video-2',
      creatorId: 'creator-2',
      amount: 10.00,
    };

    // Send two tips concurrently
    result.current.sendTip(tipData1);
    result.current.sendTip(tipData2);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should handle the last request
    expect(result.current.isSuccess).toBe(true);
  });
});