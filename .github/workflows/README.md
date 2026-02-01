# GitHub Actions Workflows

This directory contains CI/CD workflows for the Revenue Management System.

## Workflows

### 1. Frontend CI (`frontend-ci.yml`)

**Triggers:**
- Pull requests to `master`, `main`, or `develop` (when frontend files change)
- Pushes to `master`, `main`, or `develop` (when frontend files change)

**Jobs:**
- **Lint & Type Check**: Runs ESLint and TypeScript type checking
- **Build**: Builds the React application
- **E2E Tests**: Runs Playwright end-to-end tests
- **PR Comment**: Posts a summary comment on the PR

**Artifacts:**
- `frontend-build`: Built application (7 days retention)
- `playwright-report`: Test report with screenshots/videos (7 days retention)
- `test-results`: Raw test results (7 days retention)

---

### 2. Backend CI (`backend-ci.yml`)

**Triggers:**
- Pull requests to `master`, `main`, or `develop` (when backend files change)
- Pushes to `master`, `main`, or `develop` (when backend files change)

**Jobs:**
- **Lint & Type Check**: Runs ESLint and TypeScript compilation
- **Unit & Integration Tests**: Runs Jest tests with PostgreSQL and Redis
- **Build**: Builds the NestJS application

**Services:**
- PostgreSQL 15 (port 5432)
- Redis 7 (port 6379)

**Artifacts:**
- `backend-coverage`: Test coverage report (7 days retention)
- `backend-build`: Built application (7 days retention)

---

### 3. PR Validation (`pr-validation.yml`)

**Triggers:**
- Pull requests (opened, edited, synchronize, reopened)

**Validations:**
- ✅ **PR Title**: Must use conventional commit format (feat:, fix:, docs:, etc.)
- ✅ **PR Description**: Minimum 50 characters
- ⚠️ **Issue Links**: Recommends linking issues (optional)

---

## Conventional Commit Prefixes

All PR titles must start with one of these prefixes:

- \`feat:\` - New feature
- \`fix:\` - Bug fix
- \`docs:\` - Documentation changes
- \`refactor:\` - Code refactoring
- \`test:\` - Adding or updating tests
- \`chore:\` - Maintenance tasks
- \`perf:\` - Performance improvements
- \`ci:\` - CI/CD pipeline changes
- \`build:\` - Build system changes
- \`revert:\` - Revert previous changes

**Examples:**
✅ feat: add multi-currency support to invoice form
✅ fix: resolve undefined metadata property access
❌ Add new feature (missing prefix)

---

## Local Testing

### Frontend
cd packages/revenue-frontend && npm run lint && npm run typecheck && npm run build && npm run test:e2e

### Backend
cd packages/revenue-backend && npm run lint && npm run build && npm run test
