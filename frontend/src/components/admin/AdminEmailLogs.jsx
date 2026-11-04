import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api";
import { IconMail, IconRefresh, IconSearch, IconCheckCircle, IconAlertCircle } from "../common/Icons";
import { Modal } from "../Modal";

export function AdminEmailLogs({ addToast }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await apiRequest("/students/emails/logs");
      setLogs(res.data.logs || []);
    } catch (err) {
      if (addToast) addToast(err.message || "Failed to load email dispatch logs.", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      log.recipient_name?.toLowerCase().includes(q) ||
      log.recipient_email?.toLowerCase().includes(q) ||
      log.subject?.toLowerCase().includes(q) ||
      log.temp_password_hint?.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (statusFilter === "all") return true;
    if (statusFilter === "sent") return log.status?.toLowerCase().includes("sent");
    if (statusFilter === "simulated") return log.status?.toLowerCase().includes("simulated");
    if (statusFilter === "error") return log.status?.toLowerCase().includes("error");
    return true;
  });

  const totalCount = logs.length;
  const sentCount = logs.filter((l) => l.status?.toLowerCase().includes("sent")).length;
  const personalCount = logs.filter((l) => l.recipient_name?.includes("Personal Email") || !l.recipient_email?.includes("@eduportal")).length;
  const collegeCount = logs.filter((l) => l.recipient_name?.includes("College Portal Email") || l.recipient_email?.includes("@eduportal")).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Top Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
        <div className="panel" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: "14px", margin: 0 }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "rgba(37, 99, 235, 0.12)", color: "var(--primary)", display: "grid", placeItems: "center" }}>
            <IconMail size={20} />
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "var(--slate-500)", fontWeight: 600 }}>TOTAL DISPATCHED</div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-main)" }}>{totalCount}</div>
          </div>
        </div>

        <div className="panel" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: "14px", margin: 0 }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.12)", color: "var(--success)", display: "grid", placeItems: "center" }}>
            <IconCheckCircle size={20} />
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "var(--slate-500)", fontWeight: 600 }}>LIVE SENT (SMTP)</div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-main)" }}>{sentCount}</div>
          </div>
        </div>

        <div className="panel" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: "14px", margin: 0 }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "rgba(99, 102, 241, 0.12)", color: "#6366f1", display: "grid", placeItems: "center" }}>
            <IconMail size={20} />
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "var(--slate-500)", fontWeight: 600 }}>PERSONAL INBOXES</div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-main)" }}>{personalCount}</div>
          </div>
        </div>

        <div className="panel" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: "14px", margin: 0 }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "rgba(14, 165, 233, 0.12)", color: "#0ea5e9", display: "grid", placeItems: "center" }}>
            <IconMail size={20} />
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "var(--slate-500)", fontWeight: 600 }}>COLLEGE INBOXES</div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-main)" }}>{collegeCount}</div>
          </div>
        </div>
      </div>

      {/* Main Table Panel */}
      <div className="panel" style={{ margin: 0, padding: "20px 24px" }}>
        <div className="panel-header" style={{ marginBottom: "16px", paddingBottom: "14px" }}>
          <div>
            <h2 style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, fontSize: "17px" }}>
              <IconMail size={20} style={{ color: "var(--primary)" }} />
              <span>Email Dispatch Monitor & Archive ({filteredLogs.length})</span>
            </h2>
            <p style={{ fontSize: "12.5px", color: "var(--slate-500)", margin: "4px 0 0" }}>
              All campus announcements, event notifications, support ticket alerts, and credential dispatches sent to both personal and college student emails.
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={loadLogs} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <IconRefresh size={14} />
            <span>Refresh Dispatch</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "18px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1 1 280px" }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search by student name, email, or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: "34px", height: "38px" }}
            />
            <span style={{ position: "absolute", left: "11px", top: "11px", color: "var(--slate-400)" }}>
              <IconSearch size={16} />
            </span>
          </div>

          <div style={{ display: "flex", gap: "6px" }}>
            {[
              { id: "all", label: "All Logs" },
              { id: "sent", label: "Sent (SMTP)" },
              { id: "simulated", label: "Simulated" },
              { id: "error", label: "Errors" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`btn btn-sm ${statusFilter === tab.id ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setStatusFilter(tab.id)}
                style={{ fontSize: "12px", padding: "5px 12px" }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dispatch Table */}
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Recipient & Account</th>
                <th>Subject & Category</th>
                <th>Dispatched To</th>
                <th>Status</th>
                <th>Dispatch Time</th>
                <th style={{ textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "36px", color: "var(--slate-400)" }}>
                    Loading email dispatch records...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "36px", color: "var(--slate-400)" }}>
                    No matching email dispatch records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isPersonal = log.recipient_name?.includes("Personal Email") || (!log.recipient_email?.includes("@eduportal") && !log.recipient_name?.includes("College Portal"));
                  const isCollege = log.recipient_name?.includes("College Portal Email") || log.recipient_email?.includes("@eduportal");
                  const isSent = log.status?.toLowerCase().includes("sent");
                  const isError = log.status?.toLowerCase().includes("error");

                  return (
                    <tr key={log.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: "var(--text-main)", fontSize: "13.5px" }}>
                          {log.recipient_name?.replace(/ \((Personal Email|College Portal Email)\)/, "")}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--slate-500)" }}>
                          {log.recipient_email}
                        </div>
                      </td>

                      <td>
                        <b style={{ color: "var(--text-main)", fontSize: "13px" }}>{log.subject}</b>
                        {log.temp_password_hint && (
                          <div style={{ fontSize: "11px", color: "var(--primary)", marginTop: "2px" }}>
                            Trigger: <b>{log.temp_password_hint}</b>
                          </div>
                        )}
                      </td>

                      <td>
                        {isPersonal && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 8px", borderRadius: "6px", background: "rgba(99, 102, 241, 0.12)", color: "#6366f1", fontSize: "11px", fontWeight: 600 }}>
                            Personal Inbox
                          </span>
                        )}
                        {isCollege && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 8px", borderRadius: "6px", background: "rgba(14, 165, 233, 0.12)", color: "#0ea5e9", fontSize: "11px", fontWeight: 600 }}>
                            College Portal Email
                          </span>
                        )}
                        {!isPersonal && !isCollege && (
                          <span style={{ fontSize: "11px", color: "var(--slate-400)" }}>Direct Recipient</span>
                        )}
                      </td>

                      <td>
                        {isSent ? (
                          <span className="badge badge-success" style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px" }}>
                            <IconCheckCircle size={12} />
                            <span>Sent (SMTP)</span>
                          </span>
                        ) : isError ? (
                          <span className="badge badge-danger" style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px" }} title={log.status}>
                            <IconAlertCircle size={12} />
                            <span>Dispatch Error</span>
                          </span>
                        ) : (
                          <span className="badge badge-info" style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px" }}>
                            <span>Logged / Simulated</span>
                          </span>
                        )}
                      </td>

                      <td style={{ fontSize: "12px", color: "var(--slate-500)" }}>
                        {new Date(log.sent_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                      </td>

                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedLog(log)}
                          style={{ fontSize: "11.5px", padding: "4px 10px" }}
                        >
                          View Content
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Email Content Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={selectedLog?.subject || "Email Notification Preview"}
        footer={
          <button className="btn btn-primary" onClick={() => setSelectedLog(null)}>
            Close
          </button>
        }
      >
        {selectedLog && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ fontSize: "12.5px", background: "var(--bg-main)", padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "4px" }}>
              <div><b>To:</b> {selectedLog.recipient_name} &lt;{selectedLog.recipient_email}&gt;</div>
              <div><b>Dispatched At:</b> {new Date(selectedLog.sent_at).toLocaleString()}</div>
              <div><b>Delivery Status:</b> <span style={{ fontWeight: 600 }}>{selectedLog.status}</span></div>
              {selectedLog.temp_password_hint && (
                <div><b>Notification Trigger:</b> <code>{selectedLog.temp_password_hint}</code></div>
              )}
            </div>

            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--slate-500)", textTransform: "uppercase" }}>
              Message Body:
            </div>

            {selectedLog.body && (selectedLog.body.includes("<html") || selectedLog.body.includes("<p>") || selectedLog.body.includes("<div")) ? (
              <div
                style={{
                  background: "#ffffff",
                  color: "#0f172a",
                  padding: "20px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  maxHeight: "55vh",
                  overflowY: "auto",
                }}
                dangerouslySetInnerHTML={{ __html: selectedLog.body }}
              />
            ) : (
              <div
                style={{
                  background: "var(--bg-main)",
                  color: "var(--text-main)",
                  padding: "16px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  whiteSpace: "pre-wrap",
                  fontSize: "13.5px",
                  lineHeight: 1.6,
                  maxHeight: "55vh",
                  overflowY: "auto",
                }}
              >
                {selectedLog.body}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
