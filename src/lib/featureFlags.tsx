/**
 * Feature flag configuration system
 * Allows conditional rendering of features based on environment variables
 */

import React from 'react';

export interface FeatureFlags {
  shorts: boolean;
  live: boolean;
  watermark: boolean;
  adultContent: boolean;
  ageGate: boolean;
  kyc: boolean;
  geoBlocking: boolean;
  escrow: boolean;
  analytics: boolean;
  notifications: boolean;
  chat: boolean;
  tips: boolean;
  uploads: boolean;
  profiles: boolean;
  search: boolean;
  comments: boolean;
  reports: boolean;
  studio: boolean;
  wallet: boolean;
}

// Default feature flags
const DEFAULT_FLAGS: FeatureFlags = {
  shorts: true,
  live: false,
  watermark: true,
  adultContent: true,
  ageGate: true,
  kyc: true,
  geoBlocking: true,
  escrow: true,
  analytics: true,
  notifications: true,
  chat: true,
  tips: true,
  uploads: true,
  profiles: true,
  search: true,
  comments: true,
  reports: true,
  studio: true,
  wallet: true,
};

/**
 * Parse feature flags from environment variables
 */
function parseFeatureFlags(): FeatureFlags {
  const envFlags = import.meta.env.REACT_APP_FEATURE_FLAGS || '';
  const enabledFlags = envFlags.split(',').map(flag => flag.trim().toLowerCase());
  
  // If no flags specified, use defaults
  if (!envFlags) {
    return DEFAULT_FLAGS;
  }
  
  // Parse individual flags
  const flags: FeatureFlags = { ...DEFAULT_FLAGS };
  
  // If 'all' is specified, enable everything
  if (enabledFlags.includes('all')) {
    Object.keys(flags).forEach(key => {
      (flags as any)[key] = true;
    });
    return flags;
  }
  
  // If 'none' is specified, disable everything
  if (enabledFlags.includes('none')) {
    Object.keys(flags).forEach(key => {
      (flags as any)[key] = false;
    });
    return flags;
  }
  
  // Parse specific flags
  Object.keys(flags).forEach(key => {
    const flagKey = key as keyof FeatureFlags;
    
    // Check if flag is explicitly enabled
    if (enabledFlags.includes(key)) {
      flags[flagKey] = true;
    }
    // Check if flag is explicitly disabled (with ! prefix)
    else if (enabledFlags.includes(`!${key}`)) {
      flags[flagKey] = false;
    }
    // Otherwise use default
  });
  
  return flags;
}

// Global feature flags instance
export const featureFlags: FeatureFlags = parseFeatureFlags();

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  return featureFlags[feature];
}

/**
 * Get all enabled features
 */
export function getEnabledFeatures(): (keyof FeatureFlags)[] {
  return Object.keys(featureFlags).filter(key => 
    featureFlags[key as keyof FeatureFlags]
  ) as (keyof FeatureFlags)[];
}

/**
 * Get all disabled features
 */
export function getDisabledFeatures(): (keyof FeatureFlags)[] {
  return Object.keys(featureFlags).filter(key => 
    !featureFlags[key as keyof FeatureFlags]
  ) as (keyof FeatureFlags)[];
}

/**
 * Feature flag hook for React components
 */
export function useFeatureFlag(feature: keyof FeatureFlags): boolean {
  return isFeatureEnabled(feature);
}

/**
 * Higher-order component for conditional feature rendering
 */
export function withFeatureFlag<P extends object>(
  feature: keyof FeatureFlags,
  Component: React.ComponentType<P>,
  FallbackComponent?: React.ComponentType<P>
) {
  return function FeatureFlaggedComponent(props: P) {
    if (isFeatureEnabled(feature)) {
      return <Component {...props} />;
    }
    
    if (FallbackComponent) {
      return <FallbackComponent {...props} />;
    }
    
    return null;
  };
}

/**
 * Feature flag context for debugging
 */
export const FeatureFlagContext = React.createContext<{
  flags: FeatureFlags;
  isEnabled: (feature: keyof FeatureFlags) => boolean;
  enabledFeatures: (keyof FeatureFlags)[];
  disabledFeatures: (keyof FeatureFlags)[];
}>({
  flags: featureFlags,
  isEnabled: isFeatureEnabled,
  enabledFeatures: getEnabledFeatures(),
  disabledFeatures: getDisabledFeatures(),
});

/**
 * Feature flag provider component
 */
export function FeatureFlagProvider({ children }: { children: React.ReactNode }) {
  const contextValue = {
    flags: featureFlags,
    isEnabled: isFeatureEnabled,
    enabledFeatures: getEnabledFeatures(),
    disabledFeatures: getDisabledFeatures(),
  };
  
  return (
    <FeatureFlagContext.Provider value={contextValue}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

/**
 * Hook to access feature flag context
 */
export function useFeatureFlags() {
  return React.useContext(FeatureFlagContext);
}

/**
 * Development helper to log feature flags
 */
export function logFeatureFlags() {
  if (import.meta.env.DEV) {
    console.group('🚩 Feature Flags');
    console.log('Enabled:', getEnabledFeatures());
    console.log('Disabled:', getDisabledFeatures());
    console.log('All flags:', featureFlags);
    console.groupEnd();
  }
}

// Log feature flags in development
if (import.meta.env.DEV) {
  logFeatureFlags();
}