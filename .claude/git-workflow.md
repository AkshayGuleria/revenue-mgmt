# Git Workflow Guide

**Audience:** Implementation agents (biksi, frooti, habibi)
**Enforced by:** tapsa (Task Manager & Tracker)
**Updated:** 2026-01-13

---

## Branch Strategy

### 🚨 CRITICAL RULE: Never Commit Directly to Master

**All implementation work MUST be done on feature/fix branches.**

### Branch Naming Convention

Use descriptive branch names following this pattern:

```
<type>/<scope>-<short-description>

Examples:
- feature/accounts-crud-api
- feature/contract-billing-engine
- fix/invoice-calculation-bug
- refactor/prisma-schema-optimization
- docs/api-documentation
- test/contract-service-unit-tests
```

#### Branch Types

| Type | Purpose | Examples |
|------|---------|----------|
| `feature/` | New functionality | `feature/consolidated-billing`, `feature/volume-discounts` |
| `fix/` | Bug fixes | `fix/seat-calculation-error`, `fix/duplicate-invoice-generation` |
| `refactor/` | Code refactoring (no behavior change) | `refactor/billing-service-cleanup` |
| `test/` | Adding or updating tests | `test/contracts-e2e-tests` |
| `docs/` | Documentation only | `docs/api-endpoints-swagger` |
| `chore/` | Maintenance tasks | `chore/update-dependencies`, `chore/setup-ci-pipeline` |

#### Scope Guidelines

Use the module or area of work:
- `accounts` - Account management
- `contracts` - Contract management
- `products` - Product catalog
- `invoices` - Invoice generation
- `billing` - Billing engine
- `payments` - Payment processing
- `analytics` - Reporting and analytics
- `infrastructure` - Database, queues, workers
- `auth` - Authentication
- `setup` - Initial project setup

---

## Workflow for Implementation Agents

### 1. Before Starting Work

**Always check the current state:**

```bash
# Ensure you're on master
git checkout master

# Pull latest changes
git pull origin master

# Verify clean state
git status
```

### 2. Create Feature/Fix Branch

**Syntax:**
```bash
git checkout -b <type>/<scope>-<description>
```

**Examples:**

**biksi (Backend) creating branches:**
```bash
# Phase 1 - Accounts API
git checkout -b feature/accounts-crud-api

# Phase 1 - Contracts API
git checkout -b feature/contracts-management-api

# Phase 2 - Billing Engine
git checkout -b feature/contract-billing-engine

# Fix a bug
git checkout -b fix/seat-calculation-rounding
```

**frooti (Frontend) creating branches:**
```bash
# Phase 1 - Accounts UI
git checkout -b feature/accounts-dashboard-ui

# Phase 2 - Invoice List
git checkout -b feature/invoice-list-component

# Fix styling issue
git checkout -b fix/invoice-table-overflow
```

**riina (Backend Testing) creating branches:**
```bash
# Phase 1 - Unit tests for accounts
git checkout -b test/accounts-service-unit-tests

# Phase 2 - Integration tests for billing
git checkout -b test/billing-engine-integration-tests

# Fix flaky test
git checkout -b fix/invoice-test-race-condition
```

**piia (Frontend Testing) creating branches:**
```bash
# Phase 1 - E2E tests for invoice flow
git checkout -b test/invoice-creation-e2e

# Phase 2 - Visual regression tests
git checkout -b test/dashboard-visual-regression

# Fix flaky E2E test
git checkout -b fix/invoice-list-e2e-timeout
```

**habibi (Infrastructure) creating branches:**
```bash
# Phase 1 - Database setup
git checkout -b setup/postgresql-docker-compose

# Phase 2 - Worker configuration
git checkout -b setup/pm2-cluster-workers

# Performance optimization
git checkout -b refactor/database-connection-pooling
```

### 3. Make Changes and Commit

**Work on your branch:**
```bash
# Make your changes
# ... code, code, code ...

# Stage changes
git add <files>

# Commit with descriptive message
git commit -m "feat: implement accounts CRUD endpoints

- Add AccountsController with GET/POST/PUT/DELETE
- Add AccountsService with business logic
- Add AccountsRepository for database operations
- Add DTOs for request validation
- Add unit tests for AccountsService

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**Commit message format:**
```
<type>: <short summary>

<detailed description>

<optional footer>
```

**Commit types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `docs:` - Documentation
- `chore:` - Maintenance
- `perf:` - Performance improvement

### 4. Keep Branch Updated

**If master has new changes while you work:**
```bash
# Save your work
git add .
git commit -m "wip: save progress"

# Update from master
git checkout master
git pull origin master

# Rebase your branch
git checkout feature/your-branch
git rebase master

# Resolve conflicts if any
# ... fix conflicts ...
git add <resolved-files>
git rebase --continue
```

### 5. Before Merging

**Checklist:**
- ✅ All tests pass (`npm test`)
- ✅ Build succeeds (`npm run build`)
- ✅ Linting passes (`npm run lint`)
- ✅ No console.log or debug code
- ✅ Branch is up-to-date with master
- ✅ Commit messages are clean

### 6. Merge to Master

**Option A: Fast-forward merge (preferred for small changes)**
```bash
# Switch to master
git checkout master

# Pull latest
git pull origin master

# Merge your branch (fast-forward)
git merge --ff-only feature/your-branch

# If fast-forward fails, rebase first
# git checkout feature/your-branch
# git rebase master
# git checkout master
# git merge --ff-only feature/your-branch
```

**Option B: Squash merge (for multiple commits)**
```bash
# Switch to master
git checkout master

# Pull latest
git pull origin master

# Squash merge
git merge --squash feature/your-branch

# Commit with clean message
git commit -m "feat: implement accounts CRUD API

Complete implementation of accounts management endpoints
including CRUD operations, validation, and tests."
```

### 7. Clean Up

**Delete merged branch:**
```bash
# Delete local branch
git branch -d feature/your-branch

# If branch was pushed to remote
git push origin --delete feature/your-branch
```

---

## Branch Lifecycle Examples

### Example 1: biksi implements Accounts API (Phase 1, Task 10-14)

```bash
# 1. Create branch
git checkout master
git pull origin master
git checkout -b feature/accounts-crud-api

# 2. Implement (multiple commits ok on feature branch)
# Implement AccountsController
git add src/modules/accounts/
git commit -m "feat: add accounts controller with GET/POST endpoints"

# Implement AccountsService
git add src/modules/accounts/accounts.service.ts
git commit -m "feat: add accounts service with business logic"

# Add tests
git add src/modules/accounts/accounts.service.spec.ts
git commit -m "test: add unit tests for accounts service"

# 3. Verify everything works
npm test
npm run build

# 4. Rebase to clean up commits (optional)
git rebase -i HEAD~3  # Squash into 1-2 meaningful commits

# 5. Merge to master
git checkout master
git pull origin master
git merge --squash feature/accounts-crud-api
git commit -m "feat: implement accounts CRUD API

- Add AccountsController with GET/POST/PUT/DELETE endpoints
- Add AccountsService with business logic and validation
- Add AccountsRepository for database operations
- Add DTOs with class-validator
- Add comprehensive unit tests

Closes Phase 1 Tasks 10-14

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# 6. Clean up
git branch -d feature/accounts-crud-api
```

### Example 2: frooti builds Invoice Dashboard (Phase 2, Task 26)

```bash
# 1. Create branch
git checkout master
git pull origin master
git checkout -b feature/invoice-dashboard-ui

# 2. Implement
# Create components
git add src/components/InvoiceList.tsx
git commit -m "feat: add invoice list component with pagination"

git add src/components/InvoiceFilters.tsx
git commit -m "feat: add invoice filters (status, date range, account)"

git add src/hooks/useInvoices.ts
git commit -m "feat: add useInvoices hook for API integration"

# 3. Test and verify
npm run dev  # Manual testing
npm test     # Unit tests

# 4. Merge to master (squash multiple commits)
git checkout master
git pull origin master
git merge --squash feature/invoice-dashboard-ui
git commit -m "feat: implement invoice dashboard UI

- Add InvoiceList component with pagination
- Add invoice filters (status, date, account)
- Add useInvoices hook for API integration
- Add loading states and error handling

Closes Phase 2 Task 26

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# 5. Clean up
git branch -d feature/invoice-dashboard-ui
```

### Example 3: habibi sets up PM2 cluster (Phase 2, Task 56)

```bash
# 1. Create branch
git checkout master
git pull origin master
git checkout -b setup/pm2-cluster-config

# 2. Implement
git add ecosystem.config.js
git commit -m "chore: add PM2 ecosystem config for cluster mode"

git add docs/deployment.md
git commit -m "docs: add PM2 cluster deployment guide"

# 3. Test
pm2 start ecosystem.config.js  # Local testing
pm2 logs                        # Verify all workers running

# 4. Merge to master
git checkout master
git pull origin master
git merge --ff-only setup/pm2-cluster-config

# 5. Clean up
git branch -d setup/pm2-cluster-config
```

---

## Common Scenarios

### Scenario 1: Work in Progress - Need to Switch Branches

```bash
# Option A: Commit WIP
git add .
git commit -m "wip: save progress on accounts API"
git checkout master
# ... do other work ...
git checkout feature/accounts-crud-api
# Continue work, amend or rebase later

# Option B: Stash changes
git stash push -m "WIP on accounts API"
git checkout master
# ... do other work ...
git checkout feature/accounts-crud-api
git stash pop
```

### Scenario 2: Accidentally Committed to Master

```bash
# 🚨 OOPS! Committed directly to master

# 1. Create a branch with current work
git branch feature/oops-my-work

# 2. Reset master to previous state
git reset --hard HEAD~1

# 3. Switch to new branch
git checkout feature/oops-my-work

# Now you can properly merge later
```

### Scenario 3: Long-Running Feature Branch

```bash
# Your branch is getting old, master has moved ahead

# Option A: Regularly rebase
git checkout feature/long-running-feature
git fetch origin
git rebase origin/master

# Option B: Merge master into feature (less preferred)
git checkout feature/long-running-feature
git merge master
```

### Scenario 4: Multiple Agents Working on Related Features

**Coordination required:**

```bash
# biksi working on accounts API
git checkout -b feature/accounts-crud-api

# frooti needs biksi's API to build UI
# Option 1: Wait for biksi to merge to master
# Option 2: Create branch from biksi's branch
git checkout feature/accounts-crud-api
git checkout -b feature/accounts-ui-from-api
# ... frooti's work ...
```

**tapsa's note:** Coordinate dependencies in sprint planning!

---

## Enforcement by tapsa

As task manager, I (tapsa) will:

1. ✅ **Review branch names** - Must follow convention
2. ✅ **Verify no direct master commits** - All work on feature branches
3. ✅ **Check commit messages** - Must be descriptive
4. ✅ **Coordinate dependencies** - Ensure proper branch order
5. ✅ **Track branch lifecycle** - Monitor stale branches
6. ✅ **Enforce clean merges** - Squash when appropriate

**Red flags I'll catch:**
- ❌ Direct commits to master without feature branch
- ❌ Branches with unclear names like `fix-stuff` or `test`
- ❌ Merge conflicts due to outdated branches
- ❌ Pushing WIP commits to master
- ❌ Forgetting to delete merged branches

---

## Quick Reference Card

**Starting new work:**
```bash
git checkout master && git pull
git checkout -b <type>/<scope>-<description>
```

**Regular commits on feature branch:**
```bash
git add <files>
git commit -m "<type>: <message>"
```

**Keep branch updated:**
```bash
git checkout master && git pull
git checkout <your-branch>
git rebase master
```

**Merge to master (squash):**
```bash
git checkout master && git pull
git merge --squash <your-branch>
git commit -m "<clean message>"
git branch -d <your-branch>
```

**Emergency - switch branches:**
```bash
git stash push -m "WIP description"
git checkout <other-branch>
# ... later ...
git checkout <original-branch>
git stash pop
```

---

## Summary

**Golden Rules:**
1. 🚨 **NEVER commit directly to master**
2. ✅ **Always create a feature/fix branch**
3. ✅ **Use descriptive branch names**
4. ✅ **Write clear commit messages**
5. ✅ **Keep branches short-lived** (merge frequently)
6. ✅ **Clean up after merging** (delete branch)
7. ✅ **Coordinate with tapsa** for dependencies

**Questions?** Ask tapsa (Task Manager) for clarification!

---

**Last Updated:** 2026-01-13
**Maintained by:** tapsa (Task Manager & Tracker)
