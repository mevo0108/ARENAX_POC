import mongoose from "mongoose";

const { Schema } = mongoose;

const gamePlayerSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  position: { type: Number },
  score: { type: Number, default: 0 },
  result: { type: String },
});

const gameResultSchema = new Schema({
  winner_id: { type: Schema.Types.ObjectId, ref: "User" },
  game_data: { type: Schema.Types.Mixed },
  created_at: { type: Date, default: Date.now },
});

const gameSchema = new Schema({
  // Core identifiers
  game_link: { type: String, required: true, unique: true },

  // Display / UX
  name: { type: String, default: "ArenaX Tournament" },

  // External integration
  external_api: { type: String },        // e.g. "lichess"
  external_game_id: { type: String },    // lichess tournament id
  lichess_url: { type: String },
  play_url: { type: String },

  // Time control (for chess-like settings)
  time_preset: { type: String },         // bullet | blitz | rapid | classical | custom
  clock_initial: { type: Number },       // minutes
  clock_increment: { type: Number },     // seconds

  // Status
  status: { type: String, default: "pending" }, // pending | completed (and maybe more later)

  // Meta
  created_by: { type: Schema.Types.ObjectId, ref: "User" },
  created_at: { type: Date, default: Date.now },
  completed_at: { type: Date },

  // Players + results
  players: [gamePlayerSchema],
  results: [gameResultSchema],
});

// Create a game with optional extra fields
gameSchema.statics.create = async function (
  gameLink,
  externalApi = null,
  externalGameId = null,
  extra = {}
) {
  const game = new this({
    game_link: gameLink,
    external_api: externalApi,
    external_game_id: externalGameId,
    ...extra,
  });

  await game.save();
  return { id: game._id, game_link: game.game_link };
};

gameSchema.statics.findByLink = async function (gameLink) {
  const doc = await this.findOne({ game_link: gameLink }).lean();
  if (!doc) return null;
  // Normalize to include `id` (controllers expect game.id)
  return { ...doc, id: doc._id };
};

gameSchema.statics.findById = function (id) {
  // Avoid recursion: use findOne by _id
  return this.findOne({ _id: id }).lean();
};

gameSchema.statics.updateStatus = async function (id, status, completedAt = null) {
  const update = { status };
  if (completedAt) update.completed_at = completedAt;
  const res = await this.updateOne({ _id: id }, { $set: update });
  return { changes: res.modifiedCount };
};

gameSchema.statics.addPlayer = async function (gameId, userId, position = null) {
  const player = { user_id: userId, position };
  const res = await this.updateOne({ _id: gameId }, { $push: { players: player } });
  if (res.matchedCount === 0) throw new Error("Game not found");
  return { success: true };
};

gameSchema.statics.updatePlayerResult = async function (gameId, userId, score, result) {
  const res = await this.updateOne(
    { _id: gameId, "players.user_id": userId },
    { $set: { "players.$.score": score, "players.$.result": result } }
  );
  return { changes: res.modifiedCount };
};

gameSchema.statics.getPlayersByGameId = async function (gameId) {
  const game = await this.findById(gameId).populate("players.user_id", "username email").lean();
  if (!game) return [];
  return (game.players || []).map((p) => ({
    ...p,
    username: p.user_id?.username,
    email: p.user_id?.email,
  }));
};

gameSchema.statics.saveResult = async function (gameId, winnerId, gameData) {
  const result = { winner_id: winnerId, game_data: gameData };
  await this.updateOne({ _id: gameId }, { $push: { results: result } });
  return { success: true };
};

gameSchema.statics.getUserGameHistory = async function (userId, limit = 10) {
  const games = await this.find({ "players.user_id": userId })
    .sort({ completed_at: -1 })
    .limit(limit)
    .lean();
  return games;
};

const Game = mongoose.model("Game", gameSchema);
export default Game;
