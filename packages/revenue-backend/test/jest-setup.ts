/**
 * Jest setup file for E2E tests
 * Runs before each test file
 */

// Make this an external module to allow global augmentation
export {};

// Increase timeout for slower CI environments
jest.setTimeout(30000);

// Suppress console logs during tests (optional)
if (process.env.CI) {
  global.console = {
    ...console,
    log: jest.fn(), // Suppress logs in CI
    debug: jest.fn(),
    info: jest.fn(),
    warn: console.warn, // Keep warnings
    error: console.error, // Keep errors
  };
}

// Add custom matchers if needed
expect.extend({
  toBeValidUUID(received: string) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);

    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be a valid UUID`
          : `expected ${received} to be a valid UUID`,
    };
  },
});

// Declare custom matcher types
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUUID(): R;
    }
  }
}
