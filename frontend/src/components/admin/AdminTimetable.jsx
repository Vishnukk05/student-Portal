import { showConfirm } from "../ConfirmModal";
import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api";
import { IconCalendar, IconDownload } from "../common/Icons";
import { Modal } from "../Modal";

export function AdminTimetable({ addToast }) {
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: "",
    course: "Computer Science",
    batch: "2026",
    notes: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadTimetables();
  }, []);

  const loadTimetables = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("/timetables/");
      setTimetables(res.data.results || res.data || []);
    } catch (err) {
      addToast(err.message || "Failed to load timetables.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setForm({ title: "", course: "Computer Science", batch: "2026", notes: "" });
    setSelectedFile(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("title", form.title.trim());
      formData.append("course", form.course.trim());
      formData.append("batch", form.batch.trim());
      formData.append("notes", form.notes.trim());
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      await apiRequest("/timetables/", {
        method: "POST",
        body: formData,
      });

      addToast("Academic timetable published successfully!", "success");
      setShowModal(false);
      loadTimetables();
    } catch (err) {
      addToast(err.message || "Failed to upload timetable.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (item) => {
    const ok = await showConfirm({
      title: "Delete Timetable",
      message: `Delete timetable "${item.title}"?`,
      confirmText: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await apiRequest(`/timetables/${item.id}/`, { method: "DELETE" });
      addToast("Timetable removed.", "success");
      loadTimetables();
    } catch (err) {
      addToast(err.message || "Could not delete timetable.", "error");
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}><IconCalendar size={18} style={{ color: "var(--primary)" }} /><span>Academic Timetables ({timetables.length})</span></h2>
          <p style={{ fontSize: "13px", color: "var(--slate-500)", marginTop: "4px" }}>
            Publish weekly class schedules, lecture routines, and exam timetables.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          + Upload Timetable
        </button>
      </div>

      {loading ? (
        <p style={{ textAlign: "center", padding: "32px" }}>Loading timetables...</p>
      ) : timetables.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--slate-500)" }}>
          <div style={{ display: "inline-flex", padding: "14px", borderRadius: "50%", background: "var(--primary-light)", color: "var(--primary)", marginBottom: "12px" }}><IconCalendar size={32} /></div>
          <p style={{ fontSize: "15px", fontWeight: 600 }}>No academic timetables uploaded yet.</p>
          <p style={{ fontSize: "13px", marginTop: "4px" }}>Click "+ Upload Timetable" to publish schedules for students.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px", marginTop: "16px" }}>
          {timetables.map((item) => (
            <div
              key={item.id}
              style={{
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-md)",
                padding: "20px",
                background: "var(--bg-card)",
                boxShadow: "var(--shadow-sm)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--slate-900)" }}>{item.title}</h3>
                  <span className="badge badge-primary">{item.course || "All Courses"}</span>
                </div>
                <div style={{ fontSize: "12px", color: "var(--slate-500)", marginTop: "6px" }}>
                  Batch: <b>{item.batch || "All Batches"}</b> • Uploaded by <b>{item.uploader_name || "Faculty"}</b>
                </div>
                {item.notes && (
                  <p style={{ fontSize: "13px", color: "var(--slate-600)", marginTop: "12px", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                    {item.notes}
                  </p>
                )}
              </div>

              <div style={{ marginTop: "20px", paddingTop: "14px", borderTop: "1px solid var(--slate-100)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {item.file_url ? (
                  <a
                    href={item.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                  >
                    Download Timetable
                  </a>
                ) : (
                  <span style={{ fontSize: "12px", color: "var(--slate-400)" }}>No file attached</span>
                )}
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Timetable Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Upload Academic Timetable"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={uploading}>
              {uploading ? "Publishing..." : "Upload & Publish"}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="form-group">
            <label>Timetable Title *</label>
            <input
              required
              className="form-control"
              placeholder="e.g. Semester 4 Class Routine & Lab Schedule"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Target Course / Department</label>
              <input
                className="form-control"
                placeholder="e.g. Computer Science, Information Technology"
                value={form.course}
                onChange={(e) => setForm({ ...form, course: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Academic Batch</label>
              <input
                className="form-control"
                placeholder="e.g. 2026 or 2025-2027"
                value={form.batch}
                onChange={(e) => setForm({ ...form, batch: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Timetable Schedule File (PDF, Image, or Word Document)</label>
            <input
              type="file"
              className="form-control"
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              onChange={(e) => setSelectedFile(e.target.files[0])}
            />
          </div>

          <div className="form-group">
            <label>Notes / Room / Schedule Details</label>
            <textarea
              rows={4}
              className="form-control"
              placeholder="e.g. Mon-Fri 9:00 AM - 4:00 PM. Room 402 for lectures, Lab 3 for practicals."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
