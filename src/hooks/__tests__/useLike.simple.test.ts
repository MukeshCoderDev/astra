import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateIdempotencyKey } from '../../lib/errorHandling';

// Mock the API
vi.mock('../../lib/api', () => ({
  apiPost: vi.fn(),
  apiDelete: vi.fn(),
}));

describe('useLike utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate unique idempotency keys for likes', () => {
    const key1 = generateIdempotencyKey('like');
    const key2 = generateIdempotencyKey('like');
    
    expect(key1).toMatch(/^like_\d+_[a-z0-9]+$/);
    expect(key2).toMatch(/^like_\d+_[a-z0-9]+$/);
    expect(key1).not.toBe(key2);
  });

  it('should generate unique idempotency keys for watch later', () => {
    const key1 = generateIdempotencyKey('watch_later');
    const key2 = generateIdempotencyKey('watch_later');
    
    expect(key1).toMatch(/^watch_later_\d+_[a-z0-9]+$/);
    expect(key2).toMatch(/^watch_later_\d+_[a-z0-9]+$/);
    expect(key1).not.toBe(key2);
  });
});