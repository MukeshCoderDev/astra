/**
 * Cross-browser compatibility tests
 */

import { test, expect, devices } from '@playwright/test';

// Test configurations for different browsers and devices
const testConfigs = [
  { name: 'Desktop Chrome', ...devices['Desktop Chrome'] },
  { name: 'Desktop Firefox', ...devices['Desktop Firefox'] },
  { name: 'Desktop Safari', ...devices['Desktop Safari'] },
  { name: 'Mobile Chrome', ...devices['Pixel 5'] },
  { name: 'Mobile Safari', ...devices['iPhone 12'] },
  { name: 'Tablet', ...devices['iPad Pro'] },
];

testConfigs.forEach(config => {
  test.describe(`Cross-browser tests - ${config.name}`, () => {
    test.use(config);

    test('should load homepage correctly', async ({ page }) => {
      await page.goto('/');
      
      // Check basic page structure
      await expect(page.locator('header')).toBeVisible();
      await expect(page.locator('nav')).toBeVisible();
      await expect(page.locator('main')).toBeVisible();
      
      // Check logo and navigation
      await expect(page.locator('text=Astra')).toBeVisible();
      await expect(page.locator('text=Home')).toBeVisible();
      
      // Check responsive behavior
      const viewport = page.viewportSize();
      if (viewport && viewport.width < 768) {
        // Mobile: check mobile navigation
        await expect(page.locator('[aria-label="Toggle navigation menu"]')).toBeVisible();
      } else {
        // Desktop: check sidebar navigation
        await expect(page.locator('aside')).toBeVisible();
      }
    });

    test('should navigate to discovery pages', async ({ page }) => {
      await page.goto('/');
      
      // Test navigation to each discovery page
      const discoveryPages = [
        { name: 'Subscriptions', path: '/subscriptions' },
        { name: 'Explore', path: '/explore' },
        { name: 'Trending', path: '/trending' },
        { name: 'History', path: '/history' },
        { name: 'Playlists', path: '/playlists' },
      ];

      for (const discoveryPage of discoveryPages) {
        await page.goto(discoveryPage.path);
        
        // Check page loads without errors
        await expect(page.locator('h1')).toContainText(discoveryPage.name);
        
        // Check for error states
        await expect(page.locator('text=Error')).not.toBeVisible();
        await expect(page.locator('text=Failed')).not.toBeVisible();
        
        // Wait for content to load
        await page.waitForLoadState('networkidle');
      }
    });

    test('should handle video card interactions', async ({ page }) => {
      await page.goto('/explore');
      
      // Wait for video cards to load
      await page.waitForSelector('[role="article"]', { timeout: 10000 });
      
      const videoCards = page.locator('[role="article"]');
      const firstCard = videoCards.first();
      
      // Check video card structure
      await expect(firstCard).toBeVisible();
      await expect(firstCard.locator('img')).toBeVisible();
      await expect(firstCard.locator('h3')).toBeVisible();
      
      // Test hover interactions (desktop only)
      if (config.name.includes('Desktop')) {
        await firstCard.hover();
        // Check for hover effects
        await expect(firstCard.locator('[aria-label="Play video"]')).toBeVisible();
      }
      
      // Test keyboard navigation
      await firstCard.focus();
      await expect(firstCard).toBeFocused();
      
      // Test click interaction
      await firstCard.click();
      
      // Should navigate to video page or show video
      await page.waitForURL(/\/watch\/.*/, { timeout: 5000 });
    });

    test('should handle search functionality', async ({ page }) => {
      await page.goto('/');
      
      const viewport = page.viewportSize();
      if (viewport && viewport.width < 768) {
        // Mobile: navigate to search page
        await page.click('[aria-label="Go to search page"]');
        await expect(page).toHaveURL('/search');
      } else {
        // Desktop: use header search
        const searchInput = page.locator('#search');
        await expect(searchInput).toBeVisible();
        
        await searchInput.fill('test query');
        await page.keyboard.press('Enter');
        
        // Should navigate to search results
        await expect(page).toHaveURL(/\/search\?q=test%20query/);
      }
    });

    test('should handle filter interactions', async ({ page }) => {
      await page.goto('/explore');
      
      // Wait for filter chips to load
      await page.waitForSelector('[role="tablist"]', { timeout: 10000 });
      
      const filterChips = page.locator('[role="tab"]');
      await expect(filterChips).toHaveCount.greaterThan(1);
      
      // Test filter selection
      const secondFilter = filterChips.nth(1);
      await secondFilter.click();
      
      // Check active state
      await expect(secondFilter).toHaveAttribute('aria-selected', 'true');
      
      // Test keyboard navigation
      await secondFilter.press('ArrowRight');
      const thirdFilter = filterChips.nth(2);
      await expect(thirdFilter).toHaveAttribute('aria-selected', 'true');
    });

    test('should handle infinite scroll', async ({ page }) => {
      await page.goto('/explore');
      
      // Wait for initial content
      await page.waitForSelector('[role="feed"]', { timeout: 10000 });
      
      const initialCards = await page.locator('[role="article"]').count();
      expect(initialCards).toBeGreaterThan(0);
      
      // Scroll to bottom to trigger infinite scroll
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      
      // Wait for more content to load
      await page.waitForTimeout(2000);
      
      const newCards = await page.locator('[role="article"]').count();
      expect(newCards).toBeGreaterThanOrEqual(initialCards);
    });

    test('should handle error states gracefully', async ({ page }) => {
      // Test with network failures
      await page.route('**/api/**', route => route.abort());
      
      await page.goto('/explore');
      
      // Should show error state or fallback content
      const errorElements = page.locator('text=Error, text=Failed, text=Try again');
      const fallbackContent = page.locator('text=No videos found');
      
      // Either error state or fallback should be visible
      await expect(errorElements.or(fallbackContent)).toBeVisible();
    });

    test('should be accessible', async ({ page }) => {
      await page.goto('/');
      
      // Test keyboard navigation
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();
      
      // Test skip links
      await page.keyboard.press('Tab');
      const skipLink = page.locator('text=Skip to main content');
      if (await skipLink.isVisible()) {
        await skipLink.click();
        await expect(page.locator('#main-content, main')).toBeFocused();
      }
      
      // Check ARIA attributes
      const navigation = page.locator('[role="navigation"]');
      await expect(navigation).toBeVisible();
      
      const main = page.locator('[role="main"], main');
      await expect(main).toBeVisible();
    });

    test('should handle theme switching', async ({ page }) => {
      await page.goto('/');
      
      // Find theme toggle button
      const themeToggle = page.locator('[aria-label*="theme"], [aria-label*="Theme"]');
      
      if (await themeToggle.isVisible()) {
        // Get initial theme
        const initialTheme = await page.evaluate(() => 
          document.documentElement.classList.contains('dark') ? 'dark' : 'light'
        );
        
        // Toggle theme
        await themeToggle.click();
        
        // Check theme changed
        const newTheme = await page.evaluate(() => 
          document.documentElement.classList.contains('dark') ? 'dark' : 'light'
        );
        
        expect(newTheme).not.toBe(initialTheme);
      }
    });

    test('should handle responsive design', async ({ page }) => {
      const viewport = page.viewportSize();
      
      if (viewport) {
        await page.goto('/');
        
        if (viewport.width < 768) {
          // Mobile tests
          await expect(page.locator('[aria-label="Toggle navigation menu"]')).toBeVisible();
          await expect(page.locator('aside')).not.toBeVisible();
          
          // Test mobile menu
          await page.click('[aria-label="Toggle navigation menu"]');
          await expect(page.locator('aside')).toBeVisible();
          
        } else {
          // Desktop tests
          await expect(page.locator('aside')).toBeVisible();
          await expect(page.locator('[aria-label="Toggle navigation menu"]')).not.toBeVisible();
        }
        
        // Test video grid responsiveness
        await page.goto('/explore');
        await page.waitForSelector('[role="feed"]');
        
        const grid = page.locator('[role="feed"] > div').first();
        const gridColumns = await grid.evaluate(el => 
          window.getComputedStyle(el).gridTemplateColumns.split(' ').length
        );
        
        // Check appropriate number of columns for viewport
        if (viewport.width < 640) {
          expect(gridColumns).toBeLessThanOrEqual(2);
        } else if (viewport.width < 1024) {
          expect(gridColumns).toBeLessThanOrEqual(3);
        } else {
          expect(gridColumns).toBeGreaterThanOrEqual(3);
        }
      }
    });

    test('should handle performance requirements', async ({ page }) => {
      // Start performance monitoring
      await page.goto('/', { waitUntil: 'networkidle' });
      
      // Measure page load performance
      const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
          loadComplete: navigation.loadEventEnd - navigation.navigationStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
        };
      });
      
      // Performance assertions (adjust thresholds as needed)
      expect(performanceMetrics.domContentLoaded).toBeLessThan(3000); // 3 seconds
      expect(performanceMetrics.loadComplete).toBeLessThan(5000); // 5 seconds
      
      if (performanceMetrics.firstContentfulPaint > 0) {
        expect(performanceMetrics.firstContentfulPaint).toBeLessThan(2000); // 2 seconds
      }
    });
  });
});

// Browser-specific tests
test.describe('Browser-specific functionality', () => {
  test('Chrome - Service Worker registration', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Chrome-specific test');
    
    await page.goto('/');
    
    const serviceWorkerRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return !!registration;
      }
      return false;
    });
    
    // Service worker should be registered in production builds
    if (process.env.NODE_ENV === 'production') {
      expect(serviceWorkerRegistered).toBe(true);
    }
  });

  test('Safari - Video playback compatibility', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'Safari-specific test');
    
    await page.goto('/watch/test-video');
    
    // Check HLS.js fallback for Safari
    const hlsSupport = await page.evaluate(() => {
      const video = document.createElement('video');
      return video.canPlayType('application/vnd.apple.mpegurl') !== '';
    });
    
    expect(hlsSupport).toBe(true);
  });

  test('Firefox - CSS Grid compatibility', async ({ page, browserName }) => {
    test.skip(browserName !== 'firefox', 'Firefox-specific test');
    
    await page.goto('/explore');
    await page.waitForSelector('[role="feed"]');
    
    const gridSupport = await page.evaluate(() => {
      const testElement = document.createElement('div');
      testElement.style.display = 'grid';
      return testElement.style.display === 'grid';
    });
    
    expect(gridSupport).toBe(true);
  });
});

// Performance regression tests
test.describe('Performance regression tests', () => {
  test('Bundle size should not exceed limits', async ({ page }) => {
    await page.goto('/');
    
    // Get loaded script sizes
    const scriptSizes = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      return Promise.all(
        scripts.map(async (script: any) => {
          try {
            const response = await fetch(script.src);
            const text = await response.text();
            return {
              src: script.src,
              size: text.length
            };
          } catch {
            return { src: script.src, size: 0 };
          }
        })
      );
    });
    
    const totalSize = scriptSizes.reduce((sum, script) => sum + script.size, 0);
    
    // Bundle size should not exceed 1MB (adjust as needed)
    expect(totalSize).toBeLessThan(1024 * 1024);
  });

  test('Memory usage should be reasonable', async ({ page }) => {
    await page.goto('/');
    
    // Navigate through several pages to test memory usage
    const pages = ['/explore', '/trending', '/subscriptions', '/history'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
    }
    
    // Check for memory leaks (simplified)
    const memoryInfo = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
      } : null;
    });
    
    if (memoryInfo) {
      // Memory usage should not exceed 100MB (adjust as needed)
      expect(memoryInfo.usedJSHeapSize).toBeLessThan(100 * 1024 * 1024);
    }
  });
});