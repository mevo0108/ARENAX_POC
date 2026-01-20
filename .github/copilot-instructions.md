# ARENAX Copilot Instructions

ARENAX is a REST API platform for managing card game tournaments with user authentication, multi-player game sessions, and external API integration (Lichess).

## Architecture Overview

**Full-stack monorepo**: Express.js backend (`/src`) + React frontend (`/client`).

### Data Flow
1. Users register/login → JWT tokens stored client-side
2. Frontend sends token in `Authorization: Bearer <token>` header
3. Backend validates JWT in `authenticateToken` middleware
4. Game creation → Optional Lichess tournament sync via `lichessService.js`

### Core Services
- **MongoDB** (local URI: `mongodb://localhost:27017/arenax`) - Collections: users, arenas, arenagames
- **Express routes**: Auth (`/api/auth`), Users (`/api/users`), Games (`/api/games`)
- **Lichess integration**: Creates tournaments via API token, stores external game IDs for sync

## Development Workflow

```bash
# Install + Run (both backend and client)
npm install && npm run dev

# Docker for full integration testing
docker-compose up -d

# Backend-only dev (auto-reload via nodemon)
npm run dev  # from root
```

**Key files**: [src/server.js](src/server.js) (entry), [src/lichessClient.js](src/lichessClient.js) (Lichess client factory)

## Code Patterns & Conventions

### Authentication Pattern
- **JWT secret**: Read from `JWT_SECRET` env var; defaults to hardcoded dev key (WARN: insecure)
- **Token format**: Bearer scheme in `Authorization` header
- **Verification**: `authenticateToken` middleware extracts token, validates against JWT_SECRET, checks blacklist
- **File**: [src/middleware/auth.js](src/middleware/auth.js)

### Model Schema Pattern
- Mongoose schemas in `/src/models/` (User, Arena, ArenaGame, Game)
- Static methods for queries (`findByEmail`, `findById`) return plain objects with id strings
- ObjectId → string conversion for API responses (e.g., `String(row._id)`)
- Example: [src/models/User.js](src/models/User.js)

### Controller Pattern
- Controllers in `/src/controllers/` receive requests, call models/services, return JSON
- Error handling: `try/catch` with error messages to client
- External API calls wrapped in try/catch with graceful fallbacks
- Example: [src/controllers/gameController.js](src/controllers/gameController.js)

### External API Integration
- Service pattern: Each external API (Lichess, future integrations) has dedicated service file
- Services handle HTTP calls, error handling, and database sync
- Lichess: `createGame()` posts to `/api/tournament`, stores tournamentId + joinUrl
- File: [src/services/lichessService.js](src/services/lichessService.js)

## Project-Specific Details

### Rate Limiting
- Auth endpoints: 5 req/15min per IP
- General API: 100 req/15min per IP
- Applied via `express-rate-limit` middleware in controllers

### Environment Variables (.env.example template)
- **Core**: `PORT`, `NODE_ENV`, `JWT_SECRET`
- **DB**: `DATABASE_PATH` (MongoDB URI)
- **Lichess**: `LICHESS_API_URL`, `LICHESS_API_KEY` (personal access token)
- Client-side auth: Access token stored in localStorage (key: `token`)

### Game Session Lifecycle
1. Creator posts to `/api/games` → Generates unique UUID gameLink
2. Players join via `/api/games/:gameLink/join`
3. All players submit results to `/api/games/:gameLink/result`
4. If Lichess enabled: Results auto-sync to external tournament

### Frontend (React + Vite)
- Entry: [client/src/main.jsx](client/src/main.jsx)
- API clients: [client/src/services/](client/src/services/) (authApi, gamesApi, usersApi)
- Services use fetch + Bearer token in headers
- Build: `npm run build` → outputs to `client/dist`, served by Express static middleware

## When Adding Features

- **New external API**: Create `src/services/newApiService.js` with async `createGame()`, `getStatus()`, `syncResults()` methods
- **New routes**: Add route file in `src/routes/`, controller in `src/controllers/`, middleware in `src/middleware/`
- **New model**: Define schema in `src/models/`, add static helper methods, update controllers
- **Frontend**: Use existing pattern in `client/src/services/*.js` for API calls; fetch with `Authorization` header

## Critical Files Reference

| File | Purpose |
|------|---------|
| [src/server.js](src/server.js) | Express setup, CORS, static files, routes |
| [src/config/database.js](src/config/database.js) | MongoDB connection |
| [src/middleware/auth.js](src/middleware/auth.js) | JWT validation, blacklist check |
| [src/models/User.js](src/models/User.js) | User schema + auth helpers |
| [src/services/lichessService.js](src/services/lichessService.js) | Lichess API client |
| [client/src/services/authApi.js](client/src/services/authApi.js) | Frontend auth calls |
| [docker-compose.yml](docker-compose.yml) | MongoDB + API containers |
