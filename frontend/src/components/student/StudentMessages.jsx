import React, { useEffect, useRef, useState } from "react";
import { apiRequest } from "../../api";
import { IconMessageSquare, IconRefresh, IconGraduationCap } from "../common/Icons";

export function StudentMessages({ addToast }) {
  const [messages, setMessages] = useState([]);
  const [newText, setNewText] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadMessages();

    const interval = setInterval(() => {
      loadMessages(true);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await apiRequest("/messages/");
      const list = res.data.results || res.data || [];
      const unreadCount = list.filter((m) => m.sender_role !== "student" && !m.is_read).length;
      if (unreadCount > 0) {
        setHasNewMessage(true);
      }
      setMessages(list);
    } catch (err) {
      if (!silent) addToast(err.message || "Failed to load messages with administration.", "error");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newText.trim()) return;

    try {
      await apiRequest("/messages/", {
        method: "POST",
        body: JSON.stringify({ message: newText.trim() }),
      });
      setNewText("");
      setHasNewMessage(false);
      loadMessages();
    } catch (err) {
      addToast(err.message || "Could not send message.", "error");
    }
  };

  return (
    <div className="panel" style={{ padding: "0", overflow: "hidden", border: "1px solid var(--border-color)", borderRadius: "14px" }}>
      {/* Chat Header */}
      <div className="chat-header">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "linear-gradient(135deg, var(--primary), var(--primary-hover))", color: "#ffffff", display: "grid", placeItems: "center" }}>
            <IconGraduationCap size={20} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <h2 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "var(--text-main)" }}>
                Academic Advisory & Support Desk
              </h2>
              {hasNewMessage && (
                <span className="chat-student-unread-badge" style={{ fontSize: "11px", padding: "2px 8px" }}>
                  NEW MESSAGE
                </span>
              )}
            </div>
            <div style={{ fontSize: "12px", color: "var(--success)", display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
              <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "var(--success)" }}></span>
              Connected &bull; Official Student Channel
            </div>
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => loadMessages()}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
            <IconRefresh size={13} />
            <span>Refresh</span>
          </span>
        </button>
      </div>

      {/* Main Message Stream */}
      <div className="chat-main" style={{ height: "560px" }}>
        <div className="chat-messages" style={{ flex: 1, padding: "20px 24px" }}>
          {loading ? (
            <p style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "40px" }}>Loading conversation history...</p>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--text-muted)", margin: "auto" }}>
              <div style={{ display: "inline-flex", padding: "12px", borderRadius: "50%", background: "var(--primary-light)", color: "var(--primary)", marginBottom: "8px" }}>
                <IconMessageSquare size={28} />
              </div>
              <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-main)" }}>No messages yet</p>
              <p style={{ fontSize: "13px" }}>Type below to ask questions directly to faculty and school administration.</p>
            </div>
          ) : (
            messages.map((m) => {
              const isSent = m.sender_role === "student";
              return (
                <div
                  key={m.id}
                  className={`chat-bubble ${isSent ? "sent" : "received"}`}
                >
                  <div>{m.message}</div>
                  <span className="msg-time">
                    {new Date(m.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Composer Form */}
        <form className="chat-composer" onSubmit={handleSend}>
          <input
            type="text"
            className="form-control"
            placeholder="Type your question or message for the administration..."
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            style={{ flex: 1, height: "42px", fontSize: "14px" }}
          />
          <button
            type="submit"
            className="btn btn-primary"
            style={{ height: "42px", padding: "0 22px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "8px" }}
          >
            <span>Send</span>
            <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
