# Content Discovery Platform Deployment Guide

This guide covers the deployment of the Astra Content Discovery Platform across different environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Build Process](#build-process)
4. [Deployment Options](#deployment-options)
5. [Performance Optimization](#performance-optimization)
6. [Monitoring Setup](#monitoring-setup)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Memory**: 4GB RAM minimum for build process
- **Storage**: 2GB free space for dependencies and build artifacts

### Development Tools

```bash
# Install required tools
npm install -g typescript
npm install -g vite
npm install -g playwright
```

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd astra
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Copy environment configuration**
   ```bash
   cp .env.example .env.local
   ```

## Environment Configuration

### Required Environment Variables

Create appropriate `.env` files for each environment:

#### Development (`.env.local`)
```bash
# API Configuration
VITE_API_BASE=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001

# Feature Flags
VITE_LIVE_ENABLED=true
VITE_SHORTS_ENABLED=true
VITE_WALLET_ENABLED=true

# Regional Settings
VITE_DEFAULT_REGION=US

# Development Settings
VITE_DEBUG_MODE=true
VITE_MOCK_DATA=true
```

#### Staging (`.env.staging`)
```bash
# API Configuration
VITE_API_BASE=https://api-staging.astra.com/api
VITE_WS_URL=wss://api-staging.astra.com

# Feature Flags
VITE_LIVE_ENABLED=true
VITE_SHORTS_ENABLED=true
VITE_WALLET_ENABLED=false

# Regional Settings
VITE_DEFAULT_REGION=US

# Analytics
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx

# Development Settings
VITE_DEBUG_MODE=false
VITE_MOCK_DATA=false
```

#### Production (`.env.production`)
```bash
# API Configuration
VITE_API_BASE=https://api.astra.com/api
VITE_WS_URL=wss://api.astra.com

# Feature Flags
VITE_LIVE_ENABLED=true
VITE_SHORTS_ENABLED=true
VITE_WALLET_ENABLED=true

# Regional Settings
VITE_DEFAULT_REGION=US

# Analytics
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx

# Security
VITE_CSP_NONCE=<generated-nonce>

# Development Settings
VITE_DEBUG_MODE=false
VITE_MOCK_DATA=false
```

### Environment Variable Validation

The application includes automatic environment variable validation:

```bash
# Validate environment configuration
npm run validate:env
```

## Build Process

### Development Build

```bash
# Start development server
npm run dev

# Run with specific port
npm run dev -- --port 3000

# Run with host binding
npm run dev -- --host 0.0.0.0
```

### Production Build

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview

# Analyze bundle size
npm run analyze
```

### Build Optimization

The build process includes several optimizations:

1. **Code Splitting**: Automatic route-based splitting
2. **Tree Shaking**: Removes unused code
3. **Minification**: JavaScript and CSS minification
4. **Asset Optimization**: Image compression and format conversion
5. **Service Worker**: Automatic caching strategy

### Build Configuration

Key build settings in `vite.config.ts`:

```typescript
export default defineConfig({
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV !== 'production',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          discovery: [
            './src/pages/Discovery/Subscriptions',
            './src/pages/Discovery/Explore',
            './src/pages/Discovery/Trending'
          ]
        }
      }
    }
  }
});
```

## Deployment Options

### 1. Netlify Deployment

#### Automatic Deployment

1. **Connect Repository**
   - Link your Git repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `dist`

2. **Environment Variables**
   ```bash
   # In Netlify dashboard, add environment variables
   VITE_API_BASE=https://api.astra.com/api
   VITE_DEFAULT_REGION=US
   # ... other variables
   ```

3. **Build Settings**
   ```toml
   # netlify.toml
   [build]
     command = "npm run build"
     publish = "dist"
   
   [build.environment]
     NODE_VERSION = "18"
   
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   
   [[headers]]
     for = "/assets/*"
     [headers.values]
       Cache-Control = "public, max-age=31536000, immutable"
   ```

#### Manual Deployment

```bash
# Build and deploy to Netlify
npm run build
npx netlify deploy --prod --dir=dist
```

### 2. Vercel Deployment

#### Automatic Deployment

1. **Connect Repository**
   - Import project from Git
   - Framework preset: Vite
   - Build command: `npm run build`
   - Output directory: `dist`

2. **Configuration**
   ```json
   // vercel.json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "framework": "vite",
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ],
     "headers": [
       {
         "source": "/assets/(.*)",
         "headers": [
           {
             "key": "Cache-Control",
             "value": "public, max-age=31536000, immutable"
           }
         ]
       }
     ]
   }
   ```

#### Manual Deployment

```bash
# Deploy to Vercel
npm run build
npx vercel --prod
```

### 3. AWS S3 + CloudFront

#### S3 Setup

```bash
# Create S3 bucket
aws s3 mb s3://astra-frontend-prod

# Configure bucket for static website hosting
aws s3 website s3://astra-frontend-prod \
  --index-document index.html \
  --error-document index.html
```

#### CloudFront Distribution

```json
{
  "DistributionConfig": {
    "CallerReference": "astra-frontend-prod",
    "Origins": [{
      "Id": "S3-astra-frontend-prod",
      "DomainName": "astra-frontend-prod.s3.amazonaws.com",
      "S3OriginConfig": {
        "OriginAccessIdentity": ""
      }
    }],
    "DefaultCacheBehavior": {
      "TargetOriginId": "S3-astra-frontend-prod",
      "ViewerProtocolPolicy": "redirect-to-https",
      "CachePolicyId": "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"
    },
    "CustomErrorResponses": [{
      "ErrorCode": 404,
      "ResponseCode": 200,
      "ResponsePagePath": "/index.html"
    }]
  }
}
```

#### Deployment Script

```bash
#!/bin/bash
# deploy-aws.sh

# Build the application
npm run build

# Sync to S3
aws s3 sync dist/ s3://astra-frontend-prod --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E1234567890123 \
  --paths "/*"
```

### 4. Docker Deployment

#### Dockerfile

```dockerfile
# Multi-stage build
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

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Nginx Configuration

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Gzip compression
        gzip on;
        gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

        # Cache static assets
        location /assets/ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # SPA routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    }
}
```

#### Docker Commands

```bash
# Build image
docker build -t astra-frontend .

# Run container
docker run -p 80:80 astra-frontend

# Docker Compose
docker-compose up -d
```

## Performance Optimization

### Build Optimizations

1. **Bundle Analysis**
   ```bash
   npm run analyze
   ```

2. **Code Splitting Configuration**
   ```typescript
   // vite.config.ts
   build: {
     rollupOptions: {
       output: {
         manualChunks(id) {
           if (id.includes('node_modules')) {
             return 'vendor';
           }
           if (id.includes('src/pages/Discovery')) {
             return 'discovery';
           }
         }
       }
     }
   }
   ```

### Runtime Optimizations

1. **Service Worker Caching**
   - Automatic caching of static assets
   - Runtime caching for API responses
   - Background sync for offline functionality

2. **Image Optimization**
   - Lazy loading for all images
   - WebP format with fallbacks
   - Responsive image sizes

3. **Performance Monitoring**
   - Web Vitals tracking
   - Bundle size monitoring
   - Runtime performance metrics

### CDN Configuration

```javascript
// Configure CDN for static assets
const CDN_BASE = 'https://cdn.astra.com';

// Update asset URLs in production
if (process.env.NODE_ENV === 'production') {
  // Configure asset base URL
  __vite__mapDeps = (indexes) => {
    return indexes.map(i => `${CDN_BASE}/assets/${__vite__assetsMap[i]}`);
  };
}
```

## Monitoring Setup

### Analytics Integration

1. **Google Analytics 4**
   ```typescript
   // src/lib/analytics.tsx
   gtag('config', 'GA_MEASUREMENT_ID', {
     page_title: document.title,
     page_location: window.location.href
   });
   ```

2. **Custom Events**
   ```typescript
   // Track content discovery events
   trackEvent('content_discovery', {
     action: 'video_play',
     video_id: videoId,
     source: 'explore_page'
   });
   ```

### Error Monitoring

1. **Sentry Integration**
   ```typescript
   import * as Sentry from '@sentry/react';
   
   Sentry.init({
     dsn: process.env.VITE_SENTRY_DSN,
     environment: process.env.NODE_ENV,
     tracesSampleRate: 0.1
   });
   ```

2. **Custom Error Tracking**
   ```typescript
   // Log application errors
   errorLogger.logApiError(endpoint, method, status, error);
   ```

### Performance Monitoring

1. **Web Vitals**
   ```typescript
   import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';
   
   getCLS(console.log);
   getFID(console.log);
   getFCP(console.log);
   getLCP(console.log);
   getTTFB(console.log);
   ```

2. **Custom Metrics**
   ```typescript
   // Track bundle load times
   bundleAnalyzer.trackChunkLoad('discovery', startTime);
   ```

## Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   
   # Check TypeScript errors
   npm run type-check
   ```

2. **Environment Variable Issues**
   ```bash
   # Validate environment configuration
   npm run validate:env
   
   # Check variable loading
   console.log(import.meta.env);
   ```

3. **Routing Issues**
   ```bash
   # Ensure SPA routing is configured
   # Check server configuration for fallback to index.html
   ```

4. **Performance Issues**
   ```bash
   # Analyze bundle size
   npm run analyze
   
   # Check performance budget
   npm run test:performance
   ```

### Debug Mode

Enable debug mode for troubleshooting:

```bash
# Set debug environment variable
VITE_DEBUG_MODE=true npm run dev
```

Debug features include:
- Console logging for all API calls
- Performance metrics display
- Error boundary information
- Bundle analysis tools

### Health Checks

```bash
# Run all tests
npm run test:all

# Check environment configuration
npm run test:env

# Validate accessibility
npm run test:accessibility

# Performance tests
npm run test:performance
```

## Security Considerations

### Content Security Policy

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' https://www.googletagmanager.com;
               style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
               font-src 'self' https://fonts.gstatic.com;
               img-src 'self' data: https:;
               connect-src 'self' https://api.astra.com wss://api.astra.com;">
```

### Environment Security

1. **Sensitive Variables**
   - Never commit `.env` files
   - Use secure environment variable management
   - Rotate API keys regularly

2. **Build Security**
   - Audit dependencies regularly: `npm audit`
   - Use lock files: `package-lock.json`
   - Validate build integrity

### HTTPS Configuration

Ensure all deployments use HTTPS:
- Configure SSL certificates
- Enable HSTS headers
- Redirect HTTP to HTTPS

## Maintenance

### Regular Tasks

1. **Dependency Updates**
   ```bash
   # Check for updates
   npm outdated
   
   # Update dependencies
   npm update
   
   # Security updates
   npm audit fix
   ```

2. **Performance Monitoring**
   - Review Web Vitals metrics weekly
   - Monitor bundle size growth
   - Check error rates and performance budgets

3. **Security Audits**
   - Run security scans monthly
   - Review access logs
   - Update security headers

### Backup and Recovery

1. **Source Code**
   - Maintain Git repository backups
   - Tag releases for rollback capability

2. **Configuration**
   - Backup environment configurations
   - Document deployment procedures

3. **Monitoring Data**
   - Export analytics data regularly
   - Maintain error logs for analysis

## Support

For deployment issues:

1. Check this documentation
2. Review error logs and monitoring data
3. Run diagnostic scripts: `npm run test:all`
4. Contact the development team with:
   - Environment details
   - Error messages
   - Steps to reproduce
   - Browser and system information