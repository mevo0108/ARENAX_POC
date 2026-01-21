import Game from "../models/Game.js";
import { v4 as uuidv4 } from "uuid";
import lichessService from "../services/lichessService.js";

function toNumberOrNull(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeStatusQuery(q) {
  const s = String(q || "").toLowerCase().trim();
  return s || "active";
}

const gameController = {
  /**
   * GET /api/games?status=active|completed|pending
   * For the Lobby: status=active should include everything that is not completed.
   */
  async listGames(req, res) {
    try {
      const status = normalizeStatusQuery(req.query.status);

      let filter = {};
      if (status === "active") {
        // Treat "active" as "not completed" (includes pending)
        filter = { status: { $ne: "completed" } };
      } else if (status === "completed") {
        filter = { status: "completed" };
      } else if (status === "pending") {
        filter = { status: "pending" };
      } else {
        // Fallback: return not-completed
        filter = { status: { $ne: "completed" } };
      }

      // Return newest first
      const docs = await Game.find(filter).sort({ created_at: -1 }).limit(50).lean();

      const games = (docs || []).map((g) => ({
        id: g._id,
        name: g.name || "ArenaX Tournament",
        status: g.status,
        externalApi: g.external_api,
        externalGameId: g.external_game_id,
        lichessUrl: g.lichess_url || "",
        playUrl: g.play_url || "",
        timePreset: g.time_preset || null,
        clockInitial: g.clock_initial ?? null,
        clockIncrement: g.clock_increment ?? null,
        createdAt: g.created_at,
      }));

      res.json({ games });
    } catch (error) {
      console.error("List games error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // POST /api/games - Create a new game session
  async createGame(req, res) {
    try {
      const body = req.body || {};

      if (!req.body) {
        return res.status(400).json({ error: "Request body required (application/json)" });
      }

      const {
        externalApi,
        name,

        // New: time control from frontend
        timePreset,
        clockInitial,
        clockIncrement,

        // Optional future fields
        rated,
        variant,
        tournamentMinutes,
      } = body;

      const userId = req.user.id;

      // Generate unique game link
      const gameLink = uuidv4();

      let externalGameId = null;
      let lichessUrl = null;
      let playUrl = null;

      // Normalize time control
      const initialMin = toNumberOrNull(clockInitial) ?? 3;
      const incSec = toNumberOrNull(clockIncrement) ?? 0;

      if (externalApi === "lichess") {
        try {
          // Map frontend to lichess arena tournament options:
          // - clockTime is initial minutes per player
          // - clockIncrement is seconds increment per move
          // - minutes is tournament duration (default 30)
          const tournamentOptions = {
            name: name || "ArenaX Tournament",
            clockTime: initialMin,
            clockIncrement: incSec,
            minutes: toNumberOrNull(tournamentMinutes) ?? 30,
            rated: !!rated,
            variant: variant || "standard",
          };

          const lichessGame = await lichessService.createGame([userId], tournamentOptions);

externalGameId = lichessGame.gameId || lichessGame.tournamentId || null;

// Normalize URL fields so the frontend can always find them
lichessUrl =
  lichessGame.lichessUrl ||
  lichessGame.joinUrl ||
  lichessGame.playUrl ||
  null;

playUrl =
  lichessGame.playUrl ||
  lichessGame.lichessUrl ||
  lichessGame.joinUrl ||
  null;

        } catch (lichessError) {
          // If Lichess fails, create game without external link
          console.log(
            "Lichess unavailable, creating game without external link:",
            lichessError.message
          );
          // Continue without Lichess - game will work in local mode
        }
      }

      // Save game with extra fields so Lobby can display them later
      const game = await Game.create(gameLink, externalApi, externalGameId, {
        name: name || "ArenaX Tournament",
        lichess_url: lichessUrl || null,
        play_url: playUrl || null,
        time_preset: timePreset || null,
        clock_initial: initialMin,
        clock_increment: incSec,
        created_by: userId,
        // Keep current status logic:
        // pending means "not completed yet" and matches our "active" filter
        status: "pending",
      });

      // Add creator as first player
      await Game.addPlayer(game.id, userId, 1);

      res.status(201).json({
        message: "Game created successfully",
        game: {
          id: game.id,
          gameLink: game.game_link,
          name: name || "ArenaX Tournament",
          externalApi,
          externalGameId,
          lichessUrl,
          playUrl,
          timePreset: timePreset || null,
          clockInitial: initialMin,
          clockIncrement: incSec,
          joinUrl: `/api/games/${game.game_link}/join`,
          status: "pending",
        },
      });
    } catch (error) {
      console.error("Create game error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // Join a game by link
  async joinGame(req, res) {
    try {
      const { gameLink } = req.params;
      const userId = req.user.id;

      const game = await Game.findByLink(gameLink);
      if (!game) return res.status(404).json({ error: "Game not found" });

      if (game.status !== "pending") {
        return res.status(400).json({ error: "Game is no longer accepting players" });
      }

      const players = await Game.getPlayersByGameId(game.id);
      const isAlreadyJoined = players.some((p) => String(p.user_id) === String(userId));

      if (isAlreadyJoined) {
        return res.status(400).json({ error: "You have already joined this game" });
      }

      await Game.addPlayer(game.id, userId, players.length + 1);

      res.json({
        message: "Joined game successfully",
        game: {
          id: game.id,
          gameLink: game.game_link,
          playerCount: players.length + 1,
        },
      });
    } catch (error) {
      console.error("Join game error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // Get game details
  async getGame(req, res) {
    try {
      const { gameLink } = req.params;

      const game = await Game.findByLink(gameLink);
      if (!game) return res.status(404).json({ error: "Game not found" });

      const players = await Game.getPlayersByGameId(game.id);

      res.json({
        game: {
          id: game.id,
          gameLink: game.game_link,
          name: game.name,
          externalApi: game.external_api,
          externalGameId: game.external_game_id,
          lichessUrl: game.lichess_url,
          playUrl: game.play_url,
          timePreset: game.time_preset || null,
          clockInitial: game.clock_initial ?? null,
          clockIncrement: game.clock_increment ?? null,
          status: game.status,
          createdAt: game.created_at,
          completedAt: game.completed_at,
          players,
        },
      });
    } catch (error) {
      console.error("Get game error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // Submit game result
  async submitResult(req, res) {
    try {
      const { gameLink } = req.params;
      const { winnerId, playerResults, gameData } = req.body;

      const game = await Game.findByLink(gameLink);
      if (!game) return res.status(404).json({ error: "Game not found" });

      await Game.updateStatus(game.id, "completed", new Date().toISOString());

      if (playerResults && Array.isArray(playerResults)) {
        for (const result of playerResults) {
          await Game.updatePlayerResult(game.id, result.userId, result.score, result.result);
        }
      }

      await Game.saveResult(game.id, winnerId, gameData || {});

      if (game.external_api === "lichess" && game.external_game_id) {
        await lichessService.syncGameResult(game.external_game_id, winnerId, playerResults);
      }

      res.json({
        message: "Game result submitted successfully",
        game: { id: game.id, gameLink: game.game_link, status: "completed" },
      });
    } catch (error) {
      console.error("Submit result error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
};

export default gameController;
