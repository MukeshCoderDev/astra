import { test, expect } from '@playwright/test';

test.describe('Compliance Workflow E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses for compliance
    await page.route('**/api/**', async (route) => {
      const url = route.request().url();
      
      if (url.includes('/auth/me')) {
        await route.fulfill({
          json: {
            id: 'user-1',
            handle: 'testuser',
            displayName: 'Test User',
            kycStatus: 'pending',
            requires2257: true,
          },
        });
      } else if (url.includes('/kyc/status')) {
        await route.fulfill({
          json: {
            status: 'pending',
            documentType: null,
            verificationDate: null,
            modelReleaseStatus: 'pending',
          },
        });
      } else if (url.includes('/reports')) {
        await route.fulfill({
          json: {
            id: 'report-123',
            status: 'pending',
          },
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
  });

  test('should show age gate on first visit', async ({ page }) => {
    // Clear any existing age verification
    await page.evaluate(() => {
      localStorage.removeItem('age-verified');
      sessionStorage.clear();
    });

    await page.reload();

    // Should show age gate modal
    const ageGate = page.locator('[data-testid="age-gate-modal"]');
    await expect(ageGate).toBeVisible();

    // Should have proper content
    await expect(ageGate).toContainText('You must be 18 or older');
    await expect(ageGate).toContainText('adult content');

    // Should have confirmation buttons
    const confirmButton = page.locator('[data-testid="age-confirm-button"]');
    const denyButton = page.locator('[data-testid="age-deny-button"]');
    
    await expect(confirmButton).toBeVisible();
    await expect(denyButton).toBeVisible();

    // Test denial
    await denyButton.click();
    
    // Should redirect or show denial message
    await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();
  });

  test('should persist age verification', async ({ page }) => {
    // Clear existing verification
    await page.evaluate(() => {
      localStorage.removeItem('age-verified');
    });

    await page.reload();

    // Confirm age
    await page.click('[data-testid="age-confirm-button"]');

    // Should close modal and show main content
    await expect(page.locator('[data-testid="age-gate-modal"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="main-content"]')).toBeVisible();

    // Reload page - should not show age gate again
    await page.reload();
    await expect(page.locator('[data-testid="age-gate-modal"]')).not.toBeVisible();

    // Verify localStorage has the verification
    const ageVerified = await page.evaluate(() => {
      return localStorage.getItem('age-verified');
    });
    expect(ageVerified).toBeTruthy();
  });

  test('should handle content reporting workflow', async ({ page }) => {
    // Navigate to a video page
    await page.goto('/watch/video-1');

    // Find and click report button
    const reportButton = page.locator('[data-testid="report-button"]');
    await expect(reportButton).toBeVisible();
    await reportButton.click();

    // Should open report modal
    const reportModal = page.locator('[data-testid="report-modal"]');
    await expect(reportModal).toBeVisible();

    // Should have report categories
    await expect(page.locator('[data-testid="report-category-inappropriate"]')).toBeVisible();
    await expect(page.locator('[data-testid="report-category-copyright"]')).toBeVisible();
    await expect(page.locator('[data-testid="report-category-spam"]')).toBeVisible();

    // Select a category
    await page.click('[data-testid="report-category-inappropriate"]');

    // Should show details field
    const detailsField = page.locator('[data-testid="report-details"]');
    await expect(detailsField).toBeVisible();
    await detailsField.fill('This content violates community guidelines');

    // Submit report
    await page.click('[data-testid="submit-report-button"]');

    // Should show success message
    await expect(page.locator('[data-testid="report-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="report-success"]')).toContainText('Report submitted successfully');

    // Modal should close
    await expect(reportModal).not.toBeVisible();
  });

  test('should handle KYC verification workflow', async ({ page }) => {
    // Navigate to studio
    await page.goto('/studio');

    // Should show KYC status card
    const kycCard = page.locator('[data-testid="kyc-status-card"]');
    await expect(kycCard).toBeVisible();
    await expect(kycCard).toContainText('KYC Status: Pending');

    // Click to start verification
    await page.click('[data-testid="start-kyc-button"]');

    // Should navigate to KYC flow
    await expect(page).toHaveURL(/.*kyc.*/);

    // Should show document upload interface
    await expect(page.locator('[data-testid="document-upload"]')).toBeVisible();

    // Should have document type selection
    const docTypeSelect = page.locator('[data-testid="document-type-select"]');
    await expect(docTypeSelect).toBeVisible();
    await docTypeSelect.selectOption('drivers_license');

    // Should show file upload for ID
    const fileUpload = page.locator('[data-testid="id-file-upload"]');
    await expect(fileUpload).toBeVisible();

    // Mock file upload
    const fileChooserPromise = page.waitForEvent('filechooser');
    await fileUpload.click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'drivers-license.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('mock id image'),
    });

    // Should show model release section for adult content creators
    await expect(page.locator('[data-testid="model-release-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="model-release-upload"]')).toBeVisible();

    // Upload model release
    const releaseChooserPromise = page.waitForEvent('filechooser');
    await page.click('[data-testid="model-release-upload"]');
    const releaseChooser = await releaseChooserPromise;
    await releaseChooser.setFiles({
      name: 'model-release.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('mock model release'),
    });

    // Submit KYC application
    await page.click('[data-testid="submit-kyc-button"]');

    // Should show submission confirmation
    await expect(page.locator('[data-testid="kyc-submitted"]')).toBeVisible();
    await expect(page.locator('[data-testid="kyc-submitted"]')).toContainText('KYC application submitted');
  });

  test('should handle geo-restriction settings', async ({ page }) => {
    await page.goto('/studio');

    // Navigate to content management
    await page.click('[data-testid="content-tab"]');

    // Find a video and click geo-restriction settings
    await page.click('[data-testid="geo-restriction-button"]');

    // Should open geo-restriction modal
    const geoModal = page.locator('[data-testid="geo-restriction-modal"]');
    await expect(geoModal).toBeVisible();

    // Should show country selection
    const countrySelect = page.locator('[data-testid="country-multiselect"]');
    await expect(countrySelect).toBeVisible();

    // Select countries to block
    await page.click('[data-testid="country-option-US"]');
    await page.click('[data-testid="country-option-TX"]');
    await page.click('[data-testid="country-option-UT"]');

    // Should show selected countries
    await expect(page.locator('[data-testid="selected-countries"]')).toContainText('United States');
    await expect(page.locator('[data-testid="selected-countries"]')).toContainText('Texas');
    await expect(page.locator('[data-testid="selected-countries"]')).toContainText('Utah');

    // Save restrictions
    await page.click('[data-testid="save-geo-restrictions-button"]');

    // Should show success message
    await expect(page.locator('[data-testid="geo-restriction-success"]')).toBeVisible();

    // Modal should close
    await expect(geoModal).not.toBeVisible();
  });

  test('should handle forensic watermark settings', async ({ page }) => {
    await page.goto('/studio');

    // Navigate to settings
    await page.click('[data-testid="settings-tab"]');

    // Should show watermark settings
    const watermarkSection = page.locator('[data-testid="watermark-settings"]');
    await expect(watermarkSection).toBeVisible();

    // Should have global watermark toggle
    const globalToggle = page.locator('[data-testid="global-watermark-toggle"]');
    await expect(globalToggle).toBeVisible();

    // Enable global watermarking
    await globalToggle.click();

    // Should show watermark options
    await expect(page.locator('[data-testid="watermark-options"]')).toBeVisible();

    // Should have per-video override option
    await expect(page.locator('[data-testid="per-video-override"]')).toBeVisible();

    // Save settings
    await page.click('[data-testid="save-watermark-settings"]');

    // Should show success message
    await expect(page.locator('[data-testid="watermark-settings-saved"]')).toBeVisible();

    // Go to upload page to verify watermark is enabled by default
    await page.goto('/upload');

    // Should show watermark enabled indicator
    await expect(page.locator('[data-testid="watermark-enabled"]')).toBeVisible();
    await expect(page.locator('[data-testid="watermark-toggle"]')).toBeChecked();
  });

  test('should handle escrow and dispute workflow', async ({ page }) => {
    await page.goto('/studio');

    // Navigate to earnings tab
    await page.click('[data-testid="earnings-tab"]');

    // Should show escrow section
    const escrowSection = page.locator('[data-testid="escrow-section"]');
    await expect(escrowSection).toBeVisible();

    // Should show pending tips in escrow
    await expect(page.locator('[data-testid="escrow-tips"]')).toBeVisible();

    // Should show escrow release dates
    await expect(page.locator('[data-testid="escrow-release-date"]')).toBeVisible();

    // Test dispute initiation
    const disputeButton = page.locator('[data-testid="initiate-dispute-button"]');
    if (await disputeButton.isVisible()) {
      await disputeButton.click();

      // Should open dispute modal
      const disputeModal = page.locator('[data-testid="dispute-modal"]');
      await expect(disputeModal).toBeVisible();

      // Should have dispute reason selection
      await expect(page.locator('[data-testid="dispute-reason-select"]')).toBeVisible();

      // Select reason and provide details
      await page.selectOption('[data-testid="dispute-reason-select"]', 'unauthorized_charge');
      await page.fill('[data-testid="dispute-details"]', 'This tip was made without authorization');

      // Submit dispute
      await page.click('[data-testid="submit-dispute-button"]');

      // Should show dispute submitted confirmation
      await expect(page.locator('[data-testid="dispute-submitted"]')).toBeVisible();
    }
  });

  test('should show compliance status in creator dashboard', async ({ page }) => {
    await page.goto('/studio');

    // Should show compliance overview
    const complianceOverview = page.locator('[data-testid="compliance-overview"]');
    await expect(complianceOverview).toBeVisible();

    // Should show KYC status
    await expect(page.locator('[data-testid="kyc-status-indicator"]')).toBeVisible();

    // Should show 2257 compliance status
    await expect(page.locator('[data-testid="2257-compliance-status"]')).toBeVisible();

    // Should show any compliance warnings
    const complianceWarnings = page.locator('[data-testid="compliance-warnings"]');
    if (await complianceWarnings.isVisible()) {
      await expect(complianceWarnings).toContainText('Action Required');
    }

    // Should show compliance help links
    await expect(page.locator('[data-testid="compliance-help-link"]')).toBeVisible();
  });

  test('should handle regional compliance variations', async ({ page, context }) => {
    // Simulate different geographic locations
    await context.setGeolocation({ latitude: 32.7767, longitude: -96.7970 }); // Dallas, TX

    await page.goto('/');

    // Should show region-specific compliance requirements
    const regionNotice = page.locator('[data-testid="region-compliance-notice"]');
    if (await regionNotice.isVisible()) {
      await expect(regionNotice).toContainText('Texas');
    }

    // Age gate should require ID verification in restricted regions
    await page.evaluate(() => localStorage.removeItem('age-verified'));
    await page.reload();

    const ageGate = page.locator('[data-testid="age-gate-modal"]');
    await expect(ageGate).toBeVisible();

    // Should show ID verification requirement for restricted regions
    if (await page.locator('[data-testid="id-verification-required"]').isVisible()) {
      await expect(page.locator('[data-testid="id-verification-required"]')).toContainText('ID verification required');
    }
  });
});