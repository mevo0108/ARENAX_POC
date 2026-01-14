import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/arenax';

mongoose.set('strictQuery', false);

mongoose.connect(MONGO_URI, {
  // useNewUrlParser and useUnifiedTopology are default in mongoose 6+
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

export default mongoose.connection;

/*
  Backup of previous SQLite initialization (kept for reference)

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

  // ... original table creation code ...

  export default db;

*/
