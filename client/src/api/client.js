const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

/**
 * Thin wrapper around fetch that always sends the httpOnly session cookie
 * and normalizes error handling. The frontend never stores or reads its
 * own "is logged in" flag — every auth decision is answered by the server.
 */
async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    // no JSON body, that's fine (e.g. some error responses)
  }

  if (!response.ok) {
    const message = data?.error || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
}

export function exchangeGoogleCredential(credential) {
  return request("/api/auth/google", {
    method: "POST",
    body: JSON.stringify({ credential }),
  });
}

export function fetchCurrentUser() {
  return request("/api/auth/me", { method: "GET" });
}

export function logout() {
  return request("/api/auth/logout", { method: "POST" });
}

export function fetchHomeData() {
  return request("/api/home", { method: "GET" });
}
