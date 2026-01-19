import Game from '../models/Game.js';
import User from '../models/User.js';
import { v4 as uuidv4 } from 'uuid';
import lichessService from '../services/lichessService.js';

const gameController = {
  // Create a new game session
  async createGame(req, res) {
    try {
      // Protect against missing body (some clients may omit Content-Type)
      const body = req.body || {};
      const { externalApi, name, players } = body;

      if (!req.body) {
        return res.status(400).json({ error: 'Request body required (application/json)' });
      }
      const userId = req.user.id;

      // Generate unique game link
      const gameLink = uuidv4();

      let externalGameId = null;
      let lichessUrl = null;
      let playUrl = null;

      if (externalApi === 'lichess') {
        try {
          // Create tournament with Lichess API using personal access token
          const tournamentOptions = { name: name || 'ArenaX Tournament' };
          const lichessGame = await lichessService.createGame(
            players || [userId],
            tournamentOptions
          );

          externalGameId = lichessGame.gameId;
          lichessUrl = lichessGame.lichessUrl;
          playUrl = lichessGame.playUrl;
        } catch (lichessError) {
          // If Lichess fails (rate limit), create game without external link
          console.log('Lichess unavailable, creating game without external link:', lichessError.message);
          // Continue without Lichess - game will work in local mode
        }
      }

      const game = await Game.create(gameLink, externalApi, externalGameId);

      // Add creator as first player
      await Game.addPlayer(game.id, userId, 1);

      res.status(201).json({
        message: 'Game created successfully',
        game: {
          id: game.id,
          gameLink: game.game_link,
          externalApi,
          externalGameId,
          lichessUrl,
          playUrl,
          joinUrl: `/api/games/${game.game_link}/join`
        }
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
      const isAlreadyJoined = players.some(p => p.user_id === userId);

      if (isAlreadyJoined) {
        return res.status(400).json({ error: 'You have already joined this game' });
      }

      // Add player to game
      await Game.addPlayer(game.id, userId, players.length + 1);

      res.json({
        message: 'Joined game successfully',
        game: {
          id: game.id,
          gameLink: game.game_link,
          playerCount: players.length + 1
        }
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
          players
        }
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

      // If external API, sync results
      if (game.external_api === 'lichess' && game.external_game_id) {
        await lichessService.syncGameResult(game.external_game_id, winnerId, playerResults);
      }

      res.json({
        message: 'Game result submitted successfully',
        game: {
          id: game.id,
          gameLink: game.game_link,
          status: 'completed'
        }
      });
    } catch (error) {
      console.error('Submit result error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export default gameController;
