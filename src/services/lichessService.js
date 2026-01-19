// src/services/lichessService.js
import axios from 'axios';

/**
 * Lichess Open Challenge service
 *
 * Requirements:
 * 1) Create a Lichess personal API token and set it in .env as LICHESS_TOKEN
 * 2) Token must have the needed permissions to create challenges (challenge write scope).
 *
 * This service creates an "open-ended challenge" (no specific opponent).
 * Lichess returns a challenge object and usually URLs for white/black sides.
 */

const LICHESS_BASE_URL = process.env.LICHESS_BASE_URL || 'https://lichess.org';
const LICHESS_TOKEN = process.env.LICHESS_TOKEN;

// Axios client
const client = axios.create({
  baseURL: LICHESS_BASE_URL,
  timeout: 15000,
  headers: {
    // Lichess expects Bearer token
    ...(LICHESS_TOKEN ? { Authorization: `Bearer ${LICHESS_TOKEN}` } : {}),
  },
  // let us inspect non-2xx responses cleanly
  validateStatus: () => true,
});

/**
 * Create an open challenge on Lichess.
 *
 * @param {Object} settings
 * @param {boolean} [settings.rated=false]
 * @param {string}  [settings.variant="standard"]  // "standard" etc.
 * @param {string}  [settings.color="random"]      // "white" | "black" | "random"
 *
 *  For REAL-TIME:
 * @param {number} [settings.clockLimit=300]       // seconds (often multiple of 60; ultra-bullet has special rules)
 * @param {number} [settings.clockIncrement=0]     // seconds
 *
 *  For CORRESPONDENCE:
 * @param {number} [settings.days]                 // days per move (if provided, do not send clock.*)
 *
 * @returns {Promise<{challengeId: string|null, url: string|null, whiteUrl: string|null, blackUrl: string|null, raw: any}>}
 */
async function createOpenChallenge(settings = {}) {
  if (!LICHESS_TOKEN) {
    throw new Error('LICHESS_TOKEN is missing. Set it in your .env');
  }

  const {
    rated = false,
    variant = 'standard',
    color = 'random',
    clockLimit = 300,
    clockIncrement = 0,
    days,
  } = settings;

  // Lichess expects application/x-www-form-urlencoded for many endpoints
  const params = new URLSearchParams();

  // Common params
  params.set('rated', String(!!rated));
  params.set('variant', variant);
  params.set('color', color);

  // Either correspondence (days) OR realtime (clock.*)
  if (typeof days === 'number' && Number.isFinite(days) && days > 0) {
    params.set('days', String(Math.floor(days)));
  } else {
    // Send both clock.limit and clock.increment (Lichess expects both) :contentReference[oaicite:1]{index=1}
    params.set('clock.limit', String(Math.floor(clockLimit)));
    params.set('clock.increment', String(Math.floor(clockIncrement)));
  }

  const resp = await client.post('/api/challenge/open', params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  if (resp.status < 200 || resp.status >= 300) {
    // Try to surface useful error info
    const body = typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data);
    throw new Error(`Lichess createOpenChallenge failed: HTTP ${resp.status} - ${body}`);
  }

  const data = resp.data || {};

  // Lichess responses can vary; handle common shapes safely
  // common: { challenge: { id, url }, url, whiteUrl, blackUrl, ... }
  const challengeObj = data.challenge || data;
  const challengeId = challengeObj.id || data.id || null;

  const url =
    challengeObj.url ||
    data.url ||
    (challengeId ? `${LICHESS_BASE_URL}/${challengeId}` : null);

  const whiteUrl = data.urlWhite || data.whiteUrl || challengeObj.urlWhite || challengeObj.whiteUrl || null;
  const blackUrl = data.urlBlack || data.blackUrl || challengeObj.urlBlack || challengeObj.blackUrl || null;


  return { challengeId, url, whiteUrl, blackUrl, raw: data };
}

const lichessService = {
  createOpenChallenge,
};

export default lichessService;
