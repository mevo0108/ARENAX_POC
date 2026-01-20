import { api } from "./apiClient";

// Fetch the current user's profile
export function getProfile() {
  return api("/api/users/profile", {
    method: "GET",
  });
}
