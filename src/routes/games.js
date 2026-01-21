import express from "express";
const router = express.Router();

import gameController from "../controllers/gameController.js";
import { authenticateToken } from "../middleware/auth.js";
import { apiLimiter } from "../middleware/rateLimiter.js";

// All routes require authentication and rate limiting
router.use(apiLimiter);
router.use(authenticateToken);

// GET /api/games?status=active|completed|pending - List games (for Lobby)
router.get("/", gameController.listGames);

// POST /api/games - Create a new game
router.post("/", gameController.createGame);

// GET /api/games/:gameLink - Get game details
router.get("/:gameLink", gameController.getGame);

// POST /api/games/:gameLink/join - Join a game
router.post("/:gameLink/join", gameController.joinGame);

// POST /api/games/:gameLink/result - Submit game result
router.post("/:gameLink/result", gameController.submitResult);

export default router;
