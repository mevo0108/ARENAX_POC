# ARENAX_POC

Social platform for managing tournaments of card games, wallet, and connecting to external API's games.

## Features

- **User Authentication**: Register and login with JWT-based authentication
- **User Profile**: View profile and game history
- **Game Session Management**: Create and join games via unique links
- **Multi-player Support**: Connect multiple players to the same game session
- **External API Integration**: Integrate with external game APIs (Lichess and more)
- **Game Results**: Store and display game results and statistics
- **Lichess Tournament Integration**: Create real Lichess tournaments with OAuth authentication

## Quick Start

### 🚀 Option 1: Docker Testing (Recommended)

Test the complete Lichess integration with Docker:

```bash
# Run automated test script
.\test-docker-lichess.ps1

# Or manually start services
docker-compose up -d

# Access application
open http://localhost:3000
```

**For Full Lichess Testing:**
1. Create OAuth app at [lichess.org/account/oauth/app](https://lichess.org/account/oauth/app)
2. Update `docker-compose.yml` with real `LICHESS_CLIENT_ID`
3. Restart: `docker-compose restart arenax-api`

### 💻 Option 2: Local Development

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/mevo0108/ARENAX_POC.git
cd ARENAX_POC
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration (optional for development)

5. Start the server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:3000`

## API Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for detailed API endpoint documentation.

## Project Structure

```
ARENAX_POC/
├── src/
│   ├── config/         # Database configuration
│   ├── controllers/    # Route controllers
│   ├── middleware/     # Authentication middleware
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── services/       # External API services
│   └── server.js       # Main server file
├── .env.example        # Environment variables template
├── .gitignore         # Git ignore rules
├── package.json       # NPM dependencies
└── README.md          # This file
```

## Technology Stack

- **Node.js** with **Express.js** - REST API framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Axios** - HTTP client for external APIs

## Usage Flow

1. **Register** a new account or **login** to existing account
2. Navigate to your **profile page** to view account information
3. **Create a game** session (optionally connected to external APIs like Leeches)
4. Share the game link with other players to **join**
5. Play the game and **submit results**
6. View your **game history** on your profile

## License

ISC
