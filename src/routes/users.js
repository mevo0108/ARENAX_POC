import express from 'express';
const router = express.Router();
import userController from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

// All routes require authentication and rate limiting
router.use(apiLimiter);
router.use(authenticateToken);

// GET /api/users/profile - Get current user profile
router.get('/profile', userController.getProfile);

// GET /api/users/games - Get user's game history
router.get('/games', userController.getGameHistory);

export default router;
