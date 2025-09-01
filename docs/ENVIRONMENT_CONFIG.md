# Environment Configuration Guide

This document describes the environment configuration system for the Astra content platform.

## Overview

The platform uses a unified environment configuration system that supports both `VITE_` and `NEXT_PUBLIC_` prefixes, with `NEXT_PUBLIC_` taking priority for compatibility across different build systems.

## Required Environment Variables

### API Configuration
- `NEXT_PUBLIC_API_BASE` / `VITE_API_BASE`: Base URL for API endpoints
- `NEXT_PUBLIC_WS_URL` / `VITE_WS_URL`: WebSocket server URL
- `NEXT_PUBLIC_CDN_BASE` / `VITE_CDN_BASE`: CDN base URL for static assets

### Content Discovery
- `NEXT_PUBLIC_DEFAULT_REGION` / `VITE_DEFAULT_REGION`: Default region for trending content (e.g., 'US', 'EU', 'APAC')

## Optional Environment Variables

### Upload Configuration
- `NEXT_PUBLIC_UPLOAD_TUS_ENDPOINT` / `VITE_UPLOAD_TUS_ENDPOINT`: TUS upload server endpoint
- `NEXT_PUBLIC_IPFS_GATEWAY` / `VITE_IPFS_GATEWAY`: IPFS gateway URL

### Feature Flags
- `NEXT_PUBLIC_FEATURE_FLAGS` / `VITE_FEATURE_FLAGS`: Comma-separated list of enabled features

### Adult Content & Compliance
- `NEXT_PUBLIC_ADULT` / `VITE_ADULT`: Enable adult content features (1 or 0)
- `NEXT_PUBLIC_AGE_GATE_TTL_DAYS` / `VITE_AGE_GATE_TTL_DAYS`: Age verification TTL in days (1-365)

### Live Streaming
- `NEXT_PUBLIC_LIVE_ENABLED` / `VITE_LIVE_ENABLED`: Enable live streaming features (1 or 0)

## Environment Files

### .env.example
Template file showing all available configuration options with example values.

### .env.local
Local development configuration. This file is gitignored and should contain your actual development values.

### .env
Production environment configuration (if used).

## Feature Flags

The platform supports comprehensive feature flag management for gradual rollouts and A/B testing.

### Available Features

#### Core Features
- `shorts`: Short-form video content
- `live`: Live streaming functionality
- `watermark`: Content watermarking
- `chat`: Real-time chat
- `tips`: Creator tipping system
- `wallet`: Integrated wallet functionality

#### Content Discovery Features
- `content-discovery`: Enhanced content discovery platform
- `trending-regional`: Regional trending content
- `infinite-scroll`: Infinite scroll for content feeds

#### Compliance Features
- `age-gate`: Age verification system
- `kyc`: Know Your Customer verification
- `geo`: Geographic content restrictions

#### Beta Features
- `analytics`: Advanced analytics dashboard
- `beta-ai-recommendations`: AI-powered content recommendations

### Feature Flag Configuration

Features can be configured with:
- **enabled**: Base enabled/disabled state
- **rolloutPercentage**: Percentage of users who see the feature (0-100)
- **dependencies**: Other features that must be enabled
- **environments**: Which environments the feature is available in

### Usage Examples

```typescript
import { isFeatureEnabled, useFeature, FeatureFlag } from '@/lib/featureConfig';

// Check if feature is enabled
if (isFeatureEnabled('shorts', userId)) {
  // Show shorts functionality
}

// React hook
const { enabled, config } = useFeature('live', userId);

// React component
<FeatureFlag feature="tips" userId={userId}>
  <TipButton />
</FeatureFlag>
```

## Validation

### Automatic Validation
The system automatically validates configuration on startup and logs warnings for:
- Missing required variables
- Invalid URL formats
- Invalid age gate configuration
- Unknown feature flags
- Inconsistent VITE_/NEXT_PUBLIC_ values

### Manual Validation
Run the validation script to check your configuration:

```bash
npm run validate:env
```

### Testing Configuration
Test your environment configuration:

```bash
npm run test:env
```

## Development Tools

### Feature Flag Debugging
In development mode, feature flags are logged to the console and debugging utilities are available:

```javascript
// Available in browser console during development
featureDevUtils.logFeatures(userId);
featureDevUtils.overrideFeature('shorts', false);
featureDevUtils.resetOverrides();
```

### Environment Debugging
Environment configuration is logged in development mode with details about:
- Loaded configuration values
- Available environment variables
- Validation results

## Best Practices

### 1. Use NEXT_PUBLIC_ Prefix
Always use `NEXT_PUBLIC_` prefix for new variables to ensure compatibility.

### 2. Provide Fallbacks
The system provides sensible defaults, but always specify values in your environment files.

### 3. Validate Configuration
Run `npm run validate:env` before deploying to catch configuration issues early.

### 4. Feature Flag Hygiene
- Remove unused feature flags regularly
- Document feature flag purposes
- Use gradual rollouts for new features
- Test feature flag combinations

### 5. Security Considerations
- Never put sensitive data in client-side environment variables
- Use server-side configuration for secrets
- Validate all environment inputs

## Troubleshooting

### Common Issues

#### 1. Feature Not Working
- Check if feature flag is enabled
- Verify feature dependencies are met
- Ensure feature is available in current environment
- Check rollout percentage for your user

#### 2. API Calls Failing
- Verify `NEXT_PUBLIC_API_BASE` is set correctly
- Check network connectivity to API server
- Validate URL format in configuration

#### 3. Age Gate Not Working
- Ensure `NEXT_PUBLIC_ADULT=1` is set
- Verify `NEXT_PUBLIC_AGE_GATE_TTL_DAYS` is between 1-365
- Check browser localStorage for existing consent

#### 4. Environment Variables Not Loading
- Ensure variables start with `VITE_` or `NEXT_PUBLIC_`
- Check .env file syntax (no spaces around =)
- Restart development server after changes
- Verify file is not gitignored

### Debug Commands

```bash
# Validate environment configuration
npm run validate:env

# Test environment loading
npm run test:env

# Run all tests including environment
npm run test:all
```

## Migration Guide

### From Legacy Configuration
If migrating from older configuration systems:

1. Update variable names to use `NEXT_PUBLIC_` prefix
2. Move feature flags to `NEXT_PUBLIC_FEATURE_FLAGS`
3. Update imports to use unified `ENV` object
4. Run validation to ensure compatibility

### Example Migration
```bash
# Old
REACT_APP_API_URL=http://localhost:3001
REACT_APP_FEATURES=shorts,live

# New
NEXT_PUBLIC_API_BASE=http://localhost:3001/api
NEXT_PUBLIC_FEATURE_FLAGS=shorts,live
```

## Support

For configuration issues:
1. Check this documentation
2. Run validation scripts
3. Check console logs in development
4. Review environment file syntax
5. Verify network connectivity for external services