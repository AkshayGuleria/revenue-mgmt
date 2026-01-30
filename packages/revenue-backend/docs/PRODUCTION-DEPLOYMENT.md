# Production Deployment Guide

Complete guide for deploying the Revenue Management Backend to a self-hosted VPS with Docker and GitHub Actions.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [VPS Setup](#vps-setup)
3. [Initial Deployment](#initial-deployment)
4. [GitHub Actions Setup](#github-actions-setup)
5. [SSL/TLS Configuration](#ssltls-configuration)
6. [Database Migrations](#database-migrations)
7. [Monitoring & Logging](#monitoring--logging)
8. [Backup Strategy](#backup-strategy)
9. [Rollback Procedures](#rollback-procedures)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software on VPS
- **Ubuntu 22.04 LTS** (recommended) or similar Linux distribution
- **Docker 24.0+** and Docker Compose v2
- **PostgreSQL 16** (containerized or native)
- **Nginx** (for reverse proxy)
- **Git** (for code deployment)
- **Minimum VPS Specs:**
  - 2 CPU cores
  - 4 GB RAM
  - 40 GB SSD storage
  - Ubuntu 22.04 LTS

### Local Requirements
- GitHub account with repository access
- SSH access to VPS
- Domain name with DNS configured

---

## VPS Setup

### 1. Initial Server Configuration

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Update system packages
apt update && apt upgrade -y

# Create a deployment user
adduser deploy
usermod -aG sudo deploy
usermod -aG docker deploy

# Switch to deploy user
su - deploy
```

### 2. Install Docker & Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin

# Verify installation
docker --version
docker compose version

# Enable Docker to start on boot
sudo systemctl enable docker
sudo systemctl start docker
```

### 3. Install Nginx

```bash
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx

# Verify Nginx is running
sudo systemctl status nginx
```

### 4. Configure Firewall

```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Verify firewall rules
sudo ufw status
```

---

## Initial Deployment

### 1. Clone Repository on VPS

```bash
# Create deployment directory
sudo mkdir -p /opt/revenue-backend
sudo chown deploy:deploy /opt/revenue-backend
cd /opt/revenue-backend

# Clone repository (replace with your repo URL)
git clone https://github.com/your-username/revenova.git .
cd packages/revenue-backend
```

### 2. Configure Environment Variables

```bash
# Copy environment template
cp .env.production.example .env.production

# Edit with secure values
nano .env.production
```

**Critical values to set:**
```env
NODE_ENV=production
PORT=5177
DATABASE_URL=postgresql://revenue:STRONG_PASSWORD@postgres:5432/revenue_db?schema=public
DB_USER=revenue
DB_PASSWORD=GENERATE_STRONG_PASSWORD_HERE
DB_NAME=revenue_db
JWT_SECRET=GENERATE_WITH_openssl_rand_base64_32
API_KEY=GENERATE_RANDOM_KEY
CORS_ORIGINS=https://yourdomain.com
```

### 3. Generate Strong Passwords

```bash
# Generate database password
openssl rand -base64 32

# Generate JWT secret
openssl rand -base64 32

# Generate API key
openssl rand -hex 32
```

### 4. Initialize Database

```bash
# Start PostgreSQL container only
docker compose -f docker-compose.production.yml up -d postgres

# Wait for PostgreSQL to be ready
sleep 10

# Run Prisma migrations
docker compose -f docker-compose.production.yml run --rm api npx prisma migrate deploy

# Verify migrations
docker compose -f docker-compose.production.yml run --rm api npx prisma migrate status
```

### 5. Start All Services

```bash
# Start all containers
docker compose -f docker-compose.production.yml up -d

# Check container status
docker compose -f docker-compose.production.yml ps

# View logs
docker compose -f docker-compose.production.yml logs -f api
```

### 6. Verify Deployment

```bash
# Test health endpoint
curl http://localhost:5177/health/liveness

# Expected response:
# {"status":"ok","timestamp":"2026-01-16T..."}

# Test readiness endpoint
curl http://localhost:5177/health/readiness
```

---

## GitHub Actions Setup

### 1. Configure Repository Secrets

Go to GitHub Repository → Settings → Secrets and variables → Actions

Add the following secrets:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `VPS_HOST` | VPS IP address or domain | `192.168.1.100` or `vps.yourdomain.com` |
| `VPS_USER` | SSH username | `deploy` |
| `VPS_SSH_PRIVATE_KEY` | SSH private key content | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `VPS_DEPLOY_PATH` | Deployment directory path | `/opt/revenue-backend/packages/revenue-backend` |
| `DOCKER_USERNAME` | Docker Hub username (optional) | `your-docker-username` |
| `DOCKER_PASSWORD` | Docker Hub password (optional) | `your-docker-password` |

### 2. Generate SSH Key for GitHub Actions

```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions@yourdomain.com" -f ~/.ssh/github_actions_deploy

# Copy public key to VPS
ssh-copy-id -i ~/.ssh/github_actions_deploy.pub deploy@your-vps-ip

# Copy private key content for GitHub secret
cat ~/.ssh/github_actions_deploy
# Copy the entire output and paste into VPS_SSH_PRIVATE_KEY secret
```

### 3. Test GitHub Actions Workflow

```bash
# Trigger workflow manually from GitHub UI:
# Actions tab → "Production Deployment" → Run workflow

# Or push to main branch:
git push origin main
```

---

## SSL/TLS Configuration

### Option 1: Let's Encrypt with Certbot (Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d api.yourdomain.com

# Test automatic renewal
sudo certbot renew --dry-run

# Certificates are automatically renewed every 60 days
```

### Option 2: Manual SSL Certificate

```bash
# Create SSL directory
sudo mkdir -p /opt/revenue-backend/packages/revenue-backend/nginx/ssl

# Copy your certificates
sudo cp fullchain.pem /opt/revenue-backend/packages/revenue-backend/nginx/ssl/
sudo cp privkey.pem /opt/revenue-backend/packages/revenue-backend/nginx/ssl/

# Set permissions
sudo chown -R deploy:deploy /opt/revenue-backend/packages/revenue-backend/nginx/ssl
sudo chmod 600 /opt/revenue-backend/packages/revenue-backend/nginx/ssl/*.pem
```

### Update Nginx Configuration

```bash
# Edit Nginx config
sudo nano /opt/revenue-backend/packages/revenue-backend/nginx/conf.d/revenue-api.conf

# Update server_name to your domain
server_name api.yourdomain.com;

# Restart Nginx
docker compose -f docker-compose.production.yml restart nginx
```

---

## Database Migrations

### Running Migrations

```bash
# During deployment (automated in GitHub Actions)
docker compose -f docker-compose.production.yml run --rm api npx prisma migrate deploy

# Check migration status
docker compose -f docker-compose.production.yml run --rm api npx prisma migrate status

# View migration history
docker compose -f docker-compose.production.yml run --rm api npx prisma migrate resolve --help
```

### Creating New Migrations (Development)

```bash
# In development environment
npx prisma migrate dev --name add_new_feature

# Commit migration files
git add prisma/migrations
git commit -m "feat: add new database migration"
git push origin main
# GitHub Actions will automatically apply migrations on deployment
```

### Rollback Migration (Emergency)

```bash
# If migration fails, rollback manually
docker compose -f docker-compose.production.yml run --rm api npx prisma migrate resolve --rolled-back MIGRATION_NAME

# Restore database from backup (see Backup section)
```

---

## Monitoring & Logging

### Application Logs

```bash
# View live logs
docker compose -f docker-compose.production.yml logs -f api

# View last 100 lines
docker compose -f docker-compose.production.yml logs --tail=100 api

# Filter by timestamp
docker compose -f docker-compose.production.yml logs --since="2h" api
```

### Database Logs

```bash
# PostgreSQL logs
docker compose -f docker-compose.production.yml logs postgres

# Slow query log (if enabled)
docker compose -f docker-compose.production.yml exec postgres tail -f /var/log/postgresql/slow-queries.log
```

### System Monitoring

```bash
# Install monitoring tools
sudo apt install htop iotop nethogs -y

# Monitor CPU, Memory, Disk
htop

# Monitor Docker resources
docker stats

# Monitor disk usage
df -h
du -sh /var/lib/docker
```

### Health Monitoring Script

Create `/opt/revenue-backend/health-check.sh`:

```bash
#!/bin/bash

HEALTH_URL="http://localhost:5177/health/readiness"
ALERT_EMAIL="admin@yourdomain.com"

response=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $response -ne 200 ]; then
    echo "❌ Health check failed! HTTP $response"
    echo "Revenue API is unhealthy at $(date)" | mail -s "API Health Alert" $ALERT_EMAIL
    exit 1
else
    echo "✅ Health check passed at $(date)"
fi
```

Add to crontab:
```bash
# Check every 5 minutes
crontab -e
*/5 * * * * /opt/revenue-backend/health-check.sh >> /var/log/health-check.log 2>&1
```

---

## Backup Strategy

### Automated Database Backups

Create `/opt/revenue-backend/backup-db.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/opt/revenue-backend/packages/revenue-backend/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="revenue_db"
DB_USER="revenue"
RETENTION_DAYS=30

mkdir -p $BACKUP_DIR

# Backup database
docker compose -f /opt/revenue-backend/packages/revenue-backend/docker-compose.production.yml \
    exec -T postgres pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Delete backups older than retention period
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "✅ Backup completed: backup_$DATE.sql.gz"
```

Make executable and schedule:
```bash
chmod +x /opt/revenue-backend/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
0 2 * * * /opt/revenue-backend/backup-db.sh >> /var/log/db-backup.log 2>&1
```

### Restore from Backup

```bash
# List available backups
ls -lh /opt/revenue-backend/packages/revenue-backend/backups/

# Restore specific backup
gunzip -c /opt/revenue-backend/packages/revenue-backend/backups/backup_20260116_020000.sql.gz | \
    docker compose -f docker-compose.production.yml exec -T postgres psql -U revenue revenue_db

# Verify restoration
docker compose -f docker-compose.production.yml exec postgres psql -U revenue revenue_db -c "SELECT COUNT(*) FROM accounts;"
```

---

## Rollback Procedures

### Rollback Docker Deployment

```bash
cd /opt/revenue-backend/packages/revenue-backend

# View deployment history
git log --oneline -10

# Rollback to specific commit
git checkout COMMIT_HASH

# Rebuild and restart
docker compose -f docker-compose.production.yml down
docker compose -f docker-compose.production.yml build --no-cache
docker compose -f docker-compose.production.yml up -d

# Verify
curl http://localhost:5177/health/liveness
```

### Rollback Database Migration

```bash
# If migration is causing issues, restore from backup
# See "Restore from Backup" section above

# Then run migration rollback
docker compose -f docker-compose.production.yml run --rm api \
    npx prisma migrate resolve --rolled-back MIGRATION_NAME
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker compose -f docker-compose.production.yml logs api

# Common issues:
# 1. Database not ready - wait and retry
# 2. Port already in use - check: sudo lsof -i :5177
# 3. Environment variables missing - verify .env.production
```

### Database Connection Issues

```bash
# Test database connectivity
docker compose -f docker-compose.production.yml exec postgres psql -U revenue revenue_db

# Check PostgreSQL logs
docker compose -f docker-compose.production.yml logs postgres

# Verify DATABASE_URL in .env.production
```

### High Memory Usage

```bash
# Check Docker memory usage
docker stats

# Restart specific service
docker compose -f docker-compose.production.yml restart api

# Adjust resource limits in docker-compose.production.yml
```

### SSL Certificate Issues

```bash
# Renew Let's Encrypt certificate manually
sudo certbot renew --force-renewal

# Test certificate
curl -vI https://api.yourdomain.com

# Check certificate expiration
echo | openssl s_client -servername api.yourdomain.com -connect api.yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates
```

### Application Errors

```bash
# View detailed error logs
docker compose -f docker-compose.production.yml logs -f api | grep ERROR

# Check application metrics
curl http://localhost:5177/health/readiness | jq

# Restart application
docker compose -f docker-compose.production.yml restart api
```

---

## Security Checklist

- [ ] Strong passwords for database (32+ characters)
- [ ] JWT secret properly configured
- [ ] Firewall configured (UFW)
- [ ] SSL/TLS enabled with valid certificate
- [ ] Nginx security headers configured
- [ ] Docker containers running as non-root user
- [ ] Regular security updates scheduled
- [ ] Database backups automated
- [ ] Health monitoring enabled
- [ ] Rate limiting configured in Nginx
- [ ] Sensitive files excluded from version control
- [ ] SSH key-based authentication only (no password login)
- [ ] Fail2ban installed and configured
- [ ] Log rotation configured

---

## Performance Optimization

### Database Tuning

Edit PostgreSQL configuration in `docker-compose.production.yml`:

```yaml
command:
  - "postgres"
  - "-c"
  - "max_connections=200"
  - "-c"
  - "shared_buffers=512MB"  # 25% of RAM
  - "-c"
  - "effective_cache_size=2GB"  # 50% of RAM
  - "-c"
  - "maintenance_work_mem=128MB"
```

### Application Tuning

Adjust resource limits in `docker-compose.production.yml`:

```yaml
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 2G
```

### Nginx Caching

Add to Nginx config:

```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m;
proxy_cache api_cache;
proxy_cache_valid 200 5m;
```

---

## Support & Maintenance

### Regular Maintenance Tasks

**Weekly:**
- Review application logs for errors
- Check disk space usage
- Verify backups are running

**Monthly:**
- Security updates: `sudo apt update && sudo apt upgrade`
- Review monitoring metrics
- Test backup restoration
- Certificate renewal check

**Quarterly:**
- Performance review and optimization
- Security audit
- Disaster recovery drill

---

## Contact & Resources

- **Documentation:** `/docs/`
- **Issue Tracker:** GitHub Issues
- **Health Dashboard:** `https://api.yourdomain.com/health/readiness`
- **API Documentation:** `https://api.yourdomain.com/api-docs`

---

**Last Updated:** 2026-01-16
**Version:** 1.0.0
