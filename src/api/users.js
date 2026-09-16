// FastAPI User & Organization Management Client
import { getCurrentUserId } from "./auth";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

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
 * GET /users — List all users in organization with pagination
 */
export async function listUsers({ includeInactive = true, skip = 0, limit = 100 } = {}) {
  const params = new URLSearchParams({
    include_inactive: String(includeInactive),
    skip: String(skip),
    limit: String(limit),
  });
  return fetch(`${BASE_URL}/users?${params}`, {
    headers: getAuthHeaders(),
  }).then(handle);
}

/**
 * GET /users/{user_id} — Fetch a single user by ID
 */
export async function getUser(userId) {
  return fetch(`${BASE_URL}/users/${userId}`, {
    headers: getAuthHeaders(),
  }).then(handle);
}

/**
 * POST /users — Create a new user and attach to organization (Superadmin / Admin)
 */
export async function createUser({ name, email, password, organization_id = null, role = "analyst", adminSecret = null }) {
  const orgId = organization_id ?? (localStorage.getItem("organization_id") ? Number(localStorage.getItem("organization_id")) : 0);
  const extraHeaders = {};
  if (adminSecret) {
    extraHeaders["X-Admin-Secret"] = adminSecret;
  }

  const payload = {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password: password,
    organization_id: Number(orgId),
    role: role || "analyst",
  };

  return fetch(`${BASE_URL}/users`, {
    method: "POST",
    headers: getAuthHeaders(extraHeaders),
    body: JSON.stringify(payload),
  }).then(handle);
}

/**
 * PUT /users/{user_id} — Partially update a user
 */
export async function updateUser(userId, { name, email, is_active }) {
  const payload = {};
  if (name !== undefined) payload.name = name.trim();
  if (email !== undefined) payload.email = email.trim().toLowerCase();
  if (is_active !== undefined) payload.is_active = is_active;

  return fetch(`${BASE_URL}/users/${userId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  }).then(handle);
}

/**
 * DELETE /users/{user_id} — Delete a user
 */
export async function deleteUser(userId) {
  return fetch(`${BASE_URL}/users/${userId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  }).then(handle);
}

/**
 * GET /users/{user_id}/organizations — List the organizations a user belongs to
 */
export async function listUserOrganizations(userId) {
  return fetch(`${BASE_URL}/users/${userId}/organizations`, {
    headers: getAuthHeaders(),
  }).then(handle);
}

/**
 * List the signed-in user's organizations. Returns [] when the token has no user id.
 */
export async function listMyOrganizations() {
  const userId = getCurrentUserId();
  if (userId == null) return [];
  return listUserOrganizations(userId);
}

/**
 * GET /organizations/{organization_id} — Fetch a single organization by ID
 */
export async function getOrganization(organizationId) {
  return fetch(`${BASE_URL}/organizations/${organizationId}`, {
    headers: getAuthHeaders(),
  }).then(handle);
}
