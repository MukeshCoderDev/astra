import { describe, it, expect } from 'vitest';
import {
  generateIdempotencyKey,
  getErrorMessage,
  isRetryableError,
  getRetryDelay,
  getErrorMessageForUser,
  ERROR_MESSAGES,
} from '../errorHandling';

describe('errorHandling', () => {
  describe('generateIdempotencyKey', () => {
    it('should generate unique keys with default prefix', () => {
      const key1 = generateIdempotencyKey();
      const key2 = generateIdempotencyKey();
      
      expect(key1).toMatch(/^op_\d+_[a-z0-9]+$/);
      expect(key2).toMatch(/^op_\d+_[a-z0-9]+$/);
      expect(key1).not.toBe(key2);
    });

    it('should generate keys with custom prefix', () => {
      const key = generateIdempotencyKey('like');
      expect(key).toMatch(/^like_\d+_[a-z0-9]+$/);
    });
  });

  describe('getErrorMessage', () => {
    it('should extract message from Error objects', () => {
      const error = new Error('Test error');
      expect(getErrorMessage(error)).toBe('Test error');
    });

    it('should return string errors as-is', () => {
      expect(getErrorMessage('String error')).toBe('String error');
    });

    it('should extract message from objects with message property', () => {
      const error = { message: 'Object error' };
      expect(getErrorMessage(error)).toBe('Object error');
    });

    it('should return default message for unknown error types', () => {
      expect(getErrorMessage(null)).toBe('An unexpected error occurred');
      expect(getErrorMessage(undefined)).toBe('An unexpected error occurred');
      expect(getErrorMessage(123)).toBe('An unexpected error occurred');
    });
  });

  describe('isRetryableError', () => {
    it('should identify network errors as retryable', () => {
      const networkError = new Error('fetch failed');
      expect(isRetryableError(networkError)).toBe(true);
    });

    it('should identify timeout errors as retryable', () => {
      const timeoutError = new Error('Request timeout');
      expect(isRetryableError(timeoutError)).toBe(true);
    });

    it('should identify 5xx status codes as retryable', () => {
      const serverError = { status: 500 };
      expect(isRetryableError(serverError)).toBe(true);
    });

    it('should identify 408 and 429 as retryable', () => {
      expect(isRetryableError({ status: 408 })).toBe(true);
      expect(isRetryableError({ status: 429 })).toBe(true);
    });

    it('should not retry 4xx client errors', () => {
      expect(isRetryableError({ status: 400 })).toBe(false);
      expect(isRetryableError({ status: 404 })).toBe(false);
    });
  });

  describe('getRetryDelay', () => {
    it('should calculate exponential backoff', () => {
      expect(getRetryDelay(0, 1000)).toBe(1000);
      expect(getRetryDelay(1, 1000)).toBe(2000);
      expect(getRetryDelay(2, 1000)).toBe(4000);
    });

    it('should cap delay at maximum', () => {
      expect(getRetryDelay(10, 1000)).toBe(10000);
    });
  });

  describe('getErrorMessageForUser', () => {
    it('should return network message for network errors', () => {
      const error = new Error('Network request failed');
      expect(getErrorMessageForUser(error)).toBe(ERROR_MESSAGES.NETWORK);
    });

    it('should return timeout message for timeout errors', () => {
      const error = new Error('Request timeout occurred');
      expect(getErrorMessageForUser(error)).toBe(ERROR_MESSAGES.TIMEOUT);
    });

    it('should return unauthorized message for 401 errors', () => {
      const error = new Error('Unauthorized access - 401');
      expect(getErrorMessageForUser(error)).toBe(ERROR_MESSAGES.UNAUTHORIZED);
    });

    it('should return forbidden message for 403 errors', () => {
      const error = new Error('Forbidden - 403');
      expect(getErrorMessageForUser(error)).toBe(ERROR_MESSAGES.FORBIDDEN);
    });

    it('should return not found message for 404 errors', () => {
      const error = new Error('Resource not found - 404');
      expect(getErrorMessageForUser(error)).toBe(ERROR_MESSAGES.NOT_FOUND);
    });

    it('should return server error message for 5xx errors', () => {
      const error = new Error('Internal server error - 500');
      expect(getErrorMessageForUser(error)).toBe(ERROR_MESSAGES.SERVER_ERROR);
    });

    it('should return original message for unrecognized errors', () => {
      const error = new Error('Custom error message');
      expect(getErrorMessageForUser(error)).toBe('Custom error message');
    });

    it('should return unknown message for empty errors', () => {
      expect(getErrorMessageForUser('')).toBe(ERROR_MESSAGES.UNKNOWN);
      expect(getErrorMessageForUser(null)).toBe(ERROR_MESSAGES.UNKNOWN);
    });
  });
});