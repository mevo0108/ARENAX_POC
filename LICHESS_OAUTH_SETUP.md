# Lichess OAuth Setup

The main backend now includes integrated Lichess OAuth authentication. To set up Lichess integration, you need to:

## 1. Create a Lichess OAuth App

1. Go to https://lichess.org/account/oauth/app
2. Create a new OAuth app with:
   - **Name**: ArenaX (or your app name)
   - **Description**: Chess tournament platform
   - **Homepage URL**: http://localhost:5173 (or your frontend URL)
   - **Callback URL**: http://localhost:3000/api/auth/lichess/callback

3. After creating the app, you'll get a **Client ID**

## 2. Environment Variables

Add these to your `.env` file:

```bash
# Lichess OAuth Configuration
LICHESS_CLIENT_ID=your-lichess-client-id-here
LICHESS_REDIRECT_URI=http://localhost:3000/api/auth/lichess/callback

# Frontend URL for OAuth redirects
FRONTEND_URL=http://localhost:5173

# Session secret for OAuth flow
SESSION_SECRET=your-secure-session-secret-here
```

## 3. OAuth Flow

The integrated system provides these endpoints:

- `GET /api/auth/lichess/login` - Redirect to Lichess OAuth
- `GET /api/auth/lichess/callback` - OAuth callback handler
- `GET /api/auth/lichess/me` - Get connected Lichess user info
- `POST /api/auth/lichess/disconnect` - Disconnect Lichess account

## 4. Tournament Creation

Once a user connects their Lichess account:

1. `POST /api/games` with `externalApi: "leeches"` creates a real Lichess tournament
2. Returns `lichessUrl` for joining the tournament
3. Tournament is saved to the Arena model for tracking

## Required Scopes

The OAuth app needs these scopes:
- `tournament:write` - Create tournaments
- `challenge:write` - Create challenges
- `challenge:read` - Read challenges
- `board:play` - Play games
- `account:read` - Read account info