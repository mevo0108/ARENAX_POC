import { createLichessClient } from '../lichessClient.js';
import Arena from '../models/Arena.js';

const lichessService = {
  /**
   * Create a tournament in Lichess API using personal access token
   */
  async createGame(playerIds, tournamentOptions = {}) {
    try {
      const lichess = createLichessClient();

      // Default tournament options
      const {
        name = "ArenaX Tournament",
        clockTime = 3,
        clockIncrement = 2,
        minutes = 30,
        rated = false,
        variant = "standard",
        berserkable = true,
      } = tournamentOptions;

      const params = new URLSearchParams();
      params.set("name", name);
      params.set("clockTime", String(clockTime));
      params.set("clockIncrement", String(clockIncrement));
      params.set("minutes", String(minutes));
      params.set("rated", String(!!rated));
      params.set("variant", variant);
      params.set("berserkable", String(!!berserkable));

      const response = await lichess.post("/api/tournament", params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const tournament = response.data;
      const joinUrl = `https://lichess.org/tournament/${tournament.id}`;

      // Save tournament to database
      await Arena.create({
        tournamentId: tournament.id,
        joinUrl,
        fullName: tournament.fullName,
        createdBy: tournament.createdBy,
        startsAt: tournament.startsAt,
        secondsToStart: tournament.secondsToStart,
        minutes: tournament.minutes,
        rated: tournament.rated,
        variant: tournament.variant,
        clock: tournament.clock,
        raw: tournament,
      });

      return {
        gameId: tournament.id,
        tournamentId: tournament.id,
        joinUrl,
        lichessUrl: joinUrl,
        playUrl: joinUrl,
        fullName: tournament.fullName,
        startsAt: tournament.startsAt,
        secondsToStart: tournament.secondsToStart,
        status: 'created'
      };
    } catch (error) {
      console.error('Lichess tournament creation error:', error.message);
      throw new Error(`Failed to create Lichess tournament: ${error.message}`);
    }
  },

  /**
   * Get tournament status from Lichess API
   */
  async getGameStatus(externalGameId) {
    try {
      const lichess = createLichessClient();
      const response = await lichess.get(`/api/tournament/${externalGameId}`);

      return response.data;
    } catch (error) {
      console.error('Lichess get tournament status error:', error.message);
      return null;
    }
  },

  /**
   * Sync game result to Lichess API (not applicable for tournaments)
   */
  async syncGameResult(externalGameId, winnerId, playerResults) {
    // For tournaments, results are automatically tracked by Lichess
    // We could potentially update our local database here
    console.log('Tournament results are automatically tracked by Lichess');
    return { synced: true, message: 'Tournament results tracked by Lichess' };
  }
};

export default lichessService;
