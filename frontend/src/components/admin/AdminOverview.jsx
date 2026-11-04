import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api";
import { AnnouncementsCarousel } from "../common/AnnouncementsCarousel";
import {
  IconGraduationCap,
  IconUserCheck,
  IconLifeBuoy,
  IconMegaphone,
  IconBookOpen,
  IconMessageSquare,
  IconActivity,
  IconRefresh,
  IconUsers,
  IconShieldCheck,
} from "../common/Icons";

export function AdminOverview({ user, setActiveTab, addToast }) {
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    announcements: 0,
    content: 0,
    openTickets: 0,
    unreadMessages: 0,
  });
  const [activities, setActivities] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, annRes] = await Promise.all([
        apiRequest("/tracker/dashboard-stats"),
        apiRequest("/announcements/"),
      ]);

      if (statsRes.data?.success) {
        setStats(statsRes.data.stats || {});
        setActivities(statsRes.data.recentActivities || []);
      }
      const annList = annRes.data?.results || annRes.data || [];
      setAnnouncements(annList);
    } catch (err) {
      if (!err.silent) {
        addToast(err.message || "Failed to load dashboard statistics.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: "Total Students", value: stats.totalStudents ?? 0, sub: "Registered accounts", icon: <IconGraduationCap size={22} />, tab: "students" },
    { title: "Active Students", value: stats.activeStudents ?? 0, sub: "Currently active", icon: <IconUserCheck size={22} />, tab: "students" },
    { title: "Open Support Tickets", value: stats.openTickets ?? 0, sub: "Requires review", icon: <IconLifeBuoy size={22} />, tab: "tickets" },
    { title: "Announcements", value: stats.announcements ?? 0, sub: "Campus broadcast", icon: <IconMegaphone size={22} />, tab: "announcements" },
    { title: "Academic Materials", value: stats.content ?? 0, sub: "Uploaded resources", icon: <IconBookOpen size={22} />, tab: "content" },
    { title: "Unread Messages", value: stats.unreadMessages ?? 0, sub: "Student inquiries", icon: <IconMessageSquare size={22} />, tab: "messages" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 1. Executive Admin Command Header */}
      <div className="admin-executive-header">
        <div className="admin-header-left">
          <h1 className="admin-header-title">Welcome back, {user?.name || "Super Admin"}</h1>
          <p className="admin-header-subtitle">
            Central institutional console. Audit admissions, faculty staff, course vault files, and campus inquiries.
          </p>
        </div>
        <div className="admin-header-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setActiveTab("students")}
            style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
          >
            <IconUsers size={16} />
            <span>Student Directory</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setActiveTab("announcements")}
            style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
          >
            <IconMegaphone size={16} />
            <span>Post Notice</span>
          </button>
        </div>
      </div>

      {/* 2. Symmetrical 6-Card Stats Grid */}
      <div className="stats-grid">
        {statCards.map((c, i) => (
          <div
            key={i}
            className="modern-stat-card"
            onClick={() => setActiveTab(c.tab)}
          >
            <div className="modern-stat-icon-wrapper">
              {c.icon}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--slate-900)", lineHeight: 1.1 }}>
                {c.value}
              </div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--slate-700)", marginTop: "2px" }}>
                {c.title}
              </div>
              <div style={{ fontSize: "11px", color: "var(--slate-500)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {c.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Official Announcements Bulletin */}
      <AnnouncementsCarousel
        announcements={announcements}
        isAdmin={true}
        onViewAll={() => setActiveTab("announcements")}
        onPost={() => setActiveTab("announcements")}
      />

      {/* 4. Recent Campus Activity Stream */}
      <div className="panel" style={{ padding: "22px 26px" }}>
        <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "var(--slate-900)", display: "flex", alignItems: "center", gap: "8px" }}>
              <IconActivity size={18} style={{ color: "var(--primary)" }} />
              <span>Real-Time Campus Activity Audit</span>
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: "12.5px", color: "var(--slate-500)" }}>
              Live audit trail of student authentication events and portal interactions
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={loadDashboardData}
            disabled={loading}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <IconRefresh size={14} className={loading ? "spin" : ""} />
            <span>Refresh Activity</span>
          </button>
        </div>
        {activities.length === 0 ? (
          <div style={{ textAlign: "center", padding: "36px 16px", color: "var(--slate-500)" }}>
            <div style={{ display: "inline-flex", padding: "14px", borderRadius: "50%", background: "var(--slate-100)", color: "var(--slate-400)", marginBottom: "8px" }}>
              <IconActivity size={28} />
            </div>
            <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--slate-700)" }}>
              No Recent Activity Yet
            </div>
            <p style={{ fontSize: "12.5px", color: "var(--slate-500)", maxWidth: "380px", margin: "4px auto 0" }}>
              Student sign-ins, ticket submissions, and file downloads will be streamed here in real time.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {activities.map((a, i) => (
              <div
                key={a.id || i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  background: "var(--bg-main)",
                  borderRadius: "10px",
                  border: "1px solid var(--border-color)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--primary-light)", color: "var(--primary)", display: "grid", placeItems: "center" }}>
                    <IconActivity size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--text-main)" }}>
                      {a.student_name || "Student"} ({a.student_id})
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      {a.activity_type} {a.activity_reference ? `— ${a.activity_reference}` : ""}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: "11.5px", color: "var(--slate-400)" }}>
                  {new Date(a.activity_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
