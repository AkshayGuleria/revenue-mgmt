# Quick Start - Production Deployment

Fast-track guide to deploy Revenue Management Backend to production in under 30 minutes.

## Prerequisites Checklist

Before starting, ensure you have:

- [ ] Ubuntu 22.04 VPS with SSH access (2+ CPU, 4GB+ RAM, 40GB+ storage)
- [ ] Domain name pointed to your VPS IP
- [ ] GitHub repository with code
- [ ] 30 minutes of time

## Step-by-Step Deployment

### Step 1: Initial VPS Setup (5 minutes)

```bash
# SSH into VPS
ssh root@your-vps-ip

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose
apt install docker-compose-plugin -y

# Install Nginx
apt install nginx -y

# Configure firewall
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable

# Create deployment user
adduser deploy
usermod -aG sudo,docker deploy
su - deploy
```

### Step 2: Clone Repository (2 minutes)

```bash
# Create deployment directory
sudo mkdir -p /opt/revenue-backend
sudo chown deploy:deploy /opt/revenue-backend
cd /opt/revenue-backend

# Clone your repository
git clone https://github.com/YOUR-USERNAME/revenue-mgmt.git .
cd packages/revenue-backend
```

### Step 3: Configure Environment (5 minutes)

```bash
# Copy environment template
cp .env.production.example .env.production

# Generate secure passwords
echo "DB_PASSWORD=$(openssl rand -base64 32)"
echo "JWT_SECRET=$(openssl rand -base64 32)"
echo "API_KEY=$(openssl rand -hex 32)"

# Edit environment file
nano .env.production
```

**Minimal required configuration:**
```env
NODE_ENV=production
PORT=5177

# Copy generated passwords from above
DATABASE_URL=postgresql://revenue:YOUR_DB_PASSWORD@postgres:5432/revenue_db?schema=public
DB_USER=revenue
DB_PASSWORD=YOUR_DB_PASSWORD
DB_NAME=revenue_db

JWT_SECRET=YOUR_JWT_SECRET
API_KEY=YOUR_API_KEY
CORS_ORIGINS=https://yourdomain.com
```

### Step 4: Deploy Database (5 minutes)

```bash
# Start PostgreSQL
docker compose -f docker-compose.production.yml up -d postgres

# Wait for database to be ready
sleep 15

# Run migrations
docker compose -f docker-compose.production.yml run --rm api npx prisma migrate deploy

# Verify migrations
docker compose -f docker-compose.production.yml run --rm api npx prisma migrate status
```

### Step 5: Start Application (3 minutes)

```bash
# Start all services
docker compose -f docker-compose.production.yml up -d

# Check status
docker compose -f docker-compose.production.yml ps

# View logs
docker compose -f docker-compose.production.yml logs -f api
```

### Step 6: Verify Deployment (2 minutes)

```bash
# Test health endpoint
curl http://localhost:5177/health/liveness

# Expected output:
# {"status":"ok","timestamp":"2026-01-16T..."}

# Test readiness
curl http://localhost:5177/health/readiness

# Should show database status: "up"
```

### Step 7: Configure SSL (5 minutes)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate (replace with your domain)
sudo certbot --nginx -d api.yourdomain.com

# Update Nginx config
sudo nano /opt/revenue-backend/packages/revenue-backend/nginx/conf.d/revenue-api.conf

# Change server_name to your domain
# server_name api.yourdomain.com;

# Restart Nginx
docker compose -f docker-compose.production.yml restart nginx
```

### Step 8: Test Public Access (2 minutes)

```bash
# Test from your local machine
curl https://api.yourdomain.com/health/liveness

# Test API documentation (if enabled)
# Visit: https://api.yourdomain.com/api-docs
```

### Step 9: Set Up Automated Backups (3 minutes)

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Test backup
./scripts/backup-database.sh

# Add to crontab
crontab -e

# Add this line (daily backup at 2 AM):
0 2 * * * /opt/revenue-backend/packages/revenue-backend/scripts/backup-database.sh >> /var/log/db-backup.log 2>&1
```

### Step 10: Configure CI/CD (Optional, 5 minutes)

**GitHub Repository Settings → Secrets:**

Add these secrets:
- `VPS_HOST`: Your VPS IP or domain
- `VPS_USER`: `deploy`
- `VPS_SSH_PRIVATE_KEY`: Your SSH private key
- `VPS_DEPLOY_PATH`: `/opt/revenue-backend/packages/revenue-backend`

**Generate SSH key for GitHub Actions:**
```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions

# Copy public key to VPS
ssh-copy-id -i ~/.ssh/github_actions.pub deploy@your-vps-ip

# Copy private key (add to GitHub secrets)
cat ~/.ssh/github_actions
```

---

## ✅ Deployment Complete!

Your Revenue Management Backend is now live at:
- **API:** https://api.yourdomain.com
- **Health:** https://api.yourdomain.com/health/readiness
- **Docs:** https://api.yourdomain.com/api-docs (if enabled)

---

## Post-Deployment Checklist

- [ ] Health endpoints returning 200 OK
- [ ] Database migrations applied successfully
- [ ] SSL certificate installed and valid
- [ ] Automated backups scheduled
- [ ] Firewall configured
- [ ] CI/CD pipeline tested (if configured)
- [ ] Application logs monitored
- [ ] Admin credentials secured

---

## Quick Commands Reference

```bash
# View logs
docker compose -f docker-compose.production.yml logs -f api

# Restart API
docker compose -f docker-compose.production.yml restart api

# Stop all services
docker compose -f docker-compose.production.yml down

# Start all services
docker compose -f docker-compose.production.yml up -d

# Check resource usage
docker stats

# Backup database
./scripts/backup-database.sh

# Restore database
./scripts/restore-database.sh backup_file.sql.gz

# Health check
curl https://api.yourdomain.com/health/liveness
```

---

## Common Issues & Fixes

### Issue: "Port 5177 already in use"

```bash
# Find process using port
sudo lsof -i :5177

# Kill the process
sudo kill -9 <PID>

# Or change port in .env.production and docker-compose
```

### Issue: "Database connection failed"

```bash
# Check if PostgreSQL is running
docker compose -f docker-compose.production.yml ps postgres

# View database logs
docker compose -f docker-compose.production.yml logs postgres

# Restart database
docker compose -f docker-compose.production.yml restart postgres
```

### Issue: "SSL certificate not working"

```bash
# Renew certificate
sudo certbot renew

# Test certificate
curl -vI https://api.yourdomain.com

# Check Nginx logs
docker compose -f docker-compose.production.yml logs nginx
```

### Issue: "Health check fails after deployment"

```bash
# Wait for startup (can take 30-60 seconds)
sleep 60

# Check if all services are running
docker compose -f docker-compose.production.yml ps

# View detailed logs
docker compose -f docker-compose.production.yml logs api

# Test locally first
curl http://localhost:5177/health/liveness
```

---

## Security Hardening (Recommended)

```bash
# 1. Disable root SSH login
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart ssh

# 2. Install Fail2Ban
sudo apt install fail2ban -y
sudo systemctl enable fail2ban

# 3. Enable automatic security updates
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure --priority=low unattended-upgrades

# 4. Set up log rotation
sudo nano /etc/logrotate.d/revenue-backend
```

Add to logrotate config:
```
/opt/revenue-backend/packages/revenue-backend/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
}
```

---

## Monitoring Setup (Optional)

```bash
# Set up health monitoring
crontab -e

# Add (runs every 5 minutes):
*/5 * * * * /opt/revenue-backend/packages/revenue-backend/scripts/health-monitor.sh >> /var/log/health-monitor.log 2>&1

# Configure alerts
export ALERT_EMAIL="admin@yourdomain.com"
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK"
```

---

## Next Steps

1. **Read full documentation:** `docs/PRODUCTION-DEPLOYMENT.md`
2. **Set up monitoring:** Configure alerts for production
3. **Test backup restore:** Verify backups work
4. **Plan scaling:** Review Phase 2 requirements (BullMQ, Redis)
5. **Security audit:** Review security checklist in full docs

---

## Support Resources

- **Full Documentation:** `/docs/PRODUCTION-DEPLOYMENT.md`
- **Scripts Guide:** `/scripts/README.md`
- **Health Dashboard:** `https://api.yourdomain.com/health/readiness`
- **API Docs:** `https://api.yourdomain.com/api-docs`

---

**Congratulations! Your Revenue Management Backend is now running in production!** 🎉

For detailed information, troubleshooting, and advanced configuration, see the full [Production Deployment Guide](docs/PRODUCTION-DEPLOYMENT.md).
