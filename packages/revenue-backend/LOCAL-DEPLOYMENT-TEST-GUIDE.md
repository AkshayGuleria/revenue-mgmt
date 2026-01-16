# Local Deployment Testing - Quick Reference

## 🎯 Purpose

Test your production Docker setup locally before deploying to ensure:
- ✅ Docker images build correctly
- ✅ Services start without errors
- ✅ Database migrations work
- ✅ API endpoints respond
- ✅ Health checks pass
- ✅ Backups function properly

## ⚡ Quick Start (5 minutes)

```bash
# Navigate to backend directory
cd packages/revenue-backend

# Run comprehensive automated tests
./scripts/test-local-deployment.sh
```

## 📋 What Gets Tested

### 1. Prerequisites Check
- Docker installation
- Docker Compose availability
- Environment file existence

### 2. Image Build
- Production Dockerfile builds successfully
- All dependencies install correctly
- Prisma Client generates

### 3. Service Startup
- PostgreSQL starts and accepts connections
- API service starts successfully
- All health checks pass

### 4. Database Operations
- Migrations apply without errors
- Tables are created
- Data can be inserted and queried

### 5. API Functionality
- Health endpoints (liveness/readiness)
- Root endpoint
- API documentation (Swagger)

### 6. Backup Operations
- Backup script executes
- Backup files are created
- Compression works

### 7. Resource Monitoring
- Container health status
- CPU and memory usage
- Log generation

## 📂 Files Used

```
packages/revenue-backend/
├── docker-compose.local.yml          # Local orchestration
├── .env.local                        # Test environment config
├── scripts/
│   └── test-local-deployment.sh      # Automated test script
├── nginx/
│   └── conf.d/
│       └── revenue-api-local.conf    # Local nginx config
└── docs/
    └── LOCAL-TESTING.md              # Detailed testing guide
```

## 🔧 Configuration

### Environment (.env.local)

```env
# Safe test values - DO NOT use in production!
NODE_ENV=production
PORT=5177
DB_USER=revenue_local
DB_PASSWORD=local_password_123
DB_NAME=revenue_db_local
DB_PORT=5433
ENABLE_SWAGGER=true
LOG_LEVEL=debug
```

### Ports

| Service | Port | Notes |
|---------|------|-------|
| API | 5177 | Same as production |
| PostgreSQL | 5433 | Avoids conflicts with local DB |
| Nginx | 8080 | Optional, only with --profile |

## 📊 Expected Results

### ✅ Success Output

```
================================================
🧪 Local Deployment Test
================================================

Checking Prerequisites
✅ Docker is installed
✅ Docker is running
✅ Docker Compose is installed
✅ Environment file exists

Building Docker Images
✅ Docker image built successfully

Starting Services
✅ PostgreSQL is ready
✅ Migrations applied successfully
✅ API is ready

Testing Health Endpoints
✅ Liveness endpoint works
✅ Readiness endpoint works
✅ Database is healthy

Testing API Endpoints
✅ Root endpoint works
✅ API documentation is accessible

Testing Database Operations
✅ Database connection works
✅ Database tables exist (count: 5)
✅ Data insertion works

Testing Backup Script
✅ Backup script executed successfully
✅ Backup file created

Testing Container Resources
✅ API container is running
✅ PostgreSQL container is running
✅ API container is healthy

Testing Logs
✅ API logs are being generated
✅ No errors found in logs

Test Summary
Test Results:
  Passed: 15
  Failed: 0

✅ All tests passed!

Your deployment is ready for production!
```

## 🛠️ Manual Testing

If you need to test specific components:

### Test Health Endpoints

```bash
# Liveness
curl http://localhost:5177/health/liveness

# Expected: {"status":"ok","timestamp":"..."}

# Readiness
curl http://localhost:5177/health/readiness

# Expected: JSON with database status "up"
```

### Test API Documentation

```bash
# In terminal
curl http://localhost:5177/api-docs

# In browser
open http://localhost:5177/api-docs
```

### Test Database

```bash
# Connect to PostgreSQL
docker compose -f docker-compose.local.yml --env-file .env.local exec postgres \
  psql -U revenue_local revenue_db_local

# List tables
\dt

# Query data
SELECT * FROM accounts LIMIT 5;

# Exit
\q
```

### Test Backup & Restore

```bash
# Create backup
./scripts/backup-database.sh

# List backups
ls -lh backups/

# Test restore (with confirmation prompt)
./scripts/restore-database.sh backup_revenue_db_local_YYYYMMDD_HHMMSS.sql.gz
```

## 🚨 Common Issues & Fixes

### Issue: Port Conflict

**Error:** "port is already allocated"

**Fix:**
```bash
# Find and kill process using port 5177
lsof -i :5177
kill -9 <PID>

# Or change port in .env.local
echo "PORT=5178" >> .env.local
```

### Issue: Build Fails

**Error:** "failed to solve"

**Fix:**
```bash
# Clear cache and rebuild
docker builder prune -af
docker compose -f docker-compose.local.yml --env-file .env.local build --no-cache
```

### Issue: Database Won't Start

**Error:** "PostgreSQL exits immediately"

**Fix:**
```bash
# Remove old volume and restart
docker volume rm revenue_postgres_data_local
docker compose -f docker-compose.local.yml --env-file .env.local up -d postgres
```

### Issue: Migration Fails

**Error:** "Migration directory not found"

**Fix:**
```bash
# Ensure you're in correct directory
cd packages/revenue-backend

# Check migrations exist
ls prisma/migrations/

# Run migrations again
docker compose -f docker-compose.local.yml --env-file .env.local run --rm api npx prisma migrate deploy
```

## 🧹 Cleanup

### Quick Cleanup (keeps images)

```bash
# Stop and remove containers + volumes
docker compose -f docker-compose.local.yml --env-file .env.local down -v

# Remove test files
rm -rf backups/backup_*.sql.gz logs/*.log
```

### Full Cleanup (removes everything)

```bash
# Stop containers
docker compose -f docker-compose.local.yml --env-file .env.local down -v

# Remove images
docker rmi $(docker images -q 'revenue-backend*')

# Remove volumes
docker volume rm revenue_postgres_data_local

# Clean Docker system
docker system prune -af --volumes
```

## 📝 Test Checklist

Before deploying to production, ensure:

- [ ] All automated tests pass
- [ ] No errors in logs
- [ ] Health endpoints return 200 OK
- [ ] Database migrations apply successfully
- [ ] API documentation loads
- [ ] Backup script creates valid backups
- [ ] Containers stay healthy for 5+ minutes
- [ ] No port conflicts
- [ ] Docker images build without errors
- [ ] All services start within 60 seconds

## 🎓 Next Steps

After successful local testing:

1. ✅ **Review Results** - Check all tests passed
2. 📚 **Read Full Docs** - See `docs/LOCAL-TESTING.md`
3. 🔒 **Setup GitHub Secrets** - For CI/CD pipeline
4. 🚀 **Deploy to Production** - Follow `QUICK-START.md`
5. 📊 **Setup Monitoring** - Configure alerts

## 📞 Need Help?

- **Detailed Guide:** `docs/LOCAL-TESTING.md`
- **Production Deployment:** `docs/PRODUCTION-DEPLOYMENT.md`
- **Quick Start:** `QUICK-START.md`
- **Scripts Guide:** `scripts/README.md`

## ⏱️ Time Estimates

| Task | Time |
|------|------|
| Automated test (first run) | 5-10 min |
| Automated test (cached) | 2-3 min |
| Manual testing | 10-15 min |
| Troubleshooting (if needed) | 5-30 min |

## 🎯 Success Criteria

Your deployment is ready for production when:

✅ **All 15 automated tests pass**
✅ **No errors in application logs**
✅ **Health checks respond < 1 second**
✅ **Database operations work correctly**
✅ **Backup script completes successfully**
✅ **Containers maintain healthy status**

---

**Quick Commands:**

```bash
# Run tests
./scripts/test-local-deployment.sh

# View logs
docker compose -f docker-compose.local.yml --env-file .env.local logs -f

# Check status
docker compose -f docker-compose.local.yml --env-file .env.local ps

# Cleanup
docker compose -f docker-compose.local.yml --env-file .env.local down -v
```

---

**Ready to test? Run:** `./scripts/test-local-deployment.sh`
