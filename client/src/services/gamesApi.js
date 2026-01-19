// src/services/gamesApi.js
import { api } from "./apiClient";

// Create a new game/tournament (requires Bearer token)
export async function createGame(payload) {
  return api("/api/games", {
    method: "POST",
    body: payload,
  });
}

/**
 * Fetch active games/tournaments.
 * Backend can implement any of these patterns:
 * - GET /api/games?status=active
 * - GET /api/games/active
 *
 * We try the first one (common REST style).
 */
export async function getActiveGames() {
  return api("/api/games?status=active", {
    method: "GET",
  });
}
