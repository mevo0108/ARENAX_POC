import axios from "axios";

export function createLichessClient() {
  if (!process.env.LICHESS_TOKEN) {
    throw new Error("Missing LICHESS_TOKEN in .env");
  }

  return axios.create({
    baseURL: "https://lichess.org",
    headers: {
      Authorization: `Bearer ${process.env.LICHESS_TOKEN}`,
    },
  });
}
