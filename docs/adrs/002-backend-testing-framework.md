# ADR-002: Backend Testing Framework - Jest + Supertest (Not Playwright)

**Date:** 2026-01-13
**Status:** Accepted
**Topic:** Testing Strategy
**Scope:** Backend testing (all modules, services, APIs, workers)
**Deciders:** tommi (Architecture), biksi (Backend), habibi (Infrastructure)

---

## Context and Problem Statement

The Revenue Management Backend System requires a comprehensive testing strategy to ensure:
- Financial calculations are accurate (seat pricing, volume discounts, tax)
- API endpoints work correctly with proper validation
- Business logic is reliable (contract billing, consolidated invoicing)
- Database operations are correct (hierarchical queries, transactions)
- Job queue workers function properly (PDF generation, email sending)

**Key Questions:**
1. What testing framework(s) should we use for backend testing?
2. Should we use Playwright for backend API testing?
3. How do we balance unit tests, integration tests, and E2E tests?
4. What's the optimal testing pyramid for B2B billing logic?

**Context:**
- NestJS framework chosen (ADR-001)
- Complex B2B billing logic with 141 tasks
- Critical financial operations requiring high accuracy
- Need fast feedback loops during development

---

## Decision

We will use **Jest + Supertest** for backend testing, NOT Playwright.

### Testing Stack

**Backend Testing (NestJS):**
- **Jest** - Unit tests (60% of tests)
  - Services, utilities, business logic
  - Default NestJS testing framework
  - Fast, isolated, mockable

- **Supertest** - Integration tests (30% of tests)
  - API endpoint testing
  - Real HTTP requests to NestJS app
  - Database integration tests

- **@nestjs/testing** - Testing utilities
  - Dependency injection for tests
  - Module mocking and overrides
  - Test module compilation

**Frontend Testing (separate repo):**
- **Playwright** - E2E tests (10% of tests)
  - Full user flows through UI
  - Browser automation
  - Visual regression testing
  - Only for critical end-to-end scenarios

### Testing Pyramid

```
┌─────────────────────────────────────────────┐
│         E2E Tests (10%)                     │
│         Playwright (Frontend repo only)      │
│         • Full user journeys                │
│         • UI → API → Database               │
├─────────────────────────────────────────────┤
│         Integration Tests (30%)             │
│         Supertest + @nestjs/testing         │
│         • API endpoints                     │
│         • Database operations               │
│         • Module integration                │
├─────────────────────────────────────────────┤
│         Unit Tests (60%)                    │
│         Jest                                │
│         • Services in isolation             │
│         • Business logic                    │
│         • Utilities and calculators         │
└─────────────────────────────────────────────┘
```

### What We Will NOT Use

❌ **Playwright for backend testing**
- Wrong tool for the job (designed for browser automation)
- Unnecessary overhead (300MB browser binaries)
- Slower than Jest/Supertest
- Not designed for backend unit/integration testing

---

## Consequences

### Positive

**1. Fast Test Execution**
- **Jest unit tests:** ~0.01 seconds per test
- **Supertest integration:** ~0.5 seconds per test
- **Total test suite (1000+ tests):** 30-60 seconds
- Fast feedback during development (watch mode)

**2. Native NestJS Integration**
- Jest is built into NestJS by default
- `@nestjs/testing` provides excellent DI mocking
- Supertest is the standard for NestJS API testing
- No additional setup required

**3. Better Developer Experience**
- Familiar tools (Jest is industry standard for Node.js)
- Extensive documentation and examples
- Easy to hire developers with Jest experience
- Built-in coverage reporting

**4. Lighter Dependencies**
- No browser binaries (Playwright = ~300MB)
- Smaller `node_modules`
- Faster CI/CD pipelines

**5. Appropriate Test Isolation**
- Unit tests run in milliseconds (no I/O)
- Integration tests use test database (isolated)
- Can mock external dependencies easily
- Parallel test execution (Jest workers)

**6. Cost-Effective CI/CD**
- No need for browser containers in CI
- Faster pipeline execution
- Lower compute costs
- Can run more tests in less time

**7. Better for B2B Testing**
- Focus on business logic accuracy (financial calculations)
- Test complex queries (hierarchical accounts, consolidated billing)
- Validate API contracts and DTOs
- Mock payment gateways and external services

### Negative

**1. Manual E2E Testing Required**
- Full-stack E2E tests must be done in frontend repo with Playwright
- Backend doesn't test complete user flows in isolation
- **Mitigation:** Frontend E2E tests cover critical paths

**2. Integration Test Setup**
- Need to manage test database
- Database migrations must run before tests
- Seed data required for integration tests
- **Mitigation:** Use Prisma test utilities, Docker Compose for test DB

**3. API Contract Testing**
- No automatic UI → API contract validation
- Frontend and backend can drift if not coordinated
- **Mitigation:** Use OpenAPI schema validation, coordinate with frooti

### Neutral

**1. Playwright Still Used**
- Frontend repo uses Playwright for E2E tests
- Tests complete user flows (UI → Backend → DB)
- This is appropriate separation of concerns

**2. Testing Strategy Documented**
- Clear guidelines for when to use each tool
- Testing pyramid enforced by tapsa
- Code review checks test quality

---

## Alternatives Considered

### Alternative 1: Playwright for Backend API Testing

**Pros:**
- Can test APIs without browser using `APIRequestContext`
- Single tool for frontend and backend
- Visual trace viewer for debugging

**Cons:**
- 300MB browser binaries unnecessary for backend
- Slower than Jest/Supertest
- Not designed for unit testing
- Heavier CI/CD requirements
- Overkill for backend testing

**Reason for Rejection:** Playwright is optimized for browser automation, not backend testing. Jest + Supertest are faster, lighter, and more appropriate for NestJS.

### Alternative 2: Only Unit Tests (No Integration Tests)

**Pros:**
- Fastest possible test execution
- No database setup required
- Maximum isolation

**Cons:**
- Doesn't test real API behavior
- Misses integration bugs (database, validation, middleware)
- No confidence in actual HTTP responses
- Mock-heavy (tests become brittle)

**Reason for Rejection:** Integration tests are critical for API-first backends. Need to test real HTTP behavior with Supertest.

### Alternative 3: Jest + Postman/Newman for API Testing

**Pros:**
- Postman is familiar to many teams
- Can import/export collections
- Good for manual testing

**Cons:**
- Separate tool from code (not in version control)
- No TypeScript support
- Harder to integrate with CI/CD
- Less developer-friendly than Supertest

**Reason for Rejection:** Supertest is code-first, integrates with NestJS, and keeps tests in version control alongside code.

### Alternative 4: Full Playwright (Backend + Frontend)

**Pros:**
- Single testing tool across stack
- Unified test reports
- Complete E2E coverage

**Cons:**
- Massive overhead for backend (browsers not needed)
- Much slower test execution
- Higher CI/CD costs
- Wrong tool for backend unit/integration testing

**Reason for Rejection:** Using Playwright for everything is like using a sledgehammer for everything - not appropriate for fine-grained backend testing.

### Alternative 5: Mocha + Chai instead of Jest

**Pros:**
- More flexible (BDD style)
- Modular (choose assertion library)

**Cons:**
- Not NestJS default (Jest is)
- More setup required
- Smaller ecosystem for NestJS
- Less TypeScript support

**Reason for Rejection:** Jest is NestJS default and has better TypeScript integration. No reason to deviate from the standard.

---

## Implementation Guidelines

### 1. Unit Tests (Jest) - 60% Coverage

**For:** Services, utilities, business logic in isolation

**Example: Seat Calculator Service**
```typescript
// src/modules/billing/services/seat-calculator.service.spec.ts
import { Test } from '@nestjs/testing';
import { SeatCalculatorService } from './seat-calculator.service';

describe('SeatCalculatorService', () => {
  let service: SeatCalculatorService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [SeatCalculatorService],
    }).compile();

    service = module.get(SeatCalculatorService);
  });

  it('should calculate basic seat price', () => {
    const result = service.calculatePrice({
      seatCount: 100,
      pricePerSeat: 99.90,
    });

    expect(result).toBe(9990.00);
  });

  it('should apply volume discount for 100+ seats', () => {
    const result = service.calculatePriceWithDiscount({
      seatCount: 150,
      pricePerSeat: 99.90,
      discountTiers: [
        { min: 100, max: 200, discountPercent: 10 },
      ],
    });

    expect(result).toBe(13486.50); // 10% discount applied
  });
});
```

**Run:** `npm test` (fast, milliseconds)

### 2. Integration Tests (Supertest) - 30% Coverage

**For:** API endpoints with real NestJS app context

**Example: Contracts API**
```typescript
// test/contracts.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';

describe('ContractsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    prisma = app.get<PrismaService>(PrismaService);

    await app.init();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('POST /api/contracts should create contract', () => {
    return request(app.getHttpServer())
      .post('/api/contracts')
      .send({
        accountId: 'acc-123',
        contractNumber: 'CTR-2026-001',
        startDate: '2026-02-01',
        endDate: '2027-01-31',
        contractValue: 119880.00,
        seatCount: 100,
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.contractNumber).toBe('CTR-2026-001');
      });
  });
});
```

**Run:** `npm run test:e2e` (slower, hits database)

### 3. E2E Tests (Playwright) - 10% Coverage

**For:** Complete user flows through frontend (separate repo)

**Example: Invoice Creation Flow**
```typescript
// revenue-app/e2e/invoice-creation.spec.ts
import { test, expect } from '@playwright/test';

test('finance user creates invoice from contract', async ({ page }) => {
  await page.goto('/contracts');
  await page.click('text=CTR-2026-001');
  await page.click('button:has-text("Generate Invoice")');
  await page.fill('[name="purchaseOrderNumber"]', 'PO-123');
  await page.click('button:has-text("Create")');

  await expect(page.locator('.success-message')).toContainText('Invoice created');
  await expect(page.locator('text=INV-2026-001')).toBeVisible();
});
```

**Run:** `npx playwright test` (slowest, full stack)

### Test Database Setup

```typescript
// test/setup.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_TEST, // Separate test database
    },
  },
});

export async function setupTestDatabase() {
  await prisma.$executeRawUnsafe('DROP SCHEMA IF EXISTS public CASCADE');
  await prisma.$executeRawUnsafe('CREATE SCHEMA public');
  // Run migrations
  // Seed test data
}

export async function teardownTestDatabase() {
  await prisma.$disconnect();
}
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register node_modules/.bin/jest --runInBand"
  }
}
```

---

## Testing Guidelines by Module

### Phase 1: Foundation

| Module | Unit Tests | Integration Tests |
|--------|------------|-------------------|
| Accounts | AccountsService, validation logic | CRUD endpoints, hierarchy queries |
| Contracts | ContractsService, date validation | Contract creation, retrieval |
| Products | Volume discount calculation | Product catalog API |
| Invoices | Invoice number generation | Invoice CRUD, line items |

### Phase 2: Billing Engine

| Module | Unit Tests | Integration Tests |
|--------|------------|-------------------|
| Billing | Seat calculator, discount engine | Invoice generation from contract |
| Workers | PDF generation logic (mocked) | Queue job processing |
| Email | Template rendering | Email sending (mocked SMTP) |

### Phase 3: Hierarchical

| Module | Unit Tests | Integration Tests |
|--------|------------|-------------------|
| Hierarchy | Parent-child traversal utils | Recursive CTE queries |
| Consolidated | Aggregation logic | Consolidated invoice generation |

---

## Success Metrics

**This decision will be validated by:**

1. ✅ **Test execution speed < 60 seconds** for full suite (1000+ tests)
2. ✅ **Code coverage > 80%** across all modules
3. ✅ **Zero production bugs** from untested code paths
4. ✅ **Fast feedback loop** - Developers get test results in < 10 seconds (watch mode)
5. ✅ **CI/CD pipeline < 5 minutes** including all tests
6. ✅ **Easy onboarding** - New developers can write tests day 1

**Measurement Plan:**
- Track test execution time in CI/CD
- Monitor code coverage with Jest --coverage
- Track production bugs per module
- Developer satisfaction surveys

---

## Dependencies and Configuration

### Required Dependencies

```json
{
  "devDependencies": {
    "@nestjs/testing": "^10.0.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "supertest": "^6.3.0",
    "@types/supertest": "^2.0.12",
    "ts-jest": "^29.0.0",
    "@faker-js/faker": "^8.0.0"
  }
}
```

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.ts',
    '!**/node_modules/**',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### E2E Test Configuration

```javascript
// test/jest-e2e.json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  }
}
```

---

## Migration Plan

### Current State
- No testing framework configured yet (greenfield)

### Implementation Steps

**Week 1 (Phase 1 Setup):**
1. Configure Jest with NestJS
2. Set up test database (Docker Compose)
3. Create test utilities and helpers
4. Write first unit tests (AccountsService)
5. Write first integration tests (POST /api/accounts)

**Week 2-12 (Ongoing):**
1. All new code must include tests (enforced in code review)
2. Minimum 80% coverage per module
3. Integration tests for all API endpoints
4. Unit tests for all services and utilities

**CI/CD Integration:**
1. Run tests on every pull request
2. Block merge if tests fail or coverage drops
3. Generate coverage reports
4. Track test execution time trends

---

## Enforcement by tapsa

As task manager, I (tapsa) will enforce:

1. ✅ **Test-first development** - Tests written alongside code
2. ✅ **Code review checks** - All PRs must include tests
3. ✅ **Coverage thresholds** - Minimum 80% per module
4. ✅ **Fast tests** - Unit tests < 10ms, integration < 1s
5. ✅ **No Playwright for backend** - Reject PRs using Playwright for backend testing

**Red flags I'll catch:**
- ❌ Backend code without tests
- ❌ Playwright used for backend testing
- ❌ Tests taking too long (>1 minute for unit tests)
- ❌ Coverage dropping below 80%
- ❌ Flaky tests (random failures)

---

## References

**Testing Documentation:**
- [NestJS Testing Guide](https://docs.nestjs.com/fundamentals/testing)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/ladjs/supertest)
- [Playwright Documentation](https://playwright.dev/docs/intro) (for frontend only)

**Testing Best Practices:**
- [Testing Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)
- [NestJS Testing Best Practices](https://docs.nestjs.com/recipes/prisma#testing)

**Related Decisions:**
- ADR-001: NestJS + Fastify + SWC Framework
- `.claude/git-workflow.md` - Git workflow guidelines
- `docs/feature-spec.md` - Phase breakdown (141 tasks)

**Performance Benchmarks:**
- Jest vs Playwright: 50-100x faster for unit tests
- Supertest vs Playwright API: 10-20x faster for API tests

---

## Notes

- Playwright remains the tool of choice for frontend E2E tests (frooti's domain)
- Backend focuses on Jest (unit) + Supertest (integration)
- Full-stack E2E tests (UI → API → DB) handled by Playwright in frontend repo
- This separation keeps backend tests fast and focused
- biksi (backend) uses Jest + Supertest exclusively
- frooti (frontend) uses Playwright for E2E tests

---

## Revision History

- **2026-01-13:** Initial decision - Jest + Supertest for backend, Playwright for frontend E2E only
