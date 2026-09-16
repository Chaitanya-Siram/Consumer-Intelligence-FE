import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { loginUser } from "../api/auth";
import logoImg from "../assets/images/image.png";

import video1 from "../assets/video/login/AILoginVideo1.mp4";
import video2 from "../assets/video/login/AILoginVideo2.mp4";
import video3 from "../assets/video/login/AILoginVdieo3.mp4";

// Personal email domains restriction list
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
  "yandex.com",
  "gmx.com",
  "icloud.me",
  "me.com",
  "inbox.com",
]);

export function validateWorkEmail(email) {
  if (!email) return "Work email address is required";
  const trimmed = email.trim().toLowerCase();
  const parts = trimmed.split("@");
  if (parts.length !== 2 || !parts[0] || !parts[1] || !parts[1].includes(".")) {
    return "Please enter a valid work email (e.g. name@company.com)";
  }
  const domain = parts[1];
  if (PERSONAL_EMAIL_DOMAINS.has(domain)) {
    return "Personal email domains are not permitted. Please enter your corporate work email.";
  }
  return null;
}

export function validatePassword(password) {
  if (!password) return "Password is required";
  // if (password.length < 12) return "Password must be at least 12 characters";
  if (!/[A-Z]/.test(password))
    return "Must contain at least 1 uppercase letter (A-Z)";
  if (!/[a-z]/.test(password))
    return "Must contain at least 1 lowercase letter (a-z)";
  if (!/[0-9]/.test(password)) return "Must contain at least 1 number (0-9)";
  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password))
    return "Must contain at least 1 special character (!@#$%^&*)";
  return null;
}

const VIDEO_SLIDES = [
  {
    id: 1,
    title: "Global Media Intelligence & Executive Command Center",
    subtitle:
      "Real-time AI monitoring, sentiment tracking, and narrative synthesis for Fortune 500 PR teams.",
    videoSrc: video1,
  },
  {
    id: 2,
    title: "Predictive PR & Reputation Impact Index",
    subtitle:
      "Quantify corporate reputation, narrative reach, and media velocity across 10,000+ publications.",
    videoSrc: video2,
  },
  {
    id: 3,
    title: "Automated Competitor & Storyline Tracking",
    subtitle:
      "Identify emerging narrative risks and competitive moves before they trend globally.",
    videoSrc: video3,
  },
];

export default function LoginScreen({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [loading, setLoading] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  // Auto-sliding media video carousel timer
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % VIDEO_SLIDES.length);
    }, 6500);
    return () => clearInterval(timer);
  }, []);

  const emailError = emailTouched ? validateWorkEmail(email) : null;
  const passwordError = passwordTouched ? validatePassword(password) : null;

  // Password requirements state
  const hasMinLength = password.length >= 12;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNum = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailTouched(true);
    setPasswordTouched(true);

    const emailErr = validateWorkEmail(email);
    const passErr = validatePassword(password);

    if (emailErr || passErr) {
      toast.error(emailErr || passErr);
      return;
    }

    setLoading(true);
    try {
      const data = await loginUser({
        username: email.trim(),
        password: password,
      });

      const token = data?.access_token || data?.token || "authenticated_token";
      localStorage.setItem("auth_token", token);
      localStorage.setItem("user_email", email.trim());
      // loginUser already persists the org context from data.organization

      toast.success("Welcome back to AlphaMetricx.");

      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        navigate("/");
      }
    } catch (err) {
      toast.error(
        err.message || "Authentication failed. Please verify your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        overflow: "hidden",
        fontFamily:
          '"Outfit", "Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, sans-serif',
        background: "#0F172A",
        color: "#0F172A",
      }}
    >
      {/* ── Left Half: Full-Height Video & Intelligence Showcase (50% Width) ── */}
      <div
        style={{
          flex: "1 1 50%",
          width: "50vw",
          height: "100vh",
          position: "relative",
          background: "#090D16",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 64px",
          color: "#FFFFFF",
        }}
      >
        {/* Background Videos with Smooth Opacity Transition */}
        {VIDEO_SLIDES.map((slide, idx) => (
          <div
            key={slide.id}
            style={{
              position: "absolute",
              inset: 0,
              opacity: activeSlide === idx ? 1 : 0,
              transition: "opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
              pointerEvents: "none",
              zIndex: 0,
            }}
          >
            <video
              src={slide.videoSrc}
              autoPlay
              loop
              muted
              playsInline
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "brightness(0.48) contrast(1.15) saturate(1.1)",
              }}
            />
          </div>
        ))}

        {/* Fortune 500 Ambient Gradient Overlays */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 20% 30%, rgba(37, 99, 235, 0.25) 0%, transparent 60%), linear-gradient(180deg, rgba(9, 13, 22, 0.75) 0%, rgba(9, 13, 22, 0.35) 45%, rgba(9, 13, 22, 0.92) 100%)",
            zIndex: 1,
            pointerEvents: "none",
          }}
        />

        {/* Top Header Branding */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "rgba(255, 255, 255, 0.12)",
                backdropFilter: "blur(12px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
              }}
            >
              <img
                src={logoImg}
                alt="AlphaMetricx Logo"
                style={{ width: "24px", height: "24px", objectFit: "contain" }}
              />
            </div>
            <div>
              <div
                style={{
                  fontWeight: "800",
                  fontSize: "20px",
                  letterSpacing: "-0.03em",
                  color: "#FFFFFF",
                  lineHeight: "1.1",
                }}
              >
                AlphaMetricx
              </div>
              <div
                style={{
                  fontSize: "10.5px",
                  fontWeight: "600",
                  color: "rgba(255, 255, 255, 0.6)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginTop: "2px",
                }}
              >
                Enterprise Platform
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Hero Carousel Content & Slide Indicators */}
        <div style={{ position: "relative", zIndex: 2, maxWidth: "600px" }}>
          <div style={{ minHeight: "130px" }}>
            <div
              style={{
                display: "inline-block",
                padding: "4px 12px",
                borderRadius: "99px",
                background: "rgba(37, 99, 235, 0.35)",
                border: "1px solid rgba(96, 165, 250, 0.4)",
                color: "#93C5FD",
                fontSize: "11px",
                fontWeight: "700",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                marginBottom: "14px",
              }}
            >
              PR & Corporate Intelligence
            </div>
            <h2
              style={{
                fontSize: "32px",
                fontWeight: "800",
                lineHeight: "1.2",
                letterSpacing: "-0.03em",
                marginBottom: "12px",
                color: "#FFFFFF",
                textShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
              }}
            >
              {VIDEO_SLIDES[activeSlide].title}
            </h2>
            <p
              style={{
                fontSize: "15px",
                lineHeight: "1.55",
                color: "rgba(241, 245, 249, 0.85)",
                margin: 0,
                fontWeight: "400",
              }}
            >
              {VIDEO_SLIDES[activeSlide].subtitle}
            </p>
          </div>

          {/* Slide Navigation Progress Indicators */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginTop: "32px",
            }}
          >
            {VIDEO_SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                onClick={() => setActiveSlide(idx)}
                aria-label={`Switch to slide ${idx + 1}`}
                style={{
                  height: "4px",
                  width: activeSlide === idx ? "40px" : "16px",
                  borderRadius: "4px",
                  background:
                    activeSlide === idx
                      ? "#FFFFFF"
                      : "rgba(255, 255, 255, 0.28)",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Half: Clean Fortune 500 Form Portal (50% Width) ── */}
      <div
        style={{
          flex: "1 1 50%",
          width: "50vw",
          height: "100vh",
          background: "#FFFFFF",
          overflowY: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px",
        }}
      >
        <div style={{ width: "100%", maxWidth: "440px" }}>
          {/* Header */}
          <div style={{ marginBottom: "36px" }}>
            <h1
              style={{
                fontSize: "34px",
                fontWeight: "800",
                letterSpacing: "-0.035em",
                color: "#0F172A",
                marginBottom: "8px",
                lineHeight: "1.15",
              }}
            >
              Sign in to your account
            </h1>
            <p
              style={{
                fontSize: "15px",
                color: "#475569",
                margin: 0,
                lineHeight: "1.5",
              }}
            >
              Welcome back. Access your executive media intelligence command
              center.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* Work Email Field */}
            <div style={{ marginBottom: "22px" }}>
              <label
                htmlFor="work-email"
                style={{
                  display: "block",
                  fontSize: "13.5px",
                  fontWeight: "700",
                  color: "#1E293B",
                  marginBottom: "8px",
                  letterSpacing: "-0.01em",
                }}
              >
                Work Email Address
              </label>
              <input
                id="work-email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmailTouched(true)}
                style={{
                  width: "100%",
                  height: "48px",
                  padding: "0 16px",
                  borderRadius: "10px",
                  border: emailError
                    ? "1.5px solid #DC2626"
                    : "1.5px solid #CBD5E1",
                  fontSize: "15px",
                  color: "#0F172A",
                  outline: "none",
                  background: "#F8FAFC",
                  transition: "all 0.2s ease",
                  boxSizing: "border-box",
                }}
              />

              {/* Inline Validation Error Message */}
              {emailError && (
                <div
                  style={{
                    fontSize: "12.5px",
                    color: "#DC2626",
                    marginTop: "6px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "#DC2626",
                      display: "inline-block",
                    }}
                  />
                  {emailError}
                </div>
              )}
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <label
                  htmlFor="account-password"
                  style={{
                    fontSize: "13.5px",
                    fontWeight: "700",
                    color: "#1E293B",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() =>
                    toast(
                      "Please contact your organization security admin to reset your password.",
                    )
                  }
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#2563EB",
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                  }}
                >
                  Forgot password?
                </button>
              </div>

              <div style={{ position: "relative" }}>
                <input
                  id="account-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setPasswordTouched(true)}
                  style={{
                    width: "100%",
                    height: "48px",
                    padding: "0 46px 0 16px",
                    borderRadius: "10px",
                    border: passwordError
                      ? "1.5px solid #DC2626"
                      : "1.5px solid #CBD5E1",
                    fontSize: "15px",
                    color: "#0F172A",
                    outline: "none",
                    background: "#F8FAFC",
                    transition: "all 0.2s ease",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute",
                    right: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                    color: "#64748B",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
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

              {/* Password Requirements Security Meter (Commented out for now)
              {password.length > 0 && (
                <div
                  style={{
                    marginTop: "12px",
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "10px",
                    padding: "12px 14px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      color: "#64748B",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: "8px",
                    }}
                  >
                    Security Checklist
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "6px 12px",
                      fontSize: "12px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        color: hasMinLength ? "#16A34A" : "#64748B",
                        fontWeight: hasMinLength ? "600" : "400",
                      }}
                    >
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: hasMinLength ? "#16A34A" : "#CBD5E1",
                        }}
                      />
                      12+ Characters
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        color: hasUpper ? "#16A34A" : "#64748B",
                        fontWeight: hasUpper ? "600" : "400",
                      }}
                    >
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: hasUpper ? "#16A34A" : "#CBD5E1",
                        }}
                      />
                      Uppercase (A-Z)
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        color: hasLower ? "#16A34A" : "#64748B",
                        fontWeight: hasLower ? "600" : "400",
                      }}
                    >
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: hasLower ? "#16A34A" : "#CBD5E1",
                        }}
                      />
                      Lowercase (a-z)
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        color: hasNum ? "#16A34A" : "#64748B",
                        fontWeight: hasNum ? "600" : "400",
                      }}
                    >
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: hasNum ? "#16A34A" : "#CBD5E1",
                        }}
                      />
                      Number (0-9)
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        color: hasSpecial ? "#16A34A" : "#64748B",
                        fontWeight: hasSpecial ? "600" : "400",
                        gridColumn: "span 2",
                      }}
                    >
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: hasSpecial ? "#16A34A" : "#CBD5E1",
                        }}
                      />
                      Special Symbol (!@#$%^&*)
                    </div>
                  </div>
                </div>
              )}
              */}
            </div>

            {/* Remember Me Option */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "28px",
              }}
            >
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "4px",
                  accentColor: "#2563EB",
                  cursor: "pointer",
                }}
              />
              <label
                htmlFor="remember-me"
                style={{
                  fontSize: "14px",
                  color: "#475569",
                  cursor: "pointer",
                  userSelect: "none",
                  fontWeight: "500",
                }}
              >
                Keep me signed in for 30 days
              </label>
            </div>

            {/* Main Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                height: "50px",
                borderRadius: "10px",
                background: "#2563EB",
                color: "#FFFFFF",
                fontSize: "15px",
                fontWeight: "700",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 16px rgba(37, 99, 235, 0.28)",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                opacity: loading ? 0.8 : 1,
              }}
            >
              {loading ? (
                <>
                  <span
                    style={{
                      width: "18px",
                      height: "18px",
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "#FFFFFF",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                      display: "inline-block",
                    }}
                  />
                  Authenticating...
                </>
              ) : (
                "Sign In"
              )}
            </button>

            {/* Divider */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                margin: "28px 0",
              }}
            >
              <div style={{ flex: 1, height: "1px", background: "#E2E8F0" }} />
              <span
                style={{
                  fontSize: "12.5px",
                  color: "#94A3B8",
                  fontWeight: "500",
                }}
              >
                Or sign in with Single Sign-On
              </span>
              <div style={{ flex: 1, height: "1px", background: "#E2E8F0" }} />
            </div>

            {/* Clean SVG Enterprise SSO Buttons */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <button
                type="button"
                onClick={() => toast("Redirecting to Google Workspace SSO...")}
                style={{
                  height: "44px",
                  borderRadius: "10px",
                  background: "#FFFFFF",
                  border: "1.5px solid #E2E8F0",
                  color: "#334155",
                  fontSize: "13.5px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "all 0.18s ease",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Google SSO
              </button>

              <button
                type="button"
                onClick={() => toast("Redirecting to Microsoft Entra SSO...")}
                style={{
                  height: "44px",
                  borderRadius: "10px",
                  background: "#FFFFFF",
                  border: "1.5px solid #E2E8F0",
                  color: "#334155",
                  fontSize: "13.5px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "all 0.18s ease",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 23 23">
                  <path fill="#f35325" d="M1 1h10v10H1z" />
                  <path fill="#81bc06" d="M12 1h10v10H12z" />
                  <path fill="#05a6f0" d="M1 12h10v10H1z" />
                  <path fill="#ffba08" d="M12 12h10v10H12z" />
                </svg>
                Microsoft SSO
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
