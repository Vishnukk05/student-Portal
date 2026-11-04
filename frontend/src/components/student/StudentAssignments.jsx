import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api";
import { Modal } from "../Modal";
import { IconFileText, IconGraduationCap, IconBookOpen, IconCheckCircle, IconDownload, IconUpload } from "../common/Icons";

export function StudentAssignments({ user, addToast }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterMode, setFilterMode] = useState("my");

  // Submit modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [targetAssignment, setTargetAssignment] = useState(null);
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submissionText, setSubmissionText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAssignments(filterMode);
  }, [filterMode]);

  const loadAssignments = async (mode = filterMode) => {
    setLoading(true);
    try {
      const courseParam = mode === "my" && user.course ? `?course=${encodeURIComponent(user.course)}` : "";
      const res = await apiRequest(`/assignments/${courseParam}`);
      setAssignments(res.data.results || res.data || []);
    } catch (err) {
      addToast(err.message || "Failed to load assignments.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSubmit = (assign) => {
    setTargetAssignment(assign);
    setSubmissionFile(null);
    setSubmissionText(assign.my_submission?.submission_text || "");
    setShowSubmitModal(true);
  };

  const handleSubmitWork = async (e) => {
    e.preventDefault();
    if (!submissionFile && !submissionText.trim()) {
      addToast("Please choose a file (Word / PDF) or enter your answer text.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      if (submissionFile) {
        formData.append("submission_file", submissionFile);
      }
      formData.append("submission_text", submissionText.trim());

      await apiRequest(`/assignments/${targetAssignment.id}/submit/`, {
        method: "POST",
        body: formData,
      });

      addToast("Assignment submitted successfully!", "success");
      setShowSubmitModal(false);
      loadAssignments();
    } catch (err) {
      addToast(err.message || "Failed to submit assignment.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="panel">
      <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}><IconFileText size={18} style={{ color: "var(--primary)" }} /><span>Course Assignments & Submissions</span></h2>
          <p style={{ fontSize: "13px", color: "var(--slate-500)", marginTop: "4px" }}>
            Download question papers, turn in your Word (.doc, .docx) or PDF solutions, and track grading feedback.
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            className={`btn btn-sm ${filterMode === "my" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setFilterMode("my")}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><IconGraduationCap size={15} /><span>My Course ({user.course || "General"})</span></span>
          </button>
          <button
            type="button"
            className={`btn btn-sm ${filterMode === "all" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setFilterMode("all")}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><IconBookOpen size={15} /><span>All Campus Coursework</span></span>
          </button>
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign: "center", padding: "32px" }}>Loading assignments...</p>
      ) : assignments.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--slate-500)" }}>
          <div style={{ display: "inline-flex", padding: "14px", borderRadius: "50%", background: "var(--primary-light)", color: "var(--primary)", marginBottom: "12px" }}><IconCheckCircle size={32} /></div>
          <p style={{ fontSize: "16px", fontWeight: 600 }}>No pending assignments!</p>
          <p style={{ fontSize: "13px", marginTop: "4px" }}>Your faculty has not posted any coursework tasks right now.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "16px" }}>
          {assignments.map((assign) => {
            const sub = assign.my_submission;
            const isSubmitted = !!sub;
            const isEvaluated = sub?.status === "Evaluated";

            return (
              <div
                key={assign.id}
                style={{
                  border: isEvaluated ? "1.5px solid #86efac" : "1px solid var(--slate-200)",
                  borderRadius: "var(--radius-md)",
                  padding: "24px",
                  background: isEvaluated ? "#f0fdf4" : "#ffffff",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--slate-900)" }}>{assign.title}</h3>
                      <span className="badge badge-primary">{assign.subject || "Subject"}</span>
                      {isEvaluated ? (
                        <span className="badge badge-success">Evaluated • Grade {sub.grade}</span>
                      ) : isSubmitted ? (
                        <span className="badge badge-info">Submitted • Pending Grading</span>
                      ) : (
                        <span className="badge badge-danger">Not Submitted</span>
                      )}
                    </div>
                    <div style={{ fontSize: "12.5px", color: "var(--slate-500)", marginTop: "6px" }}>
                      Max Marks: <b>{assign.total_marks}</b> • Due Date:{" "}
                      <b>{assign.due_date ? new Date(assign.due_date).toLocaleDateString() : "No deadline"}</b>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    {assign.question_file_url && (
                      <a
                        href={assign.question_file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                      >
                        <IconDownload size={14} /> <span>Download Question Document</span>
                      </a>
                    )}
                    <button
                      className={`btn btn-sm ${isSubmitted ? "btn-secondary" : "btn-primary"}`}
                      onClick={() => handleOpenSubmit(assign)}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><IconUpload size={14} /><span>{isSubmitted ? "Re-submit Solution" : "Submit Solution"}</span></span>
                    </button>
                  </div>
                </div>

                {assign.description && (
                  <div style={{ marginTop: "14px", fontSize: "14px", color: "var(--slate-700)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                    {assign.description}
                  </div>
                )}

                {/* Submission Details & Grade Evaluation */}
                {isSubmitted && (
                  <div
                    style={{
                      marginTop: "16px",
                      padding: "16px",
                      background: "var(--bg-card)",
                      borderRadius: "8px",
                      border: "1px solid var(--slate-200)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                      <div style={{ fontSize: "13px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "var(--success)" }}><IconCheckCircle size={14} /></span> <b>Your Submission:</b> {sub.file_url ? (
                          <a href={sub.file_url} target="_blank" rel="noreferrer" style={{ color: "var(--primary)", fontWeight: 600, marginLeft: "4px" }}>
                            Download Uploaded File ({sub.file_url.split("/").pop()})
                          </a>
                        ) : "Text response"}
                        <span style={{ color: "var(--slate-400)", marginLeft: "8px" }}>
                          (Turned in {new Date(sub.submitted_at).toLocaleString()})
                        </span>
                      </div>

                      {isEvaluated && (
                        <div style={{ fontSize: "14px", fontWeight: 700 }}>
                          Your Score: <span style={{ color: "var(--primary)", fontSize: "17px" }}>{sub.marks_obtained}</span> / {assign.total_marks} • Grade: <span style={{ color: "#16a34a", fontSize: "16px" }}>{sub.grade}</span>
                        </div>
                      )}
                    </div>

                    {sub.submission_text && (
                      <div style={{ marginTop: "10px", fontSize: "13px", color: "var(--slate-600)" }}>
                        <b>Your Note:</b> {sub.submission_text}
                      </div>
                    )}

                    {sub.feedback && (
                      <div style={{ marginTop: "12px", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "10px 14px", borderRadius: "6px", fontSize: "13px", color: "#166534" }}>
                        <b>Faculty Feedback:</b> {sub.feedback}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Submit Assignment Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title={`Submit Solution: ${targetAssignment?.title || ""}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowSubmitModal(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSubmitWork} disabled={submitting}>
              {submitting ? "Uploading..." : "Turn In Assignment"}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmitWork} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ fontSize: "13.5px", color: "var(--slate-600)", background: "var(--slate-50)", padding: "12px", borderRadius: "8px" }}>
            Subject: <b>{targetAssignment?.subject}</b> • Total Marks: <b>{targetAssignment?.total_marks}</b>
          </div>

          <div className="form-group">
            <label>Upload Solution Document (Word .doc, .docx, or PDF) *</label>
            <input
              type="file"
              className="form-control"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setSubmissionFile(e.target.files[0])}
            />
            <div className="form-text">Accepted file formats: Microsoft Word (.docx, .doc) or PDF.</div>
          </div>

          <div className="form-group">
            <label>Notes / Explanations / Written Response</label>
            <textarea
              rows={4}
              className="form-control"
              placeholder="Add optional notes, references, or text answers for your instructor..."
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
