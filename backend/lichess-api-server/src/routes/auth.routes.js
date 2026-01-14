import express from "express";
import axios from "axios";
import crypto from "node:crypto";
import {
  generateCodeVerifier,
  generateCodeChallenge,
  buildLichessAuthorizeUrl,
} from "../oauth/lichess.oauth.js";

function randomState() {
  return crypto.randomBytes(16).toString("hex");
}

export function authRoutes() {
  const router = express.Router();
  router.get("/ping", (req, res) => res.json({ ok: true, route: "/auth/ping" }));

  // 1) Redirect user to Lichess OAuth consent page
  router.get("/lichess/login", (req, res) => {
    const clientId = process.env.LICHESS_CLIENT_ID;
    const redirectUri = process.env.LICHESS_REDIRECT_URI;

    // scopes לפי הצורך שלך (דוגמה טובה למערכת שלך):
    // tournament:write ליצירת זירות, challenge:write לאתגרים, board:play למשחקים (אם צריך)
    const scope = [
      "tournament:write",
      "challenge:write",
      "challenge:read",
      "board:play",
      "account:read",
    ].join(" ");

    const state = randomState();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);

    // שמירה ב-session כדי לוודא callback בטוח
    req.session.lichessOAuth = { state, codeVerifier, scope };

    const url = buildLichessAuthorizeUrl({
      clientId,
      redirectUri,
      scope,
      state,
      codeChallenge,
    });

    return res.redirect(url);
  });

  // 2) Callback: exchange code -> access token
  router.get("/lichess/callback", async (req, res) => {
    const { code, state } = req.query;

    const saved = req.session.lichessOAuth;
    if (!saved || !code || !state || state !== saved.state) {
      return res.status(400).json({ ok: false, error: "Invalid state/code" });
    }

    try {
      // Token endpoint: https://lichess.org/api/token :contentReference[oaicite:4]{index=4}
      const tokenResp = await axios.post(
        "https://lichess.org/api/token",
        new URLSearchParams({
          grant_type: "authorization_code",
          code: String(code),
          redirect_uri: process.env.LICHESS_REDIRECT_URI,
          client_id: process.env.LICHESS_CLIENT_ID,
          code_verifier: saved.codeVerifier, // PKCE
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      const token = tokenResp.data?.access_token;
      const expiresIn = tokenResp.data?.expires_in;

      if (!token) {
        return res.status(500).json({ ok: false, error: "Missing access_token in response" });
      }

      // שמירה ב-session (מומלץ: httpOnly cookie דרך session)
      req.session.lichessAccessToken = token;
      req.session.lichessExpiresIn = expiresIn;

      // אופציונלי: להביא את הפרופיל של המשתמש כדי לזהות מי זה
      const meResp = await axios.get("https://lichess.org/api/account", {
        headers: { Authorization: `Bearer ${token}` },
      });

      req.session.lichessUser = meResp.data;

      // redirect לפרונט או החזרת JSON
      const frontend = process.env.FRONTEND_URL;
      if (frontend) return res.redirect(`${frontend}/lichess/connected`);
      return res.json({ ok: true, user: meResp.data, expiresIn });
    } catch (err) {
      const status = err?.response?.status || 500;
      return res.status(status).json({ ok: false, error: err?.response?.data || err.message });
    }
  });

  // 3) Debug endpoint: who am I
  router.get("/me", (req, res) => {
    if (!req.session.lichessAccessToken) return res.status(401).json({ ok: false, error: "Not logged in" });
    res.json({ ok: true, user: req.session.lichessUser, expiresIn: req.session.lichessExpiresIn });
  });

  // 4) Logout
  router.post("/logout", (req, res) => {
    req.session.destroy(() => res.json({ ok: true }));
  });

  return router;
}
