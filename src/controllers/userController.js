// src/controllers/userController.js
import User from '../models/User.js';
import Game from '../models/Game.js';

const ALLOWED_PROFILE_FIELDS = [
  'displayName',
  'avatarUrl',
  'bio',
  'country',
  'language',
  'games',
];

const pickAllowedFields = (obj, allowedKeys) => {
  const updates = {};
  for (const key of allowedKeys) {
    if (obj[key] !== undefined) updates[key] = obj[key];
  }
  return updates;
};

const userController = {
  // Get user profile
async getProfile(req, res) {
  try {
    const userId = req.user.id;

    const user = await User.findOne({ _id: userId })
      .select('_id username email created_at displayName avatarUrl bio country language games')
      .lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // כדי לשמור פורמט כמו שאר המערכת (id במקום _id)
    const normalized = { ...user, id: String(user._id) };
    delete normalized._id;

    res.json({ user: normalized });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
},


  // Update user profile (me)
  async updateProfile(req, res) {
    try {
      const userId = req.user.id;

      const updates = pickAllowedFields(req.body, ALLOWED_PROFILE_FIELDS);

      // אם לא הגיע שום שדה לעדכון
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          error: 'No valid fields provided',
          allowedFields: ALLOWED_PROFILE_FIELDS,
        });
      }

      // ולידציה בסיסית נחמדה (אופציונלי)
      if (updates.bio && updates.bio.length > 240) {
        return res.status(400).json({ error: 'Bio is too long (max 240)' });
      }
      if (updates.displayName && updates.displayName.length > 40) {
        return res.status(400).json({ error: 'Display name is too long (max 40)' });
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updates },
        { new: true, runValidators: true }
      ).select('_id username email created_at displayName avatarUrl bio country language games');

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ user });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get user's game history
  async getGameHistory(req, res) {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 10;

      const gameHistory = await Game.getUserGameHistory(userId, limit);

      res.json({ games: gameHistory });
    } catch (error) {
      console.error('Get game history error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};

export default userController;
