// src/services/authApi.js
import { api } from "./apiClient";

// Register a new user
export async function registerUser({ username, email, password }) {
  // Expected response: { message, user, token }
  return api("/api/auth/register", {
    method: "POST",
    body: { username, email, password },
  });
}

// Login existing user
export async function loginUser({ email, password }) {
  // Expected response: { message, user, token }
  return api("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

// OAuth functions removed - now using global API token
// Logout user (client-side only)
export function logoutUser() {
  localStorage.removeItem("token");
  window.dispatchEvent(new CustomEvent("auth:logout"));
}
