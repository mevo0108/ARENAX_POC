// src/middleware/auth.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Named exports (backward compatible)
export const accessTokenSecret = process.env.JWT_SECRET || "dev_secret_only";
export const refreshTokenSecret =
  process.env.JWT_REFRESH_SECRET || "dev_refresh_secret_only";

// Core middleware
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, accessTokenSecret);

    const userId = decoded.id || decoded.userId;
    if (!userId) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    // IMPORTANT: use findOne to avoid collision with your custom User.findById static
    const user = await User.findOne({ _id: userId })
      .select("_id username email")
      .lean();

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = { id: String(user._id) };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

export default authenticateToken;
