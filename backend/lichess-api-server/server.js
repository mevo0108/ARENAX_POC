import express from "express";
import dotenv from "dotenv";

import { connectDb } from "./src/db.js";
import { createLichessClient } from "./src/lichessClient.js";
import { arenaRoutes } from "./src/routes/arena.routes.js";

dotenv.config();

const app = express();
app.use(express.json());

const lichess = createLichessClient();

// Arena routes
app.use("/api/arena", arenaRoutes(lichess));

// health
app.get("/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;

connectDb()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`✅ Server running on http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("❌ DB connection failed:", err);
    process.exit(1);
  });
