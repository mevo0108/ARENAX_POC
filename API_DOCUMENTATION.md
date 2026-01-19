# ARENAX API Documentation

## Overview

ARENAX is a REST API system for managing card game tournaments with user authentication, game session management, and external API integration (starting with Leeches API).

## Base URL

```
http://localhost:3000
```

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## API Endpoints

### Authentication

#### Register User

Register a new user account.

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:** `201 Created`
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Login User

Authenticate and receive a JWT token.

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:** `200 OK`
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### User Profile

#### Get Profile

Get the authenticated user's profile information.

**Endpoint:** `GET /api/users/profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "created_at": "2024-01-01T10:00:00.000Z"
  }
}
```

#### Get Game History

Get the authenticated user's game history.

**Endpoint:** `GET /api/users/games?limit=10`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (optional): Number of games to return (default: 10)

**Response:** `200 OK`
```json
{
  "games": [
    {
      "game_id": 1,
      "game_link": "550e8400-e29b-41d4-a716-446655440000",
      "external_api": "leeches",
      "status": "completed",
      "completed_at": "2024-01-01T12:00:00.000Z",
      "score": 100,
      "result": "won",
      "winner_id": 1,
      "winner_username": "johndoe"
    }
  ]
}
```

### Games

#### Create Game

Create a new game session.

**Endpoint:** `POST /api/games`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "externalApi": "leeches",
  "players": [1, 2, 3]
}
```

**Parameters:**
- `externalApi` (optional): External API to use ("leeches" or null)
- `players` (optional): Array of player user IDs

**Response:** `201 Created`
```json
{
  "message": "Game created successfully",
  "game": {
    "id": 1,
    "gameLink": "550e8400-e29b-41d4-a716-446655440000",
    "externalApi": "leeches",
    "externalGameId": "leeches_1234567890",
    "joinUrl": "/api/games/550e8400-e29b-41d4-a716-446655440000/join"
  }
}
```

#### Get Game Details

Get details of a specific game.

**Endpoint:** `GET /api/games/:gameLink`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "game": {
    "id": 1,
    "gameLink": "550e8400-e29b-41d4-a716-446655440000",
    "externalApi": "leeches",
    "externalGameId": "leeches_1234567890",
    "status": "pending",
    "createdAt": "2024-01-01T10:00:00.000Z",
    "completedAt": null,
    "players": [
      {
        "id": 1,
        "user_id": 1,
        "username": "johndoe",
        "email": "john@example.com",
        "position": 1,
        "score": null,
        "result": null
      }
    ]
  }
}
```

#### Join Game

Join an existing game using its unique link.

**Endpoint:** `POST /api/games/:gameLink/join`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "message": "Joined game successfully",
  "game": {
    "id": 1,
    "gameLink": "550e8400-e29b-41d4-a716-446655440000",
    "playerCount": 2
  }
}
```

#### Submit Game Result

Submit the result of a completed game.

**Endpoint:** `POST /api/games/:gameLink/result`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "winnerId": 1,
  "playerResults": [
    {
      "userId": 1,
      "score": 100,
      "result": "won"
    },
    {
      "userId": 2,
      "score": 75,
      "result": "lost"
    }
  ],
  "gameData": {
    "duration": 1800,
    "rounds": 10
  }
}
```

**Response:** `200 OK`
```json
{
  "message": "Game result submitted successfully",
  "game": {
    "id": 1,
    "gameLink": "550e8400-e29b-41d4-a716-446655440000",
    "status": "completed"
  }
}
```

## External API Integration

### Lichess Integration

The system integrates with Lichess using OAuth 2.0 for tournament creation and management. Users must authenticate with Lichess before creating tournaments.

#### OAuth Configuration

Set up a Lichess OAuth application at https://lichess.org/account/oauth/app with:
- **Homepage URL**: `http://localhost:3000`
- **Callback URL**: `http://localhost:3000/api/auth/lichess/callback`

Required environment variables:
```
LICHESS_CLIENT_ID=your-lichess-client-id
LICHESS_REDIRECT_URI=http://localhost:3000/api/auth/lichess/callback
```

#### Authentication Flow

1. User registers/logs in to ARENAX
2. User clicks "Connect Lichess" → Redirects to Lichess OAuth
3. User authorizes ARENAX → Redirects back with access token
4. User can now create Lichess tournaments

When creating a game with `"externalApi": "leeches"`, the system will:
1. Create a game session in the Leeches API
2. Store the external game ID
3. Sync results back to Leeches when the game completes

## Error Responses

All endpoints may return the following error responses:

**400 Bad Request**
```json
{
  "error": "Validation error message"
}
```

**401 Unauthorized**
```json
{
  "error": "Invalid token"
}
```

**404 Not Found**
```json
{
  "error": "Resource not found"
}
```

**409 Conflict**
```json
{
  "error": "Resource already exists"
}
```

**500 Internal Server Error**
```json
{
  "error": "Internal server error"
}
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your configuration

5. Start the server:
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

The API will be available at `http://localhost:3000`

## Database

The system uses MongoDB for data persistence. The database connection is established automatically on startup with the following collections:

- `users`: User accounts
- `arenas`: Tournament and arena information  
- `arenagames`: Games within arenas
- `games`: Game sessions (if applicable)

## Testing the API

You can test the API using curl, Postman, or any HTTP client.

### Example: Complete User Flow

1. **Register a user:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"player1","email":"player1@example.com","password":"pass123"}'
```

2. **Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"player1@example.com","password":"pass123"}'
```

3. **Get profile (use token from login):**
```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

4. **Create a game:**
```bash
curl -X POST http://localhost:3000/api/games \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"externalApi":"leeches"}'
```

5. **Get game history:**
```bash
curl -X GET http://localhost:3000/api/users/games \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```
