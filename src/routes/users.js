const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

// All routes require authentication and rate limiting
router.use(apiLimiter);
router.use(authMiddleware);

// GET /api/users/profile - Get current user profile
router.get('/profile', userController.getProfile);

// GET /api/users/games - Get user's game history
router.get('/games', userController.getGameHistory);

module.exports = router;
