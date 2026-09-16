import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-hot-toast";
import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getOrganization,
} from "../api/users";
import { parseJwt } from "../api/auth";
import {
  listDataProviders,
  listProviderKeys,
  createProviderKey,
  updateProviderKey,
  deleteProviderKey,
} from "../api/dataProviders";

// Credential fields a provider can require, in display order.
const CREDENTIAL_FIELDS = ["api_key", "username", "password"];

const CREDENTIAL_LABELS = {
  api_key: "API Key",
  username: "Username",
  password: "Password",
};

// Reads `credentials_fields_required` (list or object) into a Set of field names.
function requiredFieldsOf(provider) {
  const raw = provider?.credentials_fields_required;
  if (Array.isArray(raw)) return new Set(raw);
  if (raw && typeof raw === "object") {
    return new Set(Object.keys(raw).filter((k) => raw[k]));
  }
  return new Set();
}

// Work email domain restriction helper
const PERSONAL_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
  "aol.com",
  "protonmail.com",
  "proton.me",
  "mail.com",
  "zoho.com",
  "live.com",
]);

// ── Validation Helpers ────────────────────────────────────────────────────────

function validateWorkEmail(email) {
  if (!email || !email.trim()) return "Work email address is required.";
  const clean = email.trim().toLowerCase();
  const parts = clean.split("@");
  if (parts.length !== 2 || !parts[0] || !parts[1] || !parts[1].includes(".")) {
    return "Please enter a valid work email format (e.g. name@company.com).";
  }
  if (PERSONAL_EMAIL_DOMAINS.has(parts[1])) {
    return "Personal email domains (Gmail, Yahoo, etc.) are prohibited. Please use corporate domain.";
  }
  return null;
}

function validateFullName(name) {
  if (!name || !name.trim()) return "Full name is required.";
  if (name.trim().length < 2)
    return "Full name must be at least 2 characters long.";
  if (/[<>/{}\\]/.test(name))
    return "Full name contains invalid special characters.";
  return null;
}

function validateUsername(username) {
  if (!username || !username.trim()) return "Username is required.";
  const clean = username.trim().replace(/^@/, "");
  if (clean.length < 3) return "Username must be at least 3 characters long.";
  if (!/^[a-zA-Z0-9._-]+$/.test(clean)) {
    return "Username may only contain letters, numbers, dots, and underscores.";
  }
  return null;
}

function validatePhone(phone) {
  if (!phone || !phone.trim()) return "Phone number is required.";
  const clean = phone.trim();
  const digits = clean.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) {
    return "Please enter a valid phone number (7 to 15 digits).";
  }
  return null;
}

function validatePasswordComplexity(password) {
  if (!password) return "Password is required.";
  if (password.length < 8)
    return "Password must be at least 8 characters long.";
  if (!/[A-Z]/.test(password))
    return "Password must include at least one uppercase letter (A-Z).";
  if (!/[a-z]/.test(password))
    return "Password must include at least one lowercase letter (a-z).";
  if (!/[0-9]/.test(password))
    return "Password must include at least one number (0-9).";
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return "Password must include at least one special character (!@#$%^&*).";
  }
  return null;
}

// Utility to cleanly format user name from email
function formatUserName(nameStr, emailStr) {
  if (nameStr && isNaN(nameStr) && nameStr.trim().length > 1) {
    return nameStr.trim();
  }
  if (!emailStr) return "Executive Member";
  const local = emailStr.split("@")[0] || "";
  const parts = local.replace(/[0-9]/g, "").split(/[._-]/).filter(Boolean);
  if (parts.length === 0) return local.charAt(0).toUpperCase() + local.slice(1);
  return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
}

// Utility to derive avatar initials
function getInitials(nameStr, emailStr) {
  const formatted = formatUserName(nameStr, emailStr);
  const words = formatted.split(" ").filter(Boolean);
  if (words.length >= 2) {
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }
  return formatted.slice(0, 2).toUpperCase();
}

// ── Data Provider row styles ──────────────────────────────────────────────────

const inputStyle = {
  width: "100%",
  minWidth: "150px",
  height: "38px",
  padding: "0 12px",
  borderRadius: "8px",
  border: "1.5px solid #CBD5E1",
  fontSize: "13.5px",
  color: "#0F172A",
  outline: "none",
  background: "#FFFFFF",
  boxSizing: "border-box",
};

const primaryBtnStyle = {
  background: "#2563EB",
  border: "none",
  borderRadius: "8px",
  padding: "6px 14px",
  fontSize: "12px",
  fontWeight: "700",
  color: "#FFFFFF",
  cursor: "pointer",
};

const neutralBtnStyle = {
  background: "#F8FAFC",
  border: "1.5px solid #CBD5E1",
  borderRadius: "8px",
  padding: "6px 14px",
  fontSize: "12px",
  fontWeight: "700",
  color: "#334155",
  cursor: "pointer",
};

const dangerBtnStyle = {
  background: "#FEF2F2",
  border: "1.5px solid #FECACA",
  borderRadius: "8px",
  padding: "6px 14px",
  fontSize: "12px",
  fontWeight: "700",
  color: "#DC2626",
  cursor: "pointer",
};

// One credential cell: marks required/optional per the provider's
// credentials_fields_required, and disables fields that provider doesn't use.
function CredentialInput({
  field,
  value,
  required,
  hasProvider,
  placeholder,
  onChange,
}) {
  // Before a provider is picked we can't know which fields apply.
  const notApplicable = hasProvider && !required;

  return (
    <div>
      <div
        style={{
          fontSize: "10.5px",
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: "0.03em",
          marginBottom: "4px",
          color: required ? "#334155" : "#94A3B8",
        }}
      >
        {CREDENTIAL_LABELS[field]}{" "}
        {hasProvider &&
          (required ? (
            <span style={{ color: "#DC2626" }}>*</span>
          ) : (
            <span style={{ fontWeight: "600", textTransform: "none" }}>
              (optional)
            </span>
          ))}
      </div>
      <input
        type={field === "password" ? "password" : "text"}
        value={value || ""}
        disabled={notApplicable}
        placeholder={
          notApplicable
            ? "Not used"
            : placeholder || `Enter ${CREDENTIAL_LABELS[field].toLowerCase()}`
        }
        onChange={(e) => onChange(e.target.value)}
        autoComplete="new-password"
        style={{
          ...inputStyle,
          border: required ? "1.5px solid #93C5FD" : "1.5px solid #E2E8F0",
          background: notApplicable ? "#F1F5F9" : "#FFFFFF",
          cursor: notApplicable ? "not-allowed" : "text",
        }}
      />
    </div>
  );
}

export default function SettingsScreen({ onBack }) {
  const [activeSection, setActiveSection] = useState("profile"); // "profile" | "team"

  // Logged-in user state
  const storedEmail =
    localStorage.getItem("user_email") || "sunil1.nayak@infovision.com";
  const storedToken = localStorage.getItem("auth_token") || "";
  const storedOrgId = localStorage.getItem("organization_id") || "1";

  // Organization details state
  const [orgDetails, setOrgDetails] = useState(null);
  const [loadingOrg, setLoadingOrg] = useState(false);

  useEffect(() => {
    async function fetchOrg() {
      if (!storedOrgId) return;
      setLoadingOrg(true);
      try {
        const data = await getOrganization(storedOrgId);
        if (data) {
          setOrgDetails(data);
        }
      } catch (err) {
        console.warn("Failed to fetch organization details:", err.message);
      } finally {
        setLoadingOrg(false);
      }
    }
    fetchOrg();
  }, [storedOrgId]);

  const orgName =
    orgDetails?.name ||
    orgDetails?.organization_name ||
    orgDetails?.title ||
    orgDetails?.company_name ||
    localStorage.getItem("organization_name") ||
    "InfoVision Inc.";

  const jwtInfo = useMemo(() => parseJwt(storedToken), [storedToken]);
  console.log({ jwtInfo });

  // Form states for profile
  const defaultFormattedName = useMemo(() => {
    return formatUserName(jwtInfo?.name || jwtInfo?.sub, storedEmail);
  }, [jwtInfo, storedEmail]);

  const [displayName, setDisplayName] = useState(defaultFormattedName);
  const [username, setUsername] = useState(`@${storedEmail.split("@")[0]}`);
  const [email, setEmail] = useState(storedEmail);
  const [phone, setPhone] = useState("+1 (555) 019-2834");
  const [country, setCountry] = useState("United States");
  const [timeZone, setTimeZone] = useState(
    "(GMT-05:00) Eastern Time (US & Canada)",
  );
  const [savingProfile, setSavingProfile] = useState(false);

  // Profile form errors state
  const [profileErrors, setProfileErrors] = useState({});

  // Organization users state (Team section)
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Add user inputs & show/hide password toggle
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // Eye toggle state
  const [newUserRole, setNewUserRole] = useState("analyst");
  const [newUserAdminSecret, setNewUserAdminSecret] = useState("");
  const [addingUser, setAddingUser] = useState(false);
  const [addUserErrors, setAddUserErrors] = useState({});

  // Edit user inputs
  const [editUserName, setEditUserName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editUserActive, setEditUserActive] = useState(true);
  const [updatingUser, setUpdatingUser] = useState(false);
  const [editUserErrors, setEditUserErrors] = useState({});

  const [deletingUser, setDeletingUser] = useState(false);

  // Data Providers state
  const [providers, setProviders] = useState([]);
  const [providerKeys, setProviderKeys] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  // Rows being edited/added, keyed by row id ("new-1" for unsaved rows).
  const [draftRows, setDraftRows] = useState({});
  const [savingRow, setSavingRow] = useState(null);
  const [deletingKeyId, setDeletingKeyId] = useState(null);
  const [togglingKeyId, setTogglingKeyId] = useState(null);

  const providerById = useMemo(() => {
    const map = {};
    providers.forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [providers]);

  // Fetch active providers + this org's stored credentials
  const fetchProviderData = async () => {
    setLoadingProviders(true);
    try {
      const [providerList, keyList] = await Promise.all([
        listDataProviders(),
        listProviderKeys({ orgId: Number(storedOrgId), includeInactive: true, limit: 200 }),
      ]);
      setProviders(Array.isArray(providerList) ? providerList : []);
      setProviderKeys(Array.isArray(keyList) ? keyList : []);
    } catch (err) {
      toast.error(err.message || "Failed to load data providers.");
      setProviders([]);
      setProviderKeys([]);
    } finally {
      setLoadingProviders(false);
    }
  };

  useEffect(() => {
    if (activeSection === "providers") {
      fetchProviderData();
    }
  }, [activeSection]);

  // Add a blank row to fill in
  const handleAddProviderRow = () => {
    const tempId = `new-${Date.now()}`;
    setDraftRows((prev) => ({
      ...prev,
      [tempId]: {
        isNew: true,
        data_provider_id: "",
        api_key: "",
        username: "",
        password: "",
      },
    }));
  };

  const handleDraftChange = (rowId, field, value) => {
    setDraftRows((prev) => ({
      ...prev,
      [rowId]: { ...prev[rowId], [field]: value },
    }));
  };

  const handleCancelDraft = (rowId) => {
    setDraftRows((prev) => {
      const next = { ...prev };
      delete next[rowId];
      return next;
    });
  };

  // Start editing a saved row. Masked secrets start blank — blank means "unchanged".
  const handleEditRow = (key) => {
    setDraftRows((prev) => ({
      ...prev,
      [key.id]: {
        isNew: false,
        data_provider_id: key.data_provider_id,
        api_key: "",
        username: "",
        password: "",
      },
    }));
  };

  // Save a draft row: POST when new, PUT when editing an existing credential set.
  const handleSaveRow = async (rowId) => {
    const draft = draftRows[rowId];
    if (!draft) return;

    if (!draft.data_provider_id) {
      toast.error("Please select a data provider.");
      return;
    }

    const provider = providerById[draft.data_provider_id];
    const required = requiredFieldsOf(provider);

    // On create every required field must be filled. On edit, blank means "keep existing".
    if (draft.isNew) {
      const missing = CREDENTIAL_FIELDS.filter(
        (f) => required.has(f) && !String(draft[f] || "").trim(),
      );
      if (missing.length) {
        toast.error(
          `${missing.map((f) => CREDENTIAL_LABELS[f]).join(", ")} required for ${provider?.name || "this provider"}.`,
        );
        return;
      }
    }

    setSavingRow(rowId);
    try {
      if (draft.isNew) {
        await createProviderKey({
          org_id: Number(storedOrgId),
          data_provider_id: Number(draft.data_provider_id),
          api_key: draft.api_key,
          username: draft.username || null,
          password: draft.password || null,
        });
        toast.success("Credentials saved.");
      } else {
        const fields = { data_provider_id: Number(draft.data_provider_id) };
        CREDENTIAL_FIELDS.forEach((f) => {
          if (String(draft[f] || "").trim()) fields[f] = draft[f];
        });
        await updateProviderKey(rowId, fields);
        toast.success("Credentials updated.");
      }
      handleCancelDraft(rowId);
      fetchProviderData();
    } catch (err) {
      toast.error(err.message || "Failed to save credentials.");
    } finally {
      setSavingRow(null);
    }
  };

  // Flip a saved credential set between active and inactive.
  const handleToggleProviderKeyActive = async (key) => {
    const nextActive = key.is_active === false;
    setTogglingKeyId(key.id);
    try {
      await updateProviderKey(key.id, { is_active: nextActive });
      setProviderKeys((prev) =>
        prev.map((k) => (k.id === key.id ? { ...k, is_active: nextActive } : k)),
      );
      toast.success(nextActive ? "Credentials activated." : "Credentials deactivated.");
    } catch (err) {
      toast.error(err.message || "Failed to update status.");
    } finally {
      setTogglingKeyId(null);
    }
  };

  const handleDeleteProviderKey = async (keyId) => {
    setDeletingKeyId(keyId);
    try {
      await deleteProviderKey(keyId);
      toast.success("Credentials removed.");
      fetchProviderData();
    } catch (err) {
      toast.error(err.message || "Failed to delete credentials.");
    } finally {
      setDeletingKeyId(null);
    }
  };

  // Fetch list of organization users from API
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await listUsers({ includeInactive: true, limit: 200 });
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("Using fallback users list:", err.message);
      setUsers([
        {
          id: 101,
          name: displayName || "Sunil Nayak",
          email: email,
          created_at: new Date(Date.now() - 120 * 86400000).toISOString(),
          is_active: true,
          is_superadmin: true,
          role: "Super Admin",
        },
        {
          id: 102,
          name: "Sophia Chen",
          email: "sophia.chen@infovision.com",
          created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
          is_active: true,
          is_superadmin: false,
          role: "Senior PR Analyst",
        },
        {
          id: 103,
          name: "Marcus Thorne",
          email: "marcus.thorne@infovision.com",
          created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
          is_active: false,
          is_superadmin: false,
          role: "Media Intelligence Lead",
        },
      ]);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeSection === "team") {
      fetchUsers();
    }
  }, [activeSection]);

  // Profile Save handler with full field validation
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();

    const errors = {
      displayName: validateFullName(displayName),
      username: validateUsername(username),
      email: validateWorkEmail(email),
      phone: validatePhone(phone),
    };

    setProfileErrors(errors);

    const firstError = Object.values(errors).find(Boolean);
    if (firstError) {
      toast.error(firstError);
      return;
    }

    setSavingProfile(true);
    try {
      const userId = jwtInfo?.user_id || jwtInfo?.id || 101;
      await updateUser(userId, { name: displayName, email: email });
      localStorage.setItem("user_email", email);
      toast.success("Profile details updated successfully.");
    } catch (err) {
      localStorage.setItem("user_email", email);
      toast.success("Profile saved locally.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Add User submit handler (`POST /users`) with full password & field validation
  const handleAddUserSubmit = async (e) => {
    e.preventDefault();

    const errors = {
      name: validateFullName(newUserName),
      email: validateWorkEmail(newUserEmail),
      password: validatePasswordComplexity(newUserPassword),
    };

    setAddUserErrors(errors);

    const firstError = Object.values(errors).find(Boolean);
    if (firstError) {
      toast.error(firstError);
      return;
    }

    setAddingUser(true);
    try {
      const created = await createUser({
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
        organization_id: Number(storedOrgId),
        adminSecret: newUserAdminSecret || null,
      });

      toast.success(`User ${created.name || newUserEmail} added successfully.`);
      setIsAddModalOpen(false);
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      setShowPassword(false);
      setNewUserRole("analyst");
      setNewUserAdminSecret("");
      setAddUserErrors({});
      fetchUsers();
    } catch (err) {
      toast.error(err.message || "Failed to create user.");
    } finally {
      setAddingUser(false);
    }
  };

  // Edit User submit handler (`PUT /users/{user_id}`)
  const handleEditUserSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    const errors = {
      name: validateFullName(editUserName),
      email: validateWorkEmail(editUserEmail),
    };
    setEditUserErrors(errors);

    const firstError = Object.values(errors).find(Boolean);
    if (firstError) {
      toast.error(firstError);
      return;
    }

    setUpdatingUser(true);
    try {
      await updateUser(selectedUser.id, {
        name: editUserName,
        email: editUserEmail,
        is_active: editUserActive,
      });
      toast.success("User updated successfully.");
      setIsEditModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.message || "Failed to update user.");
    } finally {
      setUpdatingUser(false);
    }
  };

  // Delete User confirm handler (`DELETE /users/{user_id}`)
  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    setDeletingUser(true);
    try {
      await deleteUser(selectedUser.id);
      toast.success("User removed successfully.");
      setIsDeleteModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.message || "Failed to delete user.");
    } finally {
      setDeletingUser(false);
    }
  };

  // Filtered users for table
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        !searchQuery ||
        (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && u.is_active !== false) ||
        (statusFilter === "inactive" && u.is_active === false);

      return matchSearch && matchStatus;
    });
  }, [users, searchQuery, statusFilter]);

  const initials = useMemo(
    () => getInitials(displayName, email),
    [displayName, email],
  );

  // Live password complexity breakdown for Add User Modal
  const passwordChecks = useMemo(() => {
    const p = newUserPassword || "";
    return {
      length: p.length >= 8,
      uppercase: /[A-Z]/.test(p),
      lowercase: /[a-z]/.test(p),
      number: /[0-9]/.test(p),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(p),
    };
  }, [newUserPassword]);

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "transparent",
        color: "#0F172A",
        fontFamily:
          '"Outfit", "Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
        boxSizing: "border-box",
        paddingBottom: "80px",
      }}
    >
      {/* ── Executive Hero Banner ── */}
      <div
        style={{
          width: "100%",
          background:
            "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 60%, #EFF6FF 100%)",
          border: "1px solid #E2E8F0",
          borderRadius: "20px",
          padding: "28px 36px",
          marginBottom: "28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ relative: 1, zIndex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "10px",
            }}
          >
            <button
              onClick={onBack}
              style={{
                background: "#FFFFFF",
                border: "1px solid #CBD5E1",
                borderRadius: "8px",
                padding: "6px 14px",
                color: "#334155",
                fontSize: "12.5px",
                fontWeight: "700",
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              ← Back to Home
            </button>
            <span style={{ color: "#CBD5E1" }}>|</span>
            <span
              style={{
                fontSize: "13px",
                color: "#2563EB",
                fontWeight: "700",
                letterSpacing: "0.02em",
              }}
            >
              Enterprise System Administration
            </span>
          </div>

          <h1
            style={{
              fontSize: "30px",
              fontWeight: "800",
              letterSpacing: "-0.03em",
              color: "#0F172A",
              margin: 0,
            }}
          >
            Settings & Access Control
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "#64748B",
              marginTop: "6px",
              margin: 0,
            }}
          >
            Manage identity profiles, team organization access, security
            parameters, and system preferences.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            zIndex: 1,
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              border: "1.5px solid #DBEAFE",
              borderRadius: "14px",
              padding: "12px 20px",
              textAlign: "left",
              boxShadow: "0 2px 8px rgba(37, 99, 235, 0.06)",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                color: "#64748B",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              ORGANIZATION
            </div>
            <div
              style={{
                fontSize: "16px",
                fontWeight: "700",
                color: "#1D4ED8",
              }}
            >
              {loadingOrg ? "Loading..." : orgName}
            </div>
          </div>
        </div>
      </div>

      {/* ── 2-Column Layout ── */}
      <div
        style={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: "240px 1fr",
          gap: "28px",
          boxSizing: "border-box",
        }}
      >
        {/* ── Left Sidebar Navigation Menu ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <button
            onClick={() => setActiveSection("profile")}
            style={{
              width: "100%",
              padding: "12px 18px",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: "700",
              textAlign: "left",
              border: "none",
              cursor: "pointer",
              background:
                activeSection === "profile" ? "#FFFFFF" : "transparent",
              color: activeSection === "profile" ? "#2563EB" : "#475569",
              boxShadow:
                activeSection === "profile"
                  ? "0 4px 14px rgba(0,0,0,0.05)"
                  : "none",
              borderLeft:
                activeSection === "profile"
                  ? "3px solid #2563EB"
                  : "3px solid transparent",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              transition: "all 0.18s ease",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            My Profile
          </button>

          <button
            onClick={() => setActiveSection("team")}
            style={{
              width: "100%",
              padding: "12px 18px",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: "700",
              textAlign: "left",
              border: "none",
              cursor: "pointer",
              background: activeSection === "team" ? "#FFFFFF" : "transparent",
              color: activeSection === "team" ? "#2563EB" : "#475569",
              boxShadow:
                activeSection === "team"
                  ? "0 4px 14px rgba(0,0,0,0.05)"
                  : "none",
              borderLeft:
                activeSection === "team"
                  ? "3px solid #2563EB"
                  : "3px solid transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              transition: "all 0.18s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M9 21v-2a4 4 0 0 1 3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                <circle cx="9" cy="7" r="4" />
              </svg>
              Organization Users
            </div>
            <span
              style={{
                background: activeSection === "team" ? "#2563EB" : "#E2E8F0",
                color: activeSection === "team" ? "#FFFFFF" : "#475569",
                fontSize: "11px",
                fontWeight: "800",
                padding: "2px 8px",
                borderRadius: "99px",
              }}
            >
              {users.length || 3}
            </span>
          </button>

          <button
            onClick={() => setActiveSection("providers")}
            style={{
              width: "100%",
              padding: "12px 18px",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: "700",
              textAlign: "left",
              border: "none",
              cursor: "pointer",
              background:
                activeSection === "providers" ? "#FFFFFF" : "transparent",
              color: activeSection === "providers" ? "#2563EB" : "#475569",
              boxShadow:
                activeSection === "providers"
                  ? "0 4px 14px rgba(0,0,0,0.05)"
                  : "none",
              borderLeft:
                activeSection === "providers"
                  ? "3px solid #2563EB"
                  : "3px solid transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              transition: "all 0.18s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="2" width="20" height="8" rx="2" />
                <rect x="2" y="14" width="20" height="8" rx="2" />
                <line x1="6" y1="6" x2="6.01" y2="6" />
                <line x1="6" y1="18" x2="6.01" y2="18" />
              </svg>
              Data Providers
            </div>
            {providerKeys.length > 0 && (
              <span
                style={{
                  background:
                    activeSection === "providers" ? "#2563EB" : "#E2E8F0",
                  color: activeSection === "providers" ? "#FFFFFF" : "#475569",
                  fontSize: "11px",
                  fontWeight: "800",
                  padding: "2px 8px",
                  borderRadius: "99px",
                }}
              >
                {providerKeys.length}
              </span>
            )}
          </button>
        </div>

        {/* ── Main Right Section Content Cards ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* SECTION 1: PROFILE */}
          {activeSection === "profile" && (
            <>
              {/* Profile Hero Card */}
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: "20px",
                  padding: "28px 32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "20px" }}
                >
                  <div
                    style={{
                      width: "76px",
                      height: "76px",
                      borderRadius: "50%",
                      background:
                        "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
                      color: "#FFFFFF",
                      fontSize: "26px",
                      fontWeight: "800",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 8px 24px rgba(37, 99, 235, 0.22)",
                    }}
                  >
                    {initials}
                  </div>

                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        marginBottom: "6px",
                      }}
                    >
                      <h2
                        style={{
                          fontSize: "22px",
                          fontWeight: "800",
                          color: "#0F172A",
                          margin: 0,
                        }}
                      >
                        {displayName}
                      </h2>
                      <span
                        style={{
                          background: "#EF4444",
                          color: "#FFFFFF",
                          fontSize: "11px",
                          fontWeight: "800",
                          padding: "3px 9px",
                          borderRadius: "99px",
                        }}
                      >
                        PRO
                      </span>
                      <span
                        style={{
                          background: "#F0FDF4",
                          border: "1px solid #BBF7D0",
                          color: "#16A34A",
                          fontSize: "11px",
                          fontWeight: "700",
                          padding: "3px 10px",
                          borderRadius: "99px",
                        }}
                      >
                        ✓ Verified Account
                      </span>
                    </div>

                    <div style={{ fontSize: "14px", color: "#64748B" }}>
                      {email}
                    </div>
                  </div>
                </div>

                {/* <button
                  onClick={() =>
                    toast.success("Profile photo update dialog opened.")
                  }
                  style={{
                    background: "#F8FAFC",
                    border: "1.5px solid #CBD5E1",
                    borderRadius: "10px",
                    padding: "9px 18px",
                    fontSize: "13.5px",
                    fontWeight: "700",
                    color: "#334155",
                    cursor: "pointer",
                  }}
                >
                  Change Photo
                </button> */}
              </div>

              {/* Personal Information Form Card */}
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: "20px",
                  padding: "32px",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "28px",
                  }}
                >
                  <div>
                    <h3
                      style={{
                        fontSize: "20px",
                        fontWeight: "800",
                        color: "#0F172A",
                        margin: 0,
                      }}
                    >
                      Personal Information
                    </h3>
                    <p
                      style={{
                        fontSize: "13.5px",
                        color: "#64748B",
                        marginTop: "4px",
                        margin: 0,
                      }}
                    >
                      Update your account identity and contact preferences
                      across your organization.
                    </p>
                  </div>

                  <button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    style={{
                      background: "#2563EB",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: "10px",
                      padding: "10px 24px",
                      fontSize: "14px",
                      fontWeight: "700",
                      cursor: savingProfile ? "not-allowed" : "pointer",
                      boxShadow: "0 4px 14px rgba(37, 99, 235, 0.25)",
                    }}
                  >
                    {savingProfile ? "Saving..." : "Save changes"}
                  </button>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "22px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: "700",
                        color: "#334155",
                        marginBottom: "8px",
                      }}
                    >
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => {
                        setDisplayName(e.target.value);
                        if (profileErrors.displayName)
                          setProfileErrors({
                            ...profileErrors,
                            displayName: null,
                          });
                      }}
                      style={{
                        width: "100%",
                        height: "44px",
                        padding: "0 16px",
                        borderRadius: "10px",
                        border: profileErrors.displayName
                          ? "1.5px solid #EF4444"
                          : "1.5px solid #CBD5E1",
                        fontSize: "14.5px",
                        color: "#0F172A",
                        outline: "none",
                        background: "#F8FAFC",
                        boxSizing: "border-box",
                      }}
                    />
                    {profileErrors.displayName && (
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#DC2626",
                          marginTop: "4px",
                          display: "block",
                          fontWeight: "600",
                        }}
                      >
                        ⚠️ {profileErrors.displayName}
                      </span>
                    )}
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: "700",
                        color: "#334155",
                        marginBottom: "8px",
                      }}
                    >
                      Username
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        if (profileErrors.username)
                          setProfileErrors({
                            ...profileErrors,
                            username: null,
                          });
                      }}
                      style={{
                        width: "100%",
                        height: "44px",
                        padding: "0 16px",
                        borderRadius: "10px",
                        border: profileErrors.username
                          ? "1.5px solid #EF4444"
                          : "1.5px solid #CBD5E1",
                        fontSize: "14.5px",
                        color: "#0F172A",
                        outline: "none",
                        background: "#F8FAFC",
                        boxSizing: "border-box",
                      }}
                    />
                    {profileErrors.username && (
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#DC2626",
                          marginTop: "4px",
                          display: "block",
                          fontWeight: "600",
                        }}
                      >
                        ⚠️ {profileErrors.username}
                      </span>
                    )}
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: "700",
                        color: "#334155",
                        marginBottom: "8px",
                      }}
                    >
                      Work Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (profileErrors.email)
                          setProfileErrors({ ...profileErrors, email: null });
                      }}
                      style={{
                        width: "100%",
                        height: "44px",
                        padding: "0 16px",
                        borderRadius: "10px",
                        border: profileErrors.email
                          ? "1.5px solid #EF4444"
                          : "1.5px solid #CBD5E1",
                        fontSize: "14.5px",
                        color: "#0F172A",
                        outline: "none",
                        background: "#F8FAFC",
                        boxSizing: "border-box",
                      }}
                    />
                    {profileErrors.email && (
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#DC2626",
                          marginTop: "4px",
                          display: "block",
                          fontWeight: "600",
                        }}
                      >
                        ⚠️ {profileErrors.email}
                      </span>
                    )}
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: "700",
                        color: "#334155",
                        marginBottom: "8px",
                      }}
                    >
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (profileErrors.phone)
                          setProfileErrors({ ...profileErrors, phone: null });
                      }}
                      style={{
                        width: "100%",
                        height: "44px",
                        padding: "0 16px",
                        borderRadius: "10px",
                        border: profileErrors.phone
                          ? "1.5px solid #EF4444"
                          : "1.5px solid #CBD5E1",
                        fontSize: "14.5px",
                        color: "#0F172A",
                        outline: "none",
                        background: "#F8FAFC",
                        boxSizing: "border-box",
                      }}
                    />
                    {profileErrors.phone && (
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#DC2626",
                          marginTop: "4px",
                          display: "block",
                          fontWeight: "600",
                        }}
                      >
                        ⚠️ {profileErrors.phone}
                      </span>
                    )}
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: "700",
                        color: "#334155",
                        marginBottom: "8px",
                      }}
                    >
                      Country / Region
                    </label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      style={{
                        width: "100%",
                        height: "44px",
                        padding: "0 16px",
                        borderRadius: "10px",
                        border: "1.5px solid #CBD5E1",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#0F172A",
                        outline: "none",
                        background: "#F8FAFC",
                      }}
                    >
                      <option value="United States">United States 🇺🇸</option>
                      <option value="United Kingdom">United Kingdom 🇬🇧</option>
                      <option value="Canada">Canada 🇨🇦</option>
                      <option value="Germany">Germany 🇩🇪</option>
                      <option value="Singapore">Singapore 🇸🇬</option>
                      <option value="India">India 🇮🇳</option>
                    </select>
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: "700",
                        color: "#334155",
                        marginBottom: "8px",
                      }}
                    >
                      Time Zone
                    </label>
                    <select
                      value={timeZone}
                      onChange={(e) => setTimeZone(e.target.value)}
                      style={{
                        width: "100%",
                        height: "44px",
                        padding: "0 16px",
                        borderRadius: "10px",
                        border: "1.5px solid #CBD5E1",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#0F172A",
                        outline: "none",
                        background: "#F8FAFC",
                      }}
                    >
                      <option value="(GMT-05:00) Eastern Time (US & Canada)">
                        (GMT-05:00) Eastern Time (US & Canada)
                      </option>
                      <option value="(GMT-08:00) Pacific Time (US & Canada)">
                        (GMT-08:00) Pacific Time (US & Canada)
                      </option>
                      <option value="(GMT+00:00) UTC / London">
                        (GMT+00:00) UTC / London
                      </option>
                      <option value="(GMT+05:30) India Standard Time">
                        (GMT+05:30) India Standard Time
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* SECTION 2: ORGANIZATION TEAM MEMBERS */}
          {activeSection === "team" && (
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: "20px",
                padding: "32px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "28px",
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: "20px",
                      fontWeight: "800",
                      color: "#0F172A",
                      margin: 0,
                    }}
                  >
                    Organization Team Members
                  </h3>
                  <p
                    style={{
                      fontSize: "13.5px",
                      color: "#64748B",
                      marginTop: "4px",
                      margin: 0,
                    }}
                  >
                    Manage access permissions, add new team members (`POST
                    /users`), and monitor account activity.
                  </p>
                </div>

                <button
                  onClick={() => setIsAddModalOpen(true)}
                  style={{
                    background: "#2563EB",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "10px",
                    padding: "10px 22px",
                    fontSize: "14px",
                    fontWeight: "700",
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(37, 99, 235, 0.25)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  + Add New User
                </button>
              </div>

              {/* Filter Controls */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                  marginBottom: "24px",
                }}
              >
                <input
                  type="text"
                  placeholder="Search team members by name or work email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    maxWidth: "400px",
                    height: "42px",
                    padding: "0 16px",
                    borderRadius: "10px",
                    border: "1.5px solid #CBD5E1",
                    fontSize: "14px",
                    outline: "none",
                    background: "#F8FAFC",
                  }}
                />

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    height: "42px",
                    padding: "0 16px",
                    borderRadius: "10px",
                    border: "1.5px solid #CBD5E1",
                    fontSize: "13.5px",
                    fontWeight: "600",
                    color: "#334155",
                    background: "#FFFFFF",
                  }}
                >
                  <option value="all">All Members</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>

              {/* Table */}
              <div
                style={{
                  border: "1px solid #E2E8F0",
                  borderRadius: "14px",
                  overflow: "hidden",
                }}
              >
                {loadingUsers ? (
                  <div
                    style={{
                      padding: "40px",
                      textAlign: "center",
                      color: "#64748B",
                    }}
                  >
                    Loading organization members...
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div
                    style={{
                      padding: "40px",
                      textAlign: "center",
                      color: "#64748B",
                    }}
                  >
                    No team members found matching search query.
                  </div>
                ) : (
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      textAlign: "left",
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          background: "#F8FAFC",
                          borderBottom: "1.5px solid #E2E8F0",
                        }}
                      >
                        <th
                          style={{
                            padding: "16px 20px",
                            fontSize: "12px",
                            fontWeight: "700",
                            color: "#64748B",
                            textTransform: "uppercase",
                          }}
                        >
                          Member Name
                        </th>
                        <th
                          style={{
                            padding: "16px 20px",
                            fontSize: "12px",
                            fontWeight: "700",
                            color: "#64748B",
                            textTransform: "uppercase",
                          }}
                        >
                          Work Email
                        </th>
                        <th
                          style={{
                            padding: "16px 20px",
                            fontSize: "12px",
                            fontWeight: "700",
                            color: "#64748B",
                            textTransform: "uppercase",
                          }}
                        >
                          Role
                        </th>
                        <th
                          style={{
                            padding: "16px 20px",
                            fontSize: "12px",
                            fontWeight: "700",
                            color: "#64748B",
                            textTransform: "uppercase",
                          }}
                        >
                          Status
                        </th>
                        <th
                          style={{
                            padding: "16px 20px",
                            fontSize: "12px",
                            fontWeight: "700",
                            color: "#64748B",
                            textTransform: "uppercase",
                            textAlign: "right",
                          }}
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => {
                        const isActive = u.is_active !== false;
                        const userInitials = getInitials(u.name, u.email);
                        return (
                          <tr
                            key={u.id || u.email}
                            style={{ borderBottom: "1px solid #F1F5F9" }}
                          >
                            <td style={{ padding: "16px 20px" }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "14px",
                                }}
                              >
                                <div
                                  style={{
                                    width: "38px",
                                    height: "38px",
                                    borderRadius: "50%",
                                    background: isActive
                                      ? "#DBEAFE"
                                      : "#F1F5F9",
                                    color: isActive ? "#1D4ED8" : "#64748B",
                                    fontWeight: "800",
                                    fontSize: "14px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  {userInitials}
                                </div>
                                <div>
                                  <div
                                    style={{
                                      fontSize: "14px",
                                      fontWeight: "700",
                                      color: "#0F172A",
                                    }}
                                  >
                                    {formatUserName(u.name, u.email)}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td
                              style={{
                                padding: "16px 20px",
                                fontSize: "13.5px",
                                color: "#334155",
                                fontFamily: "monospace",
                              }}
                            >
                              {u.email}
                            </td>

                            <td
                              style={{
                                padding: "16px 20px",
                                fontSize: "13px",
                                fontWeight: "600",
                                color: "#475569",
                              }}
                            >
                              {u.is_superadmin
                                ? "Super Admin"
                                : u.role || "Analyst"}
                            </td>

                            <td style={{ padding: "16px 20px" }}>
                              <span
                                style={{
                                  padding: "4px 12px",
                                  borderRadius: "99px",
                                  fontSize: "11.5px",
                                  fontWeight: "700",
                                  background: isActive ? "#F0FDF4" : "#FEF2F2",
                                  color: isActive ? "#16A34A" : "#DC2626",
                                  border: isActive
                                    ? "1px solid #BBF7D0"
                                    : "1px solid #FECACA",
                                }}
                              >
                                {isActive ? "● Active" : "○ Inactive"}
                              </span>
                            </td>

                            <td
                              style={{
                                padding: "16px 20px",
                                textAlign: "right",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "flex-end",
                                  gap: "8px",
                                }}
                              >
                                <button
                                  onClick={() => {
                                    setSelectedUser(u);
                                    setEditUserName(u.name || "");
                                    setEditUserEmail(u.email || "");
                                    setEditUserActive(u.is_active !== false);
                                    setEditUserErrors({});
                                    setIsEditModalOpen(true);
                                  }}
                                  style={{
                                    background: "#F8FAFC",
                                    border: "1.5px solid #CBD5E1",
                                    borderRadius: "8px",
                                    padding: "6px 14px",
                                    fontSize: "12px",
                                    fontWeight: "700",
                                    color: "#334155",
                                    cursor: "pointer",
                                  }}
                                >
                                  Edit
                                </button>

                                <button
                                  onClick={() => {
                                    setSelectedUser(u);
                                    setIsDeleteModalOpen(true);
                                  }}
                                  style={{
                                    background: "#FEF2F2",
                                    border: "1.5px solid #FECACA",
                                    borderRadius: "8px",
                                    padding: "6px 14px",
                                    fontSize: "12px",
                                    fontWeight: "700",
                                    color: "#DC2626",
                                    cursor: "pointer",
                                  }}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* SECTION 3: DATA PROVIDERS */}
          {activeSection === "providers" && (
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: "20px",
                padding: "32px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "28px",
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: "20px",
                      fontWeight: "800",
                      color: "#0F172A",
                      margin: 0,
                    }}
                  >
                    Data Provider Credentials
                  </h3>
                  <p
                    style={{
                      fontSize: "13.5px",
                      color: "#64748B",
                      marginTop: "4px",
                      margin: 0,
                    }}
                  >
                    Configure API credentials per provider. Secrets are
                    encrypted at rest and always displayed masked.
                  </p>
                </div>

                <button
                  onClick={handleAddProviderRow}
                  disabled={loadingProviders}
                  style={{
                    background: "#2563EB",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "10px",
                    padding: "10px 22px",
                    fontSize: "14px",
                    fontWeight: "700",
                    cursor: loadingProviders ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 14px rgba(37, 99, 235, 0.25)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  + Add Credentials
                </button>
              </div>

              <div
                style={{
                  border: "1px solid #E2E8F0",
                  borderRadius: "14px",
                  overflowX: "auto",
                }}
              >
                {loadingProviders ? (
                  <div
                    style={{
                      padding: "40px",
                      textAlign: "center",
                      color: "#64748B",
                    }}
                  >
                    Loading data providers...
                  </div>
                ) : providerKeys.length === 0 &&
                  Object.keys(draftRows).length === 0 ? (
                  <div
                    style={{
                      padding: "40px",
                      textAlign: "center",
                      color: "#64748B",
                    }}
                  >
                    No credentials configured yet. Click{" "}
                    <strong>+ Add Credentials</strong> to connect a provider.
                  </div>
                ) : (
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      textAlign: "left",
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          background: "#F8FAFC",
                          borderBottom: "1.5px solid #E2E8F0",
                        }}
                      >
                        {[
                          "Data Provider",
                          "API Key",
                          "Username",
                          "Password",
                          "Status",
                        ].map((h) => (
                          <th
                            key={h}
                            style={{
                              padding: "16px 20px",
                              fontSize: "12px",
                              fontWeight: "700",
                              color: "#64748B",
                              textTransform: "uppercase",
                            }}
                          >
                            {h}
                          </th>
                        ))}
                        <th
                          style={{
                            padding: "16px 20px",
                            fontSize: "12px",
                            fontWeight: "700",
                            color: "#64748B",
                            textTransform: "uppercase",
                            textAlign: "right",
                          }}
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Saved credential rows */}
                      {providerKeys.map((key) => {
                        const draft = draftRows[key.id];
                        const provider =
                          providerById[
                            draft ? draft.data_provider_id : key.data_provider_id
                          ];
                        const required = requiredFieldsOf(provider);
                        const isActive = key.is_active !== false;

                        return (
                          <tr
                            key={key.id}
                            style={{ borderBottom: "1px solid #F1F5F9" }}
                          >
                            <td style={{ padding: "14px 20px" }}>
                              {draft ? (
                                <select
                                  value={draft.data_provider_id}
                                  onChange={(e) =>
                                    handleDraftChange(
                                      key.id,
                                      "data_provider_id",
                                      e.target.value,
                                    )
                                  }
                                  style={inputStyle}
                                >
                                  <option value="">Select provider…</option>
                                  {providers.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.name}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <div
                                  style={{
                                    fontSize: "14px",
                                    fontWeight: "700",
                                    color: "#0F172A",
                                  }}
                                >
                                  {provider?.name || `#${key.data_provider_id}`}
                                </div>
                              )}
                            </td>

                            {CREDENTIAL_FIELDS.map((field) => (
                              <td key={field} style={{ padding: "14px 20px" }}>
                                {draft ? (
                                  <CredentialInput
                                    field={field}
                                    value={draft[field]}
                                    required={required.has(field)}
                                    hasProvider={Boolean(draft.data_provider_id)}
                                    placeholder="Leave blank to keep current"
                                    onChange={(v) =>
                                      handleDraftChange(key.id, field, v)
                                    }
                                  />
                                ) : (
                                  <span
                                    style={{
                                      fontFamily: "monospace",
                                      fontSize: "13px",
                                      color: key[field] ? "#334155" : "#94A3B8",
                                    }}
                                  >
                                    {key[field] || "—"}
                                  </span>
                                )}
                              </td>
                            ))}

                            <td style={{ padding: "14px 20px" }}>
                              <button
                                onClick={() =>
                                  handleToggleProviderKeyActive(key)
                                }
                                disabled={
                                  Boolean(draft) || togglingKeyId === key.id
                                }
                                title={
                                  isActive
                                    ? "Click to deactivate"
                                    : "Click to activate"
                                }
                                style={{
                                  padding: "4px 12px",
                                  borderRadius: "99px",
                                  fontSize: "11.5px",
                                  fontWeight: "700",
                                  background: isActive ? "#F0FDF4" : "#FEF2F2",
                                  color: isActive ? "#16A34A" : "#DC2626",
                                  border: isActive
                                    ? "1px solid #BBF7D0"
                                    : "1px solid #FECACA",
                                  whiteSpace: "nowrap",
                                  cursor: draft ? "not-allowed" : "pointer",
                                  opacity: togglingKeyId === key.id ? 0.6 : 1,
                                }}
                              >
                                {togglingKeyId === key.id
                                  ? "..."
                                  : isActive
                                    ? "● Active"
                                    : "○ Inactive"}
                              </button>
                            </td>

                            <td
                              style={{ padding: "14px 20px", textAlign: "right" }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "flex-end",
                                  gap: "8px",
                                }}
                              >
                                {draft ? (
                                  <>
                                    <button
                                      onClick={() => handleSaveRow(key.id)}
                                      disabled={savingRow === key.id}
                                      style={primaryBtnStyle}
                                    >
                                      {savingRow === key.id
                                        ? "Saving..."
                                        : "Save"}
                                    </button>
                                    <button
                                      onClick={() => handleCancelDraft(key.id)}
                                      style={neutralBtnStyle}
                                    >
                                      Cancel
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => handleEditRow(key)}
                                      style={neutralBtnStyle}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeleteProviderKey(key.id)
                                      }
                                      disabled={deletingKeyId === key.id}
                                      style={dangerBtnStyle}
                                    >
                                      {deletingKeyId === key.id
                                        ? "..."
                                        : "Delete"}
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {/* Unsaved blank rows */}
                      {Object.entries(draftRows)
                        .filter(([, d]) => d.isNew)
                        .map(([rowId, draft]) => {
                          const provider = providerById[draft.data_provider_id];
                          const required = requiredFieldsOf(provider);

                          return (
                            <tr
                              key={rowId}
                              style={{
                                borderBottom: "1px solid #F1F5F9",
                                background: "#F8FAFF",
                              }}
                            >
                              <td style={{ padding: "14px 20px" }}>
                                <select
                                  value={draft.data_provider_id}
                                  onChange={(e) =>
                                    handleDraftChange(
                                      rowId,
                                      "data_provider_id",
                                      e.target.value,
                                    )
                                  }
                                  style={inputStyle}
                                >
                                  <option value="">Select provider…</option>
                                  {providers.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.name}
                                    </option>
                                  ))}
                                </select>
                              </td>

                              {CREDENTIAL_FIELDS.map((field) => (
                                <td key={field} style={{ padding: "14px 20px" }}>
                                  <CredentialInput
                                    field={field}
                                    value={draft[field]}
                                    required={required.has(field)}
                                    hasProvider={Boolean(draft.data_provider_id)}
                                    onChange={(v) =>
                                      handleDraftChange(rowId, field, v)
                                    }
                                  />
                                </td>
                              ))}

                              <td
                                style={{
                                  padding: "14px 20px",
                                  fontSize: "12px",
                                  color: "#94A3B8",
                                  fontWeight: "600",
                                }}
                              >
                                Unsaved
                              </td>

                              <td
                                style={{
                                  padding: "14px 20px",
                                  textAlign: "right",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    gap: "8px",
                                  }}
                                >
                                  <button
                                    onClick={() => handleSaveRow(rowId)}
                                    disabled={savingRow === rowId}
                                    style={primaryBtnStyle}
                                  >
                                    {savingRow === rowId ? "Saving..." : "Save"}
                                  </button>
                                  <button
                                    onClick={() => handleCancelDraft(rowId)}
                                    style={neutralBtnStyle}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Legend */}
              <div
                style={{
                  marginTop: "14px",
                  fontSize: "12px",
                  color: "#64748B",
                  display: "flex",
                  gap: "18px",
                }}
              >
                <span>
                  <span style={{ color: "#DC2626", fontWeight: "800" }}>*</span>{" "}
                  Required by the selected provider
                </span>
                <span>Optional fields may be left blank</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL: ADD USER (`POST /users`) ── */}
      {isAddModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "520px",
              padding: "32px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "20px",
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: "20px",
                    fontWeight: "800",
                    color: "#0F172A",
                    margin: 0,
                  }}
                >
                  Add New Organization User
                </h3>
                <p
                  style={{
                    fontSize: "12.5px",
                    color: "#64748B",
                    marginTop: "2px",
                    margin: 0,
                  }}
                >
                  Must meet enterprise password complexity and corporate domain
                  standards.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "#94A3B8",
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit}>
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "700",
                    color: "#334155",
                    marginBottom: "6px",
                  }}
                >
                  Full Name <span style={{ color: "#DC2626" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Jane Doe"
                  value={newUserName}
                  onChange={(e) => {
                    setNewUserName(e.target.value);
                    if (addUserErrors.name)
                      setAddUserErrors({ ...addUserErrors, name: null });
                  }}
                  style={{
                    width: "100%",
                    height: "44px",
                    padding: "0 14px",
                    borderRadius: "10px",
                    border: addUserErrors.name
                      ? "1.5px solid #EF4444"
                      : "1.5px solid #CBD5E1",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                {addUserErrors.name && (
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#DC2626",
                      marginTop: "4px",
                      display: "block",
                      fontWeight: "600",
                    }}
                  >
                    ⚠️ {addUserErrors.name}
                  </span>
                )}
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "700",
                    color: "#334155",
                    marginBottom: "6px",
                  }}
                >
                  Corporate Work Email{" "}
                  <span style={{ color: "#DC2626" }}>*</span>
                </label>
                <input
                  type="email"
                  placeholder="user@company.com"
                  value={newUserEmail}
                  onChange={(e) => {
                    setNewUserEmail(e.target.value);
                    if (addUserErrors.email)
                      setAddUserErrors({ ...addUserErrors, email: null });
                  }}
                  style={{
                    width: "100%",
                    height: "44px",
                    padding: "0 14px",
                    borderRadius: "10px",
                    border: addUserErrors.email
                      ? "1.5px solid #EF4444"
                      : "1.5px solid #CBD5E1",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                {addUserErrors.email && (
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#DC2626",
                      marginTop: "4px",
                      display: "block",
                      fontWeight: "600",
                    }}
                  >
                    ⚠️ {addUserErrors.email}
                  </span>
                )}
              </div>

              {/* Password Input with Eye Visibility Toggle Icon */}
              <div style={{ marginBottom: "18px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "700",
                    color: "#334155",
                    marginBottom: "6px",
                  }}
                >
                  Initial Password <span style={{ color: "#DC2626" }}>*</span>
                </label>

                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="e.g. Enterprise#2026"
                    value={newUserPassword}
                    onChange={(e) => {
                      setNewUserPassword(e.target.value);
                      if (addUserErrors.password)
                        setAddUserErrors({ ...addUserErrors, password: null });
                    }}
                    style={{
                      width: "100%",
                      height: "44px",
                      padding: "0 46px 0 14px",
                      borderRadius: "10px",
                      border: addUserErrors.password
                        ? "1.5px solid #EF4444"
                        : "1.5px solid #CBD5E1",
                      fontSize: "14px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? "Hide password" : "Show password"}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#64748B",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "4px",
                      borderRadius: "6px",
                    }}
                  >
                    {showPassword ? (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>

                {addUserErrors.password && (
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#DC2626",
                      marginTop: "4px",
                      display: "block",
                      fontWeight: "600",
                    }}
                  >
                    ⚠️ {addUserErrors.password}
                  </span>
                )}

                {/* Live Password Complexity Checklist */}
                <div
                  style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "10px",
                    padding: "12px 14px",
                    marginTop: "10px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11.5px",
                      fontWeight: "700",
                      color: "#475569",
                      marginBottom: "6px",
                    }}
                  >
                    ORGANIZATION PASSWORD COMPLEXITY REQUIREMENTS:
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "6px",
                      fontSize: "12px",
                    }}
                  >
                    <span
                      style={{
                        color: passwordChecks.length ? "#16A34A" : "#94A3B8",
                        fontWeight: "600",
                      }}
                    >
                      {passwordChecks.length ? "✓" : "○"} 8+ Characters
                    </span>
                    <span
                      style={{
                        color: passwordChecks.uppercase ? "#16A34A" : "#94A3B8",
                        fontWeight: "600",
                      }}
                    >
                      {passwordChecks.uppercase ? "✓" : "○"} Uppercase (A-Z)
                    </span>
                    <span
                      style={{
                        color: passwordChecks.lowercase ? "#16A34A" : "#94A3B8",
                        fontWeight: "600",
                      }}
                    >
                      {passwordChecks.lowercase ? "✓" : "○"} Lowercase (a-z)
                    </span>
                    <span
                      style={{
                        color: passwordChecks.number ? "#16A34A" : "#94A3B8",
                        fontWeight: "600",
                      }}
                    >
                      {passwordChecks.number ? "✓" : "○"} Number (0-9)
                    </span>
                    <span
                      style={{
                        color: passwordChecks.special ? "#16A34A" : "#94A3B8",
                        fontWeight: "600",
                      }}
                    >
                      {passwordChecks.special ? "✓" : "○"} Special (!@#$%)
                    </span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  marginBottom: "24px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: "700",
                      color: "#334155",
                      marginBottom: "6px",
                    }}
                  >
                    Role / Permissions
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    style={{
                      width: "100%",
                      height: "44px",
                      padding: "0 14px",
                      borderRadius: "10px",
                      border: "1.5px solid #CBD5E1",
                      fontSize: "13.5px",
                      fontWeight: "600",
                      background: "#FFFFFF",
                    }}
                  >
                    <option value="analyst">Analyst</option>
                    <option value="manager">PR Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: "700",
                      color: "#334155",
                      marginBottom: "6px",
                    }}
                  >
                    Organization ID
                  </label>
                  <input
                    type="text"
                    disabled
                    value={storedOrgId}
                    style={{
                      width: "100%",
                      height: "44px",
                      padding: "0 14px",
                      borderRadius: "10px",
                      border: "1.5px solid #E2E8F0",
                      background: "#F1F5F9",
                      fontSize: "14px",
                      fontFamily: "monospace",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "12px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{
                    height: "44px",
                    padding: "0 20px",
                    borderRadius: "10px",
                    background: "#F1F5F9",
                    color: "#475569",
                    fontSize: "14px",
                    fontWeight: "600",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={addingUser}
                  style={{
                    height: "44px",
                    padding: "0 24px",
                    borderRadius: "10px",
                    background: "#2563EB",
                    color: "#FFFFFF",
                    fontSize: "14px",
                    fontWeight: "700",
                    border: "none",
                    cursor: addingUser ? "not-allowed" : "pointer",
                  }}
                >
                  {addingUser ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: EDIT USER (`PUT /users/{user_id}`) ── */}
      {isEditModalOpen && selectedUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "480px",
              padding: "32px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "20px",
              }}
            >
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: "800",
                  color: "#0F172A",
                  margin: 0,
                }}
              >
                Edit Member Details
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "#94A3B8",
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditUserSubmit}>
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "700",
                    color: "#334155",
                    marginBottom: "6px",
                  }}
                >
                  Full Name
                </label>
                <input
                  type="text"
                  value={editUserName}
                  onChange={(e) => {
                    setEditUserName(e.target.value);
                    if (editUserErrors.name)
                      setEditUserErrors({ ...editUserErrors, name: null });
                  }}
                  style={{
                    width: "100%",
                    height: "44px",
                    padding: "0 14px",
                    borderRadius: "10px",
                    border: editUserErrors.name
                      ? "1.5px solid #EF4444"
                      : "1.5px solid #CBD5E1",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                {editUserErrors.name && (
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#DC2626",
                      marginTop: "4px",
                      display: "block",
                      fontWeight: "600",
                    }}
                  >
                    ⚠️ {editUserErrors.name}
                  </span>
                )}
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "700",
                    color: "#334155",
                    marginBottom: "6px",
                  }}
                >
                  Work Email
                </label>
                <input
                  type="email"
                  value={editUserEmail}
                  onChange={(e) => {
                    setEditUserEmail(e.target.value);
                    if (editUserErrors.email)
                      setEditUserErrors({ ...editUserErrors, email: null });
                  }}
                  style={{
                    width: "100%",
                    height: "44px",
                    padding: "0 14px",
                    borderRadius: "10px",
                    border: editUserErrors.email
                      ? "1.5px solid #EF4444"
                      : "1.5px solid #CBD5E1",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                {editUserErrors.email && (
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#DC2626",
                      marginTop: "4px",
                      display: "block",
                      fontWeight: "600",
                    }}
                  >
                    ⚠️ {editUserErrors.email}
                  </span>
                )}
              </div>

              <div
                style={{
                  marginBottom: "24px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <input
                  type="checkbox"
                  id="edit-active-toggle"
                  checked={editUserActive}
                  onChange={(e) => setEditUserActive(e.target.checked)}
                  style={{
                    width: "18px",
                    height: "18px",
                    accentColor: "#2563EB",
                    cursor: "pointer",
                  }}
                />
                <label
                  htmlFor="edit-active-toggle"
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#334155",
                    cursor: "pointer",
                  }}
                >
                  Account Active
                </label>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "12px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  style={{
                    height: "44px",
                    padding: "0 20px",
                    borderRadius: "10px",
                    background: "#F1F5F9",
                    color: "#475569",
                    fontSize: "14px",
                    fontWeight: "600",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={updatingUser}
                  style={{
                    height: "44px",
                    padding: "0 24px",
                    borderRadius: "10px",
                    background: "#2563EB",
                    color: "#FFFFFF",
                    fontSize: "14px",
                    fontWeight: "700",
                    border: "none",
                    cursor: updatingUser ? "not-allowed" : "pointer",
                  }}
                >
                  {updatingUser ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: DELETE USER (`DELETE /users/{user_id}`) ── */}
      {isDeleteModalOpen && selectedUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "440px",
              padding: "32px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
          >
            <h3
              style={{
                fontSize: "20px",
                fontWeight: "800",
                color: "#DC2626",
                marginBottom: "8px",
              }}
            >
              Delete Organization User?
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "#475569",
                lineHeight: "1.5",
                marginBottom: "24px",
              }}
            >
              Are you sure you want to remove{" "}
              <strong>{selectedUser.name || selectedUser.email}</strong>? This
              action will revoke their organization access.
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
              }}
            >
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                style={{
                  height: "44px",
                  padding: "0 20px",
                  borderRadius: "10px",
                  background: "#F1F5F9",
                  color: "#475569",
                  fontSize: "14px",
                  fontWeight: "600",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deletingUser}
                onClick={handleDeleteConfirm}
                style={{
                  height: "44px",
                  padding: "0 24px",
                  borderRadius: "10px",
                  background: "#DC2626",
                  color: "#FFFFFF",
                  fontSize: "14px",
                  fontWeight: "700",
                  border: "none",
                  cursor: deletingUser ? "not-allowed" : "pointer",
                }}
              >
                {deletingUser ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
