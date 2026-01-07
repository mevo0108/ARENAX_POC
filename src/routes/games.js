const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const authMiddleware = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

// All routes require authentication and rate limiting
router.use(apiLimiter);
router.use(authMiddleware);

// POST /api/games - Create a new game
router.post('/', gameController.createGame);

// GET /api/games/:gameLink - Get game details
router.get('/:gameLink', gameController.getGame);

// POST /api/games/:gameLink/join - Join a game
router.post('/:gameLink/join', gameController.joinGame);

// POST /api/games/:gameLink/result - Submit game result
router.post('/:gameLink/result', gameController.submitResult);

module.exports = router;
