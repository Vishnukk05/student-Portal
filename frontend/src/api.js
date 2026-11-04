const API_BASE = import.meta.env.VITE_API_URL || "/api";
const SESSION_KEY = "eduportal_user_session";

// In-memory cache for GET requests to achieve sub-5ms instant navigation
const apiCache = new Map();
const CACHE_TTL_MS = 8000; // 8 seconds cache per endpoint

export function clearApiCache() {
  apiCache.clear();
}

export const AuthStore = {
  getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setSession(token, user) {
    clearApiCache();
    localStorage.setItem(SESSION_KEY, JSON.stringify({ token, user }));
    if (user.role === "admin" || user.role === "staff") {
      localStorage.setItem("sms_admin_token", token);
      localStorage.setItem("sms_admin_user", JSON.stringify(user));
    } else {
      localStorage.setItem("sms_student_token", token);
      localStorage.setItem("sms_student_user", JSON.stringify(user));
    }
  },

  clearSession() {
    clearApiCache();
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem("sms_admin_token");
    localStorage.removeItem("sms_admin_user");
    localStorage.removeItem("sms_student_token");
    localStorage.removeItem("sms_student_user");
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("eduportal:auth_expired"));
    }
  },

  getToken() {
    const session = this.getSession();
    return session?.token || localStorage.getItem("sms_admin_token") || localStorage.getItem("sms_student_token") || "";
  },

  getUser() {
    const session = this.getSession();
    return session?.user || null;
  },

  updateUser(updates) {
    clearApiCache();
    const session = this.getSession();
    if (session && session.user) {
      session.user = { ...session.user, ...updates };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
  },
};

export async function apiRequest(endpoint, options = {}) {
  const method = (options.method || "GET").toUpperCase();

  // Any data mutation immediately invalidates cached data
  if (method !== "GET") {
    clearApiCache();
  }

  const token = AuthStore.getToken();
  const headers = { ...(options.headers || {}) };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  // Normalize endpoint: ensure no double slash
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const isAuthEndpoint = cleanEndpoint.startsWith("/auth/login") ||
                         cleanEndpoint.startsWith("/auth/admin/login") ||
                         cleanEndpoint.startsWith("/auth/student/login") ||
                         cleanEndpoint.startsWith("/auth/student/activate") ||
                         cleanEndpoint.startsWith("/auth/student/password-reset");

  // Never attach stale session token to public login or auth endpoints
  if (token && !isAuthEndpoint) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${cleanEndpoint}`;

  // Instant response for cached GET requests (0ms UI latency)
  const cacheKey = `${url}?token=${token}`;
  if (method === "GET" && !options.force) {
    const cached = apiCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.result;
    }
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 204) {
    return { ok: true, data: null };
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401 && !isAuthEndpoint) {
        AuthStore.clearSession();
      }
      const message = data.message || data.detail || `Request failed with status ${response.status}`;
      const err = new Error(message);
      err.data = data;
      err.status = response.status;
      err.isAuthError = response.status === 401;
      err.silent = response.status === 401;
      throw err;
    }
    const result = { ok: true, data };
    if (method === "GET") {
      apiCache.set(cacheKey, { timestamp: Date.now(), result });
    }
    return result;
  }

  if (!response.ok) {
    if (response.status === 401 && !isAuthEndpoint) {
      AuthStore.clearSession();
    }
    const err = new Error(`Request failed with status ${response.status}`);
    err.status = response.status;
    err.isAuthError = response.status === 401;
    err.silent = response.status === 401;
    throw err;
  }

  return { ok: true, response };
}

export function getDownloadUrl(contentId) {
  return `/api/content/${contentId}/download/`;
}

export async function downloadContent(contentId, filename = "download") {
  const token = AuthStore.getToken();
  const response = await fetch(`${API_BASE}/content/${contentId}/download/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Unable to download this file.");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
