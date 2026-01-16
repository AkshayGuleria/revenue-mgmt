#!/bin/bash

##############################################################################
# Health Monitoring Script
# Description: Monitor application health and send alerts
# Usage: ./health-monitor.sh
# Recommended: Add to crontab to run every 5 minutes
##############################################################################

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="${PROJECT_ROOT}/logs/health-monitor.log"
ALERT_EMAIL="${ALERT_EMAIL:-admin@yourdomain.com}"
API_URL="${API_URL:-http://localhost:5177}"
SLACK_WEBHOOK="${SLACK_WEBHOOK_URL:-}"

# Health check endpoints
LIVENESS_URL="${API_URL}/health/liveness"
READINESS_URL="${API_URL}/health/readiness"

# Thresholds
MAX_RESPONSE_TIME=5000  # milliseconds
MAX_MEMORY_PERCENT=80
MAX_CPU_PERCENT=80
MAX_DISK_PERCENT=90

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create log directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Alert function
send_alert() {
    local SEVERITY=$1
    local MESSAGE=$2

    log "${SEVERITY}: ${MESSAGE}"

    # Send email alert if configured
    if [ -n "$ALERT_EMAIL" ] && command -v mail &> /dev/null; then
        echo "$MESSAGE" | mail -s "[$SEVERITY] Revenue API Health Alert" "$ALERT_EMAIL"
    fi

    # Send Slack alert if webhook is configured
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -X POST "$SLACK_WEBHOOK" \
            -H 'Content-Type: application/json' \
            -d "{\"text\":\"[$SEVERITY] $MESSAGE\"}" \
            2>/dev/null || true
    fi
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        send_alert "CRITICAL" "Docker is not running!"
        return 1
    fi
    return 0
}

# Check API liveness
check_liveness() {
    local start_time=$(date +%s%3N)
    local response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$LIVENESS_URL" 2>/dev/null || echo "000")
    local end_time=$(date +%s%3N)
    local response_time=$((end_time - start_time))

    if [ "$response" = "200" ]; then
        if [ $response_time -gt $MAX_RESPONSE_TIME ]; then
            send_alert "WARNING" "Liveness endpoint slow: ${response_time}ms (threshold: ${MAX_RESPONSE_TIME}ms)"
            return 1
        else
            log "✅ Liveness check passed (${response_time}ms)"
            return 0
        fi
    else
        send_alert "CRITICAL" "Liveness endpoint failed! HTTP $response"
        return 1
    fi
}

# Check API readiness
check_readiness() {
    local start_time=$(date +%s%3N)
    local response=$(curl -s -w "\n%{http_code}" --max-time 10 "$READINESS_URL" 2>/dev/null || echo "000")
    local end_time=$(date +%s%3N)
    local response_time=$((end_time - start_time))

    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n-1)

    if [ "$http_code" = "200" ]; then
        # Check if database is healthy
        if echo "$body" | grep -q '"database".*"status":"up"'; then
            log "✅ Readiness check passed (${response_time}ms)"
            return 0
        else
            send_alert "CRITICAL" "Database health check failed!"
            return 1
        fi
    else
        send_alert "CRITICAL" "Readiness endpoint failed! HTTP $http_code"
        return 1
    fi
}

# Check container health
check_container_health() {
    local CONTAINER_NAME="revenue-api"

    if ! docker ps | grep -q "$CONTAINER_NAME"; then
        send_alert "CRITICAL" "API container is not running!"
        return 1
    fi

    # Check container resource usage
    local STATS=$(docker stats --no-stream --format "{{.CPUPerc}},{{.MemPerc}}" "$CONTAINER_NAME" 2>/dev/null)

    if [ -n "$STATS" ]; then
        local CPU_PERCENT=$(echo "$STATS" | cut -d',' -f1 | sed 's/%//')
        local MEM_PERCENT=$(echo "$STATS" | cut -d',' -f2 | sed 's/%//')

        # Remove decimal points for comparison
        CPU_PERCENT=${CPU_PERCENT%.*}
        MEM_PERCENT=${MEM_PERCENT%.*}

        if [ "$CPU_PERCENT" -gt "$MAX_CPU_PERCENT" ]; then
            send_alert "WARNING" "High CPU usage: ${CPU_PERCENT}% (threshold: ${MAX_CPU_PERCENT}%)"
        fi

        if [ "$MEM_PERCENT" -gt "$MAX_MEMORY_PERCENT" ]; then
            send_alert "WARNING" "High memory usage: ${MEM_PERCENT}% (threshold: ${MAX_MEMORY_PERCENT}%)"
        fi

        log "📊 Container stats - CPU: ${CPU_PERCENT}%, Memory: ${MEM_PERCENT}%"
    fi

    return 0
}

# Check disk space
check_disk_space() {
    local DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')

    if [ "$DISK_USAGE" -gt "$MAX_DISK_PERCENT" ]; then
        send_alert "WARNING" "High disk usage: ${DISK_USAGE}% (threshold: ${MAX_DISK_PERCENT}%)"
        return 1
    else
        log "💾 Disk usage: ${DISK_USAGE}%"
        return 0
    fi
}

# Check database connectivity
check_database() {
    if docker compose -f "${PROJECT_ROOT}/docker-compose.production.yml" exec -T postgres pg_isready &>/dev/null; then
        log "✅ Database is accepting connections"
        return 0
    else
        send_alert "CRITICAL" "Database is not accepting connections!"
        return 1
    fi
}

# Main health check routine
main() {
    log "================================================"
    log "Starting health check"
    log "================================================"

    local ALL_CHECKS_PASSED=true

    # Run all checks
    check_docker || ALL_CHECKS_PASSED=false
    check_liveness || ALL_CHECKS_PASSED=false
    check_readiness || ALL_CHECKS_PASSED=false
    check_container_health || ALL_CHECKS_PASSED=false
    check_disk_space || ALL_CHECKS_PASSED=false
    check_database || ALL_CHECKS_PASSED=false

    log "================================================"
    if [ "$ALL_CHECKS_PASSED" = true ]; then
        log "✅ All health checks passed"
        log "================================================"
        exit 0
    else
        log "❌ Some health checks failed"
        log "================================================"
        exit 1
    fi
}

# Run main function
main
