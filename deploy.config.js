/**
 * Deployment configuration for Web3 Content Platform Frontend
 * Supports multiple deployment targets and environments
 */

const deployConfig = {
  // Environment configurations
  environments: {
    development: {
      name: 'Development',
      url: 'http://localhost:5173',
      apiUrl: 'http://localhost:3000',
      wsUrl: 'ws://localhost:3001',
      features: 'all',
      analytics: false,
      serviceWorker: false,
    },
    staging: {
      name: 'Staging',
      url: 'https://staging.web3platform.com',
      apiUrl: 'https://api-staging.web3platform.com',
      wsUrl: 'wss://ws-staging.web3platform.com',
      features: 'all',
      analytics: true,
      serviceWorker: true,
    },
    production: {
      name: 'Production',
      url: 'https://web3platform.com',
      apiUrl: 'https://api.web3platform.com',
      wsUrl: 'wss://ws.web3platform.com',
      features: 'shorts,live,watermark,adultContent,ageGate,kyc,geoBlocking,escrow,analytics,notifications,chat,tips,uploads,profiles,search,comments,reports,studio,wallet',
      analytics: true,
      serviceWorker: true,
    },
  },

  // Build configurations
  build: {
    outputDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: true,
    target: 'esnext',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', 'lucide-react'],
          media: ['hls.js'],
          upload: ['tus-js-client', 'react-dropzone'],
          state: ['zustand', '@tanstack/react-query'],
        },
      },
    },
  },

  // CDN configuration
  cdn: {
    enabled: true,
    provider: 'cloudflare', // or 'aws', 'gcp'
    domain: 'cdn.web3platform.com',
    regions: ['us-east-1', 'eu-west-1', 'ap-southeast-1'],
    caching: {
      static: '1y',
      html: '1h',
      api: '5m',
    },
  },

  // Security headers
  security: {
    contentSecurityPolicy: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'", 'https://cdn.web3platform.com'],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'img-src': ["'self'", 'data:', 'https:', 'blob:'],
      'media-src': ["'self'", 'https:', 'blob:'],
      'connect-src': ["'self'", 'https://api.web3platform.com', 'wss://ws.web3platform.com'],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'frame-src': ["'none'"],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
    },
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    },
  },

  // Performance optimization
  performance: {
    budgets: {
      maximumFileSizeBudget: 1024 * 1024, // 1MB
      maximumChunkSizeBudget: 300 * 1024, // 300KB
    },
    compression: {
      gzip: true,
      brotli: true,
    },
    preload: [
      'fonts/inter-var.woff2',
      'icons/sprite.svg',
    ],
    prefetch: [
      '/api/videos/trending',
      '/api/user/profile',
    ],
  },

  // Monitoring and analytics
  monitoring: {
    sentry: {
      enabled: true,
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
    },
    analytics: {
      enabled: true,
      provider: 'privacy-first',
    },
    performance: {
      enabled: true,
      sampleRate: 0.1, // 10% sampling
    },
  },

  // Feature flags per environment
  featureFlags: {
    development: {
      all: true,
    },
    staging: {
      shorts: true,
      live: false, // Disabled in staging
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
    },
    production: {
      shorts: true,
      live: true,
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
    },
  },

  // Deployment targets
  targets: {
    vercel: {
      framework: 'vite',
      buildCommand: 'npm run build',
      outputDirectory: 'dist',
      installCommand: 'npm ci',
      devCommand: 'npm run dev',
      functions: {
        'api/**/*.js': {
          runtime: 'nodejs18.x',
        },
      },
      headers: [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'X-Frame-Options',
              value: 'DENY',
            },
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff',
            },
          ],
        },
      ],
      rewrites: [
        {
          source: '/api/:path*',
          destination: 'https://api.web3platform.com/:path*',
        },
      ],
    },
    netlify: {
      build: {
        command: 'npm run build',
        publish: 'dist',
      },
      redirects: [
        {
          from: '/api/*',
          to: 'https://api.web3platform.com/:splat',
          status: 200,
        },
        {
          from: '/*',
          to: '/index.html',
          status: 200,
        },
      ],
      headers: [
        {
          for: '/*',
          values: {
            'X-Frame-Options': 'DENY',
            'X-Content-Type-Options': 'nosniff',
          },
        },
      ],
    },
    aws: {
      s3: {
        bucket: 'web3platform-frontend',
        region: 'us-east-1',
      },
      cloudfront: {
        enabled: true,
        priceClass: 'PriceClass_100',
        cacheBehaviors: [
          {
            pathPattern: '/static/*',
            cachePolicyId: '4135ea2d-6df8-44a3-9df3-4b5a84be39ad', // CachingOptimized
          },
          {
            pathPattern: '/api/*',
            cachePolicyId: '4135ea2d-6df8-44a3-9df3-4b5a84be39ad', // CachingDisabled
            originRequestPolicyId: '88a5eaf4-2fd4-4709-b370-b4c650ea3fcf', // CORS-S3Origin
          },
        ],
      },
    },
  },
};

// Environment-specific configuration
function getConfig(environment = 'development') {
  const env = deployConfig.environments[environment];
  if (!env) {
    throw new Error(`Unknown environment: ${environment}`);
  }

  return {
    ...deployConfig,
    environment: env,
    featureFlags: deployConfig.featureFlags[environment] || deployConfig.featureFlags.development,
  };
}

// Export configuration
module.exports = {
  deployConfig,
  getConfig,
  
  // Helper functions
  generateEnvFile: (environment) => {
    const config = getConfig(environment);
    const env = config.environment;
    
    let envContent = `# Environment: ${env.name}\n`;
    envContent += `REACT_APP_API_BASE=${env.apiUrl}\n`;
    envContent += `REACT_APP_WS_URL=${env.wsUrl}\n`;
    envContent += `REACT_APP_FEATURE_FLAGS=${env.features}\n`;
    envContent += `REACT_APP_ANALYTICS=${env.analytics}\n`;
    envContent += `REACT_APP_SERVICE_WORKER=${env.serviceWorker}\n`;
    
    return envContent;
  },
  
  generateBuildCommand: (environment, target) => {
    const config = getConfig(environment);
    const targetConfig = config.targets[target];
    
    if (!targetConfig) {
      throw new Error(`Unknown target: ${target}`);
    }
    
    return targetConfig.buildCommand || 'npm run build';
  },
  
  validateConfig: (environment) => {
    const config = getConfig(environment);
    const errors = [];
    
    if (!config.environment.url) {
      errors.push('Missing environment URL');
    }
    
    if (!config.environment.apiUrl) {
      errors.push('Missing API URL');
    }
    
    if (config.environment.analytics && !config.monitoring.analytics.enabled) {
      errors.push('Analytics enabled but monitoring not configured');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  },
};