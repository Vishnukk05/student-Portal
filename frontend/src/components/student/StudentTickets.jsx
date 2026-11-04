import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api";
import { IconLifeBuoy, IconPaperclip } from "../common/Icons";
import { Modal } from "../Modal";

export function StudentTickets({ addToast }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);

  // New Ticket Modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    subject: "",
    category: "Academic",
    priority: "Medium",
    description: "",
  });
  const [attachmentFile, setAttachmentFile] = useState(null);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const res = await apiRequest("/tickets/");
      setTickets(res.data.results || res.data || []);
    } catch (err) {
      addToast(err.message || "Failed to load support tickets.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("subject", form.subject);
      formData.append("category", form.category);
      formData.append("priority", form.priority);
      formData.append("description", form.description);
      if (attachmentFile) {
        formData.append("attachment", attachmentFile);
      }

      await apiRequest("/tickets/", {
        method: "POST",
        body: formData,
      });

      addToast("Support ticket raised successfully! Administration will review shortly.", "success");
      setShowModal(false);
      setForm({ subject: "", category: "Academic", priority: "Medium", description: "" });
      setAttachmentFile(null);
      loadTickets();
    } catch (err) {
      addToast(err.message || "Could not create ticket.", "error");
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}><IconLifeBuoy size={18} style={{ color: "var(--primary)" }} /><span>Academic & IT Support Tickets ({tickets.length})</span></h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
          + Raise New Ticket
        </button>
      </div>

      {loading ? (
        <p style={{ textAlign: "center", padding: "32px" }}>Loading tickets...</p>
      ) : tickets.length === 0 ? (
        <p style={{ textAlign: "center", padding: "32px", color: "var(--slate-500)" }}>
          You have not submitted any support tickets yet. Click "Raise New Ticket" if you need academic or technical assistance.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {tickets.map((t) => (
            <div
              key={t.id}
              style={{
                border: "1px solid var(--slate-200)",
                borderRadius: "var(--radius-md)",
                padding: "20px",
                background: "var(--bg-card)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "10px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <code style={{ fontSize: "13px", fontWeight: 700 }}>{t.ticket_id || `#${t.id}`}</code>
                    <span className="badge badge-info">{t.category}</span>
                    <span className={`badge badge-${t.priority === "High" ? "danger" : t.priority === "Medium" ? "warning" : "info"}`}>
                      {t.priority}
                    </span>
                  </div>
                  <h3 style={{ fontSize: "17px", color: "var(--slate-900)", marginTop: "6px" }}>{t.subject}</h3>
                </div>
                <div>
                  <span className={`badge badge-${t.status === "Completed" ? "success" : t.status === "In Progress" ? "info" : "warning"}`}>
                    {t.status}
                  </span>
                </div>
              </div>

              <p style={{ fontSize: "14px", color: "var(--slate-700)", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                {t.description}
              </p>

              {t.attachment_url && (
                <div style={{ marginTop: "10px" }}>
                  <a href={t.attachment_url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                    <IconPaperclip size={14} /> <span>View Attached File</span>
                  </a>
                </div>
              )}

              {/* Admin remarks / response banner */}
              {t.response && (
                <div
                  style={{
                    marginTop: "16px",
                    background: "var(--primary-light)",
                    borderLeft: "4px solid var(--primary)",
                    padding: "14px",
                    borderRadius: "4px",
                  }}
                >
                  <b style={{ fontSize: "13px", color: "var(--primary)", display: "block", marginBottom: "4px" }}>
                    Official Administrative Remarks:
                  </b>
                  <p style={{ fontSize: "13px", color: "var(--slate-800)", whiteSpace: "pre-wrap" }}>
                    {t.response}
                  </p>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "var(--slate-500)", marginTop: "14px", paddingTop: "10px", borderTop: "1px solid var(--border-color)", flexWrap: "wrap", gap: "8px" }}>
                <div>
                  <span>Created Time: </span>
                  <b style={{ color: "var(--text-main)" }}>{new Date(t.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</b>
                </div>
                <div>
                  <span>Updated Time: </span>
                  <b style={{ color: "var(--text-main)" }}>{new Date(t.updated_at || t.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</b>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Raise Ticket Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Raise a Support Ticket"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreateSubmit}>Submit Ticket</button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="form-group">
            <label>Subject *</label>
            <input
              required
              className="form-control"
              placeholder="e.g. Issue accessing Database Management lecture slides"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Category *</label>
              <select
                className="form-control"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="Academic">Academic</option>
                <option value="IT Support">IT Support</option>
                <option value="General">General</option>
                <option value="Examination">Examination</option>
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select
                className="form-control"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Detailed Description *</label>
            <textarea
              required
              rows={4}
              className="form-control"
              placeholder="Please provide full details of your inquiry or problem..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Optional Attachment (Screenshot / Document)</label>
            <input
              type="file"
              className="form-control"
              onChange={(e) => setAttachmentFile(e.target.files[0])}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
