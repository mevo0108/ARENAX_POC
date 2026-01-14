import crypto from "node:crypto";

// base64url helper
function base64url(buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function generateCodeVerifier() {
  // 32-64 bytes is common
  return base64url(crypto.randomBytes(64));
}

export function generateCodeChallenge(verifier) {
  const hash = crypto.createHash("sha256").update(verifier).digest();
  return base64url(hash);
}

export function buildLichessAuthorizeUrl({ clientId, redirectUri, scope, state, codeChallenge }) {
  const u = new URL("https://lichess.org/oauth");
  u.searchParams.set("response_type", "code");
  u.searchParams.set("client_id", clientId);
  u.searchParams.set("redirect_uri", redirectUri);
  u.searchParams.set("scope", scope); // space-separated
  u.searchParams.set("state", state);

  // PKCE
  u.searchParams.set("code_challenge_method", "S256");
  u.searchParams.set("code_challenge", codeChallenge);

  return u.toString();
}
