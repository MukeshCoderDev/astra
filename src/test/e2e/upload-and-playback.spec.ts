import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Video Upload and Playback E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route('**/api/**', async (route) => {
      const url = route.request().url();
      
      if (url.includes('/auth/me')) {
        await route.fulfill({
          json: {
            id: 'user-1',
            handle: 'testuser',
            displayName: 'Test User',
            avatar: 'https://example.com/avatar.jpg',
            verified: false,
            followerCount: 100,
            totalViews: 1000,
            kycStatus: 'approved',
          },
        });
      } else if (url.includes('/uploads/initiate')) {
        await route.fulfill({
          json: {
            uploadId: 'upload-123',
            tusUrl: 'https://upload.example.com/files/upload-123',
          },
        });
      } else if (url.includes('/uploads/complete')) {
        await route.fulfill({
          json: {
            videoId: 'video-123',
            status: 'processing',
          },
        });
      } else if (url.includes('/videos/video-123')) {
        await route.fulfill({
          json: {
            id: 'video-123',
            title: 'Test Upload Video',
            description: 'This is a test video uploaded via E2E test',
            hlsUrl: 'https://example.com/video-123.m3u8',
            poster: 'https://example.com/poster-123.jpg',
            durationSec: 120,
            durationLabel: '2:00',
            views: 1,
            likes: 0,
            tips: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            creator: {
              id: 'user-1',
              handle: 'testuser',
              displayName: 'Test User',
              avatar: 'https://example.com/avatar.jpg',
              verified: false,
              followerCount: 100,
              totalViews: 1000,
            },
            tags: ['test', 'e2e'],
            visibility: 'public',
            type: 'long',
          },
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
  });

  test('should complete video upload workflow', async ({ page }) => {
    // Navigate to upload page
    await page.click('[data-testid="upload-button"]');
    await expect(page).toHaveURL('/upload');

    // Wait for upload page to load
    await expect(page.locator('h1')).toContainText('Upload Video');

    // Create a test video file (mock)
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('[data-testid="file-input"]');
    const fileChooser = await fileChooserPromise;
    
    // Mock file selection (in real E2E, you'd use an actual file)
    await fileChooser.setFiles({
      name: 'test-video.mp4',
      mimeType: 'video/mp4',
      buffer: Buffer.from('mock video content'),
    });

    // Verify file is selected
    await expect(page.locator('[data-testid="selected-file"]')).toContainText('test-video.mp4');

    // Fill in video metadata
    await page.fill('[data-testid="title-input"]', 'Test Upload Video');
    await page.fill('[data-testid="description-input"]', 'This is a test video uploaded via E2E test');
    await page.fill('[data-testid="tags-input"]', 'test, e2e');

    // Select visibility
    await page.click('[data-testid="visibility-public"]');

    // Start upload
    await page.click('[data-testid="start-upload-button"]');

    // Verify upload progress is shown
    await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible();

    // Wait for upload completion (mock will complete immediately)
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 10000 });

    // Verify success message
    await expect(page.locator('[data-testid="upload-success"]')).toContainText('Upload completed successfully');

    // Should show link to view video
    const viewVideoLink = page.locator('[data-testid="view-video-link"]');
    await expect(viewVideoLink).toBeVisible();
    await expect(viewVideoLink).toHaveAttribute('href', '/watch/video-123');
  });

  test('should play uploaded video', async ({ page }) => {
    // Navigate directly to watch page for uploaded video
    await page.goto('/watch/video-123');

    // Wait for video page to load
    await expect(page.locator('[data-testid="video-title"]')).toContainText('Test Upload Video');

    // Verify video player is present
    const videoPlayer = page.locator('[data-testid="video-player"]');
    await expect(videoPlayer).toBeVisible();

    // Verify video metadata
    await expect(page.locator('[data-testid="video-description"]')).toContainText('This is a test video uploaded via E2E test');
    await expect(page.locator('[data-testid="creator-name"]')).toContainText('Test User');
    await expect(page.locator('[data-testid="video-duration"]')).toContainText('2:00');

    // Verify video controls are present
    await expect(page.locator('[data-testid="play-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="volume-control"]')).toBeVisible();
    await expect(page.locator('[data-testid="fullscreen-button"]')).toBeVisible();

    // Test play functionality (mock)
    await page.click('[data-testid="play-button"]');
    
    // After clicking play, button should change to pause
    await expect(page.locator('[data-testid="pause-button"]')).toBeVisible();

    // Test volume control
    await page.click('[data-testid="volume-button"]');
    await expect(page.locator('[data-testid="volume-slider"]')).toBeVisible();

    // Test fullscreen toggle
    await page.click('[data-testid="fullscreen-button"]');
    // Note: Fullscreen API might not work in headless mode, so we just verify the button exists
  });

  test('should handle upload errors gracefully', async ({ page }) => {
    // Mock upload error
    await page.route('**/uploads/initiate', async (route) => {
      await route.fulfill({
        status: 500,
        json: { error: 'Upload service unavailable' },
      });
    });

    await page.goto('/upload');

    // Select file and fill form
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('[data-testid="file-input"]');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'test-video.mp4',
      mimeType: 'video/mp4',
      buffer: Buffer.from('mock video content'),
    });

    await page.fill('[data-testid="title-input"]', 'Test Video');
    await page.click('[data-testid="visibility-public"]');

    // Try to start upload
    await page.click('[data-testid="start-upload-button"]');

    // Should show error message
    await expect(page.locator('[data-testid="upload-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="upload-error"]')).toContainText('Upload failed');

    // Should show retry button
    await expect(page.locator('[data-testid="retry-upload-button"]')).toBeVisible();
  });

  test('should validate file types and sizes', async ({ page }) => {
    await page.goto('/upload');

    // Try to upload invalid file type
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('[data-testid="file-input"]');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'document.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('mock pdf content'),
    });

    // Should show error for invalid file type
    await expect(page.locator('[data-testid="file-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-error"]')).toContainText('Invalid file type');

    // Upload button should be disabled
    await expect(page.locator('[data-testid="start-upload-button"]')).toBeDisabled();
  });

  test('should support mobile upload workflow', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This test is only for mobile');

    await page.goto('/upload');

    // On mobile, should show mobile-optimized upload interface
    await expect(page.locator('[data-testid="mobile-upload-interface"]')).toBeVisible();

    // Should have touch-friendly file selection
    await expect(page.locator('[data-testid="mobile-file-selector"]')).toBeVisible();

    // Test mobile file selection
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.tap('[data-testid="mobile-file-selector"]');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'mobile-video.mp4',
      mimeType: 'video/mp4',
      buffer: Buffer.from('mock mobile video'),
    });

    // Should show mobile-optimized form
    await expect(page.locator('[data-testid="mobile-metadata-form"]')).toBeVisible();

    // Fill form with mobile keyboard
    await page.tap('[data-testid="title-input"]');
    await page.fill('[data-testid="title-input"]', 'Mobile Upload Test');

    // Should have mobile-friendly upload button
    const uploadButton = page.locator('[data-testid="mobile-upload-button"]');
    await expect(uploadButton).toBeVisible();
    await uploadButton.tap();

    // Should show mobile upload progress
    await expect(page.locator('[data-testid="mobile-upload-progress"]')).toBeVisible();
  });

  test('should handle network interruptions during upload', async ({ page }) => {
    await page.goto('/upload');

    // Start upload
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('[data-testid="file-input"]');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'test-video.mp4',
      mimeType: 'video/mp4',
      buffer: Buffer.from('mock video content'),
    });

    await page.fill('[data-testid="title-input"]', 'Network Test Video');
    await page.click('[data-testid="visibility-public"]');
    await page.click('[data-testid="start-upload-button"]');

    // Simulate network interruption
    await page.setOffline(true);

    // Should show network error
    await expect(page.locator('[data-testid="network-error"]')).toBeVisible();

    // Restore network
    await page.setOffline(false);

    // Should show resume option
    await expect(page.locator('[data-testid="resume-upload-button"]')).toBeVisible();

    // Resume upload
    await page.click('[data-testid="resume-upload-button"]');

    // Should continue upload
    await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible();
  });

  test('should support accessibility features', async ({ page }) => {
    await page.goto('/upload');

    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="file-input"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="title-input"]')).toBeFocused();

    // Test screen reader labels
    const fileInput = page.locator('[data-testid="file-input"]');
    await expect(fileInput).toHaveAttribute('aria-label', /select video file/i);

    const titleInput = page.locator('[data-testid="title-input"]');
    await expect(titleInput).toHaveAttribute('aria-label', /video title/i);

    // Test form validation with screen reader announcements
    await page.click('[data-testid="start-upload-button"]');
    
    const errorMessage = page.locator('[role="alert"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Please select a video file');
  });
});