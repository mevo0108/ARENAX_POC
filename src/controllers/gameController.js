import Game from '../models/Game.js';
import { v4 as uuidv4 } from 'uuid';
import leechesService from '../services/leechesService.js';

const gameController = {
  // Create a new game session
  async createGame(req, res) {
    try {
      const { externalApi, players } = req.body;
      const userId = req.user.id;

      // Generate unique game link
      const gameLink = uuidv4();

      // Create game
      let externalGameId = null;
      if (externalApi === 'leeches') {
        // Initialize game with leeches API
        const leechesGame = await leechesService.createGame(players || [userId]);
        externalGameId = leechesGame.gameId;
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
      if (game.external_api === 'leeches' && game.external_game_id) {
        await leechesService.syncGameResult(game.external_game_id, winnerId, playerResults);
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
