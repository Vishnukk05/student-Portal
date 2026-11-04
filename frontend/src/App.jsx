import { showConfirm, ConfirmModal } from "./components/ConfirmModal";
import React, { useEffect, useState } from "react";
import { AuthStore, apiRequest } from "./api";
import { ToastContainer } from "./components/Toast";
import { Login } from "./components/Login";
import { Sidebar } from "./components/Sidebar";
import { Modal } from "./components/Modal";

// Admin & Staff views
import { AdminOverview } from "./components/admin/AdminOverview";
import { AdminStudents } from "./components/admin/AdminStudents";
import { AdminStaff } from "./components/admin/AdminStaff";
import { AdminTimetable } from "./components/admin/AdminTimetable";
import { AdminAssignments } from "./components/admin/AdminAssignments";
import { AdminLeaves } from "./components/admin/AdminLeaves";
import { AdminTickets } from "./components/admin/AdminTickets";
import { AdminAnnouncements } from "./components/admin/AdminAnnouncements";
import { AdminContent } from "./components/admin/AdminContent";
import { AdminMessages } from "./components/admin/AdminMessages";
import { AdminEmailLogs } from "./components/admin/AdminEmailLogs";
import { AdminTracker } from "./components/admin/AdminTracker";
import { AdminDatabase } from "./components/admin/AdminDatabase";

// Student views
import { StudentHome } from "./components/student/StudentHome";
import { StudentTimetable } from "./components/student/StudentTimetable";
import { StudentAssignments } from "./components/student/StudentAssignments";
import { StudentLeaves } from "./components/student/StudentLeaves";
import { StudentAnnouncements } from "./components/student/StudentAnnouncements";
import { StudentContent } from "./components/student/StudentContent";
import { StudentTickets } from "./components/student/StudentTickets";
import { StudentInbox } from "./components/student/StudentInbox";
import { StudentMessages } from "./components/student/StudentMessages";
import { StudentActivity } from "./components/student/StudentActivity";
import { StudentProfile } from "./components/student/StudentProfile";

// Common
import { CalendarWidget } from "./components/common/CalendarWidget";
import { ThemeToggle } from "./components/common/ThemeToggle";

export function App() {
  const [user, setUser] = useState(() => AuthStore.getUser());
  const [activeTab, setActiveTab] = useState(() => {
    const u = AuthStore.getUser();
    return u?.role === "student" ? "home" : "overview";
  });
  const [toasts, setToasts] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({ tickets: 0, announcements: 0, inbox: 0, messages: 0 });
  const [sidebarHidden, setSidebarHidden] = useState(false);

  // Forced First-Time Password Change for Students
  const [firstTimeCurrentPassword, setFirstTimeCurrentPassword] = useState("");
  const [firstTimeNewPassword, setFirstTimeNewPassword] = useState("");
  const [firstTimeConfirmPassword, setFirstTimeConfirmPassword] = useState("");
  const [firstTimeError, setFirstTimeError] = useState("");
  const [firstTimeSaving, setFirstTimeSaving] = useState(false);
  const [showFirstTimePw, setShowFirstTimePw] = useState(false);

  const handleFirstTimePasswordSubmit = async (e) => {
    e.preventDefault();
    setFirstTimeError("");
    if (firstTimeNewPassword !== firstTimeConfirmPassword) {
      setFirstTimeError("New passwords do not match.");
      return;
    }
    if (firstTimeNewPassword.length < 6) {
      setFirstTimeError("Password must be at least 6 characters long.");
      return;
    }
    setFirstTimeSaving(true);
    try {
      const res = await apiRequest("/auth/change-password/", {
        method: "POST",
        body: JSON.stringify({
          newPassword: firstTimeNewPassword,
        }),
      });
      addToast("Permanent password set successfully! Welcome to EduPortal.", "success");
      const updatedUser = res.data.user || { ...user, mustChangePassword: false };
      AuthStore.updateUser(updatedUser);
      setUser(updatedUser);
      setFirstTimeCurrentPassword("");
      setFirstTimeNewPassword("");
      setFirstTimeConfirmPassword("");
    } catch (err) {
      setFirstTimeError(err.message || "Could not change password. Please verify your current temporary password.");
    } finally {
      setFirstTimeSaving(false);
    }
  };

  // 2FA Management State
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFactorData, setTwoFactorData] = useState({ secret: "", otpauthUrl: "" });
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);

  const addToast = (message, type = "info") => {
    if (!message) return;
    const msgStr = typeof message === "string" ? message : (message?.message || "");
    const lower = msgStr.toLowerCase();
    if (
      lower.includes("invalid or expired") ||
      lower.includes("authentication") ||
      lower.includes("token") ||
      lower.includes("credentials") ||
      lower.includes("unauthorized") ||
      lower.includes("session has been revoked") ||
      lower.includes("not authenticated") ||
      lower.includes("status 401")
    ) {
      AuthStore.clearSession();
      setUser(null);
      return;
    }
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message: msgStr, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const lastBadgeFetchRef = React.useRef(0);

  useEffect(() => {
    if (window.location.pathname.includes('activate')) {
      window.history.replaceState({}, document.title, '/');
    }
  }, []);

  useEffect(() => {
    const handleAuthExpired = () => {
      setUser(null);
    };
    window.addEventListener("eduportal:auth_expired", handleAuthExpired);
    return () => window.removeEventListener("eduportal:auth_expired", handleAuthExpired);
  }, []);

  useEffect(() => {
    if (user) {
      apiRequest("/auth/me/").catch((err) => {
        if (err.isAuthError || err.status === 401) {
          AuthStore.clearSession();
          setUser(null);
        }
      });
    }
  }, []);

  useEffect(() => {
    if (user) {
      const now = Date.now();
      if (now - lastBadgeFetchRef.current > 15000) {
        lastBadgeFetchRef.current = now;
        loadBadgeCounts();
      }
    }
  }, [user, activeTab]);

  const loadBadgeCounts = async () => {
    try {
      if (user.role === "student") {
        const [annRes, inboxRes, msgRes] = await Promise.all([
          apiRequest("/announcements/"),
          apiRequest("/messages/inbox/"),
          apiRequest("/messages/unread-counts/"),
        ]);
        const annList = annRes.data.results || annRes.data || [];
        const unreadAnn = annList.filter((a) => !a.is_read).length;
        const mails = inboxRes.data?.messages || [];
        const unreadMails = mails.filter((m) => !m.is_read).length;
        const unreadChat = msgRes.data?.total || 0;
        setUnreadCounts({ announcements: unreadAnn, inbox: unreadMails, messages: unreadChat });
      } else {
        const [tktRes, msgRes] = await Promise.all([
          apiRequest("/tickets/"),
          apiRequest("/messages/unread-counts/"),
        ]);
        const tkts = tktRes.data.results || tktRes.data || [];
        const openTkts = tkts.filter((t) => t.status !== "Completed").length;
        const unreadMsgs = msgRes.data?.total || 0;
        setUnreadCounts({ tickets: openTkts, messages: unreadMsgs });
      }
    } catch {
      // badge fetch silent fallback
    }
  };

  const handleOpen2FAModal = async () => {
    if (user?.twoFactorEnabled) {
      setShow2FAModal(true);
      return;
    }
    setTwoFactorLoading(true);
    try {
      const res = await apiRequest("/auth/authenticator/setup", { method: "POST" });
      setTwoFactorData({
        secret: res.data.secret || "",
        otpauthUrl: res.data.otpauthUrl || "",
      });
      setTwoFactorCode("");
      setShow2FAModal(true);
    } catch (err) {
      addToast(err.message || "Failed to initialize 2FA setup.", "error");
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleEnable2FA = async (e) => {
    if (e) e.preventDefault();
    if (!twoFactorCode.trim()) {
      addToast("Please enter the 6-digit authenticator code.", "error");
      return;
    }
    setTwoFactorLoading(true);
    try {
      await apiRequest("/auth/authenticator/verify", {
        method: "POST",
        body: JSON.stringify({ code: twoFactorCode.trim() }),
      });
      const updated = { ...user, twoFactorEnabled: true };
      setUser(updated);
      AuthStore.updateUser(updated);
      addToast("Two-Factor Authentication enabled successfully!", "success");
      setShow2FAModal(false);
      setTwoFactorCode("");
    } catch (err) {
      addToast(err.message || "Invalid authenticator code. Check your app and try again.", "error");
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    const ok = await showConfirm({
      title: "Disable 2FA",
      message: "Disable Two-Factor Authentication on your account?",
      confirmText: "Disable 2FA",
      danger: true,
    });
    if (!ok) return;
    setTwoFactorLoading(true);
    try {
      await apiRequest("/auth/authenticator/disable", { method: "POST" });
      const updated = { ...user, twoFactorEnabled: false };
      setUser(updated);
      AuthStore.updateUser(updated);
      addToast("Two-Factor Authentication has been disabled.", "info");
      setShow2FAModal(false);
    } catch (err) {
      addToast(err.message || "Failed to disable 2FA.", "error");
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    setActiveTab(loggedInUser.role === "student" ? "home" : "overview");
  };

  const handleLogout = async () => {
    try {
      if (AuthStore.getToken()) {
        await apiRequest("/auth/logout/", { method: "POST" });
      }
    } catch {
      // Local logout still proceeds if the network is unavailable.
    }
    AuthStore.clearSession();
    setUser(null);
    addToast("Logged out successfully.", "info");
  };

  if (!user) {
    return (
      <>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        <ConfirmModal />
        <Login onLoginSuccess={handleLoginSuccess} addToast={addToast} />
      </>
    );
  }

  const isAdmin = user.role === "admin" || user.role === "staff";

  const renderContent = () => {
    if (isAdmin) {
      switch (activeTab) {
        case "overview": return <AdminOverview user={user} setActiveTab={setActiveTab} addToast={addToast} />;
        case "staff": return <AdminStaff addToast={addToast} />;
        case "students": return <AdminStudents addToast={addToast} />;
        case "timetables": return <AdminTimetable addToast={addToast} />;
        case "assignments": return <AdminAssignments addToast={addToast} />;
        case "leaves": return <AdminLeaves addToast={addToast} />;
        case "calendar": return <CalendarWidget user={user} addToast={addToast} />;
        case "tickets": return <AdminTickets addToast={addToast} />;
        case "announcements": return <AdminAnnouncements addToast={addToast} />;
        case "content": return <AdminContent addToast={addToast} />;
        case "messages": return <AdminMessages addToast={addToast} />;
        case "emails": return <AdminEmailLogs addToast={addToast} />;
        case "tracker": return <AdminTracker addToast={addToast} />;
        case "database": return <AdminDatabase addToast={addToast} />;
        default: return <AdminOverview user={user} setActiveTab={setActiveTab} addToast={addToast} />;
      }
    } else {
      switch (activeTab) {
        case "home": return <StudentHome user={user} setActiveTab={setActiveTab} addToast={addToast} />;
        case "timetable": return <StudentTimetable user={user} addToast={addToast} />;
        case "assignments": return <StudentAssignments user={user} addToast={addToast} />;
        case "leaves": return <StudentLeaves user={user} addToast={addToast} />;
        case "calendar": return <CalendarWidget user={user} addToast={addToast} />;
        case "announcements": return <StudentAnnouncements addToast={addToast} />;
        case "content": return <StudentContent addToast={addToast} />;
        case "tickets": return <StudentTickets addToast={addToast} />;
        case "inbox": return <StudentInbox addToast={addToast} />;
        case "messages": return <StudentMessages addToast={addToast} />;
        case "activity": return <StudentActivity addToast={addToast} />;
        case "profile": return <StudentProfile user={user} onUpdateUser={setUser} addToast={addToast} />;
        default: return <StudentHome user={user} setActiveTab={setActiveTab} addToast={addToast} />;
      }
    }
  };

  const getPageHeaderInfo = () => {
    const titles = {
      overview: ["Executive Overview", "System analytics, metrics and live student activities."],
      staff: ["Faculty & Staff Management", "Manage teachers, faculty members, and assigned teaching subjects."],
      students: ["Student Directory", "Manage registered student accounts, enrollment, and credentials."],
      timetables: ["Course Timetables", "Upload and maintain academic class schedules and routine routines."],
      timetable: ["Academic Routine & Timetable", "View daily lectures, practical laboratory timings, and venue details."],
      assignments: ["Course Assignments & Grading", "Publish tasks, download question files, and evaluate student work online."],
      leaves: ["Leave Requests & Approvals", "Review and manage student leave applications with faculty remarks."],
      calendar: ["Academic Calendar & Live Events", "Interactive campus schedule with direct meeting join links."],
      tickets: ["Support Desk", "Track and resolve academic and technical inquiries."],
      announcements: ["Campus Announcements", "Broadcast announcements and track student read receipts."],
      content: ["Academic E-Content", "Distribute course syllabus materials, notes, and media."],
      messages: ["Student Communications", "Direct messaging and inquiry resolution."],
      emails: ["Outgoing Email Logs", "Audit trail of simulated credential and reset emails."],
      tracker: ["Activity Audit Tracker", "Chronological audit of student logins and operations."],
      database: ["Neon PostgreSQL Database & Cloud Hub", "Monitor serverless connection health, live row counts, and schema telemetry."],
      home: ["Student Portal Dashboard", "Personal academic overview, course materials, and updates."],
      inbox: ["Institutional Inbox", "Official announcements and ticket updates."],
      activity: ["My Activity Log", "Personal record of your logins, downloads, and actions."],
      profile: ["Profile & Security", "Manage your personal contact info, password, and 2FA protection."],
    };
    return titles[activeTab] || ["EduPortal", "Student Management System"];
  };

  const [headerTitle, headerSub] = getPageHeaderInfo();

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <ConfirmModal />
      <div className={`dashboard-layout ${sidebarHidden ? "sidebar-hidden" : ""}`}>
        <Sidebar
          user={user}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
        />
        <main className="main-wrapper">
          <header className="topbar">
            <div className="topbar-left-cluster">
              <button
                type="button"
                className="sidebar-toggle-btn"
                onClick={() => setSidebarHidden(!sidebarHidden)}
                title="Toggle Sidebar"
              >
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
              </button>
              <div className="topbar-title">
                <h2>{headerTitle}</h2>
                <p>{headerSub}</p>
              </div>
            </div>
            <div className="topbar-actions" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <ThemeToggle />

              {/* Only Super Admin can view API Docs */}
              {user.role === "admin" && (
                <a
                  href="/apidocument"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                  title="View Backend API Documentation (Admin Only)"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                  </svg>
                  <span>API Docs</span>
                </a>
              )}

              {isAdmin ? (
                <button
                  type="button"
                  className={`btn btn-sm ${user.twoFactorEnabled ? "btn-secondary" : "btn-primary"}`}
                  onClick={handleOpen2FAModal}
                  disabled={twoFactorLoading}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                  title={user.twoFactorEnabled ? "Two-factor authentication is active. Click to manage." : "Set up two-factor authentication"}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  <span>{user.twoFactorEnabled ? "2FA Active" : "Set Up 2FA"}</span>
                </button>
              ) : (
                user.twoFactorEnabled && (
                  <span className="badge badge-primary" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                    <span>2FA Protected</span>
                  </span>
                )
              )}
            </div>
          </header>

          <div className="content-container">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Admin / Staff 2FA Modal */}
      {show2FAModal && (
        user.twoFactorEnabled ? (
          <Modal
            isOpen={show2FAModal}
            onClose={() => setShow2FAModal(false)}
            title="Two-Factor Authentication"
            footer={
              <>
                <button type="button" className="btn btn-secondary" onClick={() => setShow2FAModal(false)}>
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDisable2FA}
                  disabled={twoFactorLoading}
                >
                  {twoFactorLoading ? "Disabling..." : "Disable 2FA"}
                </button>
              </>
            }
          >
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <div style={{ display: "inline-flex", padding: "16px", borderRadius: "50%", background: "var(--primary-light)", color: "var(--primary)", marginBottom: "12px" }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <h3 style={{ fontSize: "17px", fontWeight: 700, marginBottom: "8px", color: "var(--slate-800)" }}>
                Two-Factor Authentication is Active
              </h3>
              <p style={{ fontSize: "14px", color: "var(--slate-600)", lineHeight: 1.5, maxWidth: "380px", margin: "0 auto" }}>
                Your account is securely protected. A 6-digit TOTP code from your authenticator app is required every time you sign in.
              </p>
            </div>
          </Modal>
        ) : (
          <Modal
            isOpen={show2FAModal}
            onClose={() => setShow2FAModal(false)}
            title="Set Up Authenticator (2FA)"
            footer={
              <>
                <button type="button" className="btn btn-secondary" onClick={() => setShow2FAModal(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleEnable2FA}
                  disabled={twoFactorLoading}
                >
                  {twoFactorLoading ? "Verifying..." : "Verify & Enable"}
                </button>
              </>
            }
          >
            <form onSubmit={handleEnable2FA} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "16px" }}>
              <p style={{ fontSize: "14px", color: "var(--slate-600)", margin: 0 }}>
                Scan this QR code with Google Authenticator, Microsoft Authenticator, or Authy:
              </p>

              {twoFactorData.otpauthUrl && (
                <div style={{ background: "#ffffff", padding: "12px", border: "1px solid var(--slate-200)", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(twoFactorData.otpauthUrl)}`}
                    alt="2FA QR Code"
                    width={180}
                    height={180}
                    style={{ display: "block" }}
                  />
                </div>
              )}

              {twoFactorData.secret && (
                <div style={{ fontSize: "13px", color: "var(--slate-600)" }}>
                  Or enter manual key:
                  <div style={{ marginTop: "6px" }}>
                    <code style={{ fontSize: "15px", letterSpacing: "2px", fontWeight: 700, padding: "6px 14px", background: "var(--slate-100)", borderRadius: "6px", display: "inline-block" }}>
                      {twoFactorData.secret}
                    </code>
                  </div>
                </div>
              )}

              <div className="form-group" style={{ width: "100%", maxWidth: "320px", marginTop: "8px", marginBottom: "0" }}>
                <label style={{ fontWeight: 600, fontSize: "13px", marginBottom: "6px" }}>Enter 6-Digit Authenticator Code</label>
                <input
                  type="text"
                  maxLength={6}
                  autoFocus
                  className="form-control"
                  style={{ textAlign: "center", fontSize: "22px", letterSpacing: "6px", fontWeight: 700 }}
                  placeholder="000000"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ""))}
                />
              </div>
            </form>
          </Modal>
        )
      )}

      {/* Forced First-Time Password Change Modal for Students */}
      {user?.role === "student" && user?.mustChangePassword && (
        <div
          className="modal-overlay active"
          style={{
            zIndex: 999999,
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.8)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            className="modal-box"
            style={{
              maxWidth: "460px",
              width: "100%",
              borderRadius: "16px",
              background: "var(--bg-card)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6)",
              overflow: "hidden",
              border: "1px solid var(--border-color)",
            }}
          >
            <div style={{ padding: "24px 24px 16px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "var(--primary-light)", color: "var(--primary)", display: "grid", placeItems: "center" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--text-main)" }}>Set Your Permanent Password</h3>
                <p style={{ margin: "2px 0 0", fontSize: "13px", color: "var(--text-muted)" }}>First-time sign in with temporary password</p>
              </div>
            </div>

            <form onSubmit={handleFirstTimePasswordSubmit} style={{ padding: "20px 24px" }}>
              <p style={{ fontSize: "13.5px", color: "var(--text-muted)", lineHeight: 1.5, margin: "0 0 16px" }}>
                Welcome, <strong>{user.name}</strong>! You signed in using a temporary password. Please set a new permanent password to secure your account.
              </p>

              {firstTimeError && (
                <div style={{ padding: "10px 14px", borderRadius: "8px", background: "var(--danger-bg)", color: "var(--danger)", fontSize: "13px", marginBottom: "16px", border: "1px solid #fecaca" }}>
                  {firstTimeError}
                </div>
              )}

              <div className="form-group" style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>New Password *</label>
                <input
                  type={showFirstTimePw ? "text" : "password"}
                  required
                  className="form-control"
                  placeholder="Enter new password (min. 6 characters)"
                  value={firstTimeNewPassword}
                  onChange={(e) => setFirstTimeNewPassword(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>Confirm New Password *</label>
                <input
                  type={showFirstTimePw ? "text" : "password"}
                  required
                  className="form-control"
                  placeholder="Re-enter new password"
                  value={firstTimeConfirmPassword}
                  onChange={(e) => setFirstTimeConfirmPassword(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--text-muted)", cursor: "pointer" }}>
                  <input type="checkbox" checked={showFirstTimePw} onChange={(e) => setShowFirstTimePw(e.target.checked)} />
                  Show passwords
                </label>
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "13px", cursor: "pointer", textDecoration: "underline" }}
                >
                  Log out
                </button>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={firstTimeSaving}
                style={{ width: "100%", padding: "12px", fontSize: "15px", fontWeight: 600 }}
              >
                {firstTimeSaving ? "Saving Password..." : "Set Password & Continue"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
