import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api";
import { IconMegaphone } from "../common/Icons";

export function StudentAnnouncements({ addToast }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await apiRequest("/announcements/");
      setAnnouncements(res.data.results || res.data || []);
    } catch (err) {
      addToast(err.message || "Failed to load announcements.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (ann) => {
    if (ann.is_read) return;
    try {
      await apiRequest(`/announcements/${ann.id}/read/`, { method: "POST" });
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === ann.id ? { ...a, is_read: true, read_count: (a.read_count || 0) + 1 } : a))
      );
    } catch {
      // Ignore
    }
  };

  const filtered = announcements.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return a.title?.toLowerCase().includes(q) || a.content?.toLowerCase().includes(q);
  });

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <IconMegaphone size={18} style={{ color: "var(--primary)" }} />
          <span>Campus Announcements & Notices ({filtered.length})</span>
        </h2>
      </div>

      <div className="filter-bar">
        <div className="search-input-group">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            className="form-control"
            placeholder="Search campus notices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign: "center", padding: "32px" }}>Loading announcements...</p>
      ) : filtered.length === 0 ? (
        <p style={{ textAlign: "center", padding: "32px", color: "var(--slate-500)" }}>No announcements found.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {filtered.map((ann) => (
            <div
              key={ann.id}
              onClick={() => handleMarkRead(ann)}
              style={{
                border: "1px solid var(--slate-200)",
                borderRadius: "var(--radius-md)",
                padding: "24px",
                background: ann.is_read ? "#ffffff" : "var(--primary-light)",
                boxShadow: "var(--shadow-sm)",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "8px" }}>
                <div>
                  <h3 style={{ fontSize: "18px", color: "var(--slate-900)" }}>{ann.title}</h3>
                  <div style={{ fontSize: "12px", color: "var(--slate-500)", marginTop: "3px" }}>
                    Published by <b>{ann.author_name || "Administration"}</b> • {new Date(ann.published_at).toLocaleString()}
                  </div>
                </div>
                <div>
                  {ann.is_read ? (
                    <span className="badge badge-success">Read</span>
                  ) : (
                    <span className="badge badge-primary">NEW</span>
                  )}
                </div>
              </div>
              <p style={{ fontSize: "14px", color: "var(--slate-700)", whiteSpace: "pre-wrap", lineHeight: 1.6, marginTop: "8px" }}>
                {ann.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
