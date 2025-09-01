// Unified environment configuration supporting both VITE_ and NEXT_PUBLIC_ prefixes
// This ensures compatibility across different build systems and deployment environments

/**
 * Get environment variable with fallback support
 * Prioritizes NEXT_PUBLIC_ over VITE_ for compatibility
 */
function getEnvVar(viteKey: string, nextKey: string, defaultValue: string = ''): string {
  // In Vite, we always use import.meta.env for both client and server
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[nextKey] || import.meta.env[viteKey] || defaultValue;
  }
  
  // Fallback to process.env for Node.js environments (testing, etc.)
  if (typeof process !== 'undefined' && process.env) {
    return process.env[nextKey] || process.env[viteKey] || defaultValue;
  }
  
  return defaultValue;
}

/**
 * Generic environment variable getter
 * Supports both VITE_ and NEXT_PUBLIC_ prefixes
 */
export function getEnv(key: string, defaultValue: string = ''): string {
  // Handle keys that already have prefixes
  if (key.startsWith('VITE_') || key.startsWith('NEXT_PUBLIC_')) {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env[key] || defaultValue;
    }
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key] || defaultValue;
    }
    return defaultValue;
  }
  
  // For keys without prefixes, try both variants
  const viteKey = `VITE_${key}`;
  const nextKey = `NEXT_PUBLIC_${key}`;
  return getEnvVar(viteKey, nextKey, defaultValue);
}

/**
 * Get boolean environment variable
 */
function getEnvBool(viteKey: string, nextKey: string, defaultValue: boolean = false): boolean {
  const value = getEnvVar(viteKey, nextKey, '');
  return value === '1' || value === 'true';
}

/**
 * Get number environment variable
 */
function getEnvNumber(viteKey: string, nextKey: string, defaultValue: number): number {
  const value = getEnvVar(viteKey, nextKey, '');
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Unified environment configuration
 * Supports both VITE_ and NEXT_PUBLIC_ prefixes with NEXT_PUBLIC_ taking priority
 */
export const ENV = {
  // Live streaming feature flag
  LIVE_ENABLED: getEnvBool('VITE_LIVE_ENABLED', 'NEXT_PUBLIC_LIVE_ENABLED', true),
  
  // Adult content and age verification
  ADULT: getEnvBool('VITE_ADULT', 'NEXT_PUBLIC_ADULT', false),
  AGE_TTL_DAYS: getEnvNumber('VITE_AGE_GATE_TTL_DAYS', 'NEXT_PUBLIC_AGE_GATE_TTL_DAYS', 90),
  
  // API endpoints
  API_BASE: getEnvVar('VITE_API_BASE', 'NEXT_PUBLIC_API_BASE', 'http://localhost:3001/api'),
  WS_URL: getEnvVar('VITE_WS_URL', 'NEXT_PUBLIC_WS_URL', 'ws://localhost:3001'),
  CDN_BASE: getEnvVar('VITE_CDN_BASE', 'NEXT_PUBLIC_CDN_BASE', 'http://localhost:3001/cdn'),
  
  // Content discovery
  DEFAULT_REGION: getEnvVar('VITE_DEFAULT_REGION', 'NEXT_PUBLIC_DEFAULT_REGION', 'US'),
  
  // Upload configuration
  UPLOAD_TUS_ENDPOINT: getEnvVar('VITE_UPLOAD_TUS_ENDPOINT', 'NEXT_PUBLIC_UPLOAD_TUS_ENDPOINT', 'http://localhost:3001/files/'),
  
  // IPFS configuration
  IPFS_GATEWAY: getEnvVar('VITE_IPFS_GATEWAY', 'NEXT_PUBLIC_IPFS_GATEWAY', 'https://cloudflare-ipfs.com/ipfs/'),
  
  // Feature flags
  FEATURE_FLAGS: getEnvVar('VITE_FEATURE_FLAGS', 'NEXT_PUBLIC_FEATURE_FLAGS', 'shorts,live,watermark').split(',').filter(Boolean),
} as const;

/**
 * Feature flag utilities
 */
export const hasFeature = (feature: string): boolean => {
  return ENV.FEATURE_FLAGS.includes(feature);
};

export const features = {
  shorts: hasFeature('shorts'),
  live: hasFeature('live'),
  watermark: hasFeature('watermark'),
  adultContent: ENV.ADULT,
  ageGate: ENV.ADULT,
  kyc: hasFeature('kyc'),
  geoBlocking: hasFeature('geo'),
  escrow: hasFeature('escrow'),
  analytics: hasFeature('analytics'),
  notifications: hasFeature('notifications'),
  chat: hasFeature('chat'),
  tips: hasFeature('tips'),
  uploads: hasFeature('uploads'),
  profiles: hasFeature('profiles'),
  search: hasFeature('search'),
  comments: hasFeature('comments'),
  reports: hasFeature('reports'),
  studio: hasFeature('studio'),
  wallet: hasFeature('wallet'),
} as const;

/**
 * Feature flag management for gradual rollout
 */
export const featureRollout = {
  // Check if feature is enabled for a specific user/session
  isEnabledForUser: (feature: string, userId?: string): boolean => {
    // Base feature flag check
    if (!hasFeature(feature)) return false;
    
    // For gradual rollout, you can implement percentage-based rollout
    // This is a simple example - in production you'd use a proper feature flag service
    if (userId) {
      const hash = userId.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      const percentage = Math.abs(hash) % 100;
      
      // Example: roll out to 50% of users for 'beta' features
      if (feature.includes('beta')) {
        return percentage < 50;
      }
    }
    
    return true;
  },
  
  // Get rollout percentage for a feature
  getRolloutPercentage: (feature: string): number => {
    // This could be configured via environment variables or API
    const rolloutConfig: Record<string, number> = {
      'beta-shorts': 50,
      'beta-live': 25,
      'beta-analytics': 75,
    };
    
    return rolloutConfig[feature] || 100;
  },
} as const;

/**
 * Age gate utilities for backward compatibility
 */
export const ageGate = {
  isEnabled: () => ENV.ADULT,
  getTtlDays: () => ENV.AGE_TTL_DAYS,
  getTtlMs: () => ENV.AGE_TTL_DAYS * 86400000, // Convert days to milliseconds
  isConsentExpired: (timestamp: number) => {
    if (!ENV.ADULT) return false;
    return Date.now() - timestamp > ageGate.getTtlMs();
  },
  getConsentStatus: () => {
    if (!ENV.ADULT) return { required: false, valid: true };
    
    const ack = localStorage.getItem("age_ack");
    const ts = Number(localStorage.getItem("age_ack_ts") || 0);
    const expired = ageGate.isConsentExpired(ts);
    
    return {
      required: true,
      valid: ack === "1" && !expired,
      acknowledged: ack === "1",
      timestamp: ts,
      expired
    };
  }
} as const;

/**
 * Legacy env export for backward compatibility
 */
export const env = {
  ADULT_CONTENT: ENV.ADULT,
  AGE_GATE_TTL_DAYS: ENV.AGE_TTL_DAYS,
  API_BASE: ENV.API_BASE,
  WS_URL: ENV.WS_URL,
  CDN_BASE: ENV.CDN_BASE,
  FEATURE_FLAGS: ENV.FEATURE_FLAGS,
} as const;

/**
 * Validate environment configuration
 * Logs warnings for missing or invalid configuration
 */
export const validateEnv = () => {
  const warnings: string[] = [];
  
  // Validate required endpoints
  if (!ENV.API_BASE) warnings.push('API_BASE is not configured');
  if (!ENV.WS_URL) warnings.push('WS_URL is not configured');
  if (!ENV.CDN_BASE) warnings.push('CDN_BASE is not configured');
  
  // Validate age gate configuration
  if (ENV.ADULT) {
    if (ENV.AGE_TTL_DAYS < 1 || ENV.AGE_TTL_DAYS > 365) {
      warnings.push('AGE_TTL_DAYS should be between 1 and 365 days');
    }
  }
  
  // Validate live streaming configuration
  if (ENV.LIVE_ENABLED && !ENV.WS_URL) {
    warnings.push('Live streaming is enabled but WS_URL is not configured');
  }
  
  // Log warnings in development
  if (warnings.length > 0 && process.env.NODE_ENV === 'development') {
    console.warn('Environment configuration warnings:', warnings);
  }
  
  return warnings.length === 0;
};

/**
 * Production-ready configuration export
 */
export const config = {
  api: {
    base: ENV.API_BASE,
    ws: ENV.WS_URL,
    cdn: ENV.CDN_BASE,
    upload: ENV.UPLOAD_TUS_ENDPOINT,
    ipfs: ENV.IPFS_GATEWAY,
  },
  features: {
    ...features,
    rollout: featureRollout,
  },
  compliance: {
    adult: ENV.ADULT,
    ageGate: ageGate,
  },
  discovery: {
    defaultRegion: ENV.DEFAULT_REGION,
  },
  live: {
    enabled: ENV.LIVE_ENABLED,
  },
} as const;

// Debug logging in development
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('🔧 Environment Configuration Loaded:', {
    LIVE_ENABLED: ENV.LIVE_ENABLED,
    ADULT: ENV.ADULT,
    AGE_TTL_DAYS: ENV.AGE_TTL_DAYS,
    API_BASE: ENV.API_BASE,
    WS_URL: ENV.WS_URL,
    DEFAULT_REGION: ENV.DEFAULT_REGION,
    FEATURE_FLAGS: ENV.FEATURE_FLAGS,
    availableEnvVars: typeof import.meta !== 'undefined' ? Object.keys(import.meta.env) : 'N/A'
  });
}

// Validate configuration on module load
const isValid = validateEnv();

// Export validation result for external use
export const configurationValid = isValid;