import mongoose from "mongoose";

const GameSchema = new mongoose.Schema(
  {
    gameId: { type: String, index: true, unique: true, sparse: true },
    challengeId: { type: String, index: true },

    url: String,

    status: String,
    winner: String,
    rated: Boolean,
    variant: String,

    movesUci: { type: [String], default: [] },

    pgn: String,
    exportRaw: mongoose.Schema.Types.Mixed,

    lastState: mongoose.Schema.Types.Mixed,
    lastUpdateAt: Date,
  },
  { timestamps: true }
);

export const Game = mongoose.model("Game", GameSchema);
