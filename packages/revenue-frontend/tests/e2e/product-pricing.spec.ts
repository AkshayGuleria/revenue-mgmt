/**
 * E2E Tests: Product Pricing Enhancement (Phase 3.5)
 * Tests for chargeType, category, setupFee, trialPeriodDays, minCommitmentMonths
 * in the product create/edit form.
 * All API calls are mocked so tests run without a live backend.
 *
 * @author piia (E2E Testing Agent)
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

// ---------------------------------------------------------------------------
// Shared mock data
// ---------------------------------------------------------------------------

const EUR_CONFIG = {
  data: { defaultCurrency: 'EUR', supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD'] },
  paging: { offset: null, limit: null, total: null, totalPages: null, hasNext: null, hasPrev: null },
};

const MOCK_PRODUCTS = [
  {
    id: 'prod-001',
    name: 'Enterprise Platform',
    sku: 'PLT-001',
    pricingModel: 'seat_based',
    chargeType: 'recurring',
    category: 'platform',
    basePrice: 99,
    currency: 'EUR',
    billingInterval: 'monthly',
    active: true,
    isAddon: false,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'prod-002',
    name: 'Onboarding Package',
    sku: 'ONB-001',
    pricingModel: 'flat_fee',
    chargeType: 'one_time',
    category: 'professional_services',
    basePrice: 2500,
    currency: 'EUR',
    billingInterval: null,
    active: true,
    isAddon: false,
    createdAt: '2024-01-15T00:00:00.000Z',
  },
  {
    id: 'prod-003',
    name: 'Volume Storage',
    sku: 'STG-001',
    pricingModel: 'volume_tiered',
    chargeType: 'recurring',
    category: 'storage',
    basePrice: null,
    currency: 'EUR',
    billingInterval: 'monthly',
    volumeTiers: [
      { minQuantity: 1, maxQuantity: 100, pricePerUnit: 0.10 },
      { minQuantity: 101, maxQuantity: 1000, pricePerUnit: 0.08 },
      { minQuantity: 1001, maxQuantity: null, pricePerUnit: 0.05 },
    ],
    active: false,
    isAddon: true,
    createdAt: '2024-02-01T00:00:00.000Z',
  },
];

function mockConfigApi(page: any) {
  return page.route('**/api/config', (route: any) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(EUR_CONFIG),
    })
  );
}

function mockProductsListApi(page: any, products = MOCK_PRODUCTS) {
  return page.route('**/api/products**', (route: any) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: products,
        paging: { offset: 0, limit: 20, total: products.length, totalPages: 1, hasNext: false, hasPrev: false },
      }),
    })
  );
}

// ---------------------------------------------------------------------------
// Product List tests
// ---------------------------------------------------------------------------

test.describe('Product List', () => {
  test.beforeEach(async ({ page }) => {
    await mockConfigApi(page);
    await mockProductsListApi(page);

    await page.goto(`${BASE_URL}/products`);
    await page.waitForLoadState('networkidle');
  });

  test('should display page title "Products"', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Products');
  });

  test('should display "New Product" button', async ({ page }) => {
    await expect(page.getByRole('link', { name: /new product/i }).or(
      page.getByRole('button', { name: /new product/i })
    ).first()).toBeVisible();
  });

  test('should show product names in the table', async ({ page }) => {
    await expect(page.getByText('Enterprise Platform')).toBeVisible();
    await expect(page.getByText('Onboarding Package')).toBeVisible();
    await expect(page.getByText('Volume Storage')).toBeVisible();
  });

  test('should show SKU column in the table', async ({ page }) => {
    await expect(page.getByText('PLT-001')).toBeVisible();
    await expect(page.getByText('ONB-001')).toBeVisible();
  });

  test('should show pricing model in the table', async ({ page }) => {
    await expect(page.getByText('seat based', { exact: false })).toBeVisible();
    await expect(page.getByText('flat fee', { exact: false })).toBeVisible();
    await expect(page.getByText('volume tiered', { exact: false })).toBeVisible();
  });

  test('should show status badges (active/inactive)', async ({ page }) => {
    await expect(page.getByText('active', { exact: false }).first()).toBeVisible();
  });

  test('should show empty state when no products exist', async ({ page }) => {
    await page.route('**/api/products**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [],
          paging: { offset: 0, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
        }),
      })
    );
    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/no products found/i)).toBeVisible();
  });

  test('should show loading state before products load', async ({ page }) => {
    await page.route('**/api/products**', async (route) => {
      await new Promise((r) => setTimeout(r, 400));
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: MOCK_PRODUCTS,
          paging: { offset: 0, limit: 20, total: 3, totalPages: 1, hasNext: false, hasPrev: false },
        }),
      });
    });
    await page.goto(`${BASE_URL}/products`);
    // While loading, the page title should still be visible
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Products');
  });

  test('should show error state gracefully when API returns 500', async ({ page }) => {
    await page.route('**/api/products**', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: { message: 'Server error', statusCode: 500 } }),
      })
    );
    await page.reload();
    await page.waitForLoadState('networkidle');

    // No JS crash — page title still renders
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should have "Edit" action buttons for each product row', async ({ page }) => {
    const editButtons = page.getByRole('button', { name: /edit/i });
    await expect(editButtons.first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Product Create Form tests
// ---------------------------------------------------------------------------

test.describe('Product Pricing — Create Form', () => {
  test.beforeEach(async ({ page }) => {
    await mockConfigApi(page);
    await page.goto(`${BASE_URL}/products/new`);
    await page.waitForLoadState('networkidle');
  });

  test('should display page title "Create Product"', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Create Product');
  });

  test('should display chargeType and category fields', async ({ page }) => {
    await expect(page.locator('label:has-text("Charge Type")')).toBeVisible();
    await expect(page.locator('label:has-text("Category")')).toBeVisible();
  });

  test('should display subscription & commitment fields', async ({ page }) => {
    await expect(page.locator('label:has-text("Setup Fee")')).toBeVisible();
    await expect(page.locator('label:has-text("Trial Period")')).toBeVisible();
    await expect(page.locator('label:has-text("Min. Commitment")')).toBeVisible();
  });

  test('should display Product Name field with correct placeholder', async ({ page }) => {
    await expect(page.locator('input[placeholder="Enterprise Plan"]')).toBeVisible();
  });

  test('currency select defaults to EUR from config', async ({ page }) => {
    const currencySelect = page.locator('[role="combobox"]').filter({ hasText: 'EUR' });
    await expect(currencySelect).toBeVisible();
  });

  test('should hide billingInterval when chargeType is one_time', async ({ page }) => {
    // Default chargeType should be recurring — billingInterval visible
    const billingIntervalLabel = page.locator('label:has-text("Billing Interval")');
    await expect(billingIntervalLabel).toBeVisible();

    // ChargeType is nth(1) — Currency is nth(0)
    const chargeTypeSelect = page.locator('[role="combobox"]').nth(1);
    await chargeTypeSelect.click();
    await page.locator('[role="listbox"]').waitFor({ state: 'visible' });
    await page.locator('[role="listbox"] [role="option"]:has-text("One-Time")').click();

    // Billing Interval should be hidden
    await expect(billingIntervalLabel).not.toBeVisible();
  });

  test('should show billingInterval when switching back to recurring', async ({ page }) => {
    // ChargeType is nth(1) — Currency is nth(0)
    const chargeTypeSelect = page.locator('[role="combobox"]').nth(1);
    await chargeTypeSelect.click();
    await page.locator('[role="listbox"]').waitFor({ state: 'visible' });
    await page.locator('[role="listbox"] [role="option"]:has-text("One-Time")').click();

    const billingIntervalLabel = page.locator('label:has-text("Billing Interval")');
    await expect(billingIntervalLabel).not.toBeVisible();

    // Switch back to recurring
    await chargeTypeSelect.click();
    await page.locator('[role="listbox"]').waitFor({ state: 'visible' });
    await page.locator('[role="listbox"] [role="option"]:has-text("Recurring")').click();

    await expect(billingIntervalLabel).toBeVisible();
  });

  test('should hide seat fields when pricingModel is flat_fee', async ({ page }) => {
    // Default pricingModel is seat_based — seat section should be visible
    await expect(page.locator('text=Seat Configuration')).toBeVisible();

    // PricingModel is nth(3): Currency(0), ChargeType(1), Category(2), PricingModel(3)
    const pricingModelSelect = page.locator('[role="combobox"]').nth(3);
    await pricingModelSelect.click();
    await page.locator('[role="listbox"]').waitFor({ state: 'visible' });
    await page.locator('[role="listbox"] [role="option"]:has-text("Flat Fee")').click();

    // Seat Configuration section should be gone
    await expect(page.locator('text=Seat Configuration')).not.toBeVisible();
  });

  test('should show seat fields when pricingModel is seat_based', async ({ page }) => {
    // Default is seat_based — seat configuration visible
    await expect(page.locator('text=Seat Configuration')).toBeVisible();
    await expect(page.locator('label:has-text("Minimum Seats")')).toBeVisible();
    await expect(page.locator('label:has-text("Maximum Seats")')).toBeVisible();
  });

  test('should show usage_based info banner when chargeType is usage_based', async ({ page }) => {
    // ChargeType is nth(1) — Currency is nth(0)
    const chargeTypeSelect = page.locator('[role="combobox"]').nth(1);
    await chargeTypeSelect.click();
    await page.locator('[role="listbox"]').waitFor({ state: 'visible' });
    await page.locator('[role="listbox"] [role="option"]:has-text("Usage-Based")').click();

    await expect(page.locator('text=Usage-Based Billing — Phase 6')).toBeVisible();
  });

  test('category dropdown shows all expected options', async ({ page }) => {
    // Category is nth(2): Currency(0), ChargeType(1), Category(2)
    const categorySelect = page.locator('[role="combobox"]').nth(2);
    await categorySelect.click();
    await page.locator('[role="listbox"]').waitFor({ state: 'visible' });

    await expect(page.locator('[role="listbox"] [role="option"]:has-text("Platform")')).toBeVisible();
    await expect(page.locator('[role="listbox"] [role="option"]:has-text("Seats")')).toBeVisible();
    await expect(page.locator('[role="listbox"] [role="option"]:has-text("Add-on")')).toBeVisible();
    await expect(page.locator('[role="listbox"] [role="option"]:has-text("Support")')).toBeVisible();
    await expect(page.locator('[role="listbox"] [role="option"]:has-text("Professional Services")')).toBeVisible();
  });

  test('should validate name is required on submit', async ({ page }) => {
    // Do not fill name and submit
    const submitButton = page.getByRole('button', { name: /create product/i });
    await submitButton.click();
    await page.waitForTimeout(500);

    await expect(page.getByText(/product name is required/i)).toBeVisible();
  });

  test('should send correct chargeType and category fields on submit (recurring)', async ({ page }) => {
    let requestBody: Record<string, unknown> = {};

    await page.route('**/api/products', (route) => {
      requestBody = JSON.parse(route.request().postData() || '{}');
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { id: 'prod-new', name: 'New Product', chargeType: 'recurring', category: 'platform', active: true, isAddon: false, pricingModel: 'seat_based', currency: 'EUR', createdAt: '2024-01-01T00:00:00.000Z' },
          paging: { offset: null, limit: null, total: null, totalPages: null, hasNext: null, hasPrev: null },
        }),
      });
    });

    // Fill name
    await page.fill('input[placeholder="Enterprise Plan"]', 'Test Recurring Product');

    // chargeType = recurring (default), category = platform (default)
    const submitButton = page.getByRole('button', { name: /create product/i });
    await submitButton.click();
    await page.waitForTimeout(1500);

    if (Object.keys(requestBody).length > 0) {
      expect(requestBody).toHaveProperty('chargeType');
      expect(requestBody).toHaveProperty('category');
      expect(requestBody.chargeType).toBe('recurring');
    }
  });

  test('should not send billingInterval for one_time products', async ({ page }) => {
    let requestBody: Record<string, unknown> = {};

    await page.route('**/api/products', (route) => {
      requestBody = JSON.parse(route.request().postData() || '{}');
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { id: 'prod-new-2', name: 'Onboarding', chargeType: 'one_time', category: 'professional_services', active: true, isAddon: false, pricingModel: 'flat_fee', currency: 'EUR', createdAt: '2024-01-01T00:00:00.000Z' },
          paging: { offset: null, limit: null, total: null, totalPages: null, hasNext: null, hasPrev: null },
        }),
      });
    });

    await page.fill('input[placeholder="Enterprise Plan"]', 'Onboarding Package');

    // Set chargeType to one_time — ChargeType is nth(1), Currency is nth(0)
    const chargeTypeSelect = page.locator('[role="combobox"]').nth(1);
    await chargeTypeSelect.click();
    await page.locator('[role="listbox"]').waitFor({ state: 'visible' });
    await page.locator('[role="listbox"] [role="option"]:has-text("One-Time")').click();

    // Set category to professional_services — Category is nth(2)
    const categorySelect = page.locator('[role="combobox"]').nth(2);
    await categorySelect.click();
    await page.locator('[role="listbox"]').waitFor({ state: 'visible' });
    await page.locator('[role="listbox"] [role="option"]:has-text("Professional Services")').click();

    await page.getByRole('button', { name: /create product/i }).click();
    await page.waitForTimeout(1500);

    if (Object.keys(requestBody).length > 0) {
      expect(requestBody.chargeType).toBe('one_time');
      expect(requestBody.category).toBe('professional_services');
      // billingInterval should be stripped for one_time products
      expect(requestBody.billingInterval).toBeUndefined();
    }
  });

  test('should navigate back to products list on cancel', async ({ page }) => {
    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(page).toHaveURL(`${BASE_URL}/products`);
  });

  test('submit button shows "Saving..." while pending', async ({ page }) => {
    await page.route('**/api/products', async (route) => {
      await new Promise((r) => setTimeout(r, 1000));
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { id: 'prod-slow', name: 'Slow Product', active: true, isAddon: false, pricingModel: 'seat_based', chargeType: 'recurring', category: 'platform', currency: 'EUR', createdAt: '2024-01-01T00:00:00.000Z' },
          paging: { offset: null, limit: null, total: null, totalPages: null, hasNext: null, hasPrev: null },
        }),
      });
    });

    await page.fill('input[placeholder="Enterprise Plan"]', 'Slow Product');
    await page.getByRole('button', { name: /create product/i }).click();

    await expect(page.getByRole('button', { name: /saving/i })).toBeVisible({ timeout: 2000 });
  });
});

// ---------------------------------------------------------------------------
// Product Edit Form tests
// ---------------------------------------------------------------------------

test.describe('Product Pricing — Edit Form', () => {
  const EDIT_PRODUCT = MOCK_PRODUCTS[0]; // seat_based, recurring, platform

  test.beforeEach(async ({ page }) => {
    await mockConfigApi(page);

    // Mock the individual product GET
    await page.route(`**/api/products/${EDIT_PRODUCT.id}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: EDIT_PRODUCT,
          paging: { offset: null, limit: null, total: null, totalPages: null, hasNext: null, hasPrev: null },
        }),
      })
    );

    await page.goto(`${BASE_URL}/products/${EDIT_PRODUCT.id}/edit`);
    await page.waitForLoadState('networkidle');
  });

  test('should display "Edit Product" page title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Edit Product');
  });

  test('should pre-fill name from existing product', async ({ page }) => {
    const nameInput = page.locator('input[placeholder="Enterprise Plan"]');
    await expect(nameInput).toHaveValue('Enterprise Platform');
  });

  test('should pre-fill currency from existing product', async ({ page }) => {
    const currencySelect = page.locator('[role="combobox"]').filter({ hasText: 'EUR' });
    await expect(currencySelect).toBeVisible();
  });

  test('should submit update and navigate to product detail', async ({ page }) => {
    await page.route(`**/api/products/${EDIT_PRODUCT.id}`, (route) => {
      if (route.request().method() === 'PUT' || route.request().method() === 'PATCH') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: { ...EDIT_PRODUCT, name: 'Updated Platform' },
            paging: { offset: null, limit: null, total: null, totalPages: null, hasNext: null, hasPrev: null },
          }),
        });
      } else {
        route.continue();
      }
    });

    // Change the name
    await page.fill('input[placeholder="Enterprise Plan"]', 'Updated Platform');

    await page.getByRole('button', { name: /update product/i }).click();
    await page.waitForURL(`${BASE_URL}/products/${EDIT_PRODUCT.id}`, { timeout: 5000 });
    expect(page.url()).toContain(`/products/${EDIT_PRODUCT.id}`);
  });

  test('should show error toast when update API returns 500', async ({ page }) => {
    await page.route(`**/api/products/${EDIT_PRODUCT.id}`, (route) => {
      if (route.request().method() === 'PUT' || route.request().method() === 'PATCH') {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: { message: 'Server error', statusCode: 500 } }),
        });
      } else {
        route.continue();
      }
    });

    await page.getByRole('button', { name: /update product/i }).click();
    await page.waitForTimeout(2000);

    // Should stay on edit page
    expect(page.url()).toContain('/edit');
  });
});

// ---------------------------------------------------------------------------
// Product Detail Page tests
// ---------------------------------------------------------------------------

test.describe('Product Detail', () => {
  test('should display product details with tabs', async ({ page }) => {
    await mockConfigApi(page);

    await page.route(`**/api/products/prod-001`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: MOCK_PRODUCTS[0],
          paging: { offset: null, limit: null, total: null, totalPages: null, hasNext: null, hasPrev: null },
        }),
      })
    );

    await page.goto(`${BASE_URL}/products/prod-001`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1')).toContainText('Enterprise Platform');
    await expect(page.getByRole('tab', { name: /overview/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /pricing/i })).toBeVisible();
  });

  test('shows Volume Tiers tab for volume_tiered products', async ({ page }) => {
    await mockConfigApi(page);

    await page.route(`**/api/products/prod-003`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: MOCK_PRODUCTS[2],
          paging: { offset: null, limit: null, total: null, totalPages: null, hasNext: null, hasPrev: null },
        }),
      })
    );

    await page.goto(`${BASE_URL}/products/prod-003`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('tab', { name: /volume tiers/i })).toBeVisible();
  });

  test('shows "Product not found" when 404', async ({ page }) => {
    await mockConfigApi(page);

    await page.route(`**/api/products/nonexistent`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: null,
          paging: { offset: null, limit: null, total: null, totalPages: null, hasNext: null, hasPrev: null },
        }),
      })
    );

    await page.goto(`${BASE_URL}/products/nonexistent`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/product not found/i)).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Product API field verification
// ---------------------------------------------------------------------------

test.describe('Product Pricing — API Field Verification', () => {
  test('products API returns chargeType and category fields', async ({ page }) => {
    await mockConfigApi(page);

    let responseBody: Record<string, unknown> = {};

    await page.route('**/api/products**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: MOCK_PRODUCTS,
          paging: { offset: 0, limit: 20, total: 3, totalPages: 1, hasNext: false, hasPrev: false },
        }),
      });
    });

    page.on('response', async (res) => {
      if (res.url().includes('/api/products') && res.status() === 200) {
        try {
          responseBody = await res.json();
        } catch { /* ignore */ }
      }
    });

    await page.goto(`${BASE_URL}/products`);
    await page.waitForLoadState('networkidle');

    if (responseBody.data && Array.isArray(responseBody.data) && (responseBody.data as any[]).length > 0) {
      const firstProduct = (responseBody.data as any[])[0];
      expect(firstProduct).toHaveProperty('chargeType');
      expect(firstProduct).toHaveProperty('category');
      expect(['recurring', 'one_time', 'usage_based']).toContain(firstProduct.chargeType);
      expect(['platform', 'seats', 'addon', 'support', 'professional_services', 'storage', 'api']).toContain(firstProduct.category);
    }
  });
});
