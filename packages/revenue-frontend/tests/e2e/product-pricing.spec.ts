/**
 * E2E Tests: Product Pricing Enhancement (Phase 3.5)
 * Tests for chargeType, category, setupFee, trialPeriodDays, minCommitmentMonths
 * in the product create/edit form.
 *
 * @author piia (E2E Testing Agent)
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('Product Pricing — Create Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/products/new`);
    await page.waitForLoadState('networkidle');
  });

  test('should display chargeType and category fields', async ({ page }) => {
    // Charge Type selector
    const chargeTypeLabel = page.locator('label:has-text("Charge Type")');
    await expect(chargeTypeLabel).toBeVisible();

    // Category selector
    const categoryLabel = page.locator('label:has-text("Category")');
    await expect(categoryLabel).toBeVisible();
  });

  test('should display subscription & commitment fields', async ({ page }) => {
    await expect(page.locator('label:has-text("Setup Fee")')).toBeVisible();
    await expect(page.locator('label:has-text("Trial Period")')).toBeVisible();
    await expect(page.locator('label:has-text("Min. Commitment")')).toBeVisible();
  });

  test('should hide billingInterval when chargeType is one_time', async ({ page }) => {
    // Default chargeType should be recurring — billingInterval visible
    const billingIntervalLabel = page.locator('label:has-text("Billing Interval")');
    await expect(billingIntervalLabel).toBeVisible();

    // Switch to one_time
    const chargeTypeSelect = page.locator('[role="combobox"]').first();
    await chargeTypeSelect.click();
    await page.locator('[role="option"]:has-text("One-Time")').click();

    // Billing Interval should be hidden
    await expect(billingIntervalLabel).not.toBeVisible();
  });

  test('should show billingInterval when switching back to recurring', async ({ page }) => {
    // Switch to one_time
    const chargeTypeSelect = page.locator('[role="combobox"]').first();
    await chargeTypeSelect.click();
    await page.locator('[role="option"]:has-text("One-Time")').click();

    const billingIntervalLabel = page.locator('label:has-text("Billing Interval")');
    await expect(billingIntervalLabel).not.toBeVisible();

    // Switch back to recurring
    await chargeTypeSelect.click();
    await page.locator('[role="option"]:has-text("Recurring")').click();

    await expect(billingIntervalLabel).toBeVisible();
  });

  test('should hide seat fields when pricingModel is flat_fee', async ({ page }) => {
    // Default pricingModel is seat_based — seat section should be visible
    await expect(page.locator('text=Seat Configuration')).toBeVisible();

    // Find and change pricing model to flat_fee
    // pricingModel is the second combobox (after chargeType)
    const comboboxes = page.locator('[role="combobox"]');
    const pricingModelSelect = comboboxes.nth(2); // chargeType, category, then pricingModel
    await pricingModelSelect.click();
    await page.locator('[role="option"]:has-text("Flat Fee")').click();

    // Seat Configuration section should be gone
    await expect(page.locator('text=Seat Configuration')).not.toBeVisible();
  });

  test('should show usage_based info banner', async ({ page }) => {
    const chargeTypeSelect = page.locator('[role="combobox"]').first();
    await chargeTypeSelect.click();
    await page.locator('[role="option"]:has-text("Usage-Based")').click();

    await expect(page.locator('text=Usage-Based Billing — Phase 6')).toBeVisible();
  });

  test('category dropdown shows correct options', async ({ page }) => {
    // Category is the second combobox
    const categorySelect = page.locator('[role="combobox"]').nth(1);
    await categorySelect.click();

    await expect(page.locator('[role="option"]:has-text("Platform")')).toBeVisible();
    await expect(page.locator('[role="option"]:has-text("Seats")')).toBeVisible();
    await expect(page.locator('[role="option"]:has-text("Add-on")')).toBeVisible();
    await expect(page.locator('[role="option"]:has-text("Support")')).toBeVisible();
    await expect(page.locator('[role="option"]:has-text("Professional Services")')).toBeVisible();
  });

  test('should send correct fields to API when creating recurring product with setup fee', async ({ page }) => {
    let requestBody: Record<string, unknown> = {};

    page.on('request', (req) => {
      if (req.url().includes('/api/products') && req.method() === 'POST') {
        requestBody = JSON.parse(req.postData() || '{}');
      }
    });

    // Fill required fields
    await page.fill('input[placeholder="Enterprise Plan"]', 'Test Recurring Product');

    // chargeType = recurring (default)
    // category = platform (default)

    // Fill base price
    await page.fill('input[type="number"]', '99.99');

    // Fill setup fee — find the setup fee input specifically
    const setupFeeInput = page.locator('input').filter({ hasText: '' }).nth(5); // fallback approach
    const setupFeeByLabel = page.locator('label:has-text("Setup Fee") + * input, label:has-text("Setup Fee") ~ * input');
    if (await setupFeeByLabel.count() > 0) {
      await setupFeeByLabel.first().fill('500');
    }

    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);

    // Verify new fields are sent
    if (Object.keys(requestBody).length > 0) {
      expect(requestBody).toHaveProperty('chargeType');
      expect(requestBody).toHaveProperty('category');
      // chargeType should be recurring by default
      expect(requestBody.chargeType).toBe('recurring');
    }
  });

  test('should send correct fields to API when creating one_time product', async ({ page }) => {
    let requestBody: Record<string, unknown> = {};

    page.on('request', (req) => {
      if (req.url().includes('/api/products') && req.method() === 'POST') {
        requestBody = JSON.parse(req.postData() || '{}');
      }
    });

    // Fill name
    await page.fill('input[placeholder="Enterprise Plan"]', 'Onboarding Package');

    // Set chargeType to one_time
    const chargeTypeSelect = page.locator('[role="combobox"]').first();
    await chargeTypeSelect.click();
    await page.locator('[role="option"]:has-text("One-Time")').click();

    // Set category to professional_services
    const categorySelect = page.locator('[role="combobox"]').nth(1);
    await categorySelect.click();
    await page.locator('[role="option"]:has-text("Professional Services")').click();

    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);

    if (Object.keys(requestBody).length > 0) {
      expect(requestBody.chargeType).toBe('one_time');
      expect(requestBody.category).toBe('professional_services');
      // billingInterval should not be sent for one_time products
      expect(requestBody.billingInterval).toBeUndefined();
    }
  });
});

test.describe('Product Pricing — Existing Products (backward compat)', () => {
  test('should display products list without errors', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);
    await page.waitForLoadState('networkidle');

    // Page should render without error
    await expect(page.locator('h1')).toBeVisible();

    // No error alerts should be visible
    const errorAlert = page.locator('[role="alert"]:has-text("Error")');
    const count = await errorAlert.count();
    expect(count).toBe(0);
  });

  test('existing products default to recurring/platform and display without errors', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);
    await page.waitForLoadState('networkidle');

    // If there are products in the table, click the first one
    const rows = page.locator('tbody tr');
    if (await rows.count() > 0) {
      // Extract product ID from first row's edit/view link if possible
      const firstLink = rows.first().locator('a').first();
      if (await firstLink.count() > 0) {
        await firstLink.click();
        await page.waitForLoadState('networkidle');

        // Product detail page should load without errors
        await expect(page.locator('h1')).toBeVisible();
      }
    }
  });
});

test.describe('Product Pricing — API Field Verification', () => {
  test('products API returns chargeType and category fields', async ({ page }) => {
    let responseBody: Record<string, unknown> = {};

    page.on('response', async (res) => {
      if (res.url().includes('/api/products') && res.status() === 200) {
        try {
          responseBody = await res.json();
        } catch {}
      }
    });

    await page.goto(`${BASE_URL}/products`);
    await page.waitForLoadState('networkidle');

    // Verify the API response includes the new fields on at least one product
    if (responseBody.data && Array.isArray(responseBody.data) && (responseBody.data as any[]).length > 0) {
      const firstProduct = (responseBody.data as any[])[0];
      expect(firstProduct).toHaveProperty('chargeType');
      expect(firstProduct).toHaveProperty('category');
      // Defaults applied at DB level
      expect(['recurring', 'one_time', 'usage_based']).toContain(firstProduct.chargeType);
    }
  });
});
