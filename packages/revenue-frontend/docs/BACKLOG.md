# Frontend Development Backlog

This document tracks nice-to-have features and improvements for the revenue management frontend that should be implemented in future sprints.

**Owner:** frooti (Frontend Development Agent)
**Last Updated:** 2026-02-01

---

## Invoice Form Improvements

### 1. Multi-Currency Support (Priority: Medium)
**Status:** Planned for Phase 4
**Effort:** 2-3 hours
**Context:** PR Review - feat_frontend_billing

Currently, the currency field is hardcoded to "USD" and uses a plain text input.

**Implementation:**
- Replace currency text input with a Select dropdown
- Add supported currencies: USD, EUR, GBP, CAD, AUD, etc.
- Integrate with Phase 4 multi-currency backend support
- Update currency display throughout the invoice form
- Add currency symbol formatting

**Files to Modify:**
- `app/components/invoices/invoice-form.tsx` (currency field)
- `app/lib/utils/currency.ts` (new utility for formatting)

**Related ADR:** Phase 4 - Multi-currency support

---

### 2. Proper Invoice Number Generation (Priority: Medium)
**Status:** Planned
**Effort:** 1-2 hours
**Context:** PR Review - feat_frontend_billing

Currently using timestamp-based generation: `INV-${Date.now()}` which could cause collisions.

**Implementation:**
- Create backend API endpoint: `GET /api/invoices/next-number`
- Fetch next invoice number when creating new invoice
- Support custom invoice number prefixes per account
- Handle concurrent requests with database sequence/counter
- Add validation for duplicate invoice numbers

**Files to Modify:**
- Backend: Add sequence generator service
- `app/components/invoices/invoice-form.tsx` (fetch next number)
- `app/lib/api/hooks/use-invoices.ts` (add useNextInvoiceNumber hook)

**Related:** Backend Phase 4 - Invoice numbering sequences

---

## Test Quality Improvements

### 3. Add data-testid Attributes for Stable Selectors (Priority: High)
**Status:** Planned
**Effort:** 3-4 hours
**Context:** PR Review - Test maintainability issue

Current tests use brittle selectors (text-based, CSS classes) that break on implementation changes.

**Implementation:**
```typescript
// Before (brittle)
await page.locator('label:has-text("Account")').click();
await page.locator('button:has-text("Add Item")').click();

// After (stable)
await page.getByTestId('account-label').click();
await page.getByTestId('add-line-item-button').click();
```

**Files to Modify:**
- `app/components/invoices/invoice-form.tsx` - Add data-testid to all interactive elements
- `app/components/invoices/invoice-form.tsx` - Add data-testid to form fields
- `tests/e2e/invoice-creation.spec.ts` - Update all selectors to use getByTestId

**Guidelines:**
- Use kebab-case for test IDs: `data-testid="invoice-number-input"`
- Add to buttons, inputs, selects, and key display elements
- Document test ID naming convention in TESTING.md

---

### 4. Add Total Calculation Accuracy Tests (Priority: High)
**Status:** Planned
**Effort:** 2-3 hours
**Context:** PR Review - Critical gap in test coverage

No tests verify that calculated totals are mathematically correct.

**Implementation:**
```typescript
test('should calculate totals correctly: subtotal - discount + tax', async ({ page }) => {
  // Item 1: 2 × $100.50 = $201.00
  // Item 2: 3 × $50.25 = $150.75
  // Subtotal: $351.75
  // Discount: $25.00
  // Tax: $30.65
  // Expected: 351.75 - 25.00 + 30.65 = $357.40

  await fillLineItem(page, 0, { quantity: '2', unitPrice: '100.50' });
  await addLineItem(page);
  await fillLineItem(page, 1, { quantity: '3', unitPrice: '50.25' });
  await page.fill('input[name="discount"]', '25.00');
  await page.fill('input[name="tax"]', '30.65');

  await expect(page.getByTestId('total-amount')).toContainText('357.40');
});
```

**Files to Modify:**
- `tests/e2e/invoice-creation.spec.ts` - Add calculation accuracy tests
- `tests/e2e/invoice-creation.spec.ts` - Test edge cases (large numbers, decimals)

---

### 5. Add API Contract Validation Test (Priority: High)
**Status:** Planned
**Effort:** 2 hours
**Context:** PR Review - Critical gap (Criticality: 9/10)

No test verifies the complete request body matches backend expectations.

**Implementation:**
```typescript
test('should send invoice data matching backend API contract', async ({ page }) => {
  let capturedRequest;
  await page.route('**/api/invoices', (route, request) => {
    capturedRequest = request.postDataJSON();
    route.fulfill({
      status: 201,
      body: JSON.stringify({ id: 'test-id', invoiceNumber: 'INV-001' })
    });
  });

  // Fill and submit form
  await fillInvoiceForm(page);
  await submitButton.click();

  // Verify ALL required fields present
  expect(capturedRequest).toMatchObject({
    invoiceNumber: expect.any(String),
    accountId: expect.any(String),
    issueDate: expect.any(String),
    dueDate: expect.any(String),
    status: expect.stringMatching(/^(draft|sent|paid|overdue|cancelled|void)$/),
    currency: 'USD',
    subtotal: expect.any(Number),
    total: expect.any(Number),
    billingType: 'one_time',
    consolidated: false,
    items: expect.arrayContaining([
      expect.objectContaining({
        description: expect.any(String),
        quantity: expect.any(Number),
        unitPrice: expect.any(Number),
        amount: expect.any(Number), // CRITICAL: Must be present
      })
    ])
  });

  // Verify item amount calculation
  expect(capturedRequest.items[0].amount).toBe(
    capturedRequest.items[0].quantity * capturedRequest.items[0].unitPrice
  );
});
```

**Files to Modify:**
- `tests/e2e/invoice-creation.spec.ts` - Add API contract test

---

### 6. Add Floating-Point Precision Tests (Priority: Medium)
**Status:** Planned
**Effort:** 1-2 hours
**Context:** PR Review - Missing edge case coverage (Criticality: 7/10)

JavaScript floating-point issues could cause invoice calculation errors.

**Implementation:**
```typescript
test('should handle floating point precision correctly', async ({ page }) => {
  // Known problematic values
  await fillLineItem(page, 0, { quantity: '3', unitPrice: '0.1' });
  // 3 × 0.1 = 0.30000000000000004 in JavaScript

  // Should display correctly rounded
  await expect(page.getByTestId('subtotal')).toContainText('0.30');
  await expect(page.getByTestId('total')).toContainText('0.30');

  // And submit correct value
  const request = await interceptApiCall();
  expect(request.subtotal).toBe(0.30); // Not 0.30000000000000004
});

test('should round to 2 decimal places in all calculations', async ({ page }) => {
  // $10.999 × 3 = $32.997 -> should round to $33.00
  await fillLineItem(page, 0, { quantity: '3', unitPrice: '10.999' });
  await expect(page.getByTestId('subtotal')).toContainText('33.00');
});
```

**Files to Modify:**
- `tests/e2e/invoice-creation.spec.ts` - Add precision tests
- `app/lib/utils/currency.ts` - Add proper rounding utility

---

### 7. Add Error Scenario Coverage (Priority: High)
**Status:** Planned
**Effort:** 3-4 hours
**Context:** PR Review - Insufficient error state testing

Only one test for API errors, doesn't cover all error types.

**Implementation:**
```typescript
test('should handle 400 validation errors from backend', async ({ page }) => {
  await page.route('**/api/invoices', (route) => {
    route.fulfill({
      status: 400,
      body: JSON.stringify({
        error: {
          message: 'Validation failed',
          details: {
            validationErrors: {
              invoiceNumber: 'Invoice number already exists'
            }
          }
        }
      })
    });
  });

  await fillAndSubmitForm(page);

  // Should display field-level error
  await expect(page.locator('text=Invoice number already exists')).toBeVisible();
});

test('should handle network timeout', async ({ page }) => {
  await page.route('**/api/invoices', (route) => {
    setTimeout(() => route.abort('timedout'), 5000);
  });

  await submitButton.click();
  await expect(page.locator('text=/request.*timed out/i')).toBeVisible({ timeout: 10000 });
});

test('should handle 401 authentication error', async ({ page }) => {
  await page.route('**/api/invoices', (route) => {
    route.fulfill({ status: 401, body: JSON.stringify({ error: { message: 'Unauthorized' } }) });
  });

  await submitButton.click();
  await expect(page.locator('text=/session.*expired/i')).toBeVisible();
});

test('should handle 500 server error', async ({ page }) => {
  await page.route('**/api/invoices', (route) => {
    route.fulfill({ status: 500, body: JSON.stringify({ error: { message: 'Internal server error' } }) });
  });

  await submitButton.click();
  await expect(page.locator('text=/unexpected error/i')).toBeVisible();
});
```

**Files to Modify:**
- `tests/e2e/invoice-creation.spec.ts` - Add error scenario tests

---

### 8. Standardize Button Text Across Components (Priority: Low)
**Status:** Planned
**Effort:** 30 minutes
**Context:** PR Review - Inconsistency issue

E2E test checks for both "Add Item" and "Add Line Item" indicating inconsistency.

**Implementation:**
- Decide on standard text: "Add Line Item" (more descriptive for invoices)
- Update all buttons to use consistent text
- Update E2E tests to use single selector

**Files to Modify:**
- `app/components/invoices/invoice-form.tsx` - Update button text
- `tests/e2e/invoice-creation.spec.ts` - Remove `.or()` fallback

---

### 9. Clean Up Duplicate Inline Comments (Priority: Low)
**Status:** Planned
**Effort:** 15 minutes
**Context:** PR Review - Code quality

"Backend requires this field" comment appears twice in 6 lines.

**Implementation:**
```typescript
// Before
const amount = item.quantity * item.unitPrice; // Required by backend
return {
  description: item.description,
  quantity: item.quantity,
  unitPrice: item.unitPrice,
  amount, // Backend requires this field  <-- Remove this one
  productId: item.productId,
};

// After
const amount = item.quantity * item.unitPrice; // Backend requires this field
return {
  description: item.description,
  quantity: item.quantity,
  unitPrice: item.unitPrice,
  amount,
  productId: item.productId,
};
```

**Files to Modify:**
- `app/components/invoices/invoice-form.tsx` - Remove duplicate comment

---

## Future Enhancements (Lower Priority)

### 10. Refactor Tests to Page Objects Pattern
**Status:** Future
**Effort:** 6-8 hours

Reduce test duplication by creating page object classes.

**Example:**
```typescript
class InvoiceFormPage {
  constructor(private page: Page) {}

  async fillLineItem(index: number, data: { quantity: string; unitPrice: string; description?: string }) {
    // Centralized line item filling logic
  }

  async addLineItem() {
    await this.page.getByTestId('add-line-item-button').click();
  }

  async submitForm() {
    await this.page.getByTestId('submit-button').click();
  }

  async expectTotalToBe(amount: string) {
    await expect(this.page.getByTestId('total-amount')).toContainText(amount);
  }
}
```

---

### 11. Add Visual Regression Tests
**Status:** Future
**Effort:** 4-6 hours

Use Playwright's screenshot comparison to catch UI regressions.

**Implementation:**
- Configure Percy or Playwright's built-in screenshot testing
- Add snapshots for invoice form in different states
- Add snapshots for error states
- Add snapshots for mobile viewport

---

### 12. Add Accessibility Tests
**Status:** Future
**Effort:** 3-4 hours

Ensure invoice form is accessible to all users.

**Implementation:**
- Add axe-core for automated accessibility testing
- Verify ARIA labels on form fields
- Test keyboard navigation
- Test screen reader announcements
- Ensure proper focus management

---

### 13. Add Performance Tests
**Status:** Future
**Effort:** 2-3 hours

Test form performance with large datasets.

**Implementation:**
- Test invoice form with 100+ line items
- Measure render time for calculation updates
- Test form submission with large payloads
- Add performance budgets

---

## Implementation Guidelines

### Priority Levels
- **High:** Should be implemented in next 1-2 sprints
- **Medium:** Implement within next quarter
- **Low:** Nice-to-have, implement when time permits
- **Future:** Long-term improvements, revisit quarterly

### Before Implementation
1. Review related ADRs and CLAUDE.md
2. Check if backend changes are required
3. Update effort estimate based on current codebase
4. Create subtasks if effort > 4 hours

### After Implementation
1. Update test coverage metrics
2. Document changes in feature docs
3. Update this backlog (mark as ✅ Done)
4. Add "Implemented in: [commit hash]" note

---

## Completed Items

### ✅ Critical Issues (Completed: 2026-02-01)
All 6 critical issues identified in PR review completed in commit `31ebe41`:
1. Fixed undefined metadata property access
2. Added due date validation
3. Added error and loading states
4. Improved error messages
5. Added global error handler
6. Made due date validation test strict

### ✅ High Priority Issues (Completed: 2026-02-01)
All 5 high priority issues completed in commit `b1a7328`:
1. Removed unused InvoiceItemsEditor component
2. Added negative total validation
3. Added NaN validation
4. Removed silent fallback for array data
5. Added optional chaining for safe access

---

## Notes

- This backlog focuses on invoice form improvements from the feat_frontend_billing PR review
- Additional backlog items for other features should be added to separate sections
- Review and reprioritize quarterly based on business needs
- Coordinate with backend team for items requiring API changes
