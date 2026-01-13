import axios from 'axios';

const LEECHES_API_URL = process.env.LEECHES_API_URL || 'https://api.leeches.example.com';
const LEECHES_API_KEY = process.env.LEECHES_API_KEY || '';

const leechesService = {
  /**
   * Create a game in Leeches API
   */
  async createGame(playerIds) {
    try {
      // This is a placeholder implementation
      // Replace with actual Leeches API endpoint and request format
      const response = await axios.post(
        `${LEECHES_API_URL}/games`,
        {
          players: playerIds,
          gameType: 'standard'
        },
        {
          headers: {
            'Authorization': `Bearer ${LEECHES_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        gameId: response.data.gameId || response.data.id,
        ...response.data
      };
    } catch (error) {
      console.error('Leeches API create game error:', error.message);
      // Return mock data if API is not available
      return {
        gameId: `leeches_${Date.now()}`,
        status: 'created',
        message: 'Mock game created (Leeches API not configured)'
      };
    }
  },

  /**
   * Get game status from Leeches API
   */
  async getGameStatus(externalGameId) {
    try {
      const response = await axios.get(
        `${LEECHES_API_URL}/games/${externalGameId}`,
        {
          headers: {
            'Authorization': `Bearer ${LEECHES_API_KEY}`
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Leeches API get game status error:', error.message);
      return null;
    }
  },

  /**
   * Sync game result to Leeches API
   */
  async syncGameResult(externalGameId, winnerId, playerResults) {
    try {
      const response = await axios.post(
        `${LEECHES_API_URL}/games/${externalGameId}/results`,
        {
          winnerId,
          results: playerResults
        },
        {
          headers: {
            'Authorization': `Bearer ${LEECHES_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Leeches API sync result error:', error.message);
      // Don't fail if sync fails, just log it
      return { synced: false, error: error.message };
    }
  }
};

export default leechesService;
