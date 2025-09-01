// Age verification utilities
import { ENV } from './env';
import { STORAGE_KEYS } from '../constants/live';

/**
 * Age verification status interface
 */
export interface AgeVerificationStatus {
  required: boolean;
  valid: boolean;
  acknowledged: boolean;
  expired: boolean;
  timestamp: number;
}

/**
 * Check if age verification is required
 */
export function isAgeVerificationRequired(): boolean {
  return ENV.ADULT;
}

/**
 * Check if age verification consent has expired
 */
export function isAgeConsentExpired(timestamp: number): boolean {
  if (!ENV.ADULT) return false;
  const ttlMs = ENV.AGE_TTL_DAYS * 86400000; // Convert days to milliseconds
  return Date.now() - timestamp > ttlMs;
}

/**
 * Get current age verification status
 */
export function getAgeVerificationStatus(): AgeVerificationStatus {
  if (!ENV.ADULT) {
    return {
      required: false,
      valid: true,
      acknowledged: false,
      expired: false,
      timestamp: 0,
    };
  }

  const ack = localStorage.getItem(STORAGE_KEYS.AGE_ACKNOWLEDGMENT);
  const ts = Number(localStorage.getItem(STORAGE_KEYS.AGE_ACKNOWLEDGMENT_TIMESTAMP) || 0);
  const expired = isAgeConsentExpired(ts);

  return {
    required: true,
    valid: ack === "1" && !expired,
    acknowledged: ack === "1",
    expired,
    timestamp: ts,
  };
}

/**
 * Store age verification acknowledgment
 */
export function storeAgeAcknowledgment(): void {
  localStorage.setItem(STORAGE_KEYS.AGE_ACKNOWLEDGMENT, "1");
  localStorage.setItem(STORAGE_KEYS.AGE_ACKNOWLEDGMENT_TIMESTAMP, String(Date.now()));
}

/**
 * Clear age verification acknowledgment
 */
export function clearAgeAcknowledgment(): void {
  localStorage.removeItem(STORAGE_KEYS.AGE_ACKNOWLEDGMENT);
  localStorage.removeItem(STORAGE_KEYS.AGE_ACKNOWLEDGMENT_TIMESTAMP);
}

/**
 * Check if user can access age-restricted content
 */
export function canAccessAgeRestrictedContent(): boolean {
  const status = getAgeVerificationStatus();
  return !status.required || status.valid;
}

/**
 * Get time until age verification expires (in milliseconds)
 */
export function getTimeUntilExpiration(): number {
  const status = getAgeVerificationStatus();
  
  if (!status.required || !status.acknowledged) {
    return 0;
  }

  const ttlMs = ENV.AGE_TTL_DAYS * 86400000;
  const expirationTime = status.timestamp + ttlMs;
  const timeRemaining = expirationTime - Date.now();
  
  return Math.max(0, timeRemaining);
}

/**
 * Get human-readable time until expiration
 */
export function getExpirationTimeString(): string {
  const timeMs = getTimeUntilExpiration();
  
  if (timeMs === 0) {
    return 'Expired';
  }

  const days = Math.floor(timeMs / (24 * 60 * 60 * 1000));
  const hours = Math.floor((timeMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  
  if (days > 0) {
    return `${days} day${days !== 1 ? 's' : ''} remaining`;
  } else if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''} remaining`;
  } else {
    return 'Less than 1 hour remaining';
  }
}