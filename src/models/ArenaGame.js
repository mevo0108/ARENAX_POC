import mongoose from "mongoose";

const ArenaGameSchema = new mongoose.Schema(
  {
    tournamentId: { type: String, index: true },
    gameId: { type: String, unique: true, index: true },

    white: { username: String, rating: Number },
    black: { username: String, rating: Number },

    winner: String, // "white" | "black" | undefined
    status: String, // mate/resign/draw/timeout/started...

    movesUci: { type: [String], default: [] },
    pgn: String,

    playedAt: Date,
    lastSyncedAt: Date,
    raw: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export default mongoose.model("ArenaGame", ArenaGameSchema);