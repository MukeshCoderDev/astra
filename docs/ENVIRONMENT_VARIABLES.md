# Environment Variables Configuration

This document describes all environment variables used in the Web3 Content Platform, with special focus on the Shorts Player Patch features.

## Required Environment Variables

### API Configuration
- `REACT_APP_API_BASE` - Backend API base URL
  - **Required**: Yes
  - **Default**: `http://localhost:3001/api`
  - **Example**: `https://bff.example.com`

- `REACT_APP_WS_URL` - WebSocket server URL
  - **Required**: Yes
  - **Default**: `ws://localhost:3001`
  - **Example**: `wss://ws.example.com`

- `REACT_APP_CDN_BASE` - CDN base URL for media assets
  - **Required**: Yes
  - **Default**: `http://localhost:3001/cdn`
  - **Example**: `https://cdn.example.com`

### Upload Configuration
- `REACT_APP_UPLOAD_TUS_ENDPOINT` - TUS resumable upload endpoint
  - **Required**: Yes
  - **Default**: `http://localhost:3001/files/`
  - **Example**: `https://upload.example.com/files/`

## Shorts Player Patch Environment Variables

### Age Verification System
- `REACT_APP_ADULT` - Enable adult content age verification
  - **Required**: No
  - **Type**: Boolean (1/0)
  - **Default**: `0` (disabled)
  - **Values**: 
    - `1` - Enable age gate modal
    - `0` - Disable age gate modal
  - **Description**: When enabled, shows an 18+ age verification modal that blocks access until users confirm they are 18+

- `REACT_APP_AGE_GATE_TTL_DAYS` - Age verification consent duration
  - **Required**: No (when REACT_APP_ADULT is enabled)
  - **Type**: Number
  - **Default**: `90`
  - **Range**: 1-365 days
  - **Description**: Number of days to persist age verification consent in localStorage

### Feature Flags
- `REACT_APP_FEATURE_FLAGS` - Comma-separated list of enabled features
  - **Required**: No
  - **Default**: `shorts,live,watermark`
  - **Available Features**:
    - `shorts` - Enable shorts functionality
    - `live` - Enable live streaming
    - `watermark` - Enable video watermarking
  - **Example**: `shorts,live` (enables only shorts and live features)

## Optional Environment Variables

### IPFS Configuration
- `REACT_APP_IPFS_GATEWAY` - IPFS gateway URL
  - **Default**: `https://cloudflare-ipfs.com/ipfs/`

### Compliance Configuration
- `REACT_APP_KYC_PROVIDER_URL` - KYC provider API URL
  - **Default**: `https://kyc.example.com`

- `REACT_APP_GEO_BLOCK_API` - Geo-blocking service API URL
  - **Default**: `https://geo.example.com`

- `REACT_APP_WATERMARK_ENDPOINT` - Video watermarking service URL
  - **Default**: `https://watermark.example.com`

- `REACT_APP_COMPLIANCE_REGION` - Compliance region code
  - **Default**: `US`
  - **Values**: ISO country codes (US, EU, etc.)

## Environment Variable Validation

The application includes built-in validation for environment variables:

1. **Required Variables**: Missing required variables will show console warnings
2. **Age Gate Validation**: TTL days must be between 1-365 when adult content is enabled
3. **Feature Flag Validation**: Invalid feature flags are filtered out automatically

## Configuration Examples

### Development Environment (.env.local)
```bash
# API Configuration
REACT_APP_API_BASE=http://localhost:3001/api
REACT_APP_WS_URL=ws://localhost:3001
REACT_APP_CDN_BASE=http://localhost:3001/cdn

# Upload Configuration
REACT_APP_UPLOAD_TUS_ENDPOINT=http://localhost:3001/files/

# Age Verification (Development)
REACT_APP_ADULT=0
REACT_APP_AGE_GATE_TTL_DAYS=1

# Feature Flags
REACT_APP_FEATURE_FLAGS=shorts,live,watermark
```

### Production Environment
```bash
# API Configuration
REACT_APP_API_BASE=https://bff.example.com
REACT_APP_WS_URL=wss://ws.example.com
REACT_APP_CDN_BASE=https://cdn.example.com

# Upload Configuration
REACT_APP_UPLOAD_TUS_ENDPOINT=https://upload.example.com/files/

# Age Verification (Production)
REACT_APP_ADULT=1
REACT_APP_AGE_GATE_TTL_DAYS=90

# Feature Flags
REACT_APP_FEATURE_FLAGS=shorts,live,watermark

# Compliance
REACT_APP_KYC_PROVIDER_URL=https://kyc.example.com
REACT_APP_GEO_BLOCK_API=https://geo.example.com
REACT_APP_WATERMARK_ENDPOINT=https://watermark.example.com
REACT_APP_COMPLIANCE_REGION=US
```

### Testing Different Age Gate Configurations

#### Disabled Age Gate
```bash
REACT_APP_ADULT=0
# AGE_GATE_TTL_DAYS is ignored when ADULT=0
```

#### Short TTL for Testing
```bash
REACT_APP_ADULT=1
REACT_APP_AGE_GATE_TTL_DAYS=1  # 1 day for testing
```

#### Standard Production TTL
```bash
REACT_APP_ADULT=1
REACT_APP_AGE_GATE_TTL_DAYS=90  # 90 days standard
```

## Troubleshooting

### Age Gate Not Showing
1. Check `REACT_APP_ADULT=1` is set
2. Clear localStorage: `age_ack` and `age_ack_ts` keys
3. Verify environment variables are loaded correctly

### Age Gate Showing Too Frequently
1. Check `REACT_APP_AGE_GATE_TTL_DAYS` value
2. Verify localStorage timestamps are not corrupted
3. Check browser clock/timezone settings

### Feature Flags Not Working
1. Verify `REACT_APP_FEATURE_FLAGS` format (comma-separated, no spaces)
2. Check available feature names in `src/lib/env.ts`
3. Restart development server after changing environment variables

## Security Considerations

1. **Environment Variables**: Never commit actual `.env` files to version control
2. **Age Verification**: TTL should be reasonable (30-90 days) for compliance
3. **API Endpoints**: Use HTTPS in production environments
4. **Feature Flags**: Disable unused features to reduce attack surface

## Migration Notes

When updating from previous versions:
1. The age gate now uses centralized environment configuration
2. Environment variable names follow React naming conventions (`REACT_APP_` prefix)
3. Boolean values use `1/0` instead of `true/false` for consistency