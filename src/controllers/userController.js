const User = require('../models/User');
const Game = require('../models/Game');

const userController = {
  // Get user profile
  async getProfile(req, res) {
    try {
      const userId = req.user.id;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        user
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get user's game history
  async getGameHistory(req, res) {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 10;

      const gameHistory = await Game.getUserGameHistory(userId, limit);

      res.json({
        games: gameHistory
      });
    } catch (error) {
      console.error('Get game history error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = userController;
