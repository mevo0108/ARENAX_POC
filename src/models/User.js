import mongoose from 'mongoose';

const { Schema } = mongoose;

const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

const blacklistedTokenSchema = new Schema({
  token: { type: String, required: true, unique: true },
  // store user id as string to support legacy numeric ids and ObjectId strings
  user_id: { type: String, required: true },
  blacklisted_at: { type: Date, default: Date.now },
  expires_at: { type: Date, required: true }
});

userSchema.statics.createUser = async function (username, email, hashedPassword) {
  const user = new this({ username, email, password: hashedPassword });
  await user.save();
  return { id: String(user._id), username: user.username, email: user.email };
};

userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email }).lean().then(row => {
    if (!row) return null;
    return { id: String(row._id), username: row.username, email: row.email, password: row.password, created_at: row.created_at };
  });
};

userSchema.statics.findByUsername = function (username) {
  return this.findOne({ username }).lean().then(row => {
    if (!row) return null;
    return { id: String(row._id), username: row.username, email: row.email, password: row.password, created_at: row.created_at };
  });
};

// Avoid recursion: use findOne instead of calling this.findById (which would call this static)
userSchema.statics.findById = function (id) {
  // If id is an ObjectId string it will match _id; numeric legacy ids will be stored as strings elsewhere
  return this.findOne({ _id: id }).select('_id username email created_at').lean().then(row => {
    if (!row) return null;
    return { id: String(row._id), username: row.username, email: row.email, created_at: row.created_at };
  });
};

const BlacklistedToken = mongoose.model('BlacklistedToken', blacklistedTokenSchema);

userSchema.statics.blacklistToken = async function (token, userId, expiresAt) {
  try {
  const bt = new BlacklistedToken({ token, user_id: String(userId), expires_at: expiresAt });
    await bt.save();
    return { success: true, id: bt._id };
  } catch (err) {
    if (err.code === 11000) {
      return { success: true, message: 'Token already blacklisted' };
    }
    throw err;
  }
};

userSchema.statics.isTokenBlacklisted = async function (token) {
  const now = new Date();
  const found = await BlacklistedToken.findOne({ token, expires_at: { $gt: now } }).lean();
  return !!found;
};

userSchema.statics.cleanupExpiredTokens = async function () {
  const result = await BlacklistedToken.deleteMany({ expires_at: { $lte: new Date() } });
  return { deleted: result.deletedCount };
};

userSchema.statics.deleteById = async function (id) {
  // Delete user and related data
  const User = this;
  const user = await User.findById(id);
  if (!user) throw new Error('User not found');

  // Remove game player references and results where applicable - handled in Game model
  await BlacklistedToken.deleteMany({ user_id: id });
  await User.deleteOne({ _id: id });
  return { success: true };
};

const User = mongoose.model('User', userSchema);

export default User;

/*
  Original SQLite-based implementation is kept in project history before this migration.
*/
