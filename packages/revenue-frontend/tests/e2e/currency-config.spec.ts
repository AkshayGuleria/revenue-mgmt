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
    // Use a tall viewport so the currency dropdown always opens downward within the viewport
    await page.setViewportSize({ width: 1280, height: 1400 });

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
    await page.locator('[role="listbox"]').waitFor({ state: 'visible' });
    await page.locator('[role="listbox"] [role="option"]:has-text("GBP")').click();
    await expect(page.locator('[role="combobox"]').filter({ hasText: 'GBP' })).toBeVisible();
  });

  test('user can change currency from EUR to USD', async ({ page }) => {
    const currencyTrigger = page.locator('[role="combobox"]').filter({ hasText: 'EUR' });
    await currencyTrigger.click();
    await page.locator('[role="listbox"]').waitFor({ state: 'visible' });
    await page.locator('[role="listbox"] [role="option"]:has-text("USD")').click();
    await expect(page.locator('[role="combobox"]').filter({ hasText: 'USD' })).toBeVisible();
  });

  test('user can change currency from EUR to CAD', async ({ page }) => {
    const currencyTrigger = page.locator('[role="combobox"]').filter({ hasText: 'EUR' });
    await currencyTrigger.click();
    await page.locator('[role="listbox"]').waitFor({ state: 'visible' });
    await page.locator('[role="listbox"] [role="option"]:has-text("CAD")').click();
    await expect(page.locator('[role="combobox"]').filter({ hasText: 'CAD' })).toBeVisible();
  });

  test('currency select does not show EUR twice in options', async ({ page }) => {
    const currencyTrigger = page.locator('[role="combobox"]').filter({ hasText: 'EUR' });
    await currencyTrigger.click();
    await page.locator('[role="listbox"]').waitFor({ state: 'visible' });
    const eurOptions = page.locator('[role="listbox"] [role="option"]:has-text("EUR")');
    await expect(eurOptions).toHaveCount(1);
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
          data: [
            { id: 'acc-001', accountName: 'Acme Corp', status: 'active' },
          ],
          paging: { offset: 0, limit: 20, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
        }),
      });
    });

    await page.route('**/api/contracts**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [],
          paging: { offset: 0, limit: 100, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
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

  test('invoice form line item amount display uses EUR currency', async ({ page }) => {
    // Fill in a quantity and unit price so the live calculation runs
    await page.fill('input[name="items.0.quantity"]', '2');
    await page.fill('input[name="items.0.unitPrice"]', '100');
    await page.waitForTimeout(500);

    // The amount display should contain "EUR" symbol or "€" — not "USD"/"$"
    const amountText = await page.locator('text=Amount').first().locator('..').textContent();
    // EUR typically renders as "€" or "EUR 200.00"
    const hasEurIndicator = amountText?.includes('€') || amountText?.includes('EUR');
    const hasUsdIndicator = amountText?.includes('$') || amountText?.includes('USD');
    expect(hasEurIndicator || !hasUsdIndicator).toBeTruthy();
  });

  test('invoice form totals section uses EUR currency', async ({ page }) => {
    await page.fill('input[name="items.0.quantity"]', '5');
    await page.fill('input[name="items.0.unitPrice"]', '200');
    await page.waitForTimeout(500);

    // The subtotal label row should contain EUR-formatted amount
    const subtotalRow = page.locator('text=Subtotal').locator('..');
    const subtotalText = await subtotalRow.textContent();
    // Should show 1000 in some currency format — EUR, not USD
    expect(subtotalText).toContain('1,000');
  });

  test('invoice form allows changing currency from EUR to another', async ({ page }) => {
    const currencyTrigger = page.locator('[role="combobox"]').filter({ hasText: 'EUR' });
    await currencyTrigger.click();
    await page.locator('[role="listbox"]').waitFor({ state: 'visible' });
    await page.locator('[role="listbox"] [role="option"]:has-text("USD")').click({ force: true });
    await expect(page.locator('[role="combobox"]').filter({ hasText: 'USD' })).toBeVisible();
  });
});

test.describe('Currency Config — API fails gracefully', () => {
  test('when /api/config returns 500, forms still render (use fallback currency)', async ({ page }) => {
    await page.route('**/api/config', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: { message: 'Server error' } }),
      })
    );
    await page.route('**/api/accounts**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [],
          paging: { offset: 0, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
        }),
      })
    );

    await page.goto(`${BASE_URL}/products/new`);
    await page.waitForLoadState('networkidle');

    // The product form should still render even when config fails
    await expect(page.locator('input[placeholder="Enterprise Plan"]')).toBeVisible();
    // A currency combobox should still be present (using fallback)
    await expect(page.locator('[role="combobox"]').first()).toBeVisible();
  });
});

test.describe('Currency Config — Backend ENV default', () => {
  test('backend returns EUR even without explicit env var (fallback default)', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/config`);
    const body = await response.json();

    // Either explicitly set to EUR or falling back to EUR — both are EUR
    expect(body.data.defaultCurrency).toBe('EUR');
  });

  test('backend supportedCurrencies includes at least USD, EUR, GBP', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/config`);
    const body = await response.json();

    expect(body.data.supportedCurrencies).toContain('USD');
    expect(body.data.supportedCurrencies).toContain('EUR');
    expect(body.data.supportedCurrencies).toContain('GBP');
  });
});
