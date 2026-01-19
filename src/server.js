import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import gameRoutes from './routes/games.js';

// Initialize database
import './config/database.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Session middleware (required for Lichess OAuth)
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // Set to true in production with HTTPS
    },
  })
);

// No OAuth middleware needed - using global API token

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the React app build directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientBuildPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/games', gameRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'ARENAX API is running' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to ARENAX API',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login'
      },
      users: {
        profile: 'GET /api/users/profile',
        games: 'GET /api/users/games'
      },
      games: {
        create: 'POST /api/games',
        get: 'GET /api/games/:gameLink',
        join: 'POST /api/games/:gameLink/join',
        submitResult: 'POST /api/games/:gameLink/result'
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Serve React app for all non-API routes (SPA fallback)
app.use((req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api/') || req.path.startsWith('/auth/')) {
    return next();
  }
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`ARENAX API server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
