# Deployment Guide

This document provides comprehensive instructions for deploying the Web3 Content Platform Frontend to various hosting platforms.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Git
- Platform-specific CLI tools (optional)

### Basic Deployment
```bash
# Install dependencies
npm ci

# Run tests
npm run test:all:required

# Build for production
npm run build

# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:prod
```

## 🏗️ Build Configuration

### Environment Variables

Create environment files for different stages:

#### `.env.development`
```env
REACT_APP_API_BASE=http://localhost:3000
REACT_APP_WS_URL=ws://localhost:3001
REACT_APP_FEATURE_FLAGS=all
REACT_APP_ANALYTICS=false
REACT_APP_SERVICE_WORKER=false
REACT_APP_ADULT=1
REACT_APP_AGE_GATE_TTL_DAYS=90
```

#### `.env.staging`
```env
REACT_APP_API_BASE=https://api-staging.web3platform.com
REACT_APP_WS_URL=wss://ws-staging.web3platform.com
REACT_APP_FEATURE_FLAGS=shorts,watermark,adultContent,ageGate,kyc,geoBlocking,escrow,analytics,notifications,chat,tips,uploads,profiles,search,comments,reports,studio,wallet
REACT_APP_ANALYTICS=true
REACT_APP_SERVICE_WORKER=true
REACT_APP_ADULT=1
REACT_APP_AGE_GATE_TTL_DAYS=90
REACT_APP_KYC_PROVIDER_URL=https://kyc-staging.example.com
REACT_APP_GEO_BLOCK_API=https://geo-staging.example.com
REACT_APP_WATERMARK_ENDPOINT=https://watermark-staging.example.com
```

#### `.env.production`
```env
REACT_APP_API_BASE=https://api.web3platform.com
REACT_APP_WS_URL=wss://ws.web3platform.com
REACT_APP_FEATURE_FLAGS=shorts,live,watermark,adultContent,ageGate,kyc,geoBlocking,escrow,analytics,notifications,chat,tips,uploads,profiles,search,comments,reports,studio,wallet
REACT_APP_ANALYTICS=true
REACT_APP_SERVICE_WORKER=true
REACT_APP_ADULT=1
REACT_APP_AGE_GATE_TTL_DAYS=90
REACT_APP_KYC_PROVIDER_URL=https://kyc.example.com
REACT_APP_GEO_BLOCK_API=https://geo.example.com
REACT_APP_WATERMARK_ENDPOINT=https://watermark.example.com
REACT_APP_COMPLIANCE_REGION=US
```

### Feature Flags

Control feature availability using the `REACT_APP_FEATURE_FLAGS` environment variable:

- `all` - Enable all features
- `none` - Disable all features
- Specific flags: `shorts,live,watermark,adultContent,ageGate,kyc,geoBlocking,escrow,analytics,notifications,chat,tips,uploads,profiles,search,comments,reports,studio,wallet`
- Disable specific features: `all,!live` (all except live streaming)

## 🌐 Platform-Specific Deployment

### Vercel

#### Automatic Deployment
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

#### Manual Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
npm run deploy:staging

# Deploy to production
npm run deploy:prod
```

#### Vercel Configuration (`vercel.json`)
```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm ci",
  "devCommand": "npm run dev",
  "functions": {
    "api/**/*.js": {
      "runtime": "nodejs18.x"
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://api.web3platform.com/:path*"
    }
  ]
}
```

### Netlify

#### Automatic Deployment
1. Connect repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Configure environment variables

#### Manual Deployment
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy to staging
netlify deploy --dir=dist

# Deploy to production
npm run deploy:netlify
```

#### Netlify Configuration (`netlify.toml`)
```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  REACT_APP_API_BASE = "https://api.web3platform.com"
  REACT_APP_WS_URL = "wss://ws.web3platform.com"
  REACT_APP_FEATURE_FLAGS = "all"
  REACT_APP_ANALYTICS = "true"

[[redirects]]
  from = "/api/*"
  to = "https://api.web3platform.com/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

### AWS S3 + CloudFront

#### Prerequisites
- AWS CLI configured
- S3 bucket created
- CloudFront distribution set up

#### Deployment
```bash
# Deploy to AWS
npm run deploy:aws

# Or manually
aws s3 sync dist/ s3://your-bucket-name --delete
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

#### S3 Bucket Policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

### Docker Deployment

#### Dockerfile
```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Security headers
RUN echo 'add_header X-Frame-Options "DENY" always;' > /etc/nginx/conf.d/security.conf && \
    echo 'add_header X-Content-Type-Options "nosniff" always;' >> /etc/nginx/conf.d/security.conf && \
    echo 'add_header Referrer-Policy "strict-origin-when-cross-origin" always;' >> /etc/nginx/conf.d/security.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### Docker Compose
```yaml
version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "80:80"
    environment:
      - REACT_APP_API_BASE=https://api.web3platform.com
      - REACT_APP_WS_URL=wss://ws.web3platform.com
    restart: unless-stopped
```

## 🔧 CI/CD Pipeline

### GitHub Actions

#### `.github/workflows/deploy.yml`
```yaml
name: Deploy

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test:run
      - run: npm run build

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run deploy:staging
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}

  deploy-production:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:e2e
      - run: npm run deploy:prod
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

## 📊 Monitoring & Analytics

### Performance Monitoring

The application includes built-in performance monitoring:

- **Core Web Vitals**: FCP, LCP, CLS, FID, TTFB
- **Bundle Analysis**: Automatic bundle size tracking
- **Error Tracking**: Comprehensive error reporting
- **User Analytics**: Privacy-first user behavior tracking

### Health Checks

Monitor application health with these endpoints:

- `/health` - Basic health check
- `/api/monitoring/health` - Detailed health status
- Performance metrics available in browser console (development)

### Error Reporting

Errors are automatically reported to the monitoring service:

- JavaScript errors and unhandled rejections
- React component errors via Error Boundaries
- Performance issues (slow renders, memory leaks)
- User interaction tracking

## 🔒 Security Considerations

### Content Security Policy

The application implements strict CSP headers:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.web3platform.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; media-src 'self' https: blob:; connect-src 'self' https://api.web3platform.com wss://ws.web3platform.com; font-src 'self' https://fonts.gstatic.com; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self';
```

### Security Headers

Required security headers are automatically set:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### Adult Content Compliance

Special considerations for adult content platform:

- Age verification with persistent consent
- Geographic content blocking
- KYC verification for creators
- Content reporting and moderation
- Forensic watermarking
- Payment escrow compliance

## 🚨 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run type-check

# Run linting
npm run lint:fix
```

#### Performance Issues
```bash
# Analyze bundle size
npm run analyze

# Check for memory leaks
# Open browser dev tools > Performance tab
# Record and analyze performance profile
```

#### Deployment Failures
```bash
# Check environment variables
node -e "console.log(process.env)"

# Validate configuration
node scripts/deploy.js staging --validate

# Check deployment logs
# Platform-specific log viewing commands
```

### Debug Mode

Enable debug mode for detailed logging:

```bash
# Development
REACT_APP_DEBUG=true npm run dev

# Production debugging
REACT_APP_DEBUG=true npm run build
```

### Performance Debugging

Use the built-in performance monitor:

1. Open application in development mode
2. Performance monitor appears in bottom-right corner
3. Click to expand detailed metrics
4. Export performance report for analysis

## 📈 Optimization Checklist

### Pre-Deployment
- [ ] Run all tests (`npm run test:all`)
- [ ] Check bundle size (`npm run analyze`)
- [ ] Validate accessibility (`npm run test:e2e -- --grep accessibility`)
- [ ] Test on multiple browsers and devices
- [ ] Verify environment variables
- [ ] Check security headers
- [ ] Test offline functionality
- [ ] Validate performance metrics

### Post-Deployment
- [ ] Verify application loads correctly
- [ ] Test critical user flows
- [ ] Check error monitoring dashboard
- [ ] Validate analytics tracking
- [ ] Monitor performance metrics
- [ ] Test real-time features
- [ ] Verify compliance features (age gate, KYC, etc.)

## 📞 Support

For deployment issues:

1. Check this documentation
2. Review platform-specific logs
3. Check GitHub Issues
4. Contact development team

## 🔄 Rollback Procedures

### Vercel
```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]
```

### Netlify
```bash
# List deployments
netlify api listSiteDeploys --data '{"site_id": "YOUR_SITE_ID"}'

# Rollback via dashboard or API
```

### AWS
```bash
# Restore from backup
aws s3 sync s3://backup-bucket/ s3://production-bucket/

# Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id ID --paths "/*"
```

---

**Last Updated**: December 2024  
**Version**: 1.0.0