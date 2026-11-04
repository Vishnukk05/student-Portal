import React, { useState, useEffect } from "react";
import { apiRequest, AuthStore } from "../api";
import { IconAlertCircle } from "./common/Icons";
import { ThemeToggle } from "./common/ThemeToggle";

export function Login({ onLoginSuccess, addToast }) {
  // Views inside the same card: 'login' | 'forgot' | 'forgot_success' | 'admin_restricted' | 'reset'
  const [authView, setAuthView] = useState("login");

  // Sign in state
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [requires2FA, setRequires2FA] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Forgot password state (inline in same card)
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotDispatchedEmail, setForgotDispatchedEmail] = useState("");

  // Reset password state (when landing via email link)
  const [resetToken, setResetToken] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [showResetPw, setShowResetPw] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");

  // Ensure clean auth state & check if user clicked Reset Link in email
  useEffect(() => {
    AuthStore.clearSession();

    try {
      const searchParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = searchParams.get("resetToken") || searchParams.get("token");
      if (tokenFromUrl) {
        setResetToken(tokenFromUrl);
        setAuthView("reset");
      }
    } catch {
      // Fallback
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      const payload = {
        identifier: identifier.trim(),
        usernameOrEmail: identifier.trim(),
        password,
        otp: otp.trim(),
      };

      const res = await apiRequest("/auth/login/", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.data.requiresTwoFactor) {
        setRequires2FA(true);
        setErrorMessage("Please enter your 6-digit authenticator code.");
        setLoading(false);
        return;
      }

      if (res.data.success && res.data.token) {
        AuthStore.setSession(res.data.token, res.data.user);
        if (addToast) addToast(res.data.message || "Unlocked successfully! Welcome to EduPortal.", "success");
        onLoginSuccess(res.data.user);
      } else {
        setErrorMessage(res.data.message || "Invalid credentials.");
      }
    } catch (err) {
      setErrorMessage(err.message || "Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };

  // Submit handler for Forgot Password (Inside same card, no popup)
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotError("");

    const emailClean = forgotEmail.trim();
    if (!emailClean) {
      setForgotError("Please enter your registered email address.");
      return;
    }

    // Check if user is attempting to reset an Administrator account
    const lower = emailClean.toLowerCase();
    if (lower === "admin" || lower.startsWith("admin@") || lower.includes("admin@eduportal.edu")) {
      setAuthView("admin_restricted");
      return;
    }

    setForgotLoading(true);
    try {
      const res = await apiRequest("/auth/student/password-reset/request/", {
        method: "POST",
        body: JSON.stringify({ identifier: emailClean }),
      });

      if (res.data?.success) {
        setForgotDispatchedEmail(emailClean);
        setAuthView("forgot_success");
        if (addToast) addToast("Reset instructions dispatched to your college and personal emails!", "success");
      } else {
        setForgotError(res.data?.message || "Could not process password reset.");
      }
    } catch (err) {
      if (err.status === 403 || err.data?.is_admin_restricted) {
        setAuthView("admin_restricted");
      } else {
        setForgotError(err.message || "No registered student account was found matching this email address.");
      }
    } finally {
      setForgotLoading(false);
    }
  };

  // Return to sign in view and clean up reset states / URL query params
  const handleBackToLogin = () => {
    setAuthView("login");
    setForgotError("");
    setResetError("");
    if (window.location.search.includes("resetToken") || window.location.search.includes("token")) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  // Submit handler for Setting New Password from Email Link
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setResetError("");

    if (!resetNewPassword || resetNewPassword.length < 6) {
      setResetError("Password must be at least 6 characters long.");
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setResetError("New passwords do not match.");
      return;
    }

    setResetLoading(true);
    try {
      const res = await apiRequest("/auth/student/password-reset/confirm/", {
        method: "POST",
        body: JSON.stringify({
          token: resetToken,
          newPassword: resetNewPassword,
        }),
      });

      if (res.data?.success) {
        if (addToast) addToast(res.data.message || "Password updated successfully! Please sign in with your new password.", "success");
        if (res.data.identifier) {
          setIdentifier(res.data.identifier);
        }
        handleBackToLogin();
      } else {
        setResetError(res.data?.message || "This password reset link is invalid or has expired.");
      }
    } catch (err) {
      setResetError(err.message || "This password reset link is invalid or has expired. Please request a new one.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="modern-lock-screen">
      {/* Top Right Floating Dark/Light Mode Switch */}
      <div className="lock-theme-toggle">
        <ThemeToggle />
      </div>

      {/* Education Website Campus Background */}
      <div className="lock-wallpaper-stack">
        <div
          className="lock-wallpaper-layer active"
          style={{
            backgroundImage: "url(/images/education-bg.jpg?v=5)",
          }}
        />
        <div className="lock-wallpaper-vignette" />
      </div>

      {/* Center: Frosted Glassmorphic Authentication Card */}
      <div className="lock-card-wrapper">
        <div className="lock-auth-card">
          {/* Logo Avatar */}
          <div className="lock-avatar-wrapper" style={{ marginBottom: "14px" }}>
            <div className="lock-avatar" style={{ width: "72px", height: "72px", boxShadow: "0 8px 24px rgba(37, 99, 235, 0.25)" }}>
              <img src="/images/logo.png?v=6" alt="EduPortal Logo" />
            </div>
          </div>

          {/* VIEW 1: Standard Sign In */}
          {authView === "login" && (
            <>
              <h2 className="lock-card-title" style={{ fontSize: "26px", letterSpacing: "-0.5px" }}>EduPortal</h2>
              <p className="lock-card-subtitle" style={{ fontSize: "13.5px", marginBottom: "20px" }}>
                Academic Management & Student Information System
              </p>

              {errorMessage && (
                <div className="lock-error-alert" style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", marginBottom: "16px" }}>
                  <IconAlertCircle size={16} />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ width: "100%" }}>
                <div className="form-group" style={{ marginBottom: "16px" }}>
                  <label style={{ fontSize: "12.5px", fontWeight: 700 }}>Email Address</label>
                  <div className="input-icon-wrap">
                    <span className="icon-left">
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      required
                      className="lock-input"
                      placeholder="Enter your email"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: "18px" }}>
                  <label style={{ fontSize: "12.5px", fontWeight: 700 }}>Password</label>
                  <div className="input-icon-wrap">
                    <span className="icon-left">
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      className="lock-input"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="icon-right"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        {showPassword ? (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        ) : (
                          <>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </>
                        )}
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="options-row" style={{ marginBottom: "22px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px" }}>
                    <input type="checkbox" defaultChecked /> Remember Session
                  </label>
                  <button
                    type="button"
                    className="forgot-link"
                    style={{ fontSize: "13px", textDecoration: "none", border: "none", background: "none", cursor: "pointer", padding: 0 }}
                    onClick={(e) => {
                      e.preventDefault();
                      setForgotEmail(identifier.trim());
                      setForgotError("");
                      setAuthView("forgot");
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>

                {requires2FA && (
                  <div className="form-group" style={{ background: "var(--primary-light)", padding: "14px", borderRadius: "10px", marginBottom: "20px" }}>
                    <label style={{ color: "var(--primary)", fontWeight: 700, fontSize: "13px" }}>Authenticator 2FA Code</label>
                    <div className="input-icon-wrap">
                      <span className="icon-left">
                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                      </span>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="Enter 6-digit code"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="lock-input"
                        autoFocus
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary lock-unlock-btn"
                  disabled={loading}
                  style={{ width: "100%", height: "46px", fontSize: "15px", fontWeight: 700 }}
                >
                  {loading ? (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                      <span className="spinner-border" /> Verifying Credentials...
                    </span>
                  ) : (
                    <span>Sign In</span>
                  )}
                </button>
              </form>
            </>
          )}

          {/* VIEW 2: Forgot Password (In Same Card, No Modal Popup) */}
          {authView === "forgot" && (
            <div style={{ width: "100%" }}>
              <h2 className="lock-card-title" style={{ fontSize: "24px", letterSpacing: "-0.5px" }}>Forgot Password</h2>
              <p className="lock-card-subtitle" style={{ fontSize: "13px", marginBottom: "18px", lineHeight: 1.5 }}>
                Enter your registered email address. We will verify your account and send a reset link to both your college and personal email.
              </p>

              {forgotError && (
                <div className="lock-error-alert" style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", marginBottom: "16px" }}>
                  <IconAlertCircle size={16} />
                  <span>{forgotError}</span>
                </div>
              )}

              <form onSubmit={handleForgotSubmit}>
                <div className="form-group" style={{ marginBottom: "22px" }}>
                  <label style={{ fontSize: "12.5px", fontWeight: 700 }}>Registered Email Address *</label>
                  <div className="input-icon-wrap">
                    <span className="icon-left">
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </span>
                    <input
                      type="email"
                      required
                      className="lock-input"
                      placeholder="Enter your registered college or personal email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={forgotLoading}
                  style={{ width: "100%", height: "46px", fontSize: "15px", fontWeight: 700, marginBottom: "12px" }}
                >
                  {forgotLoading ? (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                      <span className="spinner-border" /> Sending Reset Link...
                    </span>
                  ) : (
                    <span>Send Reset Link</span>
                  )}
                </button>

                <div style={{ textAlign: "center", marginTop: "8px" }}>
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    style={{ background: "none", border: "none", color: "var(--primary)", fontSize: "13.5px", fontWeight: 600, cursor: "pointer", padding: "6px" }}
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* VIEW 3: Reset Link Dispatched Success Screen (In Same Card) */}
          {authView === "forgot_success" && (
            <div style={{ width: "100%", textAlign: "center", padding: "6px 0" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", marginBottom: "16px" }}>
                <div style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  background: "rgba(16, 185, 129, 0.14)",
                  border: "1px solid rgba(16, 185, 129, 0.28)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#10b981"
                }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
              </div>

              <h2 className="lock-card-title" style={{ fontSize: "22px", marginBottom: "8px" }}>
                Reset Link Dispatched!
              </h2>

              <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "14px" }}>
                A secure password reset link has been dispatched to both your <strong>college portal email</strong> and <strong>personal email</strong> address:
              </p>

              <div style={{
                background: "var(--bg-main)",
                padding: "10px 14px",
                borderRadius: "8px",
                fontFamily: "monospace",
                fontSize: "13px",
                color: "var(--primary)",
                fontWeight: 600,
                marginBottom: "18px",
                wordBreak: "break-all",
                border: "1px solid var(--border-color)"
              }}>
                {forgotDispatchedEmail}
              </div>

              <p style={{ fontSize: "12.5px", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "22px" }}>
                Please check your inbox (and spam folder). Click the reset button in that email to choose your new permanent password. The link expires in 60 minutes.
              </p>

              <button
                type="button"
                className="btn btn-primary"
                style={{ width: "100%", height: "46px", fontSize: "15px", fontWeight: 700 }}
                onClick={handleBackToLogin}
              >
                Back to Sign In
              </button>
            </div>
          )}

          {/* VIEW 4: Super Admin Restricted Alert (In Same Card) */}
          {authView === "admin_restricted" && (
            <div style={{ width: "100%", textAlign: "center", padding: "6px 0" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", marginBottom: "16px" }}>
                <div style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  background: "rgba(239, 68, 68, 0.14)",
                  border: "1px solid rgba(239, 68, 68, 0.28)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "12px",
                  color: "#ef4444"
                }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>

                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  background: "rgba(239, 68, 68, 0.12)",
                  color: "#f87171",
                  border: "1px solid rgba(239, 68, 68, 0.22)",
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "4px 14px",
                  borderRadius: "999px",
                  textTransform: "uppercase",
                  letterSpacing: "0.6px"
                }}>
                  Institutional Security Policy
                </div>
              </div>

              <h2 className="lock-card-title" style={{ fontSize: "21px", marginBottom: "8px" }}>
                Administrator Password Reset Disabled
              </h2>

              <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "12px" }}>
                Self-service password reset is strictly restricted for Super Administrator accounts to prevent unauthorized credential tampering.
              </p>

              <div style={{
                background: "var(--bg-main)",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                fontSize: "12.5px",
                color: "var(--text-muted)",
                lineHeight: 1.5,
                marginBottom: "20px"
              }}>
                Administrator credentials cannot be reset through the public student portal. If you require password recovery, credential rotation, or token synchronization, please contact the <strong>IT Infrastructure & Security Administration</strong> desk directly.
              </div>

              <button
                type="button"
                className="btn btn-primary"
                style={{ width: "100%", height: "46px", fontSize: "15px", fontWeight: 700 }}
                onClick={handleBackToLogin}
              >
                Back to Sign In
              </button>
            </div>
          )}

          {/* VIEW 5: Set New Password (Opened via Reset Link in Email, In Same Card) */}
          {authView === "reset" && (
            <div style={{ width: "100%" }}>
              <h2 className="lock-card-title" style={{ fontSize: "24px", letterSpacing: "-0.5px" }}>Choose New Password</h2>
              <p className="lock-card-subtitle" style={{ fontSize: "13px", marginBottom: "18px", lineHeight: 1.5 }}>
                Your password reset security token has been verified. Please choose and confirm your new permanent password below.
              </p>

              {resetError && (
                <div className="lock-error-alert" style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", marginBottom: "16px" }}>
                  <IconAlertCircle size={16} />
                  <span>{resetError}</span>
                </div>
              )}

              <form onSubmit={handleResetSubmit}>
                <div className="form-group" style={{ marginBottom: "16px" }}>
                  <label style={{ fontSize: "12.5px", fontWeight: 700 }}>New Permanent Password *</label>
                  <div className="input-icon-wrap">
                    <span className="icon-left">
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </span>
                    <input
                      type={showResetPw ? "text" : "password"}
                      required
                      className="lock-input"
                      placeholder="Enter new password (min. 6 characters)"
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: "16px" }}>
                  <label style={{ fontSize: "12.5px", fontWeight: 700 }}>Confirm New Password *</label>
                  <div className="input-icon-wrap">
                    <span className="icon-left">
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </span>
                    <input
                      type={showResetPw ? "text" : "password"}
                      required
                      className="lock-input"
                      placeholder="Re-enter new password"
                      value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--text-muted)", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={showResetPw}
                      onChange={(e) => setShowResetPw(e.target.checked)}
                    />
                    <span>Show passwords</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={resetLoading}
                  style={{ width: "100%", height: "46px", fontSize: "15px", fontWeight: 700, marginBottom: "12px" }}
                >
                  {resetLoading ? (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                      <span className="spinner-border" /> Saving Password...
                    </span>
                  ) : (
                    <span>Save New Password</span>
                  )}
                </button>

                <div style={{ textAlign: "center", marginTop: "8px" }}>
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "13px", cursor: "pointer", textDecoration: "underline" }}
                  >
                    Cancel and Back to Sign In
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
