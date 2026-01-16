# Production Scripts

Collection of utility scripts for production deployment, monitoring, and maintenance.

## Available Scripts

### 1. `backup-database.sh`

**Purpose:** Automated PostgreSQL database backup with retention policy

**Usage:**
```bash
./backup-database.sh
```

**Features:**
- Creates compressed `.sql.gz` backups
- Automatic retention policy (default: 30 days)
- Timestamp-based filenames
- Backup size reporting

**Configuration:**
- `BACKUP_RETENTION_DAYS` environment variable (default: 30)
- Backups stored in `../backups/` directory

**Cron Schedule (Recommended):**
```bash
# Daily backups at 2 AM
0 2 * * * /opt/revenue-backend/packages/revenue-backend/scripts/backup-database.sh >> /var/log/db-backup.log 2>&1
```

---

### 2. `restore-database.sh`

**Purpose:** Restore PostgreSQL database from backup

**Usage:**
```bash
./restore-database.sh backup_revenue_db_20260116_020000.sql.gz
```

**Features:**
- Pre-restore safety backup
- Connection termination before restore
- Automatic migration after restore
- Health check verification

**Safety:**
- Requires explicit confirmation (`yes`)
- Creates backup of current database before restore
- Stops API during restoration to prevent data corruption

---

### 3. `health-monitor.sh`

**Purpose:** Comprehensive application health monitoring with alerts

**Usage:**
```bash
./health-monitor.sh
```

**Features:**
- Liveness and readiness endpoint checks
- Response time monitoring
- Container resource monitoring (CPU, memory)
- Disk space monitoring
- Database connectivity checks
- Email and Slack alerts

**Configuration:**
Set environment variables:
```bash
export ALERT_EMAIL="admin@yourdomain.com"
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
export API_URL="http://localhost:5177"
```

**Thresholds (configurable in script):**
- Max response time: 5000ms
- Max memory usage: 80%
- Max CPU usage: 80%
- Max disk usage: 90%

**Cron Schedule (Recommended):**
```bash
# Every 5 minutes
*/5 * * * * /opt/revenue-backend/packages/revenue-backend/scripts/health-monitor.sh >> /var/log/health-monitor.log 2>&1
```

---

## Setup Instructions

### 1. Make Scripts Executable

```bash
chmod +x scripts/*.sh
```

### 2. Configure Environment Variables

Create or edit `.env.production`:
```bash
# Required for backup/restore
DB_NAME=revenue_db
DB_USER=revenue
DB_PASSWORD=your_password

# Optional for monitoring
ALERT_EMAIL=admin@yourdomain.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
API_URL=http://localhost:5177
BACKUP_RETENTION_DAYS=30
```

### 3. Set Up Cron Jobs

Edit crontab:
```bash
crontab -e
```

Add recommended schedules:
```bash
# Database backup - Daily at 2 AM
0 2 * * * /opt/revenue-backend/packages/revenue-backend/scripts/backup-database.sh >> /var/log/db-backup.log 2>&1

# Health monitoring - Every 5 minutes
*/5 * * * * /opt/revenue-backend/packages/revenue-backend/scripts/health-monitor.sh >> /var/log/health-monitor.log 2>&1
```

### 4. Test Scripts

```bash
# Test backup
./scripts/backup-database.sh

# Test monitoring
./scripts/health-monitor.sh

# Test restore (with a backup file)
./scripts/restore-database.sh backup_revenue_db_YYYYMMDD_HHMMSS.sql.gz
```

---

## Directory Structure

```
scripts/
├── README.md                   # This file
├── backup-database.sh          # Database backup script
├── restore-database.sh         # Database restore script
└── health-monitor.sh           # Health monitoring script

../backups/                     # Backup storage (created automatically)
├── backup_revenue_db_20260116_020000.sql.gz
└── pre_restore_backup_20260116_102030.sql.gz

../logs/                        # Log files (created automatically)
└── health-monitor.log
```

---

## Troubleshooting

### Backup Script Issues

**Error: "PostgreSQL container is not running"**
```bash
# Check container status
docker compose -f docker-compose.production.yml ps

# Start containers
docker compose -f docker-compose.production.yml up -d
```

**Error: "Permission denied"**
```bash
# Make script executable
chmod +x scripts/backup-database.sh

# Check directory permissions
sudo chown -R $(whoami):$(whoami) backups/
```

### Restore Script Issues

**Error: "Backup file not found"**
```bash
# List available backups
ls -lh backups/

# Use full filename including extension
./scripts/restore-database.sh backup_revenue_db_20260116_020000.sql.gz
```

**Warning: "Failed to create pre-restore backup"**
- Ensure sufficient disk space
- Check PostgreSQL container is healthy
- Verify database user permissions

### Monitoring Script Issues

**Alert emails not sending**
```bash
# Install mail utility
sudo apt install mailutils

# Test email
echo "Test" | mail -s "Test Subject" admin@yourdomain.com
```

**Slack alerts not working**
- Verify webhook URL is correct
- Test webhook manually:
```bash
curl -X POST $SLACK_WEBHOOK_URL \
    -H 'Content-Type: application/json' \
    -d '{"text":"Test alert"}'
```

---

## Best Practices

1. **Test backups regularly** - Run restore in a test environment monthly
2. **Monitor backup sizes** - Sudden size changes may indicate issues
3. **Keep multiple backup copies** - Store off-site backups for disaster recovery
4. **Review logs regularly** - Check health-monitor.log for patterns
5. **Set up alerts** - Configure email/Slack for critical issues
6. **Document incidents** - Track issues and resolutions

---

## Security Considerations

- **Backup files contain sensitive data** - Secure the `backups/` directory
- **Encrypt backups** for off-site storage
- **Restrict script permissions** - Only deploy user should execute
- **Rotate credentials regularly** - Update database passwords
- **Audit script logs** - Review for unauthorized access

---

## Support

For issues or improvements:
1. Check troubleshooting section above
2. Review main deployment documentation: `docs/PRODUCTION-DEPLOYMENT.md`
3. Check application logs: `docker compose logs`
4. Contact DevOps team

---

**Last Updated:** 2026-01-16
