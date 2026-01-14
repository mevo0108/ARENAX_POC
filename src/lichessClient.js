import axios from "axios";

export function createLichessClient() {
  const token = process.env.LICHESS_TOKEN;
  if (!token) {
    throw new Error("Missing LICHESS_TOKEN in .env");
  }

  return axios.create({
    baseURL: "https://lichess.org",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    timeout: 30000,
  });
}

export function buildChallengeParams(body) {
  const {
    rated = false,
    variant = "standard",
    color = "random",
    timeControl = { type: "clock", limit: 300, increment: 0 },
    fen,
  } = body;

  const params = new URLSearchParams();
  params.set("rated", String(!!rated));
  params.set("variant", variant);
  params.set("color", color);

  if (timeControl?.type === "clock") {
    params.set("clock.limit", String(timeControl.limit ?? 300));
    params.set("clock.increment", String(timeControl.increment ?? 0));
  } else if (timeControl?.type === "correspondence") {
    params.set("days", String(timeControl.days ?? 2));
  } else if (timeControl?.type === "unlimited") {
    // nothing
  } else {
    throw new Error("Invalid timeControl.type");
  }

  if (fen) {
    params.set("fen", fen);
  }

  return params;
}
