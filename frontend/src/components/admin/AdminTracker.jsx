import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api";
import { IconActivity } from "../common/Icons";

export function AdminTracker({ addToast }) {
  const [activities, setActivities] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const res = await apiRequest("/tracker/");
      setActivities(res.data.results || res.data || []);
    } catch (err) {
      addToast(err.message || "Failed to load student activity records.", "error");
    } finally {
      setLoading(false);
    }
  };

  const filtered = activities.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.student_name?.toLowerCase().includes(q) ||
      a.student_code?.toLowerCase().includes(q) ||
      a.activity_type?.toLowerCase().includes(q) ||
      a.activity_reference?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}><IconActivity size={18} style={{ color: "var(--primary)" }} /><span>Student Activity Audit Log ({filtered.length})</span></h2>
        <button className="btn btn-secondary btn-sm" onClick={loadActivities}>
          Refresh Audit
        </button>
      </div>

      <div className="filter-bar">
        <div className="search-input-group">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            className="form-control"
            placeholder="Search activities by student name, code, type or action..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Activity Type</th>
              <th>Details & Reference</th>
              <th>Recorded Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ textAlign: "center", padding: "32px" }}>Loading audit records...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: "center", padding: "32px", color: "var(--slate-500)" }}>No activity logs recorded.</td></tr>
            ) : (
              filtered.map((act) => (
                <tr key={act.id}>
                  <td>
                    <b>{act.student_name || `Student #${act.student}`}</b>
                    {act.student_code && (
                      <div style={{ fontSize: "12px", color: "var(--slate-500)" }}>{act.student_code}</div>
                    )}
                  </td>
                  <td>
                    <span className={`badge badge-${act.activity_type === "login" ? "success" : act.activity_type === "download" ? "info" : "primary"}`}>
                      {act.activity_type}
                    </span>
                  </td>
                  <td>{act.activity_reference || "—"}</td>
                  <td style={{ fontSize: "12px", color: "var(--slate-500)" }}>
                    {new Date(act.activity_time).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
