#!/bin/bash

##############################################################################
# Database Backup Script
# Description: Automated PostgreSQL backup with retention policy
# Usage: ./backup-database.sh
##############################################################################

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${PROJECT_ROOT}/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}

# Load environment variables
if [ -f "${PROJECT_ROOT}/.env.production" ]; then
    source "${PROJECT_ROOT}/.env.production"
else
    echo "❌ Error: .env.production not found"
    exit 1
fi

DB_NAME="${DB_NAME:-revenue_db}"
DB_USER="${DB_USER:-revenue}"
BACKUP_FILE="backup_${DB_NAME}_${DATE}.sql.gz"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

echo "================================================"
echo "Database Backup Script"
echo "================================================"
echo "Database: ${DB_NAME}"
echo "Date: ${DATE}"
echo "Backup directory: ${BACKUP_DIR}"
echo "================================================"

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

# Create backup
echo -e "${YELLOW}🔄 Creating database backup...${NC}"
docker compose -f "${PROJECT_ROOT}/docker-compose.production.yml" exec -T postgres \
    pg_dump -U "${DB_USER}" "${DB_NAME}" | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"

# Check if backup was successful
if [ $? -eq 0 ] && [ -f "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
    BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
    echo -e "${GREEN}✅ Backup created successfully: ${BACKUP_FILE} (${BACKUP_SIZE})${NC}"
else
    echo -e "${RED}❌ Error: Backup failed${NC}"
    exit 1
fi

# Delete old backups based on retention policy
echo -e "${YELLOW}🗑️  Cleaning up old backups (retention: ${RETENTION_DAYS} days)...${NC}"
OLD_BACKUPS=$(find "${BACKUP_DIR}" -name "backup_*.sql.gz" -mtime +${RETENTION_DAYS})

if [ -n "$OLD_BACKUPS" ]; then
    echo "$OLD_BACKUPS" | while read -r file; do
        rm -f "$file"
        echo "Deleted: $(basename "$file")"
    done
    echo -e "${GREEN}✅ Old backups cleaned up${NC}"
else
    echo "No old backups to delete"
fi

# List recent backups
echo ""
echo "Recent backups:"
ls -lh "${BACKUP_DIR}" | tail -n 10

# Calculate total backup size
TOTAL_SIZE=$(du -sh "${BACKUP_DIR}" | cut -f1)
echo ""
echo "Total backup size: ${TOTAL_SIZE}"

echo "================================================"
echo -e "${GREEN}✅ Backup completed successfully!${NC}"
echo "================================================"

exit 0
