import { showConfirm } from "../ConfirmModal";
import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api";
import { IconMegaphone, IconCalendar } from "../common/Icons";
import { CalendarWidget } from "../common/CalendarWidget";
import { Modal } from "../Modal";

export function AdminAnnouncements({ addToast }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState("calendar");

  // Modal for Add / Edit
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: "", content: "" });

  // Modal for Readers List
  const [showReadersModal, setShowReadersModal] = useState(false);
  const [currentAnnTitle, setCurrentAnnTitle] = useState("");
  const [readersList, setReadersList] = useState([]);
  const [loadingReaders, setLoadingReaders] = useState(false);

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

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({ title: "", content: "" });
    setShowModal(true);
  };

  const handleOpenEdit = (ann) => {
    setEditingId(ann.id);
    setForm({ title: ann.title, content: ann.content });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiRequest(`/announcements/${editingId}/`, {
          method: "PUT",
          body: JSON.stringify(form),
        });
        addToast("Announcement updated successfully!", "success");
      } else {
        await apiRequest("/announcements/", {
          method: "POST",
          body: JSON.stringify(form),
        });
        addToast("Announcement broadcasted successfully to all students!", "success");
      }
      setShowModal(false);
      loadAnnouncements();
    } catch (err) {
      addToast(err.message || "Could not save announcement.", "error");
    }
  };

  const handleDelete = async (ann) => {
    const ok = await showConfirm({
      title: "Delete Announcement",
      message: `Delete announcement "${ann.title}"?`,
      confirmText: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await apiRequest(`/announcements/${ann.id}/`, { method: "DELETE" });
      addToast("Announcement deleted.", "success");
      loadAnnouncements();
    } catch (err) {
      addToast(err.message || "Could not delete announcement.", "error");
    }
  };

  const handleOpenReaders = async (ann) => {
    setCurrentAnnTitle(ann.title);
    setShowReadersModal(true);
    setLoadingReaders(true);
    setReadersList([]);
    try {
      const res = await apiRequest(`/announcements/${ann.id}/readers/`);
      setReadersList(res.data.readers || []);
    } catch (err) {
      addToast(err.message || "Could not load readers list.", "error");
    } finally {
      setLoadingReaders(false);
    }
  };

  return (
    <div>
      {/* Top View Toggle Tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "18px" }}>
        <button
          type="button"
          className={`btn ${activeView === "calendar" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveView("calendar")}
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "9px 18px", fontSize: "14px", fontWeight: 600 }}
        >
          <IconCalendar size={16} />
          <span>Event Announcements Calendar</span>
        </button>
        <button
          type="button"
          className={`btn ${activeView === "broadcast" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveView("broadcast")}
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "9px 18px", fontSize: "14px", fontWeight: 600 }}
        >
          <IconMegaphone size={16} />
          <span>Broadcast Bulletins ({announcements.length})</span>
        </button>
      </div>

      {activeView === "calendar" ? (
        <CalendarWidget user={{ role: "admin" }} addToast={addToast} />
      ) : (
        <div className="panel">
          <div className="panel-header">
        <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}><IconMegaphone size={18} style={{ color: "var(--primary)" }} /><span>Campus Announcements ({announcements.length})</span></h2>
        <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
          + Post Announcement
        </button>
      </div>

      {loading ? (
        <p style={{ textAlign: "center", padding: "32px" }}>Loading announcements...</p>
      ) : announcements.length === 0 ? (
        <p style={{ textAlign: "center", padding: "32px", color: "var(--slate-500)" }}>No announcements posted yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {announcements.map((ann) => (
            <div
              key={ann.id}
              style={{
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-md)",
                padding: "20px",
                background: "var(--bg-card)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "8px" }}>
                <div>
                  <h3 style={{ fontSize: "17px", color: "var(--slate-900)" }}>{ann.title}</h3>
                  <div style={{ fontSize: "12px", color: "var(--slate-500)", marginTop: "3px" }}>
                    Published by <b>{ann.author_name || "Administration"}</b> on {new Date(ann.published_at).toLocaleString()}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <button
                    type="button"
                    className="badge badge-info"
                    onClick={() => handleOpenReaders(ann)}
                    title="Click to view students who read this announcement"
                    style={{
                      cursor: "pointer",
                      border: "1px solid #bae6fd",
                      background: "#e0f2fe",
                      color: "#0369a1",
                      padding: "4px 10px",
                      borderRadius: "12px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    {ann.read_count || 0} read
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEdit(ann)}>
                    Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(ann)}>
                    Delete
                  </button>
                </div>
              </div>
              <p style={{ fontSize: "14px", color: "var(--slate-700)", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                {ann.content}
              </p>
            </div>
          ))}
        </div>
      )}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? "Edit Announcement" : "Create New Campus Announcement"}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              {editingId ? "Save Changes" : "Publish to Students"}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="form-group">
            <label>Title *</label>
            <input
              required
              className="form-control"
              placeholder="e.g. End Semester Examination Schedule 2026"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Announcement Content *</label>
            <textarea
              required
              rows={6}
              className="form-control"
              placeholder="Type the announcement details here..."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Readers List Modal */}
      <Modal
        isOpen={showReadersModal}
        onClose={() => setShowReadersModal(false)}
        title={`Read Receipts: ${currentAnnTitle}`}
        footer={
          <button className="btn btn-secondary" onClick={() => setShowReadersModal(false)}>
            Close
          </button>
        }
      >
        {loadingReaders ? (
          <p style={{ textAlign: "center", padding: "20px" }}>Loading read receipts...</p>
        ) : readersList.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px", color: "var(--slate-500)" }}>
            <p style={{ fontSize: "15px" }}>No students have read this announcement yet.</p>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: "13px", color: "var(--slate-600)", marginBottom: "14px" }}>
              Total <b>{readersList.length}</b> student{readersList.length > 1 ? "s" : ""} opened and read this announcement:
            </p>
            <div style={{ maxHeight: "350px", overflowY: "auto", border: "1px solid var(--slate-200)", borderRadius: "8px" }}>
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Student ID</th>
                    <th>Course</th>
                    <th>Read At</th>
                  </tr>
                </thead>
                <tbody>
                  {readersList.map((reader, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{reader.student_name}</td>
                      <td><code>{reader.student_id}</code></td>
                      <td>{reader.course || "—"}</td>
                      <td style={{ fontSize: "12px", color: "var(--slate-500)" }}>{reader.read_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
