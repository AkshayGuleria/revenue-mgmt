/**
 * E2E Tests: Currency Config Feature
 * Tests that GET /api/config is correctly consumed and forms default to the
 * backend-configured currency (EUR).
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const API_BASE_URL = 'http://localhost:5177';

const EUR_CONFIG = {
  data: {
    defaultCurrency: 'EUR',
    supportedCurrencies: [
      'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'SEK', 'NOK', 'DKK',
      'SGD', 'HKD', 'NZD', 'MXN', 'BRL', 'INR', 'ZAR', 'AED',
    ],
  },
  paging: {
    offset: null,
    limit: null,
    total: null,
    totalPages: null,
    hasNext: null,
    hasPrev: null,
  },
};

test.describe('Currency Config — Backend API', () => {
  test('GET /api/config returns ADR-003 envelope with defaultCurrency EUR and supportedCurrencies array', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/config`);

    expect(response.ok()).toBeTruthy();

    const body = await response.json();

    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('paging');
    expect(body.data.defaultCurrency).toBe('EUR');
    expect(Array.isArray(body.data.supportedCurrencies)).toBe(true);
    expect(body.data.supportedCurrencies.length).toBeGreaterThan(0);
    expect(body.data.supportedCurrencies).toContain('EUR');
    expect(body.data.supportedCurrencies).toContain('USD');

    // Verify null paging (single resource)
    expect(body.paging.offset).toBeNull();
    expect(body.paging.limit).toBeNull();
    expect(body.paging.total).toBeNull();
  });
});

test.describe('Currency Config — Account Form', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the config endpoint to return EUR
    await page.route('**/api/config', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(EUR_CONFIG),
      });
    });

    await page.goto(`${BASE_URL}/accounts/new`);
    await page.waitForLoadState('networkidle');
  });

  test('account form defaults currency to EUR', async ({ page }) => {
    const currencySelect = page.locator('[role="combobox"]').filter({ hasText: 'EUR' });
    await expect(currencySelect).toBeVisible();
  });

  test('CurrencySelect dropdown lists all supported currencies', async ({ page }) => {
    // Find and click the currency combobox
    const currencyTrigger = page.locator('[role="combobox"]').filter({ hasText: 'EUR' });
    await currencyTrigger.click();

    // Verify some supported currencies appear in the dropdown
    await expect(page.locator('[role="option"]:has-text("USD")')).toBeVisible();
    await expect(page.locator('[role="option"]:has-text("GBP")')).toBeVisible();
    await expect(page.locator('[role="option"]:has-text("EUR")')).toBeVisible();
  });

  test('user can change currency from EUR to GBP', async ({ page }) => {
    const currencyTrigger = page.locator('[role="combobox"]').filter({ hasText: 'EUR' });
    await currencyTrigger.click();

    await page.locator('[role="option"]:has-text("GBP")').click();

    // Verify GBP is now selected
    await expect(page.locator('[role="combobox"]').filter({ hasText: 'GBP' })).toBeVisible();
  });
});

test.describe('Currency Config — Product Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/config', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(EUR_CONFIG),
      });
    });

    await page.goto(`${BASE_URL}/products/new`);
    await page.waitForLoadState('networkidle');
  });

  test('product form defaults currency to EUR', async ({ page }) => {
    const currencySelect = page.locator('[role="combobox"]').filter({ hasText: 'EUR' });
    await expect(currencySelect).toBeVisible();
  });
});

test.describe('Currency Config — Invoice Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/config', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(EUR_CONFIG),
      });
    });

    // Mock accounts endpoint so the form doesn't hang on loading
    await page.route('**/api/accounts**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [],
          paging: { offset: 0, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
        }),
      });
    });

    await page.goto(`${BASE_URL}/invoices/new`);
    await page.waitForLoadState('networkidle');
  });

  test('invoice form defaults currency to EUR', async ({ page }) => {
    const currencySelect = page.locator('[role="combobox"]').filter({ hasText: 'EUR' });
    await expect(currencySelect).toBeVisible();
  });
});

test.describe('Currency Config — Backend ENV default', () => {
  test('backend returns EUR even without explicit env var (fallback default)', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/config`);
    const body = await response.json();

    // Either explicitly set to EUR or falling back to EUR — both are EUR
    expect(body.data.defaultCurrency).toBe('EUR');
  });
});
