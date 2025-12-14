#!/bin/bash

# ========================================
# Cloud Proxmox - Production Deployment
# ========================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check requirements
check_requirements() {
    log_info "Checking requirements..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    log_success "Requirements check passed"
}

# Check env file
check_env() {
    log_info "Checking environment configuration..."
    
    if [ ! -f ".env" ]; then
        log_error ".env file not found!"
        log_info "Copy .env.example to .env and configure your settings:"
        log_info "  cp .env.example .env"
        log_info "  nano .env"
        exit 1
    fi
    
    # Check for placeholder values
    if grep -q "CHANGE_ME" .env; then
        log_warning "Found placeholder values in .env file"
        log_warning "Please update all CHANGE_ME values before deploying"
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    log_success "Environment configuration check passed"
}

# Build and deploy
deploy() {
    log_info "Building and deploying..."
    
    # Use docker compose or docker-compose
    if docker compose version &> /dev/null; then
        DC="docker compose"
    else
        DC="docker-compose"
    fi
    
    # Pull latest base images
    log_info "Pulling base images..."
    $DC -f docker-compose.prod.yml pull postgres redis
    
    # Build application images
    log_info "Building application images..."
    $DC -f docker-compose.prod.yml build --no-cache
    
    # Stop existing containers
    log_info "Stopping existing containers..."
    $DC -f docker-compose.prod.yml down
    
    # Start services
    log_info "Starting services..."
    $DC -f docker-compose.prod.yml up -d
    
    log_success "Deployment complete!"
    log_info ""
    log_info "Services are running on:"
    log_info "  - Web: http://localhost:\${WEB_PORT:-3000}"
    log_info "  - API: http://localhost:\${API_PORT:-3002}"
    log_info ""
    log_info "Configure your Caddy reverse proxy to point to these ports."
}

# Show status
status() {
    log_info "Service status:"
    
    if docker compose version &> /dev/null; then
        docker compose -f docker-compose.prod.yml ps
    else
        docker-compose -f docker-compose.prod.yml ps
    fi
}

# Show logs
logs() {
    if docker compose version &> /dev/null; then
        docker compose -f docker-compose.prod.yml logs -f "$@"
    else
        docker-compose -f docker-compose.prod.yml logs -f "$@"
    fi
}

# Stop services
stop() {
    log_info "Stopping services..."
    
    if docker compose version &> /dev/null; then
        docker compose -f docker-compose.prod.yml down
    else
        docker-compose -f docker-compose.prod.yml down
    fi
    
    log_success "Services stopped"
}

# Main
case "${1:-deploy}" in
    deploy)
        check_requirements
        check_env
        deploy
        status
        ;;
    status)
        status
        ;;
    logs)
        shift
        logs "$@"
        ;;
    stop)
        stop
        ;;
    restart)
        stop
        deploy
        ;;
    *)
        echo "Usage: $0 {deploy|status|logs|stop|restart}"
        echo ""
        echo "Commands:"
        echo "  deploy   - Build and deploy the application (default)"
        echo "  status   - Show service status"
        echo "  logs     - Show service logs (use: logs api, logs web, etc.)"
        echo "  stop     - Stop all services"
        echo "  restart  - Stop and redeploy"
        exit 1
        ;;
esac

