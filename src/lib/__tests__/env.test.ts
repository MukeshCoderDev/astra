import { describe, it, expect } from 'vitest';
import { ENV, validateEnv, hasFeature, features, featureRollout, ageGate } from '../env';

describe('Environment Configuration', () => {
  describe('ENV object', () => {
    it('should have all required configuration properties', () => {
      expect(ENV).toHaveProperty('API_BASE');
      expect(ENV).toHaveProperty('DEFAULT_REGION');
      expect(ENV).toHaveProperty('FEATURE_FLAGS');
      expect(ENV).toHaveProperty('ADULT');
      expect(ENV).toHaveProperty('AGE_TTL_DAYS');
    });

    it('should provide valid configuration values', () => {
      expect(typeof ENV.API_BASE).toBe('string');
      expect(typeof ENV.DEFAULT_REGION).toBe('string');
      expect(Array.isArray(ENV.FEATURE_FLAGS)).toBe(true);
      expect(typeof ENV.ADULT).toBe('boolean');
      expect(typeof ENV.AGE_TTL_DAYS).toBe('number');
    });
  });

  describe('Feature Flags', () => {
    it('should parse feature flags correctly', () => {
      expect(Array.isArray(ENV.FEATURE_FLAGS)).toBe(true);
      expect(ENV.FEATURE_FLAGS.length).toBeGreaterThan(0);
    });

    it('should check feature availability', () => {
      // Test with known features from environment
      const firstFeature = ENV.FEATURE_FLAGS[0];
      if (firstFeature) {
        expect(hasFeature(firstFeature)).toBe(true);
      }
      expect(hasFeature('nonexistent-feature')).toBe(false);
    });

    it('should provide feature object', () => {
      expect(typeof features).toBe('object');
      expect(typeof features.shorts).toBe('boolean');
      expect(typeof features.live).toBe('boolean');
      expect(typeof features.watermark).toBe('boolean');
    });
  });

  describe('Feature Rollout', () => {
    it('should respect base feature flags', () => {
      const firstFeature = ENV.FEATURE_FLAGS[0];
      if (firstFeature) {
        expect(featureRollout.isEnabledForUser(firstFeature)).toBe(true);
      }
      expect(featureRollout.isEnabledForUser('nonexistent')).toBe(false);
    });

    it('should handle user-based rollout consistently', () => {
      const result1 = featureRollout.isEnabledForUser('beta-shorts', 'user1');
      const result2 = featureRollout.isEnabledForUser('beta-shorts', 'user1');
      
      // Should be consistent for same user
      expect(result1).toBe(result2);
    });

    it('should provide rollout percentages', () => {
      expect(featureRollout.getRolloutPercentage('beta-shorts')).toBe(50);
      expect(featureRollout.getRolloutPercentage('unknown')).toBe(100);
    });
  });

  describe('Environment Validation', () => {
    it('should validate current configuration', () => {
      const isValid = validateEnv();
      expect(typeof isValid).toBe('boolean');
    });
  });

  describe('Age Gate Utilities', () => {
    it('should check if age gate is enabled', () => {
      expect(typeof ageGate.isEnabled()).toBe('boolean');
    });

    it('should calculate TTL correctly', () => {
      expect(typeof ageGate.getTtlDays()).toBe('number');
      expect(typeof ageGate.getTtlMs()).toBe('number');
      expect(ageGate.getTtlMs()).toBe(ageGate.getTtlDays() * 86400000);
    });

    it('should check consent expiration', () => {
      const now = Date.now();
      const expired = now - (400 * 86400000); // 400 days ago (definitely expired)
      const valid = now - (1 * 86400000); // 1 day ago (definitely valid)
      
      if (ENV.ADULT) {
        expect(ageGate.isConsentExpired(expired)).toBe(true);
        expect(ageGate.isConsentExpired(valid)).toBe(false);
      }
    });

    it('should provide consent status', () => {
      const status = ageGate.getConsentStatus();
      expect(typeof status).toBe('object');
      expect(typeof status.required).toBe('boolean');
      expect(typeof status.valid).toBe('boolean');
    });
  });
});