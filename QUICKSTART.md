# Quick Start Guide

Get ARENAX API up and running in under 5 minutes!

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env

# 3. (Optional) Edit .env to customize settings
# nano .env

# 4. Start the development server
npm run dev
```

The API will be running at `http://localhost:3000`

## First API Call

Open a new terminal and try:

```bash
curl http://localhost:3000/health
```

You should see: `{"status":"ok","message":"ARENAX API is running"}`

## Testing the Complete Flow

Run the automated test script:

```bash
./test-api.sh
```

This will:
1. Register two users
2. Create a game
3. Have second user join the game
4. Submit game results
5. Display game history

## Manual Testing

### 1. Register a User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "mevo",
    "email": "test@example.com",
    "password": "1234"
  }'
```

Save the `token` from the response!

### 2. Get Your Profile

```bash
# Replace YOUR_TOKEN with the token from registration
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Create a Game

```bash
curl -X POST http://localhost:3000/api/games \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"externalApi": "leeches"}'
```

Save the `gameLink` from the response!

### 4. View Game History

```bash
curl -X GET http://localhost:3000/api/users/games \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Available Scripts

- `npm start` - Start the server in production mode
- `npm run dev` - Start the server with auto-reload (development mode)

## Next Steps

- Read [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for full API reference
- Check [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for technical details
- Customize `.env` for your environment
- Configure external API keys (e.g., Leeches)

## Troubleshooting

### Database locked error
If you get a database locked error, make sure no other instances of the server are running:

```bash
# Find and kill any running instances
ps aux | grep "node src/server.js"
kill <PID>
```

### Port already in use
Change the PORT in `.env` file:

```
PORT=3001
```

### JWT Secret Warning
In production, always set a strong JWT_SECRET in `.env`:

```
JWT_SECRET=your-very-long-random-secret-key-here
```

Generate a secure secret with:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Support

For questions or issues, please refer to:
- [API Documentation](./API_DOCUMENTATION.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
- [README](./README.md)

Happy coding! 🚀
