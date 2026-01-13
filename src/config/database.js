import sqlite3 from 'sqlite3';
import path from 'path';

const sqlite = sqlite3.verbose();
const DB_PATH = process.env.DATABASE_PATH || './arenax.db';

const db = new sqlite.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Initialize database tables
db.serialize(() => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Games table
  db.run(`
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_link TEXT UNIQUE NOT NULL,
      external_api TEXT,
      external_game_id TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME
    )
  `);

  // Game players table
  db.run(`
    CREATE TABLE IF NOT EXISTS game_players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      position INTEGER,
      score INTEGER,
      result TEXT,
      FOREIGN KEY (game_id) REFERENCES games(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Game results table
  db.run(`
    CREATE TABLE IF NOT EXISTS game_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL,
      winner_id INTEGER,
      game_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id),
      FOREIGN KEY (winner_id) REFERENCES users(id)
    )
  `);

  // Blacklisted tokens table
  db.run(`
    CREATE TABLE IF NOT EXISTS blacklisted_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      blacklisted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Create index for faster token lookups
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_blacklisted_tokens_token 
    ON blacklisted_tokens(token)
  `);
});

export default db;
