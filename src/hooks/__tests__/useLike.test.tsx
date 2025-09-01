import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useLike } from '../useLike';
import { ToastProvider } from '../../providers/ToastProvider';
import * as api from '../../lib/api';
import { ReactNode } from 'react';

// Mock the API
vi.mock('../../lib/api', () => ({
  apiPost: vi.fn(),
  apiDelete: vi.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        {children}
      </ToastProvider>
    </QueryClientProvider>
  );
};

describe('useLike', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should toggle like status optimistically', async () => {
    const mockApiPost = vi.mocked(api.apiPost);
    mockApiPost.mockResolvedValue({ ok: true, data: {} });

    const { result } = renderHook(() => useLike(), {
      wrapper: createWrapper(),
    });

    // Initially not loading
    expect(result.current.isLoading).toBe(false);

    // Toggle like
    result.current.toggleLike('video-1', false);

    // Should be loading
    expect(result.current.isLoading).toBe(true);

    // Wait for mutation to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have called the API
    expect(mockApiPost).toHaveBeenCalledWith(
      '/bff/videos/video-1/like',
      {},
      {
        headers: {
          'Idempotency-Key': expect.stringMatching(/^like_\d+_[a-z0-9]+$/),
        },
      }
    );
  });

  it('should handle unlike operation', async () => {
    const mockApiDelete = vi.mocked(api.apiDelete);
    mockApiDelete.mockResolvedValue({ ok: true, data: {} });

    const { result } = renderHook(() => useLike(), {
      wrapper: createWrapper(),
    });

    // Toggle unlike
    result.current.toggleLike('video-1', true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have called the delete API
    expect(mockApiDelete).toHaveBeenCalledWith('/bff/videos/video-1/like');
  });

  it('should handle API errors gracefully', async () => {
    const mockApiPost = vi.mocked(api.apiPost);
    mockApiPost.mockResolvedValue({ 
      ok: false, 
      error: 'Network error',
      data: null 
    });

    const { result } = renderHook(() => useLike(), {
      wrapper: createWrapper(),
    });

    result.current.toggleLike('video-1', false);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have an error
    expect(result.current.error).toBeTruthy();
  });

  it('should generate unique idempotency keys', async () => {
    const mockApiPost = vi.mocked(api.apiPost);
    mockApiPost.mockResolvedValue({ ok: true, data: {} });

    const { result } = renderHook(() => useLike(), {
      wrapper: createWrapper(),
    });

    // Make two calls
    result.current.toggleLike('video-1', false);
    result.current.toggleLike('video-2', false);

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledTimes(2);
    });

    // Check that different idempotency keys were used
    const calls = mockApiPost.mock.calls;
    const key1 = calls[0][2]?.headers?.['Idempotency-Key'];
    const key2 = calls[1][2]?.headers?.['Idempotency-Key'];
    
    expect(key1).toBeDefined();
    expect(key2).toBeDefined();
    expect(key1).not.toBe(key2);
  });
});