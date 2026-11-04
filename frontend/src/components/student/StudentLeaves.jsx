import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api";
import { IconCalendarOff, IconCheckCircle, IconAlertCircle, IconClock } from "../common/Icons";
import { Modal } from "../Modal";

export function StudentLeaves({ user, addToast }) {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    leave_type: "Casual Leave",
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date().toISOString().split("T")[0],
    reason: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadLeaves();
  }, []);

  const loadLeaves = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("/leaves/");
      setLeaves(res.data.results || res.data || []);
    } catch (err) {
      addToast(err.message || "Failed to load leave requests.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRequest = () => {
    const today = new Date().toISOString().split("T")[0];
    setForm({
      leave_type: "Casual Leave",
      start_date: today,
      end_date: today,
      reason: "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (new Date(form.end_date) < new Date(form.start_date)) {
      addToast("End date cannot be earlier than start date.", "error");
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest("/leaves/", {
        method: "POST",
        body: JSON.stringify(form),
      });
      addToast("Leave application submitted successfully!", "success");
      setShowModal(false);
      loadLeaves();
    } catch (err) {
      addToast(err.message || "Could not submit leave request.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}><IconCalendarOff size={18} style={{ color: "var(--primary)" }} /><span>Student Leave Applications ({leaves.length})</span></h2>
          <p style={{ fontSize: "13px", color: "var(--slate-500)", marginTop: "4px" }}>
            Submit absence requests for medical, academic, or personal reasons and track approval status.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenRequest}>
          + Apply for Leave
        </button>
      </div>

      {loading ? (
        <p style={{ textAlign: "center", padding: "32px" }}>Loading leave records...</p>
      ) : leaves.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--slate-500)" }}>
          <div style={{ display: "inline-flex", padding: "14px", borderRadius: "50%", background: "var(--primary-light)", color: "var(--primary)", marginBottom: "12px" }}><IconCalendarOff size={32} /></div>
          <p style={{ fontSize: "16px", fontWeight: 600 }}>No leave applications submitted yet.</p>
          <p style={{ fontSize: "13px", marginTop: "4px" }}>Click "+ Apply for Leave" whenever you need to request absence.</p>
        </div>
      ) : (
        <div className="table-responsive" style={{ marginTop: "16px" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Leave Type</th>
                <th>Dates</th>
                <th>Reason</th>
                <th>Submitted On</th>
                <th>Approval Status</th>
                <th>Faculty Remarks</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map((leave) => (
                <tr key={leave.id}>
                  <td style={{ fontWeight: 600 }}>{leave.leave_type}</td>
                  <td>
                    <b>{leave.start_date}</b> to <b>{leave.end_date}</b>
                  </td>
                  <td style={{ maxWidth: "260px" }}>{leave.reason}</td>
                  <td style={{ fontSize: "12.5px", color: "var(--slate-500)" }}>
                    {new Date(leave.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <span
                      className={`badge badge-${
                        leave.status === "Approved"
                          ? "success"
                          : leave.status === "Rejected"
                          ? "danger"
                          : "warning"
                      }`}
                    >
                      {leave.status === "Approved"
                        ? "Approved"
                        : leave.status === "Rejected"
                        ? "Rejected"
                        : "Pending Review"}
                    </span>
                  </td>
                  <td style={{ fontSize: "13px" }}>
                    {leave.reviewer_response ? (
                      <span style={{ color: leave.status === "Approved" ? "#166534" : "#991b1b" }}>
                        {leave.reviewer_response}
                      </span>
                    ) : (
                      <span style={{ color: "var(--slate-400)" }}>Awaiting review</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Leave Application Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Apply for Student Leave of Absence"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Application"}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="form-group">
            <label>Leave Category *</label>
            <select
              className="form-control"
              value={form.leave_type}
              onChange={(e) => setForm({ ...form, leave_type: e.target.value })}
            >
              <option value="Sick Leave">Sick / Medical Leave</option>
              <option value="Casual Leave">Casual Leave</option>
              <option value="Academic Leave">Academic / Conference Leave</option>
              <option value="Emergency Leave">Family Emergency</option>
            </select>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>From Date *</label>
              <input
                type="date"
                required
                className="form-control"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>To Date *</label>
              <input
                type="date"
                required
                className="form-control"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Detailed Reason *</label>
            <textarea
              rows={4}
              required
              className="form-control"
              placeholder="State the reason for absence, missed lectures to cover, and contact info if needed..."
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
