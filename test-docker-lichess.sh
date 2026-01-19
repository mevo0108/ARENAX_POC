#!/bin/bash

# ARENAX Lichess Integration Docker Test Script
# This script helps test the integrated Lichess OAuth and tournament creation

set -e

echo "🎯 ARENAX Lichess Integration Docker Test"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

print_status "Starting ARENAX services with Docker Compose..."

# Start services
docker-compose up -d

# Wait for services to be healthy
print_status "Waiting for services to start..."
sleep 10

# Check if MongoDB is ready
if docker-compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    print_success "MongoDB is ready"
else
    print_error "MongoDB failed to start"
    docker-compose logs mongodb
    exit 1
fi

# Check if API is ready
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    print_success "ARENAX API is ready"
else
    print_error "ARENAX API failed to start"
    docker-compose logs arenax-api
    exit 1
fi

print_success "All services are running!"
echo ""
print_status "ARENAX is now running at: http://localhost:3000"
echo ""
print_warning "IMPORTANT: Lichess OAuth Configuration Required"
echo ""
echo "To test the full Lichess integration, you need to:"
echo ""
echo "1. Create a Lichess OAuth app at: https://lichess.org/account/oauth/app"
echo "   - Name: ARENAX Test"
echo "   - Description: Testing ARENAX Lichess integration"
echo "   - Homepage: http://localhost:3000"
echo "   - Callback URL: http://localhost:3000/api/auth/lichess/callback"
echo ""
echo "2. Update docker-compose.yml with real values:"
echo "   - LICHESS_CLIENT_ID=your-real-client-id-here"
echo ""
echo "3. Restart the services:"
echo "   docker-compose restart arenax-api"
echo ""
print_status "Testing basic functionality (without Lichess OAuth)..."

# Test health endpoint
if curl -s http://localhost:3000/health | grep -q "ok"; then
    print_success "Health check passed"
else
    print_error "Health check failed"
fi

# Test root endpoint
if curl -s http://localhost:3000/ | grep -q "ARENAX"; then
    print_success "Root endpoint working"
else
    print_error "Root endpoint failed"
fi

echo ""
print_status "Next steps:"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Register a new account or login"
echo "3. Try to create a tournament (will show OAuth connection needed)"
echo "4. Set up real Lichess OAuth credentials to test full integration"
echo ""
print_status "To stop services: docker-compose down"
print_status "To view logs: docker-compose logs -f arenax-api"