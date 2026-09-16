// FastAPI OAuth2 authentication client with automated token rotation & auto-logout
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Log in user via OAuth2 password flow (/auth/login)
 */
export async function loginUser({ username, password, organizationId = null }) {
  const params = new URLSearchParams();
  params.append("grant_type", "password");
  params.append("username", username);
  params.append("password", password);
  if (organizationId != null) {
    params.append("organization_id", String(organizationId));
  }
  params.append("scope", "");
  params.append("client_id", "");
  params.append("client_secret", "");

  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const data = await res.json();
      if (data && data.detail) detail = data.detail;
      else if (data && data.message) detail = data.message;
    } catch {
      /* non-JSON error */
    }
    throw new Error(detail);
  }

  const data = await res.json();

  // Persist token credentials
  if (data.access_token) {
    localStorage.setItem("auth_token", data.access_token);
  }
  if (data.refresh_token) {
    localStorage.setItem("refresh_token", data.refresh_token);
  }
  persistOrgContext(data);

  return data;
}

/**
 * Store the org the issued token is scoped to. The API returns it nested under
 * `organization`, so a flat `data.organization_id` read would always miss.
 */
function persistOrgContext(data) {
  const org = data?.organization;
  if (!org) return;
  if (org.organization_id != null) {
    localStorage.setItem("organization_id", String(org.organization_id));
  }
  if (org.organization_name) {
    localStorage.setItem("organization_name", org.organization_name);
  }
  if (org.role) {
    localStorage.setItem("organization_role", org.role);
  }
}

/**
 * Exchange a valid refresh token for a new access + refresh pair (/auth/refresh).
 * If the API call fails or token is invalid, automatically log out the user.
 */
export async function refreshAuthToken(organizationId = null) {
  const refreshToken = localStorage.getItem("refresh_token");
  const storedOrgId = localStorage.getItem("organization_id");

  if (!refreshToken) {
    logoutUser("Session expired. Please sign in again.");
    throw new Error("No refresh token available");
  }

  const targetOrgId = organizationId ?? (storedOrgId ? Number(storedOrgId) : null);

  const payload = { refresh_token: refreshToken };
  // Omit the field when there is no org — the API reads any number, including 0,
  // as an explicit org and rejects it with a 403.
  if (targetOrgId != null) {
    payload.organization_id = Number(targetOrgId);
  }

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      let errorDetail = "Failed to refresh token";
      try {
        const errData = await res.json();
        if (errData?.detail) errorDetail = errData.detail;
      } catch {
        /* non-JSON */
      }
      // A rejected organization leaves the refresh token intact server-side,
      // so keep the current session instead of signing the user out.
      if (res.status !== 403) {
        logoutUser("Session expired. Please sign in again.");
      }
      const error = new Error(errorDetail);
      error.status = res.status;
      throw error;
    }

    const data = await res.json();
    const newAccessToken = data.access_token || data.token;
    const newRefreshToken = data.refresh_token;

    if (newAccessToken) {
      localStorage.setItem("auth_token", newAccessToken);
    }
    if (newRefreshToken) {
      localStorage.setItem("refresh_token", newRefreshToken);
    }
    persistOrgContext(data);

    return data;
  } catch (err) {
    // Force logout on network or invalid-token errors, but not on an already
    // handled HTTP failure (which decided for itself whether to log out).
    if (err?.status == null) {
      logoutUser("Session expired. Please sign in again.");
    }
    throw err;
  }
}

/**
 * Re-scope the session to another organization by refreshing the token against
 * it. Also makes it the user's default org server-side.
 */
export async function switchOrganization(organizationId) {
  const data = await refreshAuthToken(Number(organizationId));
  setupAuthRefreshLoop();
  return data;
}

/**
 * Current org context (id / name / role) from localStorage, falling back to the
 * access token's claims.
 */
export function getCurrentOrg() {
  const stored = localStorage.getItem("organization_id");
  const claims = parseJwt(localStorage.getItem("auth_token"));
  const id = stored ? Number(stored) : (claims?.org_id ?? null);
  return {
    id,
    name: localStorage.getItem("organization_name") || "",
    role: localStorage.getItem("organization_role") || claims?.role || "",
  };
}

/**
 * Authenticated user's id, taken from the access token's `sub` claim.
 */
export function getCurrentUserId() {
  const claims = parseJwt(localStorage.getItem("auth_token"));
  const id = claims?.sub;
  return id != null && !Number.isNaN(Number(id)) ? Number(id) : null;
}

/**
 * Log out user by clearing stored credentials and redirecting to /login
 */
export function logoutUser(reason = null) {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user_email");
  localStorage.removeItem("organization_id");
  localStorage.removeItem("organization_name");
  localStorage.removeItem("organization_role");

  window.dispatchEvent(new CustomEvent("auth_logout", { detail: { reason } }));

  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

/**
 * Decode JWT token payload without external libraries
 */
export function parseJwt(token) {
  try {
    if (!token) return null;
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

let refreshTimer = null;

/**
 * Automates background token refresh based on JWT expiration (or periodic check).
 * Automatically refreshes 60 seconds before expiration.
 */
export function setupAuthRefreshLoop() {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }

  const token = localStorage.getItem("auth_token");
  const refreshToken = localStorage.getItem("refresh_token");

  if (!token || !refreshToken) return;

  const decoded = parseJwt(token);
  if (!decoded || !decoded.exp) {
    // If token has no exp, run periodic refresh check every 10 minutes
    refreshTimer = setTimeout(() => {
      refreshAuthToken().then(setupAuthRefreshLoop).catch(() => {});
    }, 10 * 60 * 1000);
    return;
  }

  const expMs = decoded.exp * 1000;
  const nowMs = Date.now();
  const timeUntilExpMs = expMs - nowMs;
  
  // Refresh 60 seconds before expiration, or immediately if remaining time is < 60s
  const refreshDelayMs = Math.max(1000, timeUntilExpMs - 60 * 1000);

  if (timeUntilExpMs <= 0) {
    // Already expired - attempt refresh immediately
    refreshAuthToken()
      .then(setupAuthRefreshLoop)
      .catch(() => {});
  } else {
    refreshTimer = setTimeout(() => {
      refreshAuthToken()
        .then(setupAuthRefreshLoop)
        .catch(() => {});
    }, refreshDelayMs);
  }
}

// Automatically check / refresh when browser tab becomes active
if (typeof window !== "undefined") {
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      const token = localStorage.getItem("auth_token");
      if (token) {
        const decoded = parseJwt(token);
        if (decoded && decoded.exp) {
          const remainingSec = decoded.exp - Math.floor(Date.now() / 1000);
          if (remainingSec < 90) {
            refreshAuthToken()
              .then(setupAuthRefreshLoop)
              .catch(() => {});
          }
        }
      }
    }
  });
}
