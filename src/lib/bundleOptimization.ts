/**
 * Bundle optimization and analysis utilities
 */

// Dynamic imports for code splitting
export const lazyImports = {
  // Discovery pages
  subscriptions: () => import('../pages/Discovery/Subscriptions'),
  explore: () => import('../pages/Discovery/Explore'),
  trending: () => import('../pages/Discovery/Trending'),
  history: () => import('../pages/Discovery/History'),
  playlists: () => import('../pages/Discovery/Playlists'),
  playlistDetail: () => import('../pages/Discovery/PlaylistDetail'),
  playlistCreate: () => import('../pages/Discovery/PlaylistCreate'),
  yourVideos: () => import('../pages/Discovery/YourVideos'),
  watchLater: () => import('../pages/Discovery/WatchLater'),
  liked: () => import('../pages/Discovery/Liked'),
  downloads: () => import('../pages/Discovery/Downloads'),

  // Core pages
  home: () => import('../pages/Home/Home'),
  shorts: () => import('../pages/Shorts/Shorts'),
  watch: () => import('../pages/Watch/Watch'),
  upload: () => import('../pages/Upload/Upload'),
  wallet: () => import('../pages/Wallet/Wallet'),
  studio: () => import('../pages/Studio/Studio'),
  profile: () => import('../pages/Profile/Profile'),
  search: () => import('../pages/Search/Search'),

  // Live streaming
  liveHome: () => import('../pages/Live/LiveHome'),
  liveWatch: () => import('../pages/Live/LiveWatch'),

  // Heavy components
  videoPlayer: () => import('../components/player/VideoPlayer'),
  shortsPlayer: () => import('../components/player/ShortsPlayer'),
  livePlayer: () => import('../components/live/LivePlayer'),
  uploadDropzone: () => import('../components/upload/UploadDropzone'),
  
  // Analytics and monitoring (load only when needed)
  analytics: () => import('./analytics'),
  monitoring: () => import('./monitoring'),
  errorLogging: () => import('./errorLogging'),
};

// Preload critical resources
export function preloadCriticalResources() {
  // Preload fonts
  const fontLinks = [
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  ];

  fontLinks.forEach(href => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    document.head.appendChild(link);
  });

  // Preload critical images
  const criticalImages = [
    '/logo.svg',
  ];

  criticalImages.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  });
}

// Prefetch resources based on user behavior
export function prefetchBasedOnRoute(currentRoute: string) {
  const prefetchMap: Record<string, string[]> = {
    '/': ['subscriptions', 'explore', 'trending'], // From home, likely to go to discovery
    '/subscriptions': ['explore', 'trending', 'history'],
    '/explore': ['trending', 'subscriptions', 'watch'],
    '/trending': ['explore', 'subscriptions', 'watch'],
    '/watch': ['liked', 'watchLater', 'playlists'], // From watch, likely to interact
    '/shorts': ['explore', 'trending'], // From shorts, likely to explore more
    '/upload': ['yourVideos', 'studio'], // From upload, likely to manage content
  };

  const routesToPrefetch = prefetchMap[currentRoute] || [];
  
  routesToPrefetch.forEach(route => {
    if (route in lazyImports) {
      // Prefetch with low priority
      requestIdleCallback(() => {
        (lazyImports as any)[route]();
      });
    }
  });
}

// Monitor bundle sizes and performance
export class BundleAnalyzer {
  private loadTimes: Map<string, number> = new Map();
  private bundleSizes: Map<string, number> = new Map();

  trackChunkLoad(chunkName: string, startTime: number) {
    const loadTime = performance.now() - startTime;
    this.loadTimes.set(chunkName, loadTime);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`📦 Chunk loaded: ${chunkName} (${loadTime.toFixed(2)}ms)`);
    }
  }

  trackBundleSize(chunkName: string, size: number) {
    this.bundleSizes.set(chunkName, size);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Bundle size: ${chunkName} (${(size / 1024).toFixed(2)}KB)`);
    }
  }

  getPerformanceReport() {
    return {
      loadTimes: Object.fromEntries(this.loadTimes),
      bundleSizes: Object.fromEntries(this.bundleSizes),
      totalSize: Array.from(this.bundleSizes.values()).reduce((a, b) => a + b, 0),
      averageLoadTime: Array.from(this.loadTimes.values()).reduce((a, b) => a + b, 0) / this.loadTimes.size,
    };
  }

  identifySlowChunks(threshold: number = 1000) {
    const slowChunks: string[] = [];
    
    this.loadTimes.forEach((time, chunk) => {
      if (time > threshold) {
        slowChunks.push(chunk);
      }
    });
    
    return slowChunks;
  }

  identifyLargeChunks(threshold: number = 100 * 1024) { // 100KB
    const largeChunks: string[] = [];
    
    this.bundleSizes.forEach((size, chunk) => {
      if (size > threshold) {
        largeChunks.push(chunk);
      }
    });
    
    return largeChunks;
  }
}

export const bundleAnalyzer = new BundleAnalyzer();

// Resource hints for better loading
export function addResourceHints() {
  // DNS prefetch for external domains
  const externalDomains = [
    'fonts.googleapis.com',
    'fonts.gstatic.com',
  ];

  externalDomains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = `//${domain}`;
    document.head.appendChild(link);
  });

  // Preconnect to critical external resources
  const preconnectDomains = [
    'fonts.googleapis.com',
  ];

  preconnectDomains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = `https://${domain}`;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

// Optimize images with lazy loading and responsive sizes
export function optimizeImages() {
  // Add intersection observer for lazy loading
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01,
    });

    // Observe all images with data-src
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }
}

// Service Worker for caching optimization
export function optimizeServiceWorker() {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered:', registration);
        
        // Update available
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content available
                console.log('New content available, please refresh');
                
                // Optionally show update notification
                if (window.confirm('New version available. Refresh to update?')) {
                  window.location.reload();
                }
              }
            });
          }
        });
      })
      .catch(error => {
        console.log('SW registration failed:', error);
      });
  }
}

// Critical CSS inlining
export function inlineCriticalCSS() {
  // This would typically be done at build time
  // Here we can add runtime optimizations
  
  // Remove unused CSS classes (simplified example)
  const unusedSelectors = [
    '.unused-class',
    '.development-only',
  ];

  unusedSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => el.remove());
  });
}

// Performance budget monitoring
export class PerformanceBudget {
  private budgets = {
    totalJSSize: 500 * 1024, // 500KB
    totalCSSSize: 100 * 1024, // 100KB
    totalImageSize: 2 * 1024 * 1024, // 2MB
    firstContentfulPaint: 1500, // 1.5s
    largestContentfulPaint: 2500, // 2.5s
    cumulativeLayoutShift: 0.1,
  };

  checkBudgets() {
    const violations: string[] = [];

    // Check bundle sizes
    const report = bundleAnalyzer.getPerformanceReport();
    if (report.totalSize > this.budgets.totalJSSize) {
      violations.push(`JS bundle size exceeds budget: ${(report.totalSize / 1024).toFixed(2)}KB > ${(this.budgets.totalJSSize / 1024).toFixed(2)}KB`);
    }

    // Check performance metrics (would integrate with Web Vitals)
    // This is a simplified example
    
    if (violations.length > 0) {
      console.warn('Performance Budget Violations:', violations);
      
      // In production, send to monitoring
      if (process.env.NODE_ENV === 'production') {
        violations.forEach(violation => {
          // Send to analytics/monitoring service
          console.warn('Budget violation:', violation);
        });
      }
    }

    return violations;
  }
}

export const performanceBudget = new PerformanceBudget();

// Initialize all optimizations
export function initializeBundleOptimizations() {
  // Preload critical resources
  preloadCriticalResources();
  
  // Add resource hints
  addResourceHints();
  
  // Optimize images
  optimizeImages();
  
  // Optimize service worker
  optimizeServiceWorker();
  
  // Inline critical CSS
  inlineCriticalCSS();
  
  // Check performance budgets
  if (process.env.NODE_ENV === 'development') {
    setTimeout(() => {
      performanceBudget.checkBudgets();
    }, 5000);
  }
}

// Development helpers
if (process.env.NODE_ENV === 'development') {
  (window as any).bundleAnalyzer = bundleAnalyzer;
  (window as any).performanceBudget = performanceBudget;
  
  // Add keyboard shortcut for bundle analysis
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'B') {
      console.log('Bundle Analysis:', bundleAnalyzer.getPerformanceReport());
      console.log('Performance Budget:', performanceBudget.checkBudgets());
    }
  });
}