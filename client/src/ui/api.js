import { getToken } from "./auth.js";

function getApiBase() {
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return "http://localhost:3000";
  }
  return "https://cs-411w-team-blue-misinformation-project-production.up.railway.app";
}

export async function apiFetch(path, options = {}) {
  const API_BASE = getApiBase();
  const token = getToken();

  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", "Bearer " + token);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(API_BASE + path, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || data.message || `Request failed (${res.status})`);
  }
  return data;
}