const db = require('../config/database');

class Game {
  static create(gameLink, externalApi = null, externalGameId = null) {
    return new Promise((resolve, reject) => {
      const query = 'INSERT INTO games (game_link, external_api, external_game_id) VALUES (?, ?, ?)';
      db.run(query, [gameLink, externalApi, externalGameId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, game_link: gameLink });
        }
      });
    });
  }

  static findByLink(gameLink) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM games WHERE game_link = ?';
      db.get(query, [gameLink], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static findById(id) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM games WHERE id = ?';
      db.get(query, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static updateStatus(id, status, completedAt = null) {
    return new Promise((resolve, reject) => {
      const query = completedAt 
        ? 'UPDATE games SET status = ?, completed_at = ? WHERE id = ?'
        : 'UPDATE games SET status = ? WHERE id = ?';
      const params = completedAt ? [status, completedAt, id] : [status, id];
      
      db.run(query, params, function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }

  static addPlayer(gameId, userId, position = null) {
    return new Promise((resolve, reject) => {
      const query = 'INSERT INTO game_players (game_id, user_id, position) VALUES (?, ?, ?)';
      db.run(query, [gameId, userId, position], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID });
        }
      });
    });
  }

  static updatePlayerResult(gameId, userId, score, result) {
    return new Promise((resolve, reject) => {
      const query = 'UPDATE game_players SET score = ?, result = ? WHERE game_id = ? AND user_id = ?';
      db.run(query, [score, result, gameId, userId], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }

  static getPlayersByGameId(gameId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT gp.*, u.username, u.email 
        FROM game_players gp
        JOIN users u ON gp.user_id = u.id
        WHERE gp.game_id = ?
      `;
      db.all(query, [gameId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static saveResult(gameId, winnerId, gameData) {
    return new Promise((resolve, reject) => {
      const query = 'INSERT INTO game_results (game_id, winner_id, game_data) VALUES (?, ?, ?)';
      db.run(query, [gameId, winnerId, JSON.stringify(gameData)], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID });
        }
      });
    });
  }

  static getUserGameHistory(userId, limit = 10) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          g.id as game_id,
          g.game_link,
          g.external_api,
          g.status,
          g.completed_at,
          gp.score,
          gp.result,
          gr.winner_id,
          (SELECT username FROM users WHERE id = gr.winner_id) as winner_username
        FROM games g
        JOIN game_players gp ON g.id = gp.game_id
        LEFT JOIN game_results gr ON g.id = gr.game_id
        WHERE gp.user_id = ?
        ORDER BY g.completed_at DESC
        LIMIT ?
      `;
      db.all(query, [userId, limit], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}

module.exports = Game;
