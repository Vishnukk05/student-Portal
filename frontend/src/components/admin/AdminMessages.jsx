import React, { useEffect, useState, useRef } from "react";
import { apiRequest } from "../../api";
import { IconMessageSquare } from "../common/Icons";

export function AdminMessages({ addToast }) {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadMap, setUnreadMap] = useState({});
  const [newText, setNewText] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const selectedStudentRef = useRef(selectedStudent);

  useEffect(() => {
    selectedStudentRef.current = selectedStudent;
  }, [selectedStudent]);

  useEffect(() => {
    loadStudents();
    loadUnreadCounts();

    const interval = setInterval(() => {
      loadUnreadCounts();
      if (selectedStudentRef.current) {
        // Silent background refresh of open conversation
        loadMessages(selectedStudentRef.current.id, true);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      loadMessages(selectedStudent.id);
    }
  }, [selectedStudent]);

  const loadUnreadCounts = async () => {
    try {
      const res = await apiRequest("/messages/unread-counts/");
      setUnreadMap(res.data?.counts || {});
    } catch {
      // background fetch silent fallback
    }
  };

  const loadStudents = async () => {
    try {
      const res = await apiRequest("/students/");
      const list = res.data.results || res.data || [];
      setStudents(list);
      if (list.length > 0 && !selectedStudent) {
        setSelectedStudent(list[0]);
      }
    } catch (err) {
      addToast(err.message || "Failed to load students list for chat.", "error");
    }
  };

  const loadMessages = async (studentId, silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await apiRequest(`/messages/?studentId=${studentId}`);
      setMessages(res.data.results || res.data || []);
      // Conversation viewed: clear unread count for this student
      setUnreadMap((prev) => {
        const next = { ...prev };
        delete next[studentId];
        delete next[String(studentId)];
        return next;
      });
    } catch (err) {
      if (!silent) addToast(err.message || "Failed to load conversation.", "error");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setUnreadMap((prev) => {
      const next = { ...prev };
      delete next[student.id];
      delete next[String(student.id)];
      return next;
    });
    loadMessages(student.id);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newText.trim() || !selectedStudent) return;

    try {
      await apiRequest("/messages/", {
        method: "POST",
        body: JSON.stringify({
          studentId: selectedStudent.id,
          message: newText.trim(),
        }),
      });
      setNewText("");
      loadMessages(selectedStudent.id);
    } catch (err) {
      addToast(err.message || "Could not send message.", "error");
    }
  };

  const filteredStudents = students.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name?.toLowerCase().includes(q) || s.student_id?.toLowerCase().includes(q);
  });

  return (
    <div className="panel" style={{ padding: "16px" }}>
      <div className="panel-header" style={{ marginBottom: "16px" }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <IconMessageSquare size={18} style={{ color: "var(--primary)" }} />
          <span>Direct Student Conversations</span>
        </h2>
      </div>

      <div className="chat-container">
        {/* Left student conversation list */}
        <div className="chat-sidebar">
          <div className="chat-search">
            <input
              type="text"
              className="form-control"
              placeholder="Find student..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="chat-student-list">
            {filteredStudents.map((s) => {
              const unread = Number(unreadMap[s.id] || unreadMap[String(s.id)] || 0);
              const isSelected = selectedStudent?.id === s.id;
              return (
                <div
                  key={s.id}
                  className={`chat-student-item ${isSelected ? "active" : ""}`}
                  onClick={() => handleSelectStudent(s)}
                >
                  <div
                    className="user-avatar"
                    style={{ width: "36px", height: "36px", fontSize: "14px", flexShrink: 0 }}
                  >
                    {(s.name || "S")[0].toUpperCase()}
                  </div>
                  <div style={{ overflow: "hidden", flex: 1, minWidth: 0 }}>
                    <b
                      style={{
                        fontSize: "13px",
                        display: "block",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {s.name}
                    </b>
                    <div style={{ fontSize: "11px", color: "var(--slate-500)" }}>{s.student_id}</div>
                  </div>
                  {unread > 0 && (
                    <span
                      className="chat-student-unread-badge"
                      title={`${unread} unread message${unread > 1 ? "s" : ""}`}
                    >
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right chat message thread */}
        <div className="chat-main">
          {selectedStudent ? (
            <>
              <div className="chat-header">
                <div>
                  Chatting with: <b>{selectedStudent.name}</b> ({selectedStudent.student_id})
                  <span style={{ fontSize: "12px", color: "var(--slate-500)", marginLeft: "12px" }}>
                    {selectedStudent.course}
                  </span>
                </div>
              </div>

              <div className="chat-messages">
                {loading ? (
                  <p style={{ textAlign: "center", color: "var(--slate-400)" }}>Loading messages...</p>
                ) : messages.length === 0 ? (
                  <p style={{ textAlign: "center", color: "var(--slate-400)", marginTop: "40px" }}>
                    No messages in this conversation yet. Send a greeting below!
                  </p>
                ) : (
                  messages.map((m) => {
                    const isSent = m.sender_role === "admin" || m.sender_role === "staff";
                    return (
                      <div key={m.id} className={`chat-bubble ${isSent ? "sent" : "received"}`}>
                        <div>{m.message}</div>
                        <span className="msg-time">
                          {new Date(m.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              <form className="chat-composer" onSubmit={handleSend}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Type an official reply to this student..."
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                />
                <button type="submit" className="btn btn-primary">
                  Send
                </button>
              </form>
            </>
          ) : (
            <div style={{ display: "grid", placeItems: "center", height: "100%", color: "var(--slate-400)" }}>
              Select a student to view the chat history.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
