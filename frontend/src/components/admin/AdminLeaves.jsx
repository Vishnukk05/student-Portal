import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api";
import { IconCalendarOff } from "../common/Icons";
import { Modal } from "../Modal";

export function AdminLeaves({ addToast }) {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");

  // Review Modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewingLeave, setReviewingLeave] = useState(null);
  const [actionType, setActionType] = useState("Approved");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);

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

  const handleOpenReview = (leave, action) => {
    setReviewingLeave(leave);
    setActionType(action);
    setRemarks(
      action === "Approved"
        ? "Leave approved. Ensure missed assignments are submitted within 3 days of return."
        : "Leave request declined due to mandatory scheduled academic assessments."
    );
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewingLeave) return;
    setSaving(true);
    try {
      await apiRequest(`/leaves/${reviewingLeave.id}/review/`, {
        method: "POST",
        body: JSON.stringify({
          status: actionType,
          reviewer_response: remarks.trim(),
        }),
      });
      addToast(`Leave request ${actionType.toLowerCase()}!`, "success");
      setShowReviewModal(false);
      loadLeaves();
    } catch (err) {
      addToast(err.message || "Failed to update leave request.", "error");
    } finally {
      setSaving(false);
    }
  };

  const filteredLeaves = leaves.filter((l) => {
    if (filter === "all") return true;
    return l.status?.toLowerCase() === filter.toLowerCase();
  });

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}><IconCalendarOff size={18} style={{ color: "var(--primary)" }} /><span>Student Leave Approvals ({leaves.length})</span></h2>
          <p style={{ fontSize: "13px", color: "var(--slate-500)", marginTop: "4px" }}>
            Review, approve, or decline student absence requests with faculty remarks.
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            className={`btn btn-sm ${filter === "all" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setFilter("all")}
          >
            All ({leaves.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${filter === "pending" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setFilter("pending")}
          >
            Pending ({leaves.filter((l) => l.status === "Pending").length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${filter === "approved" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setFilter("approved")}
          >
            Approved ({leaves.filter((l) => l.status === "Approved").length})
          </button>
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign: "center", padding: "32px" }}>Loading leave requests...</p>
      ) : filteredLeaves.length === 0 ? (
        <p style={{ textAlign: "center", padding: "32px", color: "var(--slate-500)" }}>
          {filter === "all" ? "No student leave requests submitted yet." : `No ${filter} leave requests found.`}
        </p>
      ) : (
        <div className="table-responsive" style={{ marginTop: "16px" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>Category</th>
                <th>Dates</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeaves.map((leave) => (
                <tr key={leave.id}>
                  <td style={{ fontWeight: 600 }}>
                    <div>{leave.student_name}</div>
                    <code style={{ fontSize: "12px", color: "var(--slate-500)" }}>{leave.student_code}</code>
                  </td>
                  <td>{leave.student_course || "General"}</td>
                  <td>
                    <span className="badge badge-info">{leave.leave_type}</span>
                  </td>
                  <td>
                    <b>{leave.start_date}</b> to <b>{leave.end_date}</b>
                  </td>
                  <td style={{ maxWidth: "260px" }}>
                    <div>{leave.reason}</div>
                    {leave.reviewer_response && (
                      <div style={{ fontSize: "12px", color: "var(--slate-500)", marginTop: "4px" }}>
                        <b>Remarks:</b> {leave.reviewer_response}
                      </div>
                    )}
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
                        : "⏳ Pending"}
                    </span>
                  </td>
                  <td>
                    {String(leave.status || "").trim().toLowerCase() === "pending" ? (
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleOpenReview(leave, "Approved")}
                          title="Approve Leave"
                          style={{ padding: "4px 8px", fontSize: "12px" }}
                        >
                          ✓ Approve
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleOpenReview(leave, "Rejected")}
                          title="Reject Leave"
                          style={{ padding: "4px 8px", fontSize: "12px" }}
                        >
                          ✕ Reject
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: "12.5px", color: "var(--slate-500)", fontStyle: "italic" }}>
                        Decision: {leave.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title={`${actionType === "Approved" ? "Approve" : "Reject"} Leave Request: ${reviewingLeave?.student_name || ""}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowReviewModal(false)}>
              Cancel
            </button>
            <button
              className={`btn ${actionType === "Approved" ? "btn-success" : "btn-danger"}`}
              onClick={handleReviewSubmit}
              disabled={saving}
            >
              {saving ? "Processing..." : `Confirm ${actionType}`}
            </button>
          </>
        }
      >
        <form onSubmit={handleReviewSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ background: "var(--slate-50)", padding: "12px", borderRadius: "8px", fontSize: "13px" }}>
            Student: <b>{reviewingLeave?.student_name}</b> ({reviewingLeave?.student_code})<br />
            Dates: <b>{reviewingLeave?.start_date}</b> to <b>{reviewingLeave?.end_date}</b> ({reviewingLeave?.leave_type})<br />
            Reason: <i>"{reviewingLeave?.reason}"</i>
          </div>

          <div className="form-group">
            <label>Decision</label>
            <select
              className="form-control"
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
            >
              <option value="Approved">Approve Absence</option>
              <option value="Rejected">Reject Absence</option>
            </select>
          </div>

          <div className="form-group">
            <label>Official Remarks / Instructions for Student</label>
            <textarea
              rows={3}
              className="form-control"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
