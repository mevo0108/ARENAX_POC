import axios from "axios";

export function createUserLichessClient(accessToken) {
  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};

  return axios.create({
    baseURL: "https://lichess.org",
    headers,
  });
}
