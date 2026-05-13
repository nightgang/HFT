#!/bin/bash
#
# HFT Trading System - Setup & Start Script
# Helps you set up and start all trading system components
#

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   HFT Trading System - Setup & Start                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to print section headers
print_section() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}▶ $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if .env exists
print_section "Checking Environment"

if [ ! -f .env ]; then
    print_error ".env file not found"
    echo "Creating .env from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        print_status ".env created from template"
        echo "Please edit .env with your configuration before running services"
    else
        print_error ".env.example not found"
        exit 1
    fi
else
    print_status ".env file exists"
fi

# Check Node.js
print_section "Checking Node.js"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_status "Node.js found: $NODE_VERSION"
else
    print_error "Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Check Docker
print_section "Checking Docker"
if command -v docker &> /dev/null; then
    print_status "Docker found: $(docker --version)"
else
    print_warning "Docker not found. Services will not start via docker-compose"
fi

# Check Python for AI Service
print_section "Checking Python"
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    print_status "Python found: $PYTHON_VERSION"
else
    print_warning "Python not found. AI Service will not be available"
fi

# Install dependencies if needed
print_section "Checking Dependencies"

if [ ! -d "node_modules" ]; then
    print_warning "Root node_modules not found, installing..."
    npm install
    print_status "Root dependencies installed"
else
    print_status "Root node_modules found"
fi

if [ ! -d "backend/node_modules" ]; then
    print_warning "Backend node_modules not found, installing..."
    cd backend && npm install && cd ..
    print_status "Backend dependencies installed"
else
    print_status "Backend node_modules found"
fi

if [ ! -d "frontend/node_modules" ]; then
    print_warning "Frontend node_modules not found, installing..."
    cd frontend && npm install && cd ..
    print_status "Frontend dependencies installed"
else
    print_status "Frontend node_modules found"
fi

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Setup Complete!                                          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

print_section "Quick Start Options"

echo -e "${YELLOW}1. Start Backend only:${NC}"
echo "   npm run dev:backend"
echo ""

echo -e "${YELLOW}2. Start Frontend only:${NC}"
echo "   npm run dev:frontend"
echo ""

echo -e "${YELLOW}3. Start Both (Backend + Frontend):${NC}"
echo "   npm run dev"
echo ""

echo -e "${YELLOW}4. Start Katana CLI:${NC}"
echo "   npm run katana"
echo ""

echo -e "${YELLOW}5. Start AI Service:${NC}"
echo "   pip install -r ai-service/requirements.txt"
echo "   python ai-service/main.py"
echo ""

echo -e "${YELLOW}6. Start All Docker Services:${NC}"
echo "   docker-compose up -d"
echo ""

print_section "Access URLs"

echo -e "${GREEN}Backend API:${NC}        http://localhost:3001"
echo -e "${GREEN}Frontend UI:${NC}        http://localhost:5173"
echo -e "${GREEN}API Docs:${NC}          http://localhost:3001/api/docs"
echo -e "${GREEN}Prometheus:${NC}        http://localhost:9090"
echo -e "${GREEN}Grafana:${NC}           http://localhost:3000"
echo -e "${GREEN}AI Service:${NC}        http://localhost:8000"
echo ""

print_section "Documentation"
echo "See SETUP-COMPLETE.md for detailed setup instructions"
echo "See SECURITY.md for security best practices"
echo "See GIT-SECURITY-WORKFLOW.md for development workflow"
echo ""
