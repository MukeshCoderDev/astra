import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ENV } from '../env';
import { STORAGE_KEYS } from '../../constants/live';
import {
  isAgeVerificationRequired,
  isAgeConsentExpired,
  getAgeVerificationStatus,
  storeAgeAcknowledgment,
  clearAgeAcknowledgment,
  canAccessAgeRestrictedContent,
  getTimeUntilExpiration,
  getExpirationTimeString,
} from '../ageVerification';

// Mock the environment
vi.mock('../env', () => ({
  ENV: {
    ADULT: true,
    AGE_TTL_DAYS: 90,
  },
}));

describe('ageVerification', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('isAgeVerificationRequired', () => {
    it('should return true when adult content is enabled', () => {
      vi.mocked(ENV).ADULT = true;
      expect(isAgeVerificationRequired()).toBe(true);
    });

    it('should return false when adult content is disabled', () => {
      vi.mocked(ENV).ADULT = false;
      expect(isAgeVerificationRequired()).toBe(false);
    });
  });

  describe('isAgeConsentExpired', () => {
    it('should return false when adult content is disabled', () => {
      vi.mocked(ENV).ADULT = false;
      const timestamp = Date.now() - (100 * 24 * 60 * 60 * 1000); // 100 days ago
      expect(isAgeConsentExpired(timestamp)).toBe(false);
    });

    it('should return false when consent is not expired', () => {
      vi.mocked(ENV).ADULT = true;
      vi.mocked(ENV).AGE_TTL_DAYS = 90;
      const timestamp = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days ago
      expect(isAgeConsentExpired(timestamp)).toBe(false);
    });

    it('should return true when consent is expired', () => {
      vi.mocked(ENV).ADULT = true;
      vi.mocked(ENV).AGE_TTL_DAYS = 90;
      const timestamp = Date.now() - (100 * 24 * 60 * 60 * 1000); // 100 days ago
      expect(isAgeConsentExpired(timestamp)).toBe(true);
    });
  });

  describe('getAgeVerificationStatus', () => {
    it('should return not required when adult content is disabled', () => {
      vi.mocked(ENV).ADULT = false;
      const status = getAgeVerificationStatus();
      
      expect(status).toEqual({
        required: false,
        valid: true,
        acknowledged: false,
        expired: false,
        timestamp: 0,
      });
    });

    it('should return invalid status when no acknowledgment exists', () => {
      vi.mocked(ENV).ADULT = true;
      const status = getAgeVerificationStatus();
      
      expect(status.required).toBe(true);
      expect(status.valid).toBe(false);
      expect(status.acknowledged).toBe(false);
      expect(status.expired).toBe(false);
    });

    it('should return valid status when acknowledgment exists and is not expired', () => {
      vi.mocked(ENV).ADULT = true;
      vi.mocked(ENV).AGE_TTL_DAYS = 90;
      
      const timestamp = Date.now();
      localStorage.setItem(STORAGE_KEYS.AGE_ACKNOWLEDGMENT, '1');
      localStorage.setItem(STORAGE_KEYS.AGE_ACKNOWLEDGMENT_TIMESTAMP, String(timestamp));
      
      const status = getAgeVerificationStatus();
      
      expect(status.required).toBe(true);
      expect(status.valid).toBe(true);
      expect(status.acknowledged).toBe(true);
      expect(status.expired).toBe(false);
      expect(status.timestamp).toBe(timestamp);
    });

    it('should return invalid status when acknowledgment is expired', () => {
      vi.mocked(ENV).ADULT = true;
      vi.mocked(ENV).AGE_TTL_DAYS = 90;
      
      const timestamp = Date.now() - (100 * 24 * 60 * 60 * 1000); // 100 days ago
      localStorage.setItem(STORAGE_KEYS.AGE_ACKNOWLEDGMENT, '1');
      localStorage.setItem(STORAGE_KEYS.AGE_ACKNOWLEDGMENT_TIMESTAMP, String(timestamp));
      
      const status = getAgeVerificationStatus();
      
      expect(status.required).toBe(true);
      expect(status.valid).toBe(false);
      expect(status.acknowledged).toBe(true);
      expect(status.expired).toBe(true);
    });
  });

  describe('storeAgeAcknowledgment', () => {
    it('should store acknowledgment in localStorage', () => {
      const beforeTime = Date.now();
      storeAgeAcknowledgment();
      const afterTime = Date.now();
      
      expect(localStorage.getItem(STORAGE_KEYS.AGE_ACKNOWLEDGMENT)).toBe('1');
      
      const timestamp = Number(localStorage.getItem(STORAGE_KEYS.AGE_ACKNOWLEDGMENT_TIMESTAMP));
      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('clearAgeAcknowledgment', () => {
    it('should remove acknowledgment from localStorage', () => {
      localStorage.setItem(STORAGE_KEYS.AGE_ACKNOWLEDGMENT, '1');
      localStorage.setItem(STORAGE_KEYS.AGE_ACKNOWLEDGMENT_TIMESTAMP, String(Date.now()));
      
      clearAgeAcknowledgment();
      
      expect(localStorage.getItem(STORAGE_KEYS.AGE_ACKNOWLEDGMENT)).toBeNull();
      expect(localStorage.getItem(STORAGE_KEYS.AGE_ACKNOWLEDGMENT_TIMESTAMP)).toBeNull();
    });
  });

  describe('canAccessAgeRestrictedContent', () => {
    it('should return true when age verification is not required', () => {
      vi.mocked(ENV).ADULT = false;
      expect(canAccessAgeRestrictedContent()).toBe(true);
    });

    it('should return false when age verification is required but not valid', () => {
      vi.mocked(ENV).ADULT = true;
      expect(canAccessAgeRestrictedContent()).toBe(false);
    });

    it('should return true when age verification is required and valid', () => {
      vi.mocked(ENV).ADULT = true;
      localStorage.setItem(STORAGE_KEYS.AGE_ACKNOWLEDGMENT, '1');
      localStorage.setItem(STORAGE_KEYS.AGE_ACKNOWLEDGMENT_TIMESTAMP, String(Date.now()));
      
      expect(canAccessAgeRestrictedContent()).toBe(true);
    });
  });

  describe('getTimeUntilExpiration', () => {
    it('should return 0 when age verification is not required', () => {
      vi.mocked(ENV).ADULT = false;
      expect(getTimeUntilExpiration()).toBe(0);
    });

    it('should return 0 when not acknowledged', () => {
      vi.mocked(ENV).ADULT = true;
      expect(getTimeUntilExpiration()).toBe(0);
    });

    it('should return correct time until expiration', () => {
      vi.mocked(ENV).ADULT = true;
      vi.mocked(ENV).AGE_TTL_DAYS = 90;
      
      const timestamp = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days ago
      localStorage.setItem(STORAGE_KEYS.AGE_ACKNOWLEDGMENT, '1');
      localStorage.setItem(STORAGE_KEYS.AGE_ACKNOWLEDGMENT_TIMESTAMP, String(timestamp));
      
      const timeRemaining = getTimeUntilExpiration();
      const expectedTime = 60 * 24 * 60 * 60 * 1000; // 60 days in ms
      
      // Allow for small timing differences
      expect(timeRemaining).toBeGreaterThan(expectedTime - 1000);
      expect(timeRemaining).toBeLessThan(expectedTime + 1000);
    });

    it('should return 0 when expired', () => {
      vi.mocked(ENV).ADULT = true;
      vi.mocked(ENV).AGE_TTL_DAYS = 90;
      
      const timestamp = Date.now() - (100 * 24 * 60 * 60 * 1000); // 100 days ago
      localStorage.setItem(STORAGE_KEYS.AGE_ACKNOWLEDGMENT, '1');
      localStorage.setItem(STORAGE_KEYS.AGE_ACKNOWLEDGMENT_TIMESTAMP, String(timestamp));
      
      expect(getTimeUntilExpiration()).toBe(0);
    });
  });

  describe('getExpirationTimeString', () => {
    it('should return "Expired" when time is 0', () => {
      vi.mocked(ENV).ADULT = false;
      expect(getExpirationTimeString()).toBe('Expired');
    });

    it('should return days remaining when more than 1 day', () => {
      vi.mocked(ENV).ADULT = true;
      vi.mocked(ENV).AGE_TTL_DAYS = 90;
      
      const timestamp = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days ago
      localStorage.setItem(STORAGE_KEYS.AGE_ACKNOWLEDGMENT, '1');
      localStorage.setItem(STORAGE_KEYS.AGE_ACKNOWLEDGMENT_TIMESTAMP, String(timestamp));
      
      const result = getExpirationTimeString();
      expect(result).toMatch(/60 days remaining/);
    });

    it('should return singular "day" when exactly 1 day remaining', () => {
      vi.mocked(ENV).ADULT = true;
      vi.mocked(ENV).AGE_TTL_DAYS = 90;
      
      const timestamp = Date.now() - (89 * 24 * 60 * 60 * 1000); // 89 days ago
      localStorage.setItem(STORAGE_KEYS.AGE_ACKNOWLEDGMENT, '1');
      localStorage.setItem(STORAGE_KEYS.AGE_ACKNOWLEDGMENT_TIMESTAMP, String(timestamp));
      
      const result = getExpirationTimeString();
      expect(result).toMatch(/1 day remaining/);
    });

    it('should return hours remaining when less than 1 day', () => {
      vi.mocked(ENV).ADULT = true;
      vi.mocked(ENV).AGE_TTL_DAYS = 90;
      
      const timestamp = Date.now() - (89.5 * 24 * 60 * 60 * 1000); // 89.5 days ago
      localStorage.setItem(STORAGE_KEYS.AGE_ACKNOWLEDGMENT, '1');
      localStorage.setItem(STORAGE_KEYS.AGE_ACKNOWLEDGMENT_TIMESTAMP, String(timestamp));
      
      const result = getExpirationTimeString();
      expect(result).toMatch(/12 hours remaining/);
    });

    it('should return "Less than 1 hour remaining" when very close to expiration', () => {
      vi.mocked(ENV).ADULT = true;
      vi.mocked(ENV).AGE_TTL_DAYS = 90;
      
      const timestamp = Date.now() - (89.99 * 24 * 60 * 60 * 1000); // Very close to 90 days
      localStorage.setItem(STORAGE_KEYS.AGE_ACKNOWLEDGMENT, '1');
      localStorage.setItem(STORAGE_KEYS.AGE_ACKNOWLEDGMENT_TIMESTAMP, String(timestamp));
      
      const result = getExpirationTimeString();
      expect(result).toBe('Less than 1 hour remaining');
    });
  });
});