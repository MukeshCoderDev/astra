import { describe, it, expect } from 'vitest';
import {
  cn,
  formatDuration,
  formatNumber,
  formatCurrency,
  formatDate,
  formatFileSize,
  validateEmail,
  validatePassword,
  debounce,
  throttle,
  generateId,
  sanitizeFilename,
  isValidVideoFile,
  getVideoFileInfo,
} from '../utils';

describe('utils', () => {
  describe('cn (className utility)', () => {
    it('should merge class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
      expect(cn('class1', undefined, 'class2')).toBe('class1 class2');
      expect(cn('class1', false && 'class2', 'class3')).toBe('class1 class3');
    });

    it('should handle conditional classes', () => {
      const isActive = true;
      const isDisabled = false;
      
      expect(cn('base', isActive && 'active', isDisabled && 'disabled'))
        .toBe('base active');
    });
  });

  describe('formatDuration', () => {
    it('should format seconds correctly', () => {
      expect(formatDuration(30)).toBe('0:30');
      expect(formatDuration(90)).toBe('1:30');
      expect(formatDuration(3661)).toBe('1:01:01');
      expect(formatDuration(0)).toBe('0:00');
    });

    it('should handle edge cases', () => {
      expect(formatDuration(-1)).toBe('0:00');
      expect(formatDuration(NaN)).toBe('0:00');
      expect(formatDuration(Infinity)).toBe('0:00');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with appropriate suffixes', () => {
      expect(formatNumber(999)).toBe('999');
      expect(formatNumber(1000)).toBe('1K');
      expect(formatNumber(1500)).toBe('1.5K');
      expect(formatNumber(1000000)).toBe('1M');
      expect(formatNumber(1500000)).toBe('1.5M');
      expect(formatNumber(1000000000)).toBe('1B');
    });

    it('should handle edge cases', () => {
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(-1000)).toBe('-1K');
    });
  });

  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(10.50)).toBe('$10.50');
      expect(formatCurrency(1000)).toBe('$1,000.00');
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should handle different currencies', () => {
      expect(formatCurrency(10.50, 'EUR')).toBe('€10.50');
      expect(formatCurrency(10.50, 'GBP')).toBe('£10.50');
    });
  });

  describe('formatDate', () => {
    it('should format dates correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      expect(formatDate(date)).toMatch(/Jan 15, 2024/);
    });

    it('should handle relative dates', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      expect(formatDate(yesterday, 'relative')).toMatch(/day ago/);
    });
  });

  describe('formatFileSize', () => {
    it('should format file sizes correctly', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
      expect(formatFileSize(0)).toBe('0 B');
    });

    it('should handle decimal places', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1024 * 1024 * 1.5)).toBe('1.5 MB');
    });
  });

  describe('validateEmail', () => {
    it('should validate email addresses correctly', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@example.co.uk')).toBe(true);
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate password strength', () => {
      expect(validatePassword('password123')).toBe(false); // Too weak
      expect(validatePassword('Password123!')).toBe(true); // Strong
      expect(validatePassword('short')).toBe(false); // Too short
      expect(validatePassword('verylongpasswordwithoutspecialchars')).toBe(false); // No special chars
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', (done) => {
      let callCount = 0;
      const debouncedFn = debounce(() => {
        callCount++;
      }, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      setTimeout(() => {
        expect(callCount).toBe(1);
        done();
      }, 150);
    });
  });

  describe('throttle', () => {
    it('should throttle function calls', (done) => {
      let callCount = 0;
      const throttledFn = throttle(() => {
        callCount++;
      }, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      expect(callCount).toBe(1);

      setTimeout(() => {
        throttledFn();
        expect(callCount).toBe(2);
        done();
      }, 150);
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
    });

    it('should generate IDs with specified prefix', () => {
      const id = generateId('user');
      expect(id).toMatch(/^user-/);
    });
  });

  describe('sanitizeFilename', () => {
    it('should sanitize filenames', () => {
      expect(sanitizeFilename('file<>name.txt')).toBe('filename.txt');
      expect(sanitizeFilename('file/name\\test.mp4')).toBe('filenametest.mp4');
      expect(sanitizeFilename('file:name|test?.mp4')).toBe('filenametest.mp4');
    });

    it('should preserve valid characters', () => {
      expect(sanitizeFilename('valid-file_name.mp4')).toBe('valid-file_name.mp4');
      expect(sanitizeFilename('file (1).mp4')).toBe('file (1).mp4');
    });
  });

  describe('isValidVideoFile', () => {
    it('should validate video file types', () => {
      expect(isValidVideoFile('video.mp4')).toBe(true);
      expect(isValidVideoFile('video.mov')).toBe(true);
      expect(isValidVideoFile('video.avi')).toBe(true);
      expect(isValidVideoFile('video.mkv')).toBe(true);
      expect(isValidVideoFile('video.webm')).toBe(true);
      
      expect(isValidVideoFile('image.jpg')).toBe(false);
      expect(isValidVideoFile('document.pdf')).toBe(false);
      expect(isValidVideoFile('audio.mp3')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(isValidVideoFile('VIDEO.MP4')).toBe(true);
      expect(isValidVideoFile('Video.MOV')).toBe(true);
    });
  });

  describe('getVideoFileInfo', () => {
    it('should extract video file information', () => {
      const file = new File([''], 'test-video.mp4', { type: 'video/mp4' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 * 100 }); // 100MB

      const info = getVideoFileInfo(file);
      
      expect(info.name).toBe('test-video.mp4');
      expect(info.size).toBe(1024 * 1024 * 100);
      expect(info.type).toBe('video/mp4');
      expect(info.extension).toBe('mp4');
      expect(info.isValid).toBe(true);
    });

    it('should handle invalid files', () => {
      const file = new File([''], 'test.txt', { type: 'text/plain' });
      const info = getVideoFileInfo(file);
      
      expect(info.isValid).toBe(false);
      expect(info.extension).toBe('txt');
    });
  });
});