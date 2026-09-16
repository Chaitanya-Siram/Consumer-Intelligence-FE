import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  logoutUser,
  parseJwt,
  getCurrentOrg,
  switchOrganization,
} from "../api/auth";
import { listMyOrganizations } from "../api/users";

export default function UserAvatar({ style = {}, className = "" }) {
  const [open, setOpen] = useState(false);
  const [orgs, setOrgs] = useState([]);
  const [switchingTo, setSwitchingTo] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const currentOrg = getCurrentOrg();

  // Retrieve user details from localStorage or JWT payload
  const token = localStorage.getItem("auth_token");
  const storedEmail = localStorage.getItem("user_email") || "";
  const storedName = localStorage.getItem("user_name") || "";

  let displayName = storedName;
  let displayEmail = storedEmail;

  console.log({ storedName });

  if (token) {
    const decoded = parseJwt(token);
    if (decoded) {
      console.log({ decoded });

      if (!displayName) {
        displayName =
          decoded.name ||
          decoded.first_name ||
          decoded.username ||
          decoded.sub ||
          "";
      }
      if (!displayEmail && decoded.email) {
        displayEmail = decoded.email;
      }
    }
  }

  if (!displayName && displayEmail) {
    displayName = displayEmail.split("@")[0];
  }
  if (!displayName) {
    displayName = "User";
  }

  // Utility to cleanly format user name from email
  function formatUserName(nameStr, emailStr) {
    if (nameStr && isNaN(nameStr) && nameStr.trim().length > 1) {
      return nameStr.trim();
    }
    if (!emailStr) return "Executive Member";
    const local = emailStr.split("@")[0] || "";
    const parts = local.replace(/[0-9]/g, "").split(/[._-]/).filter(Boolean);
    if (parts.length === 0)
      return local.charAt(0).toUpperCase() + local.slice(1);
    return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
  }

  // Extract first initial of user's first name
  const firstName = displayName.trim().split(" ")[0] || "User";
  // Form states for profile

  const jwtInfo = useMemo(() => parseJwt(token), [token]);

  const defaultFormattedName = useMemo(() => {
    return formatUserName(jwtInfo?.name || jwtInfo?.sub, storedEmail);
  }, [jwtInfo, storedEmail]);
  const firstInitial = (defaultFormattedName.charAt(0) || "U").toUpperCase();

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load memberships when the menu opens so the switcher only shows for
  // users who actually belong to more than one org.
  useEffect(() => {
    if (!open || orgs.length > 0) return;
    let cancelled = false;
    listMyOrganizations()
      .then((list) => {
        if (!cancelled) setOrgs(Array.isArray(list) ? list : []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, orgs.length]);

  const switchableOrgs = useMemo(
    () => orgs.filter((o) => o.is_active !== false),
    [orgs],
  );
  const hasMultipleOrgs = switchableOrgs.length > 1;

  const activeOrgName =
    switchableOrgs.find((o) => o.id === currentOrg.id)?.name ||
    currentOrg.name ||
    "";

  const handleSwitchOrg = async (org) => {
    if (org.id === currentOrg.id || switchingTo != null) return;
    setSwitchingTo(org.id);
    try {
      await switchOrganization(org.id);
      // Projects, sessions and charts are all org-scoped and cached in memory,
      // so reload rather than leaving the previous org's data on screen.
      window.location.href = "/";
    } catch (err) {
      toast.error(err.message || "Could not switch organization.");
      setSwitchingTo(null);
    }
  };

  const handleLogout = () => {
    setOpen(false);
    // toast.success("Signed out successfully");
    logoutUser();
  };

  const handleSettings = () => {
    setOpen(false);
    navigate("/settings");
  };

  return (
    <div
      ref={dropdownRef}
      style={{
        position: "relative",
        display: "inline-block",
        zIndex: 9999,
      }}
    >
      <button
        type="button"
        className={`avatar ${className}`}
        onClick={() => setOpen(!open)}
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "var(--wine-salmon, #F8E3DA)",
          color: "var(--wine-dark, #4A1525)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 700,
          border: open ? "2px solid #6C5CE7" : "none",
          outline: "none",
          cursor: "pointer",
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
          boxShadow: open
            ? "0 0 0 3px rgba(108, 92, 231, 0.25)"
            : "0 2px 6px rgba(0,0,0,0.08)",
          ...style,
        }}
        title={`Account: ${displayName}`}
      >
        {firstInitial}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: "210px",
            background: "#ffffff",
            borderRadius: "14px",
            border: "1px solid rgba(0, 0, 0, 0.09)",
            boxShadow:
              "0 14px 36px -8px rgba(15, 23, 42, 0.18), 0 4px 12px rgba(15, 23, 42, 0.06)",
            padding: "6px 0",
            zIndex: 99999,
            animation:
              "userAvatarMenuFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* User Info Header */}
          <div
            style={{
              padding: "10px 14px 8px",
              borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
              marginBottom: "4px",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                fontWeight: "700",
                color: "#0F172A",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {/* {displayName} */}
            </div>
            {displayEmail && (
              <div
                style={{
                  fontSize: "11px",
                  color: "#64748B",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  marginTop: "1px",
                }}
              >
                {displayEmail}
              </div>
            )}
            {activeOrgName && (
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "#7C3AED",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  marginTop: "3px",
                }}
              >
                {activeOrgName}
              </div>
            )}
          </div>

          {/* Organization Switcher — only when the user has more than one */}
          {hasMultipleOrgs && (
            <div
              style={{
                borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
                paddingBottom: "4px",
                marginBottom: "4px",
              }}
            >
              <div
                style={{
                  padding: "6px 14px 4px",
                  fontSize: "10px",
                  fontWeight: "700",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "#94A3B8",
                }}
              >
                Organization
              </div>
              {switchableOrgs.map((org) => {
                const isActive = org.id === currentOrg.id;
                const isSwitching = switchingTo === org.id;
                return (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => handleSwitchOrg(org)}
                    disabled={isActive || switchingTo != null}
                    title={org.name}
                    style={{
                      width: "100%",
                      padding: "8px 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      background: isActive ? "#F5F3FF" : "transparent",
                      border: "none",
                      fontSize: "12.5px",
                      fontWeight: isActive ? "700" : "600",
                      color: isActive ? "#5B21B6" : "#334155",
                      cursor: isActive
                        ? "default"
                        : switchingTo != null
                          ? "wait"
                          : "pointer",
                      textAlign: "left",
                      opacity: switchingTo != null && !isSwitching ? 0.5 : 1,
                      transition: "background 0.15s ease, color 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive && switchingTo == null) {
                        e.currentTarget.style.background = "#F1F5F9";
                        e.currentTarget.style.color = "#0F172A";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive && switchingTo == null) {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "#334155";
                      }
                    }}
                  >
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        flexShrink: 0,
                        background: isActive ? "#7C3AED" : "transparent",
                        border: isActive ? "none" : "1px solid #CBD5E1",
                      }}
                    />
                    <span
                      style={{
                        flex: 1,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {org.name}
                    </span>
                    {isSwitching && (
                      <span style={{ fontSize: "10px", color: "#7C3AED" }}>
                        …
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Menu Action Items */}
          <button
            type="button"
            onClick={handleSettings}
            style={{
              width: "100%",
              padding: "9px 14px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "transparent",
              border: "none",
              fontSize: "13px",
              fontWeight: "600",
              color: "#334155",
              cursor: "pointer",
              textAlign: "left",
              transition: "background 0.15s ease, color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#F1F5F9";
              e.currentTarget.style.color = "#0F172A";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#334155";
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Settings
          </button>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              width: "100%",
              padding: "9px 14px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "transparent",
              border: "none",
              fontSize: "13px",
              fontWeight: "600",
              color: "#EF4444",
              cursor: "pointer",
              textAlign: "left",
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#FEF2F2";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>
      )}

      <style>{`
        @keyframes userAvatarMenuFadeIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
