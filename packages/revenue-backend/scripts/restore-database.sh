#!/bin/bash

##############################################################################
# Database Restore Script
# Description: Restore PostgreSQL database from backup
# Usage: ./restore-database.sh <backup_file>
#   Example: ./restore-database.sh backup_revenue_db_20260116_020000.sql.gz
##############################################################################

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${PROJECT_ROOT}/backups"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backup file is provided
if [ -z "$1" ]; then
    echo -e "${RED}❌ Error: No backup file specified${NC}"
    echo "Usage: $0 <backup_file>"
    echo ""
    echo "Available backups:"
    ls -lh "${BACKUP_DIR}" | grep "backup_.*\.sql\.gz"
    exit 1
fi

BACKUP_FILE="$1"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

# Check if backup file exists
if [ ! -f "${BACKUP_PATH}" ]; then
    echo -e "${RED}❌ Error: Backup file not found: ${BACKUP_PATH}${NC}"
    echo ""
    echo "Available backups:"
    ls -lh "${BACKUP_DIR}" | grep "backup_.*\.sql\.gz"
    exit 1
fi

# Load environment variables
if [ -f "${PROJECT_ROOT}/.env.production" ]; then
    source "${PROJECT_ROOT}/.env.production"
else
    echo -e "${RED}❌ Error: .env.production not found${NC}"
    exit 1
fi

DB_NAME="${DB_NAME:-revenue_db}"
DB_USER="${DB_USER:-revenue}"

echo "================================================"
echo "Database Restore Script"
echo "================================================"
echo "⚠️  WARNING: This will OVERWRITE the current database!"
echo "Database: ${DB_NAME}"
echo "Backup file: ${BACKUP_FILE}"
echo "================================================"

# Confirmation prompt
read -p "Are you sure you want to proceed? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Docker is not running${NC}"
    exit 1
fi

# Check if PostgreSQL container is running
if ! docker compose -f "${PROJECT_ROOT}/docker-compose.production.yml" ps postgres | grep -q "Up"; then
    echo -e "${RED}❌ Error: PostgreSQL container is not running${NC}"
    exit 1
fi

# Create backup of current database before restore
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PRE_RESTORE_BACKUP="${BACKUP_DIR}/pre_restore_backup_${TIMESTAMP}.sql.gz"

echo -e "${YELLOW}🔄 Creating backup of current database before restore...${NC}"
docker compose -f "${PROJECT_ROOT}/docker-compose.production.yml" exec -T postgres \
    pg_dump -U "${DB_USER}" "${DB_NAME}" | gzip > "${PRE_RESTORE_BACKUP}"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Pre-restore backup created: pre_restore_backup_${TIMESTAMP}.sql.gz${NC}"
else
    echo -e "${RED}❌ Warning: Failed to create pre-restore backup${NC}"
    read -p "Continue anyway? (yes/no): " CONTINUE
    if [ "$CONTINUE" != "yes" ]; then
        exit 1
    fi
fi

# Stop API to prevent connections during restore
echo -e "${YELLOW}🔄 Stopping API service...${NC}"
docker compose -f "${PROJECT_ROOT}/docker-compose.production.yml" stop api

# Terminate existing connections
echo -e "${YELLOW}🔄 Terminating existing database connections...${NC}"
docker compose -f "${PROJECT_ROOT}/docker-compose.production.yml" exec -T postgres \
    psql -U "${DB_USER}" -d postgres -c \
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();"

# Drop and recreate database
echo -e "${YELLOW}🔄 Dropping and recreating database...${NC}"
docker compose -f "${PROJECT_ROOT}/docker-compose.production.yml" exec -T postgres \
    psql -U "${DB_USER}" -d postgres -c "DROP DATABASE IF EXISTS ${DB_NAME};"

docker compose -f "${PROJECT_ROOT}/docker-compose.production.yml" exec -T postgres \
    psql -U "${DB_USER}" -d postgres -c "CREATE DATABASE ${DB_NAME};"

# Restore from backup
echo -e "${YELLOW}🔄 Restoring database from backup...${NC}"
gunzip -c "${BACKUP_PATH}" | \
    docker compose -f "${PROJECT_ROOT}/docker-compose.production.yml" exec -T postgres \
    psql -U "${DB_USER}" "${DB_NAME}"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database restored successfully${NC}"
else
    echo -e "${RED}❌ Error: Database restore failed${NC}"
    echo "You may need to restore from the pre-restore backup: ${PRE_RESTORE_BACKUP}"
    exit 1
fi

# Run Prisma migrations to ensure schema is up to date
echo -e "${YELLOW}🔄 Running database migrations...${NC}"
docker compose -f "${PROJECT_ROOT}/docker-compose.production.yml" run --rm api \
    npx prisma migrate deploy

# Verify restoration
echo -e "${YELLOW}🔄 Verifying database restoration...${NC}"
ACCOUNT_COUNT=$(docker compose -f "${PROJECT_ROOT}/docker-compose.production.yml" exec -T postgres \
    psql -U "${DB_USER}" "${DB_NAME}" -t -c "SELECT COUNT(*) FROM accounts;")

echo "Accounts in database: ${ACCOUNT_COUNT}"

# Start API service
echo -e "${YELLOW}🔄 Starting API service...${NC}"
docker compose -f "${PROJECT_ROOT}/docker-compose.production.yml" start api

# Wait for API to be ready
echo -e "${YELLOW}🔄 Waiting for API to be ready...${NC}"
sleep 10

# Health check
HEALTH_STATUS=$(curl -s http://localhost:5177/health/liveness | grep -o '"status":"ok"' || echo "failed")

if [ "$HEALTH_STATUS" = '"status":"ok"' ]; then
    echo -e "${GREEN}✅ API is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Warning: API health check failed${NC}"
fi

echo "================================================"
echo -e "${GREEN}✅ Database restore completed!${NC}"
echo "================================================"
echo "Pre-restore backup saved at: ${PRE_RESTORE_BACKUP}"
echo ""

exit 0
