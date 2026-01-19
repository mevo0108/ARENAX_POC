import Game from '../models/Game.js';
import { v4 as uuidv4 } from 'uuid';
import lichessService from '../services/lichessService.js';

const gameController = {
  // Create a new game session
  async createGame(req, res) {
    try {
      // Protect against missing body (some clients may omit Content-Type)
      if (!req.body) {
        return res.status(400).json({ error: 'Request body required (application/json)' });
      }

      const body = req.body || {};
      const { externalApi, players, lichess } = body; // lichess: settings object (optional)
      const userId = req.user.id;

      // Generate unique game link (internal)
      const gameLink = uuidv4();

      let externalGameId = null;
      let externalJoinUrl = null;

      // === External provider: Lichess ===
      // NOTE: Lichess is not "create game" directly; it creates a CHALLENGE/SEEK.
      // We'll store challengeId as externalGameId, and return challenge URL as externalJoinUrl.
      if (externalApi === 'lichess') {
        try {
          // Recommended payload structure:
          // lichess: {
          //   rated: false,
          //   variant: "standard",
          //   clockLimit: 300,       // seconds
          //   clockIncrement: 0,     // seconds
          //   color: "random"        // "white" | "black" | "random"
          // }
          //
          // players: optional - could be lichess usernames in future.
          // For open challenge we don't need opponent username.

          const settings = lichess || {};
          const challenge = await lichessService.createOpenChallenge(settings);

          // Your service should return something like:
          // { challengeId, url, blackUrl, whiteUrl, ... }
          externalGameId = challenge.challengeId || challenge.id || null;
          externalJoinUrl =
            challenge.url || challenge.challengeUrl || challenge.joinUrl || null;
        } catch (err) {
          // External failed — we still create internal game (POC should not crash)
          console.error('Lichess API create game error:', err?.message || err);
        }
      }

      // Create internal game record
      const game = await Game.create(gameLink, externalApi || null, externalGameId);

      // Add creator as first player
      await Game.addPlayer(game.id, userId, 1);

      res.status(201).json({
        message: 'Game created successfully',
        game: {
          id: game.id,
          gameLink: game.game_link,
          externalApi: externalApi || null,
          externalGameId,
          externalJoinUrl, // <-- lichess link (if created)
          joinUrl: `/api/games/${game.game_link}/join`,
        },
      });
    } catch (error) {
      console.error('Create game error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Join a game by link
  async joinGame(req, res) {
    try {
      const { gameLink } = req.params;
      const userId = req.user.id;

      // Find game
      const game = await Game.findByLink(gameLink);
      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }

      if (game.status !== 'pending') {
        return res.status(400).json({ error: 'Game is no longer accepting players' });
      }

      // Get current players
      const players = await Game.getPlayersByGameId(game.id);

      // FIX: handle different shapes (string id OR populated user object)
      const isAlreadyJoined = players.some((p) => {
        const pid =
          typeof p.user_id === 'string'
            ? p.user_id
            : (p.user_id && (p.user_id._id || p.user_id.id)) || null;

        return pid && String(pid) === String(userId);
      });

      // Make join idempotent (do not add duplicate)
      if (isAlreadyJoined) {
        return res.json({
          message: 'Already joined',
          game: {
            id: game.id,
            gameLink: game.game_link,
            playerCount: players.length,
          },
        });
      }

      // Add player to game
      await Game.addPlayer(game.id, userId, players.length + 1);

      res.json({
        message: 'Joined game successfully',
        game: {
          id: game.id,
          gameLink: game.game_link,
          playerCount: players.length + 1,
        },
      });
    } catch (error) {
      console.error('Join game error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get game details
  async getGame(req, res) {
    try {
      const { gameLink } = req.params;

      const game = await Game.findByLink(gameLink);
      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }

      const players = await Game.getPlayersByGameId(game.id);

      res.json({
        game: {
          id: game.id,
          gameLink: game.game_link,
          externalApi: game.external_api,
          externalGameId: game.external_game_id,
          status: game.status,
          createdAt: game.created_at,
          completedAt: game.completed_at,
          players,
        },
      });
    } catch (error) {
      console.error('Get game error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Submit game result
  async submitResult(req, res) {
    try {
      const { gameLink } = req.params;
      const { winnerId, playerResults, gameData } = req.body;

      const game = await Game.findByLink(gameLink);
      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }

      // Update game status
      await Game.updateStatus(game.id, 'completed', new Date().toISOString());

      // Update player results
      if (playerResults && Array.isArray(playerResults)) {
        for (const result of playerResults) {
          await Game.updatePlayerResult(
            game.id,
            result.userId,
            result.score,
            result.result
          );
        }
      }

      // Save game result
      await Game.saveResult(game.id, winnerId, gameData || {});

      // External sync (optional)
      // For Lichess, results can be pulled from the game via Lichess APIs later (PGN / game export).
      // We'll keep it as no-op for now to avoid breaking the flow.

      res.json({
        message: 'Game result submitted successfully',
        game: {
          id: game.id,
          gameLink: game.game_link,
          status: 'completed',
        },
      });
    } catch (error) {
      console.error('Submit result error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};

export default gameController;
