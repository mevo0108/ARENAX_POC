import express from "express";
import dotenv from "dotenv";
import session from "express-session";

import { connectDb } from "./src/db.js";
import { authRoutes } from "./src/routes/auth.routes.js";
import { arenaRoutes } from "./src/routes/arena.routes.js";
import { createUserLichessClient } from "./src/lichessClient.user.js";

dotenv.config();
console.log("ENV CHECK MONGODB_URI:", process.env.MONGODB_URI ? "✅ loaded" : "❌ missing");


const app = express();
app.use(express.json());

// Session (שומר token פר-משתמש)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // בפרודקשן על https -> true
    },
  })
);

// Auth routes
app.use("/auth", authRoutes());

// Middleware: build lichess client from the logged-in user's token
app.use((req, _res, next) => {
  req.lichess = createUserLichessClient(req.session?.lichessAccessToken);
  next();
});


// Arena routes now use req.lichess (user token)
app.use("/api/arena", arenaRoutes());

// health
app.get("/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;

connectDb()
  .then(() => app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`)))
  .catch((e) => {
    console.error("DB connection failed:", e);
    process.exit(1);
  });
