import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api";
import { IconMail } from "../common/Icons";

export function StudentInbox({ addToast }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadInbox();
  }, []);

  const loadInbox = async () => {
    try {
      setLoading(true);
      const res = await apiRequest("/messages/inbox/");
      setMessages(res.data.messages || []);
    } catch (err) {
      addToast(err.message || "Failed to load portal inbox.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiRequest("/messages/inbox/all/read/", { method: "POST" });
      addToast("All inbox messages marked as read.", "success");
      loadInbox();
    } catch (err) {
      addToast(err.message || "Could not mark messages as read.", "error");
    }
  };

  const handleToggleExpand = async (mail) => {
    if (expandedId === mail.id) {
      setExpandedId(null);
    } else {
      setExpandedId(mail.id);
      if (!mail.is_read) {
        try {
          await apiRequest(`/messages/inbox/${mail.id}/read/`, { method: "POST" });
          setMessages((prev) =>
            prev.map((m) => (m.id === mail.id ? { ...m, is_read: true } : m))
          );
        } catch {
          // ignore
        }
      }
    }
  };

  const unreadCount = messages.filter((m) => !m.is_read).length;

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}><IconMail size={18} style={{ color: "var(--primary)" }} /><span>Unified Portal Inbox ({messages.length})</span></h2>
        {unreadCount > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={handleMarkAllRead}>
            Mark All ({unreadCount}) as Read
          </button>
        )}
      </div>

      <p style={{ fontSize: "13px", color: "var(--slate-500)", marginBottom: "16px" }}>
        Official administration notices, ticket resolution updates, and academic notifications.
      </p>

      {loading ? (
        <p style={{ textAlign: "center", padding: "32px" }}>Loading inbox...</p>
      ) : messages.length === 0 ? (
        <p style={{ textAlign: "center", padding: "32px", color: "var(--slate-500)" }}>
          Your inbox is completely empty.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {messages.map((mail) => {
            const isExpanded = expandedId === mail.id;
            return (
              <div
                key={mail.id}
                onClick={() => handleToggleExpand(mail)}
                style={{
                  border: "1px solid var(--slate-200)",
                  borderRadius: "var(--radius-sm)",
                  padding: "16px 20px",
                  background: mail.is_read ? "#ffffff" : "var(--primary-light)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {!mail.is_read && <span className="badge badge-primary">NEW</span>}
                    <b style={{ fontSize: "15px", color: "var(--slate-900)" }}>{mail.subject}</b>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--slate-500)" }}>
                    {new Date(mail.sent_at).toLocaleString()}
                  </div>
                </div>

                {isExpanded ? (
                  <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid var(--slate-200)", fontSize: "14px", color: "var(--slate-700)", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                    {mail.body}
                  </div>
                ) : (
                  <p style={{ fontSize: "13px", color: "var(--slate-500)", marginTop: "6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {mail.body}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
