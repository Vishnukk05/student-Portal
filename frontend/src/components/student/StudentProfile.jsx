import { showConfirm } from "../ConfirmModal";
import React, { useState } from "react";
import { apiRequest, AuthStore } from "../../api";
import { IconPhone, IconLock, IconShieldCheck } from "../common/Icons";
import { Modal } from "../Modal";

export function StudentProfile({ user, onUpdateUser, addToast }) {
  // Contact Form
  const [phone, setPhone] = useState(user.phone || "");
  const [personalEmail, setPersonalEmail] = useState(user.personal_email || "");
  const [savingContact, setSavingContact] = useState(false);

  // Password Form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // 2FA State
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [secret, setSecret] = useState("");
  const [otpauthUrl, setOtpauthUrl] = useState("");
  const [verifyCode, setVerifyCode] = useState("");

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setSavingContact(true);
    try {
      const res = await apiRequest("/auth/update-profile/", {
        method: "POST",
        body: JSON.stringify({ phone, personal_email: personalEmail }),
      });
      addToast("Contact information updated successfully!", "success");
      if (res.data.user) {
        AuthStore.updateUser(res.data.user);
        onUpdateUser(res.data.user);
      }
    } catch (err) {
      addToast(err.message || "Failed to update contact info.", "error");
    } finally {
      setSavingContact(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast("New passwords do not match.", "error");
      return;
    }
    if (newPassword.length < 6) {
      addToast("Password must be at least 6 characters long.", "error");
      return;
    }

    setSavingPassword(true);
    try {
      await apiRequest("/auth/change-password/", {
        method: "PUT",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      addToast("Password changed successfully!", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      addToast(err.message || "Could not change password.", "error");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleStart2FA = async () => {
    try {
      const res = await apiRequest("/auth/authenticator/setup", { method: "POST" });
      setSecret(res.data.secret);
      setOtpauthUrl(res.data.otpauthUrl || "");
      setShow2FAModal(true);
    } catch (err) {
      addToast(err.message || "Could not initialize authenticator setup.", "error");
    }
  };

  const handleEnable2FA = async (e) => {
    e.preventDefault();
    try {
      await apiRequest("/auth/authenticator/enable", {
        method: "POST",
        body: JSON.stringify({ code: verifyCode.trim() }),
      });
      addToast("Two-Factor Authentication enabled successfully!", "success");
      setShow2FAModal(false);
      setVerifyCode("");
      const updated = { ...user, twoFactorEnabled: true };
      AuthStore.updateUser(updated);
      onUpdateUser(updated);
    } catch (err) {
      addToast(err.message || "Invalid authenticator code. Check app.", "error");
    }
  };

  const handleDisable2FA = async () => {
    const ok = await showConfirm({
      title: "Disable 2FA",
      message: "Disable two-factor authentication on your account?",
      confirmText: "Disable",
      danger: true,
    });
    if (!ok) return;
    try {
      await apiRequest("/auth/authenticator/disable", { method: "POST" });
      addToast("Two-Factor Authentication has been disabled.", "info");
      const updated = { ...user, twoFactorEnabled: false };
      AuthStore.updateUser(updated);
      onUpdateUser(updated);
    } catch (err) {
      addToast(err.message || "Could not disable 2FA.", "error");
    }
  };

  const qrImageUrl = otpauthUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(otpauthUrl)}`
    : "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Profile Overview Card */}
      <div className="panel">
        <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
          <div className="user-avatar" style={{ width: "80px", height: "80px", fontSize: "32px" }}>
            {user.profile_photo ? (
              <img src={user.profile_photo} alt={user.name} />
            ) : (
              (user.name || "S")[0].toUpperCase()
            )}
          </div>
          <div>
            <h2>{user.name}</h2>
            <div style={{ color: "var(--slate-500)", fontSize: "14px", marginTop: "4px" }}>
              Student ID: <code>{user.student_id}</code> | Username: <code>@{user.username}</code>
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "8px", flexWrap: "wrap" }}>
              <span className="badge badge-success">Active Student</span>
              <span className={`badge badge-${user.twoFactorEnabled ? "success" : "danger"}`}>
                2FA: {user.twoFactorEnabled ? "Protected" : "Disabled"}
              </span>
            </div>
          </div>
        </div>

        <div className="form-grid" style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--slate-200)" }}>
          <div><b>Course:</b> {user.course || "General"}</div>
          <div><b>Batch:</b> {user.batch || "—"}</div>
          <div><b>Portal Institutional Email:</b> {user.portal_email || `${user.student_id?.toLowerCase()}@eduportal.edu`}</div>
          <div><b>Joining Date:</b> {user.joining_date || "—"}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "24px" }}>
        {/* Contact Information Form */}
        <div className="panel">
          <h2 style={{ fontSize: "18px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}><IconPhone size={18} style={{ color: "var(--primary)" }} /><span>Contact Information</span></h2>
          <form onSubmit={handleContactSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div className="form-group">
              <label>Personal Email</label>
              <input
                type="email"
                required
                className="form-control"
                value={personalEmail}
                onChange={(e) => setPersonalEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                className="form-control"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: "8px" }} disabled={savingContact}>
              {savingContact ? "Saving..." : "Update Contact Info"}
            </button>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="panel">
          <h2 style={{ fontSize: "18px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}><IconLock size={18} style={{ color: "var(--primary)" }} /><span>Change Password</span></h2>
          <form onSubmit={handlePasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                required
                className="form-control"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                required
                className="form-control"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                required
                className="form-control"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: "8px" }} disabled={savingPassword}>
              {savingPassword ? "Updating..." : "Change Password"}
            </button>
          </form>
        </div>
      </div>

      {/* 2FA Security Panel */}
      <div className="panel">
        <div className="panel-header">
          <div>
            <h2 style={{ fontSize: "18px", display: "flex", alignItems: "center", gap: "8px" }}><IconShieldCheck size={18} style={{ color: "var(--primary)" }} /><span>Two-Factor Authentication (2FA / TOTP)</span></h2>
            <p style={{ fontSize: "13px", color: "var(--slate-500)", marginTop: "4px" }}>
              Secure your account using standard TOTP apps like Google Authenticator or Microsoft Authenticator.
            </p>
          </div>
          <div>
            {user.twoFactorEnabled ? (
              <button className="btn btn-danger btn-sm" onClick={handleDisable2FA}>
                Disable 2FA
              </button>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={handleStart2FA}>
                Enable 2FA Protection
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2FA Setup Modal */}
      <Modal
        isOpen={show2FAModal}
        onClose={() => setShow2FAModal(false)}
        title="Setup Authenticator App"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShow2FAModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleEnable2FA}>Verify & Enable</button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "16px" }}>
          <p style={{ fontSize: "14px", color: "var(--slate-600)" }}>
            Scan the QR code with Google Authenticator, Authy, or Microsoft Authenticator.
          </p>

          {qrImageUrl && (
            <div style={{ background: "#ffffff", padding: "12px", border: "1px solid var(--slate-200)", borderRadius: "12px" }}>
              <img src={qrImageUrl} alt="2FA QR Code" width={180} height={180} />
            </div>
          )}

          <div style={{ fontSize: "13px", color: "var(--slate-600)" }}>
            Or manually enter secret key:
            <div style={{ marginTop: "4px" }}>
              <code style={{ fontSize: "15px", letterSpacing: "2px", fontWeight: 700, padding: "6px 12px", background: "var(--slate-100)", borderRadius: "6px" }}>
                {secret}
              </code>
            </div>
          </div>

          <div className="form-group" style={{ width: "100%", maxWidth: "320px", marginTop: "12px" }}>
            <label>Enter 6-Digit Code</label>
            <input
              type="text"
              maxLength={6}
              className="form-control"
              style={{ textAlign: "center", fontSize: "20px", letterSpacing: "6px" }}
              placeholder="000000"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
