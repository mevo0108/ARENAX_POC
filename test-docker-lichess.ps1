# ARENAX Lichess Integration Docker Test Script (PowerShell)
# This script helps test the integrated Lichess OAuth and tournament creation

Write-Host "🎯 ARENAX Lichess Integration Docker Test" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Check if Docker is running
try {
    $dockerInfo = docker info 2>$null
} catch {
    Write-Host "[ERROR] Docker is not running. Please start Docker first." -ForegroundColor Red
    exit 1
}

Write-Host "[INFO] Starting ARENAX services with Docker Compose..." -ForegroundColor Blue

# Start services
docker-compose up -d

Write-Host "[INFO] Waiting for services to start..." -ForegroundColor Blue
Start-Sleep -Seconds 10

# Check MongoDB
Write-Host "[INFO] Checking MongoDB..." -ForegroundColor Blue
try {
    $mongoResult = docker-compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[SUCCESS] MongoDB is ready" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] MongoDB failed to start" -ForegroundColor Red
        docker-compose logs mongodb
        exit 1
    }
} catch {
    Write-Host "[ERROR] MongoDB health check failed" -ForegroundColor Red
    exit 1
}

# Check API
Write-Host "[INFO] Checking ARENAX API..." -ForegroundColor Blue
try {
    $apiResponse = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing
    if ($apiResponse.StatusCode -eq 200) {
        Write-Host "[SUCCESS] ARENAX API is ready" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] ARENAX API returned status $($apiResponse.StatusCode)" -ForegroundColor Red
        docker-compose logs arenax-api
        exit 1
    }
} catch {
    Write-Host "[ERROR] ARENAX API failed to respond" -ForegroundColor Red
    docker-compose logs arenax-api
    exit 1
}

Write-Host ""
Write-Host "[SUCCESS] All services are running!" -ForegroundColor Green
Write-Host ""
Write-Host "ARENAX is now running at: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "[WARNING] IMPORTANT: Lichess OAuth Configuration Required" -ForegroundColor Yellow
Write-Host ""
Write-Host "To test the full Lichess integration, you need to:" -ForegroundColor White
Write-Host ""
Write-Host "1. Create a Lichess OAuth app at: https://lichess.org/account/oauth/app" -ForegroundColor White
Write-Host "   - Name: ARENAX Test" -ForegroundColor White
Write-Host "   - Description: Testing ARENAX Lichess integration" -ForegroundColor White
Write-Host "   - Homepage: http://localhost:3000" -ForegroundColor White
Write-Host "   - Callback URL: http://localhost:3000/api/auth/lichess/callback" -ForegroundColor White
Write-Host ""
Write-Host "2. Update docker-compose.yml with real values:" -ForegroundColor White
Write-Host "   - LICHESS_CLIENT_ID=your-real-client-id-here" -ForegroundColor White
Write-Host ""
Write-Host "3. Restart the services:" -ForegroundColor White
Write-Host "   docker-compose restart arenax-api" -ForegroundColor White
Write-Host ""
Write-Host "[INFO] Testing basic functionality (without Lichess OAuth)..." -ForegroundColor Blue

# Test health endpoint
try {
    $healthResponse = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing
    $healthContent = $healthResponse.Content
    if ($healthContent -match "ok") {
        Write-Host "[SUCCESS] Health check passed" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Health check failed - unexpected response" -ForegroundColor Red
    }
} catch {
    Write-Host "[ERROR] Health check request failed" -ForegroundColor Red
}

# Test root endpoint
try {
    $rootResponse = Invoke-WebRequest -Uri "http://localhost:3000/" -UseBasicParsing
    $rootContent = $rootResponse.Content
    if ($rootContent -match "ARENAX") {
        Write-Host "[SUCCESS] Root endpoint working" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Root endpoint failed - unexpected response" -ForegroundColor Red
    }
} catch {
    Write-Host "[ERROR] Root endpoint request failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "[INFO] Next steps:" -ForegroundColor Blue
Write-Host "1. Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host "2. Register a new account or login" -ForegroundColor White
Write-Host "3. Try to create a tournament (will show OAuth connection needed)" -ForegroundColor White
Write-Host "4. Set up real Lichess OAuth credentials to test full integration" -ForegroundColor White
Write-Host ""
Write-Host "[INFO] To stop services: docker-compose down" -ForegroundColor Blue
Write-Host "[INFO] To view logs: docker-compose logs -f arenax-api" -ForegroundColor Blue