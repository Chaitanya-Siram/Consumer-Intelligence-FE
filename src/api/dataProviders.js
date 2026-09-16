// FastAPI Data Provider & Credential Management Client
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function getAuthHeaders(extraHeaders = {}) {
  const token = localStorage.getItem("auth_token");
  const headers = {
    "Content-Type": "application/json",
    ...extraHeaders,
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function handle(res) {
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const data = await res.json();
      if (data && data.detail) {
        if (Array.isArray(data.detail)) {
          detail = data.detail.map((err) => err.msg || err.detail).join(", ");
        } else {
          detail = data.detail;
        }
      } else if (data && data.message) {
        detail = data.message;
      }
    } catch {
      /* non-JSON error body */
    }
    throw new Error(detail);
  }
  if (res.status === 204) return null;
  return res.json();
}

/**
 * GET /data-providers — List all active data providers
 */
export async function listDataProviders() {
  return fetch(`${BASE_URL}/data-providers`, {
    headers: getAuthHeaders(),
  }).then(handle);
}

/**
 * GET /data-provider-keys — List stored credentials (secrets returned masked)
 */
export async function listProviderKeys({
  orgId = null,
  dataProviderId = null,
  includeInactive = true,
  skip = 0,
  limit = 100,
} = {}) {
  const org =
    orgId ?? (localStorage.getItem("organization_id") ? Number(localStorage.getItem("organization_id")) : 0);
  const params = new URLSearchParams({
    org_id: String(org),
    include_inactive: String(includeInactive),
    skip: String(skip),
    limit: String(limit),
  });
  if (dataProviderId) params.append("data_provider_id", String(dataProviderId));

  return fetch(`${BASE_URL}/data-provider-keys?${params}`, {
    headers: getAuthHeaders(),
  }).then(handle);
}

/**
 * POST /data-provider-keys — Store credentials for a data provider
 */
export async function createProviderKey({
  data_provider_id,
  api_key,
  username = null,
  password = null,
  org_id = null,
}) {
  const orgId =
    org_id ?? (localStorage.getItem("organization_id") ? Number(localStorage.getItem("organization_id")) : 0);

  // Only send credentials that were actually filled in — a provider that
  // authenticates with username/password leaves the API key input disabled.
  const payload = {
    org_id: Number(orgId),
    data_provider_id: Number(data_provider_id),
  };
  if (api_key) payload.api_key = api_key;
  if (username) payload.username = username;
  if (password) payload.password = password;

  return fetch(`${BASE_URL}/data-provider-keys`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  }).then(handle);
}

/**
 * PUT /data-provider-keys/{key_id} — Partially update a credential set
 */
export async function updateProviderKey(keyId, fields) {
  const payload = {};
  ["data_provider_id", "api_key", "username", "password", "is_active"].forEach((key) => {
    if (fields[key] !== undefined) payload[key] = fields[key];
  });

  return fetch(`${BASE_URL}/data-provider-keys/${keyId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  }).then(handle);
}

/**
 * DELETE /data-provider-keys/{key_id} — Delete a credential set
 */
export async function deleteProviderKey(keyId) {
  return fetch(`${BASE_URL}/data-provider-keys/${keyId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  }).then(handle);
}

/**
 * GET /data-provider-keys/active — Get active data provider keys for an organization
 * Returns dictionary mapping display names to source IDs, e.g. { "Google News": "google_news", "Tavily": "tavily" }
 */
export async function getActiveProviderKeys(orgId = null) {
  const org =
    orgId ?? (localStorage.getItem("organization_id") ? Number(localStorage.getItem("organization_id")) : 1);
  const params = new URLSearchParams({
    org_id: String(org),
  });

  return fetch(`${BASE_URL}/data-provider-keys/active?${params}`, {
    headers: getAuthHeaders(),
  }).then(handle);
}

