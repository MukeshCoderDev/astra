/**
 * Comprehensive Feature Configuration System
 * Integrates with environment variables and provides gradual rollout capabilities
 */

import { ENV, hasFeature } from './env';

export interface FeatureConfig {
  enabled: boolean;
  rolloutPercentage: number;
  dependencies?: string[];
  description?: string;
  environments?: ('development' | 'staging' | 'production')[];
}

/**
 * Feature configuration registry
 * Defines all available features with their configuration
 */
export const FEATURE_REGISTRY: Record<string, FeatureConfig> = {
  // Core features
  shorts: {
    enabled: hasFeature('shorts'),
    rolloutPercentage: 100,
    description: 'Short-form video content',
    environments: ['development', 'staging', 'production'],
  },
  
  live: {
    enabled: hasFeature('live'),
    rolloutPercentage: 100,
    description: 'Live streaming functionality',
    dependencies: ['chat'],
    environments: ['development', 'staging', 'production'],
  },
  
  watermark: {
    enabled: hasFeature('watermark'),
    rolloutPercentage: 100,
    description: 'Content watermarking',
    environments: ['staging', 'production'],
  },
  
  // Content discovery features
  'content-discovery': {
    enabled: true,
    rolloutPercentage: 100,
    description: 'Enhanced content discovery platform',
    environments: ['development', 'staging', 'production'],
  },
  
  'trending-regional': {
    enabled: true,
    rolloutPercentage: 100,
    description: 'Regional trending content',
    dependencies: ['content-discovery'],
    environments: ['development', 'staging', 'production'],
  },
  
  'infinite-scroll': {
    enabled: true,
    rolloutPercentage: 100,
    description: 'Infinite scroll for content feeds',
    dependencies: ['content-discovery'],
    environments: ['development', 'staging', 'production'],
  },
  
  // User features
  chat: {
    enabled: hasFeature('chat'),
    rolloutPercentage: 100,
    description: 'Real-time chat functionality',
    environments: ['development', 'staging', 'production'],
  },
  
  tips: {
    enabled: hasFeature('tips'),
    rolloutPercentage: 75,
    description: 'Creator tipping system',
    dependencies: ['wallet'],
    environments: ['staging', 'production'],
  },
  
  wallet: {
    enabled: hasFeature('wallet'),
    rolloutPercentage: 50,
    description: 'Integrated wallet functionality',
    environments: ['development', 'staging'],
  },
  
  // Compliance features
  'age-gate': {
    enabled: ENV.ADULT,
    rolloutPercentage: 100,
    description: 'Age verification system',
    environments: ['development', 'staging', 'production'],
  },
  
  kyc: {
    enabled: hasFeature('kyc'),
    rolloutPercentage: 100,
    description: 'Know Your Customer verification',
    dependencies: ['age-gate'],
    environments: ['staging', 'production'],
  },
  
  'geo-blocking': {
    enabled: hasFeature('geo'),
    rolloutPercentage: 100,
    description: 'Geographic content restrictions',
    environments: ['staging', 'production'],
  },
  
  // Beta features
  'beta-analytics': {
    enabled: hasFeature('analytics'),
    rolloutPercentage: 25,
    description: 'Advanced analytics dashboard',
    environments: ['development', 'staging'],
  },
  
  'beta-ai-recommendations': {
    enabled: false,
    rolloutPercentage: 10,
    description: 'AI-powered content recommendations',
    dependencies: ['content-discovery'],
    environments: ['development'],
  },
};

/**
 * Get current environment
 */
function getCurrentEnvironment(): 'development' | 'staging' | 'production' {
  if (typeof process !== 'undefined' && process.env.NODE_ENV) {
    return process.env.NODE_ENV as 'development' | 'staging' | 'production';
  }
  
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    if (import.meta.env.DEV) return 'development';
    if (import.meta.env.PROD) return 'production';
  }
  
  return 'development';
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(featureName: string, userId?: string): boolean {
  const config = FEATURE_REGISTRY[featureName];
  
  if (!config) {
    console.warn(`Unknown feature: ${featureName}`);
    return false;
  }
  
  // Check if feature is enabled in current environment
  const currentEnv = getCurrentEnvironment();
  if (config.environments && !config.environments.includes(currentEnv)) {
    return false;
  }
  
  // Check base enabled flag
  if (!config.enabled) {
    return false;
  }
  
  // Check dependencies
  if (config.dependencies) {
    for (const dependency of config.dependencies) {
      if (!isFeatureEnabled(dependency, userId)) {
        return false;
      }
    }
  }
  
  // Check rollout percentage
  if (config.rolloutPercentage < 100 && userId) {
    const hash = userId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const userPercentage = Math.abs(hash) % 100;
    
    if (userPercentage >= config.rolloutPercentage) {
      return false;
    }
  }
  
  return true;
}

/**
 * Get feature configuration
 */
export function getFeatureConfig(featureName: string): FeatureConfig | null {
  return FEATURE_REGISTRY[featureName] || null;
}

/**
 * Get all enabled features for a user
 */
export function getEnabledFeatures(userId?: string): string[] {
  return Object.keys(FEATURE_REGISTRY).filter(feature => 
    isFeatureEnabled(feature, userId)
  );
}

/**
 * Get feature rollout status
 */
export function getFeatureRolloutStatus(): Record<string, {
  enabled: boolean;
  rolloutPercentage: number;
  environment: string;
  dependencies: string[];
}> {
  const currentEnv = getCurrentEnvironment();
  const status: Record<string, any> = {};
  
  Object.entries(FEATURE_REGISTRY).forEach(([name, config]) => {
    status[name] = {
      enabled: config.enabled,
      rolloutPercentage: config.rolloutPercentage,
      environment: currentEnv,
      dependencies: config.dependencies || [],
      availableInCurrentEnv: !config.environments || config.environments.includes(currentEnv),
    };
  });
  
  return status;
}

/**
 * Feature flag hook for React components
 */
export function useFeature(featureName: string, userId?: string): {
  enabled: boolean;
  config: FeatureConfig | null;
  loading: boolean;
} {
  // In a real implementation, this might fetch feature flags from an API
  // For now, we'll use the static configuration
  
  return {
    enabled: isFeatureEnabled(featureName, userId),
    config: getFeatureConfig(featureName),
    loading: false,
  };
}

/**
 * Feature flag component for conditional rendering
 */
export function FeatureFlag({ 
  feature, 
  userId, 
  children, 
  fallback 
}: {
  feature: string;
  userId?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { enabled } = useFeature(feature, userId);
  
  if (enabled) {
    return <>{children}</>;
  }
  
  return <>{fallback || null}</>;
}

/**
 * Development utilities
 */
export const featureDevUtils = {
  // Log all feature flags
  logFeatures: (userId?: string) => {
    if (getCurrentEnvironment() === 'development') {
      console.group('🚩 Feature Flags Status');
      
      const enabled = getEnabledFeatures(userId);
      const disabled = Object.keys(FEATURE_REGISTRY).filter(f => !enabled.includes(f));
      
      console.log('✅ Enabled:', enabled);
      console.log('❌ Disabled:', disabled);
      console.log('📊 Rollout Status:', getFeatureRolloutStatus());
      
      console.groupEnd();
    }
  },
  
  // Override feature for testing
  overrideFeature: (featureName: string, enabled: boolean) => {
    if (getCurrentEnvironment() === 'development') {
      const config = FEATURE_REGISTRY[featureName];
      if (config) {
        config.enabled = enabled;
        console.log(`🔧 Feature override: ${featureName} = ${enabled}`);
      }
    }
  },
  
  // Reset all overrides
  resetOverrides: () => {
    if (getCurrentEnvironment() === 'development') {
      // Re-initialize from environment
      Object.keys(FEATURE_REGISTRY).forEach(feature => {
        const config = FEATURE_REGISTRY[feature];
        if (config && hasFeature(feature)) {
          config.enabled = hasFeature(feature);
        }
      });
      console.log('🔄 Feature overrides reset');
    }
  },
};

// Log features in development
if (getCurrentEnvironment() === 'development') {
  featureDevUtils.logFeatures();
}

// Export for global access in development
if (typeof window !== 'undefined' && getCurrentEnvironment() === 'development') {
  (window as any).featureDevUtils = featureDevUtils;
}