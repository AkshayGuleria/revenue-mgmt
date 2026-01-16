# Local Deployment Testing Guide

Test your production Docker setup locally before deploying to a VPS. This ensures everything works correctly and catches issues early.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Test Environment Setup](#test-environment-setup)
4. [Running Tests](#running-tests)
5. [Manual Testing](#manual-testing)
6. [Troubleshooting](#troubleshooting)
7. [Cleanup](#cleanup)

---

## Quick Start

```bash
# Navigate to backend directory
cd packages/revenue-backend

# Run automated tests
./scripts/test-local-deployment.sh
```

The script will:
- ✅ Build Docker images
- ✅ Start PostgreSQL and API services
- ✅ Run database migrations
- ✅ Test all health endpoints
- ✅ Test API functionality
- ✅ Test backup scripts
- ✅ Report results

**Expected time:** 5-10 minutes

---

## Prerequisites

### Required Software

- **Docker Desktop** 24.0+ or Docker Engine
- **Docker Compose** v2+
- **curl** (for testing)
- **Git** (to clone repository)

### System Requirements

- **CPU:** 2+ cores
- **RAM:** 4GB+ available
- **Disk:** 5GB+ free space
- **OS:** macOS, Linux, or Windows with WSL2

### Verify Installation

```bash
# Check Docker
docker --version
# Expected: Docker version 24.0.0 or higher

# Check Docker Compose
docker compose version
# Expected: Docker Compose version v2.x.x

# Check Docker is running
docker ps
# Should show running containers or empty list (not an error)
```

---

## Test Environment Setup

### 1. Files Overview

The local testing environment uses:

| File | Purpose |
|------|---------|
| `docker-compose.local.yml` | Local container orchestration |
| `.env.local` | Local environment variables |
| `scripts/test-local-deployment.sh` | Automated test script |
| `nginx/conf.d/revenue-api-local.conf` | Local nginx config |

### 2. Environment Configuration

The `.env.local` file contains safe test values:

```env
NODE_ENV=production
PORT=5177
DB_USER=revenue_local
DB_PASSWORD=local_password_123
DB_NAME=revenue_db_local
ENABLE_SWAGGER=true
LOG_LEVEL=debug
```

**Note:** These are test values only - never use in production!

### 3. Port Configuration

Local setup uses different ports to avoid conflicts:

| Service | Local Port | Production Port |
|---------|------------|-----------------|
| API | 5177 | 5177 |
| PostgreSQL | 5433 | 5432 |
| Nginx (optional) | 8080 | 80/443 |

---

## Running Tests

### Automated Testing (Recommended)

Run the comprehensive test script:

```bash
./scripts/test-local-deployment.sh
```

**What it tests:**
1. **Prerequisites** - Docker, Compose, environment files
2. **Image Build** - Production Docker image builds successfully
3. **Service Startup** - PostgreSQL and API start without errors
4. **Database Migrations** - Prisma migrations apply correctly
5. **Health Endpoints** - Liveness and readiness checks work
6. **API Endpoints** - Root endpoint and Swagger docs accessible
7. **Database Operations** - Connections, tables, data insertion
8. **Backup Script** - Database backup creation
9. **Container Resources** - Health status, resource usage
10. **Logs** - Application logging works

**Sample Output:**

```
================================================
🧪 Local Deployment Test
================================================

================================================
Checking Prerequisites
================================================
✅ Docker is installed
✅ Docker is running
✅ Docker Compose is installed
✅ Environment file exists

================================================
Building Docker Images
================================================
✅ Docker image built successfully

================================================
Starting Services
================================================
✅ PostgreSQL is ready
✅ Migrations applied successfully
✅ API is ready

================================================
Testing Health Endpoints
================================================
✅ Liveness endpoint works
✅ Readiness endpoint works
✅ Database is healthy

================================================
Test Summary
================================================
Test Results:
  Passed: 15
  Failed: 0

✅ All tests passed!
```

### Manual Step-by-Step Testing

If you prefer manual testing or need to debug:

#### Step 1: Build Images

```bash
docker compose -f docker-compose.local.yml --env-file .env.local build
```

#### Step 2: Start PostgreSQL

```bash
docker compose -f docker-compose.local.yml --env-file .env.local up -d postgres

# Wait for PostgreSQL to be ready
docker compose -f docker-compose.local.yml --env-file .env.local logs -f postgres
# Look for "database system is ready to accept connections"
```

#### Step 3: Run Migrations

```bash
docker compose -f docker-compose.local.yml --env-file .env.local run --rm api npx prisma migrate deploy

# Verify migrations
docker compose -f docker-compose.local.yml --env-file .env.local run --rm api npx prisma migrate status
```

#### Step 4: Start API

```bash
docker compose -f docker-compose.local.yml --env-file .env.local up -d api

# View logs
docker compose -f docker-compose.local.yml --env-file .env.local logs -f api
# Look for "Nest application successfully started"
```

#### Step 5: Test Endpoints

```bash
# Test liveness
curl http://localhost:5177/health/liveness

# Test readiness
curl http://localhost:5177/health/readiness

# Test root endpoint
curl http://localhost:5177/

# Test Swagger UI (in browser)
open http://localhost:5177/api-docs
```

---

## Manual Testing

### Testing API Endpoints

#### 1. Health Checks

```bash
# Liveness (simple check)
curl -i http://localhost:5177/health/liveness

# Expected:
# HTTP/1.1 200 OK
# {"status":"ok","timestamp":"2026-01-16T..."}

# Readiness (comprehensive check)
curl -s http://localhost:5177/health/readiness | jq

# Expected JSON with database status:
# {
#   "status": "ok",
#   "info": {
#     "database": { "status": "up", "responseTime": 5 }
#   }
# }
```

#### 2. API Documentation

```bash
# Access Swagger UI
curl http://localhost:5177/api-docs

# Or open in browser:
open http://localhost:5177/api-docs
```

#### 3. CRUD Operations (using Swagger UI)

1. Open http://localhost:5177/api-docs
2. Try creating an account:
   - Click "POST /api/accounts"
   - Click "Try it out"
   - Enter test data:
     ```json
     {
       "accountName": "Test Company",
       "primaryContactEmail": "test@example.com"
     }
     ```
   - Click "Execute"
   - Should return 201 Created

3. Try retrieving accounts:
   - Click "GET /api/accounts"
   - Click "Try it out"
   - Click "Execute"
   - Should return your created account

### Testing Database

```bash
# Connect to PostgreSQL
docker compose -f docker-compose.local.yml --env-file .env.local exec postgres \
  psql -U revenue_local revenue_db_local

# List tables
\dt

# Query accounts
SELECT * FROM accounts;

# Exit
\q
```

### Testing Backup & Restore

```bash
# Create a backup
./scripts/backup-database.sh

# List backups
ls -lh backups/

# Test restore (will prompt for confirmation)
./scripts/restore-database.sh backup_revenue_db_local_YYYYMMDD_HHMMSS.sql.gz
```

### Testing with Nginx (Optional)

```bash
# Start with Nginx
docker compose -f docker-compose.local.yml --env-file .env.local --profile with-nginx up -d

# Test through Nginx
curl http://localhost:8080/health/liveness

# View Nginx logs
docker compose -f docker-compose.local.yml logs nginx
```

---

## Troubleshooting

### Issue: Port Already in Use

**Error:** "Bind for 0.0.0.0:5177 failed: port is already allocated"

**Solution:**
```bash
# Find process using port 5177
lsof -i :5177

# Kill the process
kill -9 <PID>

# Or change port in .env.local
PORT=5178
```

### Issue: Docker Build Fails

**Error:** "failed to solve: process ... exited with code 1"

**Solution:**
```bash
# Clear Docker build cache
docker builder prune -af

# Rebuild with no cache
docker compose -f docker-compose.local.yml --env-file .env.local build --no-cache
```

### Issue: PostgreSQL Won't Start

**Error:** "PostgreSQL container exits immediately"

**Solution:**
```bash
# Remove old volume
docker volume rm revenue_postgres_data_local

# Start fresh
docker compose -f docker-compose.local.yml --env-file .env.local up -d postgres

# Check logs
docker compose -f docker-compose.local.yml --env-file .env.local logs postgres
```

### Issue: Migrations Fail

**Error:** "P3009: Migrations directory not found"

**Solution:**
```bash
# Ensure you're in the correct directory
cd packages/revenue-backend

# Check migrations exist
ls -la prisma/migrations/

# Try running migrations again
docker compose -f docker-compose.local.yml --env-file .env.local run --rm api npx prisma migrate deploy
```

### Issue: API Won't Start

**Error:** "Application fails to start"

**Solution:**
```bash
# Check API logs
docker compose -f docker-compose.local.yml --env-file .env.local logs api

# Common issues:
# 1. Database not ready - wait longer
# 2. Environment variables missing - check .env.local
# 3. Build failed - rebuild image

# Restart API
docker compose -f docker-compose.local.yml --env-file .env.local restart api
```

### Issue: Health Check Fails

**Error:** "curl: (7) Failed to connect to localhost port 5177"

**Solution:**
```bash
# Check if API container is running
docker ps | grep revenue-api-local

# Check API logs
docker compose -f docker-compose.local.yml --env-file .env.local logs api

# Wait longer for startup (can take 30-60 seconds)
sleep 30
curl http://localhost:5177/health/liveness
```

### Debug Commands

```bash
# View all container logs
docker compose -f docker-compose.local.yml --env-file .env.local logs

# Check container status
docker compose -f docker-compose.local.yml --env-file .env.local ps

# Inspect specific container
docker inspect revenue-api-local

# Execute commands in running container
docker compose -f docker-compose.local.yml --env-file .env.local exec api sh

# Check resource usage
docker stats

# View networks
docker network ls

# View volumes
docker volume ls
```

---

## Cleanup

### Quick Cleanup

```bash
# Stop and remove containers, networks, volumes
docker compose -f docker-compose.local.yml --env-file .env.local down -v

# Remove test backups
rm -rf backups/backup_*.sql.gz

# Remove test logs
rm -rf logs/*.log
```

### Deep Cleanup

```bash
# Stop all containers
docker compose -f docker-compose.local.yml --env-file .env.local down -v

# Remove all images
docker rmi $(docker images -q 'revenue-backend*')

# Remove all volumes
docker volume rm revenue_postgres_data_local

# Remove build cache
docker builder prune -af

# Remove unused Docker resources
docker system prune -af --volumes
```

### Verify Cleanup

```bash
# Check no containers running
docker ps -a | grep revenue

# Check no volumes remain
docker volume ls | grep revenue

# Check disk space reclaimed
docker system df
```

---

## Comparing to Production

### Differences Between Local and Production

| Aspect | Local | Production |
|--------|-------|------------|
| **Port** | PostgreSQL on 5433 | PostgreSQL on 5432 |
| **SSL** | No HTTPS | HTTPS with Let's Encrypt |
| **Nginx** | Optional, port 8080 | Required, ports 80/443 |
| **Passwords** | Test values | Strong generated passwords |
| **Logging** | Debug level | Info level |
| **Swagger** | Enabled | Disabled (or protected) |
| **Resources** | No limits | CPU/Memory limits set |
| **Volumes** | Local named volumes | Persistent VPS volumes |

### Testing Production-Like Setup

To test closer to production:

```bash
# 1. Use production compose file
docker compose -f docker-compose.production.yml --env-file .env.local up -d

# 2. Enable Nginx with SSL (requires certificates)
docker compose -f docker-compose.local.yml --env-file .env.local --profile with-nginx up -d

# 3. Test with production-like data
# Import production-like test data into database

# 4. Load test with realistic traffic
# Use tools like Apache Bench or k6
ab -n 1000 -c 10 http://localhost:5177/health/liveness
```

---

## Next Steps After Successful Testing

1. ✅ **All tests passed locally**
2. 📝 **Review configuration files**
3. 🔒 **Set up GitHub secrets**
4. 🚀 **Deploy to production VPS** (see QUICK-START.md)
5. 📊 **Set up monitoring**

---

## Common Testing Scenarios

### Scenario 1: Test Before Production Deploy

```bash
# Full automated test
./scripts/test-local-deployment.sh

# If all pass, proceed with production deployment
```

### Scenario 2: Test After Code Changes

```bash
# Rebuild images
docker compose -f docker-compose.local.yml --env-file .env.local build

# Restart services
docker compose -f docker-compose.local.yml --env-file .env.local up -d

# Run specific tests
curl http://localhost:5177/health/readiness
```

### Scenario 3: Test Database Migrations

```bash
# Start services
docker compose -f docker-compose.local.yml --env-file .env.local up -d

# Create new migration (in dev)
npx prisma migrate dev --name add_new_feature

# Test migration in local production setup
docker compose -f docker-compose.local.yml --env-file .env.local run --rm api \
  npx prisma migrate deploy

# Verify migration
docker compose -f docker-compose.local.yml --env-file .env.local run --rm api \
  npx prisma migrate status
```

### Scenario 4: Performance Testing

```bash
# Start services
docker compose -f docker-compose.local.yml --env-file .env.local up -d

# Monitor resources
docker stats

# Load test (requires Apache Bench)
ab -n 10000 -c 100 http://localhost:5177/health/liveness

# Check for errors in logs
docker compose -f docker-compose.local.yml --env-file .env.local logs api | grep -i error
```

---

## Best Practices

1. **Always test locally first** before deploying to production
2. **Run full test script** after significant changes
3. **Monitor resource usage** during testing
4. **Check logs for errors** even when tests pass
5. **Test backup and restore** periodically
6. **Clean up regularly** to free disk space
7. **Document any issues** found during testing
8. **Keep local env in sync** with production config structure

---

## Support

- **Full Deployment Guide:** `/docs/PRODUCTION-DEPLOYMENT.md`
- **Quick Start Guide:** `/QUICK-START.md`
- **Scripts Documentation:** `/scripts/README.md`

---

**Last Updated:** 2026-01-16
