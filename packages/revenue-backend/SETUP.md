# Revenue Backend Setup Guide

Complete setup guide for the Revenue Management backend.

## Quick Start with Docker (Recommended)

### 1. Start Docker

If using Colima (macOS):
```bash
colima start
```

If using Docker Desktop:
- Start Docker Desktop application

### 2. Start Services

```bash
cd packages/revenue-backend
docker-compose up -d
```

This starts:
- **PostgreSQL 14** on localhost:5432
- **Redis 6** on localhost:6379

### 3. Verify Services

```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f postgres
```

Expected output:
```
NAME               STATUS    PORTS
revenue-postgres   Up        0.0.0.0:5432->5432/tcp
revenue-redis      Up        0.0.0.0:6379->6379/tcp
```

### 4. Setup Application

```bash
# Copy environment file
cp .env.example .env

# Install dependencies
npm install

# Run migrations
npm run prisma:migrate

# Generate Prisma client
npm run prisma:generate

# Start development server
npm run start:dev
```

### 5. Access Application

- **API:** http://localhost:5177
- **Swagger Docs:** http://localhost:5177/api/docs
- **Health Check:** http://localhost:5177/health

## Database Connection

The `.env` file contains:
```env
DATABASE_URL="postgresql://revenue_user:revenue_pass@localhost:5432/revenue_db?schema=public"
```

**Credentials:**
- Username: `revenue_user`
- Password: `revenue_pass`
- Database: `revenue_db`
- Port: `5432`

## Redis Connection

```env
REDIS_URL=redis://localhost:6379
```

Redis is required for Phase 2 (BullMQ job queues).

## Useful Commands

### Docker Management

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f postgres
docker-compose logs -f redis

# Remove everything (⚠️ deletes data)
docker-compose down -v
```

### Database Management

```bash
# Create a new migration
npm run prisma:migrate

# Reset database (⚠️ deletes data)
npx prisma migrate reset

# Open Prisma Studio (GUI)
npm run prisma:studio

# View database directly
docker exec -it revenue-postgres psql -U revenue_user -d revenue_db
```

### Redis Management

```bash
# Connect to Redis CLI
docker exec -it revenue-redis redis-cli

# Check Redis is working
docker exec -it revenue-redis redis-cli ping
# Should return: PONG
```

## Manual Setup (Without Docker)

If you prefer to install PostgreSQL and Redis manually:

### PostgreSQL Setup

1. Install PostgreSQL 14+
   ```bash
   # macOS with Homebrew
   brew install postgresql@14
   brew services start postgresql@14
   ```

2. Create database and user
   ```sql
   CREATE DATABASE revenue_db;
   CREATE USER revenue_user WITH PASSWORD 'revenue_pass';
   GRANT ALL PRIVILEGES ON DATABASE revenue_db TO revenue_user;
   ```

3. Update `.env` with your connection details

### Redis Setup

1. Install Redis 6+
   ```bash
   # macOS with Homebrew
   brew install redis
   brew services start redis
   ```

2. Verify Redis is running
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

## Troubleshooting

### Docker daemon not running

**Error:** `Cannot connect to the Docker daemon`

**Solution:**
```bash
# For Colima users
colima start

# For Docker Desktop users
# Start Docker Desktop application
```

### Port already in use

**Error:** `Bind for 0.0.0.0:5432 failed: port is already allocated`

**Solution:**
```bash
# Check what's using the port
lsof -i :5432

# Stop the conflicting service or change ports in docker-compose.yml
```

### Database connection refused

**Error:** `Error: P1001: Can't reach database server`

**Solution:**
1. Check Docker containers are running: `docker-compose ps`
2. Check logs: `docker-compose logs postgres`
3. Verify `.env` has correct `DATABASE_URL`
4. Restart containers: `docker-compose restart`

### Prisma migration fails

**Error:** `Migration failed to apply`

**Solution:**
```bash
# Reset database and reapply migrations
npx prisma migrate reset

# Or manually drop and recreate
docker-compose down -v
docker-compose up -d
npm run prisma:migrate
```

## Health Checks

### PostgreSQL
```bash
docker exec -it revenue-postgres pg_isready -U revenue_user -d revenue_db
```

### Redis
```bash
docker exec -it revenue-redis redis-cli ping
```

### Application
```bash
curl http://localhost:5177/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "revenue-backend",
  "timestamp": "2024-01-14T12:00:00.000Z"
}
```

## Next Steps

After setup:
1. Explore API docs at http://localhost:5177/api/docs
2. Run tests: `npm test`
3. Start implementing Phase 1 features (see `docs/feature-spec.md`)
4. Follow git workflow (see `.claude/git-workflow.md`)
