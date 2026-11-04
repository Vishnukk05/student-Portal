import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api";
import { IconActivity, IconRefresh } from "../common/Icons";

export function StudentActivity({ addToast }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const res = await apiRequest("/tracker/my-activity");
      setActivities(res.data.results || res.data || []);
    } catch (err) {
      addToast(err.message || "Failed to load activity logs.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <IconActivity size={18} style={{ color: "var(--primary)" }} />
          <span>My Academic & Portal Activity Log ({activities.length})</span>
        </h2>
        <button
          className="btn btn-secondary btn-sm"
          onClick={loadActivities}
          disabled={loading}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <IconRefresh size={14} className={loading ? "spin" : ""} />
          <span>Refresh Log</span>
        </button>
      </div>

      <p style={{ fontSize: "13px", color: "var(--slate-500)", marginBottom: "16px" }}>
        Every time you log in, access course materials, or submit a support inquiry, a record is kept here for your verification.
      </p>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Activity Type</th>
              <th>Reference / Details</th>
              <th>Recorded Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} style={{ textAlign: "center", padding: "32px" }}>Loading activity history...</td></tr>
            ) : activities.length === 0 ? (
              <tr><td colSpan={3} style={{ textAlign: "center", padding: "32px", color: "var(--slate-500)" }}>No activity records recorded yet.</td></tr>
            ) : (
              activities.map((act) => (
                <tr key={act.id}>
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
