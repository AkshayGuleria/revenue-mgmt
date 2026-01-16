#!/bin/bash

##############################################################################
# Local Deployment Test Script
# Description: Test the production Docker setup locally before deploying
# Usage: ./test-local-deployment.sh [OPTIONS]
##############################################################################

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="${PROJECT_ROOT}/docker-compose.local.yml"
ENV_FILE="${PROJECT_ROOT}/.env.local"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

# Script options
SKIP_CLEANUP=false
INTERACTIVE_MODE=false
SKIP_BUILD=false
TESTS_TO_RUN=()

# Logging
log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((TESTS_PASSED++))
}

error() {
    echo -e "${RED}❌ $1${NC}"
    ((TESTS_FAILED++))
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

section() {
    echo ""
    echo "================================================"
    echo "$1"
    echo "================================================"
}

# Usage information
usage() {
    cat << EOF
${CYAN}Usage: ./test-local-deployment.sh [OPTIONS]${NC}

${CYAN}Options:${NC}
    -h, --help              Show this help message
    -i, --interactive       Run in interactive mode (choose tests)
    --skip-cleanup          Skip cleanup before tests
    --skip-build            Skip Docker image build
    --full-test             Run all tests (default)
    --quick-test            Quick health and API tests only
    --db-test               Database operations only
    --help-tests            Show available test categories

${CYAN}Examples:${NC}
    # Run full test suite interactively
    ./test-local-deployment.sh --interactive

    # Quick test without rebuilding
    ./test-local-deployment.sh --quick-test --skip-build

    # Run database tests only
    ./test-local-deployment.sh --db-test

${CYAN}Test Categories:${NC}
    health      - Health endpoints (liveness, readiness)
    api         - API endpoints and documentation
    database    - Database operations and connectivity
    backup      - Backup script functionality
    resources   - Container resources and health
    logs        - Log generation and error checking
    all         - All of the above (default)

EOF
    exit 0
}

# Show available tests
show_help_tests() {
    cat << EOF
${CYAN}Available Test Categories:${NC}

1. health           - Test liveness and readiness endpoints
2. api              - Test API endpoints and documentation
3. database         - Test database connection and operations
4. backup           - Test backup script functionality
5. resources        - Check container resources and health
6. logs             - Check logs for errors
7. all              - Run all tests (default)

EOF
    exit 0
}

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                usage
                ;;
            -i|--interactive)
                INTERACTIVE_MODE=true
                shift
                ;;
            --skip-cleanup)
                SKIP_CLEANUP=true
                shift
                ;;
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --full-test)
                TESTS_TO_RUN=("health" "api" "database" "backup" "resources" "logs")
                shift
                ;;
            --quick-test)
                TESTS_TO_RUN=("health" "api")
                shift
                ;;
            --db-test)
                TESTS_TO_RUN=("database")
                shift
                ;;
            --help-tests)
                show_help_tests
                ;;
            *)
                echo -e "${RED}Unknown option: $1${NC}"
                usage
                ;;
        esac
    done

    # Default to all tests if none specified
    if [ ${#TESTS_TO_RUN[@]} -eq 0 ] && [ "$INTERACTIVE_MODE" = false ]; then
        TESTS_TO_RUN=("health" "api" "database" "backup" "resources" "logs")
    fi
}

# Interactive mode - let user select tests
interactive_menu() {
    section "Interactive Test Selection"

    echo "Select which tests to run:"
    echo ""
    echo "  1) Health endpoints (liveness, readiness)"
    echo "  2) API endpoints and documentation"
    echo "  3) Database operations"
    echo "  4) Backup script"
    echo "  5) Container resources"
    echo "  6) Logs analysis"
    echo "  7) All tests (default)"
    echo "  8) Quick test (health + API only)"
    echo "  0) Exit"
    echo ""
    read -p "Enter your choice (default: 7): " choice

    case "${choice:-7}" in
        1) TESTS_TO_RUN=("health") ;;
        2) TESTS_TO_RUN=("api") ;;
        3) TESTS_TO_RUN=("database") ;;
        4) TESTS_TO_RUN=("backup") ;;
        5) TESTS_TO_RUN=("resources") ;;
        6) TESTS_TO_RUN=("logs") ;;
        7) TESTS_TO_RUN=("health" "api" "database" "backup" "resources" "logs") ;;
        8) TESTS_TO_RUN=("health" "api") ;;
        0) 
            echo -e "${YELLOW}Exiting...${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option${NC}"
            TESTS_TO_RUN=("health" "api" "database" "backup" "resources" "logs")
            ;;
    esac

    echo ""
    read -p "Skip cleanup before tests? (y/n, default: n): " skip_cleanup_input
    if [[ "$skip_cleanup_input" =~ ^[Yy]$ ]]; then
        SKIP_CLEANUP=true
    fi

    echo ""
    read -p "Skip Docker image build? (y/n, default: n): " skip_build_input
    if [[ "$skip_build_input" =~ ^[Yy]$ ]]; then
        SKIP_BUILD=true
    fi
}

section() {
    echo ""
    echo "================================================"
    echo "$1"
    echo "================================================"
}

# Check prerequisites
check_prerequisites() {
    section "Checking Prerequisites"

    if command -v docker &> /dev/null; then
        success "Docker is installed"
    else
        error "Docker is not installed"
        exit 1
    fi

    if docker info > /dev/null 2>&1; then
        success "Docker is running"
    else
        error "Docker is not running"
        exit 1
    fi

    if command -v docker compose &> /dev/null; then
        success "Docker Compose is installed"
    else
        error "Docker Compose is not installed"
        exit 1
    fi

    if [ -f "$ENV_FILE" ]; then
        success "Environment file exists"
    else
        error "Environment file not found: $ENV_FILE"
        exit 1
    fi
}

# Clean up previous test environment
cleanup() {
    section "Cleaning Up Previous Test Environment"

    cd "$PROJECT_ROOT"

    log "Stopping containers..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down -v 2>/dev/null || true

    log "Removing volumes..."
    docker volume rm revenue_postgres_data_local 2>/dev/null || true

    log "Cleaning up logs and backups..."
    rm -rf logs/*.log 2>/dev/null || true
    rm -rf backups/backup_*.sql.gz 2>/dev/null || true

    success "Cleanup completed"
}

# Build Docker images
build_images() {
    section "Building Docker Images"

    cd "$PROJECT_ROOT"

    log "Building production image..."
    if docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build --no-cache; then
        success "Docker image built successfully"
    else
        error "Failed to build Docker image"
        exit 1
    fi
}

# Start services
start_services() {
    section "Starting Services"

    cd "$PROJECT_ROOT"

    log "Starting PostgreSQL..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d postgres

    log "Waiting for PostgreSQL to be ready..."
    for i in {1..30}; do
        if docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T postgres pg_isready &>/dev/null; then
            success "PostgreSQL is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            error "PostgreSQL failed to start"
            docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs postgres
            exit 1
        fi
        sleep 1
    done

    log "Running database migrations..."
    if docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" run --rm api npx prisma migrate deploy; then
        success "Migrations applied successfully"
    else
        error "Failed to apply migrations"
        exit 1
    fi

    log "Starting API service..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d api

    log "Waiting for API to be ready..."
    for i in {1..60}; do
        if curl -sf http://localhost:5177/health/liveness > /dev/null 2>&1; then
            success "API is ready"
            break
        fi
        if [ $i -eq 60 ]; then
            error "API failed to start"
            docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs api
            exit 1
        fi
        sleep 1
    done
}

# Test health endpoints
test_health_endpoints() {
    section "Testing Health Endpoints"

    # Test liveness
    log "Testing liveness endpoint..."
    if curl -sf http://localhost:5177/health/liveness | grep -q '"status":"ok"'; then
        success "Liveness endpoint works"
    else
        error "Liveness endpoint failed"
    fi

    # Test readiness
    log "Testing readiness endpoint..."
    READINESS=$(curl -sf http://localhost:5177/health/readiness)
    if echo "$READINESS" | grep -q '"status":"ok"'; then
        success "Readiness endpoint works"
    else
        error "Readiness endpoint failed"
    fi

    # Check database status in readiness response
    if echo "$READINESS" | grep -q '"database".*"status":"up"'; then
        success "Database is healthy"
    else
        error "Database health check failed"
    fi
}

# Test API endpoints
test_api_endpoints() {
    section "Testing API Endpoints"

    # Test root endpoint
    log "Testing root endpoint..."
    if curl -sf http://localhost:5177/ | grep -q '"status":"ok"'; then
        success "Root endpoint works"
    else
        error "Root endpoint failed"
    fi

    # Test API documentation (if enabled)
    log "Testing API documentation..."
    if curl -sf http://localhost:5177/api-docs | grep -q -i "swagger"; then
        success "API documentation is accessible"
    else
        warning "API documentation might not be enabled"
    fi
}

# Test database operations
test_database_operations() {
    section "Testing Database Operations"

    cd "$PROJECT_ROOT"

    # Test database connection
    log "Testing database connection..."
    if docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T postgres \
        psql -U revenue_local revenue_db_local -c "SELECT 1;" > /dev/null 2>&1; then
        success "Database connection works"
    else
        error "Database connection failed"
    fi

    # Check if tables exist
    log "Checking database tables..."
    TABLE_COUNT=$(docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T postgres \
        psql -U revenue_local revenue_db_local -t -c \
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)

    if [ "$TABLE_COUNT" -gt 0 ]; then
        success "Database tables exist (count: $TABLE_COUNT)"
    else
        error "No database tables found"
    fi

    # Test inserting data
    log "Testing data insertion..."
    TEST_UUID=$(uuidgen | tr '[:upper:]' '[:lower:]')
    CREATE_ACCOUNT="
    INSERT INTO accounts (id, \"accountName\", \"primaryContactEmail\", status, \"createdAt\", \"updatedAt\")
    VALUES ('test-$TEST_UUID', 'Test Account', 'test@example.com', 'active', NOW(), NOW())
    RETURNING id;
    "
    if ACCOUNT_ID=$(docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T postgres \
        psql -U revenue_local revenue_db_local -t -c "$CREATE_ACCOUNT" 2>/dev/null | xargs); then
        success "Data insertion works (Account ID: ${ACCOUNT_ID:0:8}...)"
    else
        error "Data insertion failed"
    fi
}

# Test backup script
test_backup_script() {
    section "Testing Backup Script"

    cd "$PROJECT_ROOT"

    # Override environment for local testing
    export DB_NAME="revenue_db_local"
    export DB_USER="revenue_local"
    export BACKUP_RETENTION_DAYS=7

    log "Running backup script..."
    if ./scripts/backup-database.sh; then
        success "Backup script executed successfully"

        # Check if backup file was created
        BACKUP_FILES=$(find backups/ -name "backup_*.sql.gz" 2>/dev/null | wc -l)
        if [ "$BACKUP_FILES" -gt 0 ]; then
            success "Backup file created"

            # Check backup file size
            LATEST_BACKUP=$(ls -t backups/backup_*.sql.gz 2>/dev/null | head -1)
            BACKUP_SIZE=$(du -h "$LATEST_BACKUP" | cut -f1)
            log "Backup size: $BACKUP_SIZE"
        else
            error "No backup file found"
        fi
    else
        error "Backup script failed"
    fi
}

# Test container resources
test_container_resources() {
    section "Testing Container Resources"

    # Check container status
    log "Checking container status..."
    if docker ps | grep -q "revenue-api-local"; then
        success "API container is running"
    else
        error "API container is not running"
    fi

    if docker ps | grep -q "revenue-postgres-local"; then
        success "PostgreSQL container is running"
    else
        error "PostgreSQL container is not running"
    fi

    # Check container health
    log "Checking container health..."
    API_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' revenue-api-local 2>/dev/null || echo "unknown")
    if [ "$API_HEALTH" = "healthy" ]; then
        success "API container is healthy"
    else
        warning "API container health: $API_HEALTH"
    fi

    # Check resource usage
    log "Checking resource usage..."
    STATS=$(docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" \
        revenue-api-local revenue-postgres-local)
    echo "$STATS"
}

# Test logs
test_logs() {
    section "Testing Logs"

    cd "$PROJECT_ROOT"

    log "Checking API logs..."
    LOG_COUNT=$(docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs api 2>/dev/null | wc -l)
    if [ "$LOG_COUNT" -gt 10 ]; then
        success "API logs are being generated (${LOG_COUNT} lines)"
    else
        warning "Limited API logs found"
    fi

    log "Checking for errors in logs..."
    ERROR_COUNT=$(docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs api 2>/dev/null | grep -i "error" | wc -l)
    if [ "$ERROR_COUNT" -eq 0 ]; then
        success "No errors found in logs"
    else
        warning "$ERROR_COUNT error(s) found in logs"
    fi
}

# View final status
final_status() {
    section "Test Summary"

    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps

    echo ""
    echo "Test Results:"
    echo "  Passed: $TESTS_PASSED"
    echo "  Failed: $TESTS_FAILED"
    echo ""

    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}✅ All tests passed!${NC}"
        echo ""
        echo "Your deployment is ready for production!"
        echo ""
        echo "Next steps:"
        echo "  1. Review the configuration files"
        echo "  2. Set up GitHub secrets for CI/CD"
        echo "  3. Deploy to production VPS"
        echo ""
        echo "To stop the test environment:"
        echo "  docker compose -f docker-compose.local.yml --env-file .env.local down -v"
        echo ""
        return 0
    else
        echo -e "${RED}❌ Some tests failed!${NC}"
        echo ""
        echo "Please review the errors above and fix them before deploying."
        echo ""
        echo "To view logs:"
        echo "  docker compose -f docker-compose.local.yml --env-file .env.local logs"
        echo ""
        echo "To stop the test environment:"
        echo "  docker compose -f docker-compose.local.yml --env-file .env.local down -v"
        echo ""
        return 1
    fi
}

# Main execution
main() {
    echo "================================================"
    echo "🧪 Local Deployment Test"
    echo "================================================"
    echo ""

    # Parse arguments
    parse_arguments "$@"

    # Show interactive menu if requested
    if [ "$INTERACTIVE_MODE" = true ]; then
        interactive_menu
    fi

    # Display execution plan
    section "Execution Plan"
    echo "Tests to run: ${TESTS_TO_RUN[*]}"
    echo "Skip cleanup: $SKIP_CLEANUP"
    echo "Skip build: $SKIP_BUILD"
    echo ""
    read -p "Continue? (y/n, default: y): " confirm
    if [[ "$confirm" =~ ^[Nn]$ ]]; then
        echo -e "${YELLOW}Cancelled by user${NC}"
        exit 0
    fi
    echo ""

    check_prerequisites

    if [ "$SKIP_CLEANUP" = false ]; then
        cleanup
    else
        log "Skipping cleanup..."
    fi

    if [ "$SKIP_BUILD" = false ]; then
        build_images
    else
        log "Skipping Docker image build..."
    fi

    start_services
    sleep 5

    # Run selected tests
    for test in "${TESTS_TO_RUN[@]}"; do
        case $test in
            health) test_health_endpoints ;;
            api) test_api_endpoints ;;
            database) test_database_operations ;;
            backup) test_backup_script ;;
            resources) test_container_resources ;;
            logs) test_logs ;;
        esac
    done

    final_status
}

# Run main function with all arguments
main "$@"
