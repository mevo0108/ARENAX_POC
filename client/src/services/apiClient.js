// src/services/apiClient.js

// Get token from localStorage
function getToken() {
  return localStorage.getItem("token");
}

// Notify the app that we should logout (e.g. after 401)
function emitLogout() {
  window.dispatchEvent(new CustomEvent("auth:logout"));
}

/**
 * Centralized API client
 * - Adds Authorization header automatically (if token exists)
 * - Handles JSON/text responses safely
 * - Emits logout event on 401 responses
 *
 * @param {string} path e.g. "/api/users/profile"
 * @param {RequestInit} options fetch options
 */
export async function api(path, options = {}) {
  const token = getToken();

  const headers = {
    ...(options.headers || {}),
  };

  // Attach Authorization header if token exists
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let body = options.body;

  // Detect FormData to avoid JSON stringify
  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  // Auto-stringify JSON objects
  if (body && typeof body === "object" && !isFormData) {
    if (typeof body !== "string") {
      body = JSON.stringify(body);
      if (!headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
      }
    }
  }

  const response = await fetch(path, {
    ...options,
    headers,
    body,
  });

  // Handle unauthorized responses globally
  if (response.status === 401) {
    localStorage.removeItem("token");
    emitLogout();
  }

  // Safely parse response body (JSON or text)
  const contentType = response.headers.get("content-type") || "";
  let data = null;

  try {
    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text ? text : null;
    }
  } catch {
    data = null;
  }

  // Throw a meaningful error for non-2xx responses
  if (!response.ok) {
    const message =
      (data && typeof data === "object" && (data.error || data.message)) ||
      (typeof data === "string" && data) ||
      `Request failed (${response.status})`;

    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}
