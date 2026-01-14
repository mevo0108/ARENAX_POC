import mongoose from "mongoose";

const ArenaSchema = new mongoose.Schema(
  {
    tournamentId: { type: String, unique: true },
    joinUrl: String,

    fullName: String,
    createdBy: String,

    startsAt: Date,
    secondsToStart: Number,

    minutes: Number,
    rated: Boolean,
    variant: String,

    clock: {
      limit: Number,
      increment: Number,
    },

    raw: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export const Arena = mongoose.model("Arena", ArenaSchema);
