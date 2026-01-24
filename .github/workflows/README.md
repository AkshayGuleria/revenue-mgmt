# GitHub Actions Workflows

This directory contains GitHub Actions workflows for the Revenue Management system.

## Workflows

### 1. PR CI - Tests & Coverage (`pr-ci.yml`)

**Triggers:** Pull requests to `main`/`master` branches

**Purpose:** Comprehensive testing and validation for all pull requests

**Jobs:**

#### 1. Lint & Build
- Runs ESLint on all TypeScript files
- Builds the application to catch compilation errors
- Caches build artifacts for subsequent jobs

#### 2. Unit Tests
- Runs all Jest unit tests (`npm run test`)
- Uses PostgreSQL 16 and Redis 7 services
- Runs database migrations before tests
- Uploads test results as artifacts (30-day retention)

#### 3. E2E Tests
- Runs end-to-end tests (`npm run test:e2e`)
- Uses separate PostgreSQL database for isolation
- Tests complete API workflows
- Uploads test results as artifacts

#### 4. Coverage Check
- Runs tests with coverage reporting (`npm run test:cov`)
- Validates coverage thresholds (80% for all metrics)
- Uploads coverage to Codecov (if token configured)
- Comments coverage report on PR automatically
- Fails if coverage < 80% (statements, branches, functions, lines)

#### 5. Test Summary
- Aggregates results from all jobs
- Displays summary in GitHub Actions UI
- Fails if any job fails

**Coverage Thresholds:**
- Statements: 80%
- Branches: 80%
- Functions: 80%
- Lines: 80%

**Services:**
- PostgreSQL 16 (Alpine)
- Redis 7 (Alpine)

**Environment Variables:**
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `NODE_ENV`: Set to `test`

### 2. Security Scanning (`security-scan.yml`)

**Triggers:**
- Pull requests to `main`/`master` branches
- Pushes to `main`/`master` branches
- Daily at 2 AM UTC (scheduled)
- Manual workflow dispatch

**Purpose:** Comprehensive security scanning for vulnerabilities, secrets, and compliance

**Jobs:**

#### 1. npm Audit - Vulnerability Check
- Scans production dependencies for known vulnerabilities
- Fails on moderate or higher severity issues
- Checks dev dependencies (non-blocking)
- Generates JSON audit report artifact

#### 2. CodeQL Analysis - Code Security
- Static code analysis for security vulnerabilities
- Detects SQL injection, XSS, command injection, etc.
- Scans only `src/` directory (excludes tests)
- Uses security-and-quality query suite
- Results published to GitHub Security tab

#### 3. Dependency Review (PR only)
- Reviews new dependencies added in PRs
- Checks for security vulnerabilities
- Validates licenses (denies GPL, allows MIT/Apache/BSD/ISC)
- Posts summary comment on PR
- Fails on moderate+ severity issues

#### 4. Secrets Scanning
- Uses TruffleHog to detect leaked credentials
- Scans commit history for API keys, passwords, tokens
- Only flags verified secrets (reduces false positives)
- Covers database URLs, Stripe keys, SMTP passwords

#### 5. SBOM Generation
- Generates Software Bill of Materials (CycloneDX format)
- Lists all dependencies and versions
- Required for SOC2/ISO 27001 compliance
- 90-day artifact retention for audit trail

#### 6. Security Summary
- Aggregates results from all security jobs
- Displays comprehensive security status
- Fails if any critical check fails

**Security Checks:**
- ✅ Known vulnerabilities (npm audit)
- ✅ Code security issues (CodeQL)
- ✅ New dependency risks (Dependency Review)
- ✅ Leaked secrets (TruffleHog)
- ✅ Supply chain transparency (SBOM)

**Artifacts:**
- `npm-audit-report`: JSON vulnerability report (30 days)
- `sbom-cyclonedx`: Software Bill of Materials (90 days)

### 3. Production Deployment (`production-deploy.yml`)

**Triggers:** Pushes to `main`/`master` branches

**Purpose:** Deploy to production after successful tests

*See production-deploy.yml for details*

## Local Testing

To run the same checks locally:

```bash
# Navigate to backend directory
cd packages/revenue-backend

# Install dependencies
npm ci

# Generate Prisma client
npx prisma generate

# Run migrations (requires local PostgreSQL)
npx prisma migrate deploy

# Run all checks
npm run lint          # Lint check
npm run build         # Build check
npm run test          # Unit tests
npm run test:e2e      # E2E tests
npm run test:cov      # Coverage check

# Security checks
npm audit --audit-level=moderate --production  # Vulnerability scan
npx @cyclonedx/cyclonedx-npm --output-file sbom.json  # Generate SBOM
```

## Required Secrets

### Optional (for enhanced features):
- `CODECOV_TOKEN`: For uploading coverage to Codecov.io

## Artifacts

The workflows upload the following artifacts (30-day retention):

1. **unit-test-results**: Jest unit test coverage reports
2. **e2e-test-results**: E2E test results
3. **coverage-report**: Full coverage reports (HTML, JSON, LCOV)

## Coverage Report

Coverage reports are automatically posted as PR comments:

```
📊 Test Coverage Report

| Metric       | Coverage | Status |
|--------------|----------|--------|
| Statements   | 95.97%   | ✅     |
| Branches     | 89.05%   | ✅     |
| Functions    | 89.89%   | ✅     |
| Lines        | 96.48%   | ✅     |
```

## Troubleshooting

### Tests failing locally but passing in CI
- Ensure you're using Node.js 20.x
- Check PostgreSQL and Redis are running
- Verify DATABASE_URL environment variable

### Coverage below threshold
- Add missing unit tests for uncovered code
- Check coverage report artifacts for details
- Run `npm run test:cov` locally to see coverage gaps

### E2E tests timing out
- Check database connection
- Ensure Redis is running
- Increase timeout in jest-e2e.json if needed

## Performance

**PR CI Workflow:** ~5-7 minutes
- Lint & Build: ~2 minutes
- Unit Tests: ~2 minutes (parallel)
- E2E Tests: ~1 minute (parallel)
- Coverage: ~2 minutes (parallel)

**Security Scan Workflow:** ~8-10 minutes
- npm Audit: ~1 minute
- CodeQL Analysis: ~5-7 minutes (builds + scans)
- Dependency Review: ~30 seconds (PR only)
- Secrets Scan: ~1-2 minutes
- SBOM Generation: ~30 seconds

## Optimization

Jobs run in parallel where possible:
- `unit-tests`, `e2e-tests`, and `coverage` run concurrently after `lint-build`
- Separate PostgreSQL databases prevent conflicts
- Build artifacts are cached to speed up subsequent jobs
