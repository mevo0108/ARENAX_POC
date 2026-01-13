import db from '../config/database.js';

class User {
  static create(username, email, hashedPassword) {
    return new Promise((resolve, reject) => {
      const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
      db.run(query, [username, email, hashedPassword], function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, username, email });
        }
      });
    });
  }

  static findByEmail(email) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM users WHERE email = ?';
      db.get(query, [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static findByUsername(username) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM users WHERE username = ?';
      db.get(query, [username], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static findById(id) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT id, username, email, created_at FROM users WHERE id = ?';
      db.get(query, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Add token to blacklist
  static blacklistToken(token, userId, expiresAt) {
    return new Promise((resolve, reject) => {
      const query = 'INSERT INTO blacklisted_tokens (token, user_id, expires_at) VALUES (?, ?, ?)';
      db.run(query, [token, userId, expiresAt], function (err) {
        if (err) {
          // Token might already be blacklisted, that's okay
          if (err.message.includes('UNIQUE constraint')) {
            resolve({ success: true, message: 'Token already blacklisted' });
          } else {
            reject(err);
          }
        } else {
          resolve({ success: true, id: this.lastID });
        }
      });
    });
  }

  // Check if token is blacklisted
  static isTokenBlacklisted(token) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT id FROM blacklisted_tokens WHERE token = ? AND expires_at > datetime("now")';
      db.get(query, [token], (err, row) => {
        if (err) reject(err);
        else resolve(!!row); // Returns true if token found in blacklist
      });
    });
  }

  // Clean up expired blacklisted tokens (optional maintenance)
  static cleanupExpiredTokens() {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM blacklisted_tokens WHERE expires_at <= datetime("now")';
      db.run(query, function (err) {
        if (err) reject(err);
        else resolve({ deleted: this.changes });
      });
    });
  }

  // Delete user by ID
  static deleteById(id) {
    return new Promise((resolve, reject) => {
      // Start a transaction to delete user and related data
      db.serialize(() => {
        // Delete user's game players records
        db.run('DELETE FROM game_players WHERE user_id = ?', [id], (err) => {
          if (err) {
            reject(err);
            return;
          }
        });

        // Delete user's blacklisted tokens
        db.run('DELETE FROM blacklisted_tokens WHERE user_id = ?', [id], (err) => {
          if (err) {
            reject(err);
            return;
          }
        });

        // Delete the user
        db.run('DELETE FROM users WHERE id = ?', [id], function (err) {
          if (err) {
            reject(err);
          } else if (this.changes === 0) {
            reject(new Error('User not found'));
          } else {
            resolve({ success: true, deleted: this.changes });
          }
        });
      });
    });
  }
}

export default User;
