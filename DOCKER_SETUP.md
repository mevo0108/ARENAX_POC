# ARENAX Docker Setup

This guide explains how to run ARENAX locally using Docker and Docker Compose.

## Architecture

The application consists of:
- **MongoDB**: Database for storing users, games, and tournament data
- **ARENAX API**: Single backend service that includes:
  - User authentication and profiles
  - Game session management
  - Lichess integration and tournament management
  - OAuth authentication for Lichess

## Prerequisites

- Docker (20.10+)
- Docker Compose (2.0+)

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd arenax_poc
   ```

2. **Create environment file**
   ```bash
   cp .env.example.docker .env
   ```

3. **Create environment file**
   ```bash
   cat > .env << 'EOF'
# ARENAX API Configuration

# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
MONGO_URI=mongodb://localhost:27017/arenax

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-change-this-in-production

# Session Configuration
SESSION_SECRET=your-session-secret-change-this-in-production

# Lichess OAuth Configuration (Required for tournament creation)
LICHESS_CLIENT_ID=your-lichess-client-id
LICHESS_REDIRECT_URI=http://localhost:3000/api/auth/lichess/callback

# Lichess API Configuration
LICHESS_TOKEN=your-lichess-api-token
LICHESS_CLIENT_ID=your-lichess-client-id
LICHESS_REDIRECT_URI=http://localhost:3000/auth/lichess/callback
FRONTEND_URL=http://localhost:5173
EOF
   ```

4. **Start the services**
   ```bash
   docker-compose up -d
   ```

5. **Check that services are running**
   ```bash
   docker-compose ps
   ```

The API will be available at `http://localhost:3000`

## Environment Variables

### Required
- `JWT_SECRET`: Secret key for JWT token signing
- `SESSION_SECRET`: Secret key for session management

### Optional (for Lichess Integration)
- `LICHESS_TOKEN`: Your Lichess API token
- `LICHESS_CLIENT_ID`: Lichess OAuth client ID
- `LICHESS_REDIRECT_URI`: OAuth callback URL (default: `http://localhost:3000/auth/lichess/callback`)

### Database
- `MONGO_URI`: MongoDB connection string (automatically set by Docker Compose)

## Available Services

### API Endpoints

**Main API** (`http://localhost:3000`):
- `GET /health` - Health check
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/users/profile` - Get user profile
- `POST /api/games` - Create game
- `GET /api/games/:gameLink` - Get game details
- `POST /api/games/:gameLink/join` - Join game
- `POST /api/games/:gameLink/result` - Submit game result

**Lichess Integration** (`http://localhost:3000`):
- `GET /auth/lichess/login` - Start Lichess OAuth
- `GET /auth/lichess/callback` - OAuth callback
- `GET /api/arena/tournaments` - List tournaments
- `POST /api/arena/tournaments` - Create tournament
- `GET /api/arena/tournaments/:id` - Get tournament details

### Database

MongoDB is available at `localhost:27017` with:
- Username: `admin`
- Password: `password`
- Database: `arenax`

## Development

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f arenax-api
docker-compose logs -f mongodb
```

### Restart services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart arenax-api
```

### Rebuild and restart
```bash
# Rebuild the API service
docker-compose up -d --build arenax-api
```

### Access database directly
```bash
# Connect to MongoDB container
docker-compose exec mongodb mongosh -u admin -p password arenax

# Or connect from host
mongosh mongodb://admin:password@localhost:27017/arenax
```

## Testing

Run the API test script:
```bash
./test-api.sh
```

This will test the complete user flow including registration, game creation, and result submission.

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Change ports in docker-compose.yml
   ports:
     - "3001:3000"  # Change host port from 3000 to 3001
   ```

2. **Database connection issues**
   ```bash
   # Check MongoDB logs
   docker-compose logs mongodb

   # Restart database
   docker-compose restart mongodb
   ```

3. **API not responding**
   ```bash
   # Check API logs
   docker-compose logs arenax-api

   # Check health endpoint
   curl http://localhost:3000/health
   ```

### Reset Everything

To completely reset the environment:
```bash
# Stop and remove all containers
docker-compose down

# Remove volumes (WARNING: deletes all data)
docker-compose down -v

# Rebuild from scratch
docker-compose up -d --build
```

## Production Deployment

For production deployment:

1. **Update environment variables** with production values
2. **Use external MongoDB** instance
3. **Enable HTTPS** and set `secure: true` in session config
4. **Configure proper CORS** origins
5. **Set up reverse proxy** (nginx, traefik, etc.)

## File Structure

```
arenax_poc/
├── docker-compose.yml    # Docker services configuration
├── Dockerfile           # Backend container definition
├── .dockerignore       # Files to exclude from Docker build
├── .env                # Environment variables (create from .env.example.docker)
├── src/                # Main backend application
├── backend/
│   └── lichess-api-server/  # Lichess integration (consolidated)
├── client/             # React frontend (run separately for development)
└── DOCKER_SETUP.md     # This file
```