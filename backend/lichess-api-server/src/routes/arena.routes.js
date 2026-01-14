// src/routes/arena.routes.js
import express from "express";
import readline from "node:readline";

import { Arena } from "../models/Arena.js";
import { ArenaGame } from "../models/ArenaGame.js";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseMoves(movesStr) {
  if (!movesStr || typeof movesStr !== "string") return [];
  return movesStr.trim().split(/\s+/).filter(Boolean);
}

function pickUsername(playerObj) {
  // JSON export לפעמים נותן players.white.user.name או players.white.name
  return playerObj?.user?.name || playerObj?.name || null;
}

function requireAuth(req, res) {
  if (!req.session?.lichessAccessToken) {
    res.status(401).json({ ok: false, error: "Login with Lichess first" });
    return false;
  }
  if (!req.lichess) {
    res.status(500).json({ ok: false, error: "Missing req.lichess client" });
    return false;
  }
  return true;
}

/**
 * In-memory sync managers:
 * tournamentId -> { timer, running, intervalMs, lastRunAt, lastError, stats }
 */
const syncManagers = new Map();

function ensureManager(tournamentId) {
  if (!syncManagers.has(tournamentId)) {
    syncManagers.set(tournamentId, {
      running: false,
      timer: null,
      intervalMs: 8000,
      lastRunAt: null,
      lastError: null,
      stats: { cycles: 0, savedNew: 0, refreshed: 0, fetchedIds: 0 },
    });
  }
  return syncManagers.get(tournamentId);
}

function stopSyncLoop(tournamentId) {
  const mgr = ensureManager(tournamentId);
  if (mgr.timer) clearInterval(mgr.timer);
  mgr.timer = null;
  mgr.running = false;
  return mgr;
}

async function fetchTournamentGameIds(lichess, tournamentId, max = 200) {
  const resp = await lichess.get(`/api/tournament/${encodeURIComponent(tournamentId)}/games`, {
    responseType: "stream",
    headers: { Accept: "application/x-ndjson" },
    params: { max },
  });

  const ids = [];
  const rl = readline.createInterface({ input: resp.data });

  for await (const line of rl) {
    if (!line?.trim()) continue;
    try {
      const obj = JSON.parse(line);
      const id = obj?.id || obj?.gameId;
      if (id) ids.push(id);
    } catch {
      // ignore
    }
    if (ids.length >= max) break;
  }

  try { resp.data.destroy(); } catch {}
  return ids;
}

async function fetchGameExport(lichess, gameId) {
  const r = await lichess.get(`/game/export/${encodeURIComponent(gameId)}`, {
    headers: { Accept: "application/json" },
    params: { moves: 1, pgnInJson: 1 },
  });
  return r.data;
}

async function upsertGameFromExport(tournamentId, gameId, data) {
  const whiteU = pickUsername(data?.players?.white);
  const blackU = pickUsername(data?.players?.black);

  const whiteRating = data?.players?.white?.rating;
  const blackRating = data?.players?.black?.rating;

  const movesUci = typeof data?.moves === "string" ? parseMoves(data.moves) : [];

  await ArenaGame.updateOne(
    { gameId },
    {
      $set: {
        tournamentId,
        gameId,
        white: { username: whiteU, rating: whiteRating },
        black: { username: blackU, rating: blackRating },
        winner: data?.winner, // "white" | "black" | undefined
        status: data?.status,
        movesUci,
        pgn: data?.pgn,
        playedAt: data?.createdAt ? new Date(data.createdAt) : undefined,
        lastSyncedAt: new Date(),
        raw: data,
      },
    },
    { upsert: true }
  );
}

/**
 * One sync cycle:
 * - fetch recent tournament game ids
 * - export+save NEW games (limit per cycle)
 * - refresh some ACTIVE games (status=started) so moves update while playing
 */
async function syncOnce(lichess, tournamentId, options = {}) {
  const max = options.max ?? 200;
  const perCycleNewLimit = options.perCycleNewLimit ?? 25;
  const refreshActiveLimit = options.refreshActiveLimit ?? 15;

  const ids = await fetchTournamentGameIds(lichess, tournamentId, max);

  const existing = await ArenaGame.find({ gameId: { $in: ids } })
    .select({ gameId: 1, status: 1 })
    .lean();

  const existingSet = new Set(existing.map((g) => g.gameId));
  const newIds = ids.filter((id) => !existingSet.has(id)).slice(0, perCycleNewLimit);

  const activeIds = existing
    .filter((g) => !g.status || g.status === "started")
    .map((g) => g.gameId)
    .slice(0, refreshActiveLimit);

  let savedNew = 0;
  let refreshed = 0;

  async function safeExportAndSave(gameId) {
    try {
      const data = await fetchGameExport(lichess, gameId);
      await upsertGameFromExport(tournamentId, gameId, data);
      await sleep(250); // gentle spacing
      return { ok: true };
    } catch (err) {
      // אם נתקעת ב-rate limit
      if (err?.response?.status === 429) {
        await sleep(60_000);
        return { ok: false, rateLimited: true };
      }
      return { ok: false, error: err?.response?.data || err.message };
    }
  }

  for (const gameId of newIds) {
    const r = await safeExportAndSave(gameId);
    if (r.ok) savedNew++;
  }

  for (const gameId of activeIds) {
    const r = await safeExportAndSave(gameId);
    if (r.ok) refreshed++;
  }

  return { fetchedIds: ids.length, savedNew, refreshed };
}

function startSyncLoop(lichess, tournamentId, intervalMs = 8000) {
  const mgr = ensureManager(tournamentId);
  if (mgr.running) return mgr;

  mgr.running = true;
  mgr.intervalMs = intervalMs;
  mgr.lastError = null;

  let inFlight = false;

  mgr.timer = setInterval(async () => {
    if (inFlight) return; // prevent overlap
    inFlight = true;

    try {
      const result = await syncOnce(lichess, tournamentId, {
        max: 200,
        perCycleNewLimit: 25,
        refreshActiveLimit: 15,
      });

      mgr.lastRunAt = new Date();
      mgr.stats.cycles += 1;
      mgr.stats.savedNew += result.savedNew;
      mgr.stats.refreshed += result.refreshed;
      mgr.stats.fetchedIds = result.fetchedIds;
      mgr.lastError = null;
    } catch (e) {
      mgr.lastError = e?.message || String(e);
    } finally {
      inFlight = false;
    }
  }, mgr.intervalMs);

  return mgr;
}

export function arenaRoutes() {
  const router = express.Router();

  /**
   * POST /api/arena
   * Create arena (requires OAuth login)
   */
  router.post("/", async (req, res) => {
    if (!requireAuth(req, res)) return;
    const lichess = req.lichess;

    try {
      const {
        name = "ArenaX",
        clockTime = 3,
        clockIncrement = 2,
        minutes = 30,
        rated = false,
        variant = "standard",
        berserkable = true,
      } = req.body || {};

      const params = new URLSearchParams();
      params.set("name", name);
      params.set("clockTime", String(clockTime));
      params.set("clockIncrement", String(clockIncrement));
      params.set("minutes", String(minutes));
      params.set("rated", String(!!rated));
      params.set("variant", variant);
      params.set("berserkable", String(!!berserkable));

      const r = await lichess.post("/api/tournament", params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const t = r.data;
      const joinUrl = `https://lichess.org/tournament/${t.id}`;

      // אם תרצה "זירה פעילה אחת למשתמש" אפשר למחוק קודמים לפי user — כרגע שומרים הכל
      await Arena.create({
        tournamentId: t.id,
        joinUrl,
        fullName: t.fullName,
        createdBy: t.createdBy,
        startsAt: t.startsAt,
        secondsToStart: t.secondsToStart,
        minutes: t.minutes,
        rated: t.rated,
        variant: t.variant,
        clock: t.clock,
        raw: t,
      });

      res.json({
        ok: true,
        tournamentId: t.id,
        joinUrl,
        startsAt: t.startsAt,
        secondsToStart: t.secondsToStart,
        fullName: t.fullName,
      });
    } catch (err) {
      const status = err?.response?.status || 500;
      res.status(status).json({ ok: false, error: err?.response?.data || err.message });
    }
  });

  /**
   * GET /api/arena/latest
   */
  router.get("/latest", async (req, res) => {
    if (!requireAuth(req, res)) return;

    const arena = await Arena.findOne().sort({ createdAt: -1 }).lean();
    if (!arena) return res.status(404).json({ ok: false, error: "No arena found" });

    res.json({ ok: true, tournamentId: arena.tournamentId, joinUrl: arena.joinUrl, arena });
  });

  /**
   * POST /api/arena/latest/sync/start?intervalMs=8000
   */
  router.post("/latest/sync/start", async (req, res) => {
    if (!requireAuth(req, res)) return;
    const lichess = req.lichess;

    const arena = await Arena.findOne().sort({ createdAt: -1 }).lean();
    if (!arena) return res.status(404).json({ ok: false, error: "No arena found" });

    const intervalMs = Number(req.query.intervalMs || 8000);
    const mgr = startSyncLoop(lichess, arena.tournamentId, intervalMs);

    res.json({
      ok: true,
      tournamentId: arena.tournamentId,
      joinUrl: arena.joinUrl,
      running: mgr.running,
      intervalMs: mgr.intervalMs,
    });
  });

  /**
   * POST /api/arena/latest/sync/stop
   */
  router.post("/latest/sync/stop", async (req, res) => {
    if (!requireAuth(req, res)) return;

    const arena = await Arena.findOne().sort({ createdAt: -1 }).lean();
    if (!arena) return res.status(404).json({ ok: false, error: "No arena found" });

    const mgr = stopSyncLoop(arena.tournamentId);

    res.json({ ok: true, tournamentId: arena.tournamentId, running: mgr.running });
  });

  /**
   * GET /api/arena/latest/sync/status
   */
  router.get("/latest/sync/status", async (req, res) => {
    if (!requireAuth(req, res)) return;

    const arena = await Arena.findOne().sort({ createdAt: -1 }).lean();
    if (!arena) return res.status(404).json({ ok: false, error: "No arena found" });

    const mgr = ensureManager(arena.tournamentId);

    res.json({
      ok: true,
      tournamentId: arena.tournamentId,
      running: mgr.running,
      intervalMs: mgr.intervalMs,
      lastRunAt: mgr.lastRunAt,
      lastError: mgr.lastError,
      stats: mgr.stats,
    });
  });

  /**
   * GET /api/arena/latest/games?limit=100
   * Returns games saved to DB with moves/winner/colors
   */
  router.get("/latest/games", async (req, res) => {
    if (!requireAuth(req, res)) return;

    const arena = await Arena.findOne().sort({ createdAt: -1 }).lean();
    if (!arena) return res.status(404).json({ ok: false, error: "No arena found" });

    const limit = Number(req.query.limit || 100);

    const games = await ArenaGame.find({ tournamentId: arena.tournamentId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({
      ok: true,
      tournamentId: arena.tournamentId,
      joinUrl: arena.joinUrl,
      count: games.length,
      games,
    });
  });

  return router;
}
