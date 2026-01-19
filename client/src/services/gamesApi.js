// src/services/gamesApi.js
import { api } from "./apiClient";

// Create a new game/tournament (requires Bearer token)
export async function createGame(payload) {
  return api("/api/games", {
    method: "POST",
    body: payload,
  });
}
