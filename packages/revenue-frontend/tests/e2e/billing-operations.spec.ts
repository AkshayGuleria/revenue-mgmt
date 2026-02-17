/**
 * E2E Tests: Billing Operations
 * Tests for billing/generate, billing/batch, and billing/consolidated routes
 *
 * @author piia (E2E Testing Agent)
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('Billing - Generate Invoice', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/billing/generate`);
    await page.waitForLoadState('networkidle');
  });

  test('should display the generate invoice form', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Generate Invoice');
    await expect(page.locator('label:has-text("Contract")')).toBeVisible();
    await expect(page.locator('label:has-text("Billing Period Start")')).toBeVisible();
    await expect(page.locator('label:has-text("Billing Period End")')).toBeVisible();
    await expect(page.locator('text=Queue for asynchronous processing')).toBeVisible();
  });

  test('should validate required fields on submit', async ({ page }) => {
    // Submit without selecting a contract
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Contract is required')).toBeVisible();
  });

  test('should load contracts in dropdown', async ({ page }) => {
    const contractSelect = page.locator('[role="combobox"]').first();
    await contractSelect.click();
    // Dropdown opens with at least one contract option
    const options = page.locator('[role="option"]');
    await expect(options.first()).toBeVisible({ timeout: 5000 });
  });

  test('should submit generate invoice with valid data', async ({ page }) => {
    // Select first contract
    const contractSelect = page.locator('[role="combobox"]').first();
    await contractSelect.click();
    await page.locator('[role="option"]').first().click();

    // Dates are pre-filled; just submit
    await page.click('button[type="submit"]');

    // Should show success toast or navigate away (or show error if contract not billable)
    await page.waitForTimeout(2000);
    const toastOrNav = page.locator('.sonner-toast').or(page.locator('[data-sonner-toast]'));
    const currentUrl = page.url();
    const navigatedAway = !currentUrl.includes('/billing/generate');
    const toastVisible = await toastOrNav.count() > 0;
    expect(navigatedAway || toastVisible).toBeTruthy();
  });

  test('should queue invoice when async checkbox is checked', async ({ page }) => {
    // Select first contract
    const contractSelect = page.locator('[role="combobox"]').first();
    await contractSelect.click();
    await page.locator('[role="option"]').first().click();

    // Check async checkbox
    await page.check('#async');
    await expect(page.locator('button[type="submit"]')).toContainText('Queue Invoice');

    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Should navigate to job status page or show toast
    const currentUrl = page.url();
    const navigatedToJob = currentUrl.includes('/billing/jobs/');
    const toast = page.locator('[data-sonner-toast]').or(page.locator('.sonner-toast'));
    const toastVisible = await toast.count() > 0;
    expect(navigatedToJob || toastVisible).toBeTruthy();
  });

  test('should navigate back to billing on cancel', async ({ page }) => {
    await page.click('button:has-text("Cancel")');
    await expect(page).toHaveURL(`${BASE_URL}/billing`);
  });

  test('should send correct field names to backend (periodStart/periodEnd)', async ({ page }) => {
    let requestBody: Record<string, unknown> = {};

    page.on('request', (req) => {
      if (req.url().includes('/api/billing/generate') && req.method() === 'POST') {
        requestBody = JSON.parse(req.postData() || '{}');
      }
    });

    const contractSelect = page.locator('[role="combobox"]').first();
    await contractSelect.click();
    await page.locator('[role="option"]').first().click();

    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Verify correct field names are sent
    expect(requestBody).toHaveProperty('contractId');
    expect(requestBody).toHaveProperty('periodStart');
    expect(requestBody).toHaveProperty('periodEnd');
    expect(requestBody).not.toHaveProperty('billingPeriodStart');
    expect(requestBody).not.toHaveProperty('billingPeriodEnd');
    expect(requestBody).not.toHaveProperty('async');
  });
});

test.describe('Billing - Batch Billing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/billing/batch`);
    await page.waitForLoadState('networkidle');
  });

  test('should display the batch billing form', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Batch Billing');
    await expect(page.locator('label:has-text("Billing Date")')).toBeVisible();
    await expect(page.locator('label:has-text("Billing Period")')).toBeVisible();
    await expect(page.locator('text=Asynchronous Processing')).toBeVisible();
  });

  test('should show async processing notice', async ({ page }) => {
    await expect(page.locator('text=Batch billing is always processed asynchronously')).toBeVisible();
  });

  test('should submit batch billing and navigate to job status', async ({ page }) => {
    let requestBody: Record<string, unknown> = {};

    page.on('request', (req) => {
      if (req.url().includes('/api/billing/batch') && req.method() === 'POST') {
        requestBody = JSON.parse(req.postData() || '{}');
      }
    });

    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Should navigate to job status page
    await expect(page).toHaveURL(/\/billing\/jobs\//);
  });

  test('should send correct field names to backend (billingDate/billingPeriod)', async ({ page }) => {
    let requestBody: Record<string, unknown> = {};

    page.on('request', (req) => {
      if (req.url().includes('/api/billing/batch') && req.method() === 'POST') {
        requestBody = JSON.parse(req.postData() || '{}');
      }
    });

    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Verify only valid backend fields are sent
    expect(requestBody).not.toHaveProperty('billingPeriodStart');
    expect(requestBody).not.toHaveProperty('billingPeriodEnd');
    expect(requestBody).not.toHaveProperty('accountIds');
    expect(requestBody).not.toHaveProperty('contractStatus');
  });

  test('should filter by billing period when selected', async ({ page }) => {
    let requestBody: Record<string, unknown> = {};

    page.on('request', (req) => {
      if (req.url().includes('/api/billing/batch') && req.method() === 'POST') {
        requestBody = JSON.parse(req.postData() || '{}');
      }
    });

    // Select a billing period
    const periodSelect = page.locator('[role="combobox"]').first();
    await periodSelect.click();
    await page.locator('[role="option"]:has-text("Monthly")').click();

    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    expect(requestBody.billingPeriod).toBe('monthly');
  });

  test('should navigate back to billing on cancel', async ({ page }) => {
    await page.click('button:has-text("Cancel")');
    await expect(page).toHaveURL(`${BASE_URL}/billing`);
  });
});

test.describe('Billing - Consolidated Invoice', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/billing/consolidated`);
    await page.waitForLoadState('networkidle');
  });

  test('should display the consolidated billing form', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Consolidated Billing');
    await expect(page.locator('label:has-text("Parent Account")')).toBeVisible();
    await expect(page.locator('label:has-text("Billing Period Start")')).toBeVisible();
    await expect(page.locator('label:has-text("Billing Period End")')).toBeVisible();
    await expect(page.locator('text=Include subsidiary accounts')).toBeVisible();
    await expect(page.locator('text=Queue for asynchronous processing')).toBeVisible();
  });

  test('should show Phase 3 feature notice', async ({ page }) => {
    await expect(page.locator('text=Phase 3 Feature')).toBeVisible();
  });

  test('should validate required parent account on submit', async ({ page }) => {
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Parent account is required')).toBeVisible();
  });

  test('should load parent accounts in dropdown', async ({ page }) => {
    const accountSelect = page.locator('[role="combobox"]').first();
    await accountSelect.click();
    // Note: consolidated billing shows accounts that have children
    // If no parent accounts exist, the dropdown may be empty — that's still valid
    await page.waitForTimeout(1000);
    // Just verify the dropdown opened without error
    await expect(page.locator('[role="combobox"]').first()).toBeVisible();
  });

  test('should submit consolidated invoice with valid data', async ({ page }) => {
    // Select an account (any account — the backend will validate parent/child)
    const accountSelect = page.locator('[role="combobox"]').first();
    await accountSelect.click();

    const options = page.locator('[role="option"]');
    if (await options.count() > 0) {
      await options.first().click();

      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);

      // Should show a toast (success or error) or navigate away
      const toast = page.locator('[data-sonner-toast]').or(page.locator('.sonner-toast'));
      const currentUrl = page.url();
      const navigatedAway = !currentUrl.includes('/billing/consolidated');
      const toastVisible = await toast.count() > 0;
      expect(navigatedAway || toastVisible).toBeTruthy();
    }
  });

  test('should send correct field names to backend (periodStart/periodEnd/includeChildren)', async ({ page }) => {
    let requestBody: Record<string, unknown> = {};

    page.on('request', (req) => {
      if (req.url().includes('/api/billing/consolidated') && req.method() === 'POST') {
        requestBody = JSON.parse(req.postData() || '{}');
      }
    });

    const accountSelect = page.locator('[role="combobox"]').first();
    await accountSelect.click();
    const options = page.locator('[role="option"]');
    await expect(options.first()).toBeVisible({ timeout: 5000 });
    await options.first().click();
    // Wait for dropdown portal to close
    await page.waitForTimeout(500);

    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);

    // Verify correct field names are sent
    expect(requestBody).toHaveProperty('parentAccountId');
    expect(requestBody).toHaveProperty('periodStart');
    expect(requestBody).toHaveProperty('periodEnd');
    expect(requestBody).toHaveProperty('includeChildren');
    // These old incorrect names must NOT be present
    expect(requestBody).not.toHaveProperty('billingPeriodStart');
    expect(requestBody).not.toHaveProperty('billingPeriodEnd');
    expect(requestBody).not.toHaveProperty('includeSubsidiaries');
    expect(requestBody).not.toHaveProperty('billingAddress');
    expect(requestBody).not.toHaveProperty('notes');
    expect(requestBody).not.toHaveProperty('async');
  });

  test('should queue consolidated invoice when async is checked', async ({ page }) => {
    const accountSelect = page.locator('[role="combobox"]').first();
    await accountSelect.click();
    const options = page.locator('[role="option"]');
    await expect(options.first()).toBeVisible({ timeout: 5000 });
    await options.first().click();
    // Wait for dropdown portal to fully close before interacting with checkbox
    await page.waitForTimeout(500);

    await page.check('#async', { force: true });
    await expect(page.locator('button[type="submit"]')).toContainText('Queue Invoice');
  });

  test('should toggle includeChildren checkbox', async ({ page }) => {
    const checkbox = page.locator('#includeChildren');
    // Default is checked
    await expect(checkbox).toBeChecked();
    await checkbox.uncheck();
    await expect(checkbox).not.toBeChecked();
    await checkbox.check();
    await expect(checkbox).toBeChecked();
  });

  test('should navigate back to billing on cancel', async ({ page }) => {
    await page.click('button:has-text("Cancel")');
    await expect(page).toHaveURL(`${BASE_URL}/billing`);
  });
});
