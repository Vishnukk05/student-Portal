import { showConfirm } from "../ConfirmModal";
import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api";
import { IconFileText, IconDownload, IconCheckCircle } from "../common/Icons";
import { Modal } from "../Modal";

export function AdminAssignments({ addToast }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Publish Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({
    title: "",
    subject: "",
    course: "Computer Science",
    total_marks: 100,
    due_date: "",
    description: "",
  });
  const [questionFile, setQuestionFile] = useState(null);
  const [creating, setCreating] = useState(false);

  // Submissions Modal
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  // Evaluation Modal
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [evaluatingSub, setEvaluatingSub] = useState(null);
  const [evalForm, setEvalForm] = useState({ marks: "", grade: "A", feedback: "" });
  const [savingEval, setSavingEval] = useState(false);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("/assignments/");
      setAssignments(res.data.results || res.data || []);
    } catch (err) {
      addToast(err.message || "Failed to load assignments.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setForm({
      title: "",
      subject: "",
      course: "Computer Science",
      total_marks: 100,
      due_date: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      description: "",
    });
    setQuestionFile(null);
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const formData = new FormData();
      formData.append("title", form.title.trim());
      formData.append("subject", form.subject.trim());
      formData.append("course", form.course.trim());
      formData.append("total_marks", form.total_marks);
      formData.append("description", form.description.trim());
      if (form.due_date) {
        formData.append("due_date", form.due_date);
      }
      if (questionFile) {
        formData.append("question_file", questionFile);
      }

      await apiRequest("/assignments/", {
        method: "POST",
        body: formData,
      });

      addToast("Assignment published successfully!", "success");
      setShowCreateModal(false);
      loadAssignments();
    } catch (err) {
      addToast(err.message || "Failed to publish assignment.", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAssignment = async (assign) => {
    const ok = await showConfirm({
      title: "Delete Assignment",
      message: `Delete assignment "${assign.title}" and all student submissions?`,
      confirmText: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await apiRequest(`/assignments/${assign.id}/`, { method: "DELETE" });
      addToast("Assignment deleted.", "success");
      loadAssignments();
    } catch (err) {
      addToast(err.message || "Failed to delete assignment.", "error");
    }
  };

  const handleOpenSubmissions = async (assign) => {
    setCurrentAssignment(assign);
    setShowSubmissionsModal(true);
    setLoadingSubs(true);
    try {
      const res = await apiRequest(`/assignments/${assign.id}/submissions/`);
      setSubmissions(res.data.submissions || []);
    } catch (err) {
      addToast(err.message || "Failed to load student submissions.", "error");
    } finally {
      setLoadingSubs(false);
    }
  };

  const handleOpenEvaluate = (sub) => {
    setEvaluatingSub(sub);
    setEvalForm({
      marks: sub.marks_obtained !== null ? sub.marks_obtained : "",
      grade: sub.grade || "A",
      feedback: sub.feedback || "",
    });
    setShowEvalModal(true);
  };

  const handleEvaluateSubmit = async (e) => {
    e.preventDefault();
    if (!evaluatingSub) return;
    setSavingEval(true);
    try {
      await apiRequest(`/assignment-submissions/${evaluatingSub.id}/evaluate/`, {
        method: "POST",
        body: JSON.stringify({
          marks_obtained: evalForm.marks,
          grade: evalForm.grade,
          feedback: evalForm.feedback,
        }),
      });
      addToast("Student assignment evaluated and graded!", "success");
      setShowEvalModal(false);
      // Reload submissions
      if (currentAssignment) {
        const res = await apiRequest(`/assignments/${currentAssignment.id}/submissions/`);
        setSubmissions(res.data.submissions || []);
      }
    } catch (err) {
      addToast(err.message || "Failed to evaluate submission.", "error");
    } finally {
      setSavingEval(false);
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}><IconFileText size={18} style={{ color: "var(--primary)" }} /><span>Assignments & Evaluation ({assignments.length})</span></h2>
          <p style={{ fontSize: "13px", color: "var(--slate-500)", marginTop: "4px" }}>
            Create academic tasks, upload question documents (Word/PDF), and grade student submissions online.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          + Publish Assignment
        </button>
      </div>

      {loading ? (
        <p style={{ textAlign: "center", padding: "32px" }}>Loading assignments...</p>
      ) : assignments.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--slate-500)" }}>
          <div style={{ display: "inline-flex", padding: "14px", borderRadius: "50%", background: "var(--primary-light)", color: "var(--primary)", marginBottom: "12px" }}><IconFileText size={32} /></div>
          <p style={{ fontSize: "16px", fontWeight: 600 }}>No assignments published yet.</p>
          <p style={{ fontSize: "13px", marginTop: "4px" }}>Click "+ Publish New Assignment" to post coursework for students.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "18px", marginTop: "16px" }}>
          {assignments.map((assign) => (
            <div
              key={assign.id}
              style={{
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-md)",
                padding: "22px",
                background: "var(--bg-card)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--slate-900)" }}>{assign.title}</h3>
                    <span className="badge badge-primary">{assign.subject || "Subject"}</span>
                    <span className="badge badge-info">{assign.course || "General"}</span>
                  </div>
                  <div style={{ fontSize: "12.5px", color: "var(--slate-500)", marginTop: "6px" }}>
                    Published by <b>{assign.creator_name || "Faculty"}</b> • Max Marks: <b>{assign.total_marks}</b> • Due Date:{" "}
                    <b>{assign.due_date ? new Date(assign.due_date).toLocaleDateString() : "No deadline"}</b>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleOpenSubmissions(assign)}
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                  >
                    View Submissions ({assign.submissions_count || 0})
                  </button>
                  {assign.question_file_url && (
                    <a
                      href={assign.question_file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary btn-sm"
                    >
                      Question Paper
                    </a>
                  )}
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteAssignment(assign)}>
                    Delete
                  </button>
                </div>
              </div>

              {assign.description && (
                <div style={{ marginTop: "14px", fontSize: "14px", color: "var(--slate-700)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                  {assign.description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Assignment Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Publish Coursework Assignment"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleCreateSubmit} disabled={creating}>
              {creating ? "Publishing..." : "Publish Assignment"}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="form-group">
            <label>Assignment Title *</label>
            <input
              required
              className="form-control"
              placeholder="e.g. Assignment 2: Database Normalization & ER Diagrams"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Subject / Course Module *</label>
              <input
                required
                className="form-control"
                placeholder="e.g. Database Management Systems"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Target Course / Department</label>
              <select
                className="form-control"
                value={form.course}
                onChange={(e) => setForm({ ...form, course: e.target.value })}
              >
                <option value="All Courses">All Courses / All Students</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Electronics">Electronics</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Civil Engineering">Civil Engineering</option>
                <option value="Business Administration">Business Administration</option>
              </select>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Total Marks</label>
              <input
                type="number"
                min={1}
                required
                className="form-control"
                value={form.total_marks}
                onChange={(e) => setForm({ ...form, total_marks: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Due Date</label>
              <input
                type="date"
                required
                className="form-control"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Question Paper Document (Word .doc, .docx, or PDF)</label>
            <input
              type="file"
              className="form-control"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setQuestionFile(e.target.files[0])}
            />
          </div>

          <div className="form-group">
            <label>Instructions & Questions</label>
            <textarea
              rows={4}
              className="form-control"
              placeholder="Provide assignment objectives, formatting guidelines, or questions..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Submissions & Evaluation Modal */}
      <Modal
        isOpen={showSubmissionsModal}
        onClose={() => setShowSubmissionsModal(false)}
        title={`Student Submissions: ${currentAssignment?.title || ""}`}
        footer={
          <button className="btn btn-secondary" onClick={() => setShowSubmissionsModal(false)}>
            Close
          </button>
        }
      >
        {loadingSubs ? (
          <p style={{ textAlign: "center", padding: "24px" }}>Loading student submissions...</p>
        ) : submissions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px", color: "var(--slate-500)" }}>
            <p style={{ fontSize: "15px" }}>No students have submitted this assignment yet.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", maxHeight: "450px", overflowY: "auto" }}>
            {submissions.map((sub) => (
              <div
                key={sub.id}
                style={{
                  border: "1px solid var(--slate-200)",
                  borderRadius: "8px",
                  padding: "16px",
                  background: sub.status === "Evaluated" ? "#f8fafc" : "#ffffff",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--slate-900)" }}>
                      {sub.student_name} <code style={{ fontSize: "12px" }}>({sub.student_code})</code>
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--slate-500)", marginTop: "2px" }}>
                      Submitted: {new Date(sub.submitted_at).toLocaleString()}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className={`badge badge-${sub.status === "Evaluated" ? "success" : "info"}`}>
                      {sub.status === "Evaluated" ? "Evaluated" : "Pending Evaluation"}
                    </span>
                    <button className="btn btn-primary btn-sm" onClick={() => handleOpenEvaluate(sub)}>
                      {sub.status === "Evaluated" ? "Re-evaluate" : "Evaluate & Grade"}
                    </button>
                  </div>
                </div>

                {sub.submission_text && (
                  <div style={{ marginTop: "10px", fontSize: "13px", color: "var(--slate-700)", background: "var(--slate-100)", padding: "8px 12px", borderRadius: "6px" }}>
                    <b>Student Note:</b> {sub.submission_text}
                  </div>
                )}

                <div style={{ marginTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  {sub.file_url ? (
                    <a
                      href={sub.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                    >
                      Download Student Submission (Word/PDF)
                    </a>
                  ) : (
                    <span style={{ fontSize: "12px", color: "var(--slate-400)" }}>No file attached</span>
                  )}

                  {sub.status === "Evaluated" && (
                    <div style={{ fontSize: "13px" }}>
                      Score: <b style={{ color: "var(--primary)" }}>{sub.marks_obtained}</b> / {currentAssignment?.total_marks} • Grade: <b>{sub.grade}</b>
                    </div>
                  )}
                </div>

                {sub.feedback && (
                  <div style={{ marginTop: "8px", fontSize: "12.5px", color: "#166534", background: "#f0fdf4", padding: "6px 10px", borderRadius: "6px" }}>
                    <b>Faculty Feedback:</b> {sub.feedback}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Online Evaluation Modal */}
      <Modal
        isOpen={showEvalModal}
        onClose={() => setShowEvalModal(false)}
        title={`Evaluate: ${evaluatingSub?.student_name || "Student"}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowEvalModal(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleEvaluateSubmit} disabled={savingEval}>
              {savingEval ? "Saving Grade..." : "Submit Evaluation"}
            </button>
          </>
        }
      >
        <form onSubmit={handleEvaluateSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="form-grid">
            <div className="form-group">
              <label>Marks Awarded (out of {currentAssignment?.total_marks || 100}) *</label>
              <input
                type="number"
                step="0.5"
                min={0}
                max={currentAssignment?.total_marks || 100}
                required
                className="form-control"
                value={evalForm.marks}
                onChange={(e) => setEvalForm({ ...evalForm, marks: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Letter Grade</label>
              <select
                className="form-control"
                value={evalForm.grade}
                onChange={(e) => setEvalForm({ ...evalForm, grade: e.target.value })}
              >
                <option value="A+">A+ (Outstanding)</option>
                <option value="A">A (Excellent)</option>
                <option value="B+">B+ (Very Good)</option>
                <option value="B">B (Good)</option>
                <option value="C">C (Satisfactory)</option>
                <option value="D">D (Pass)</option>
                <option value="F">F (Fail)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Faculty Feedback & Remarks for Student</label>
            <textarea
              rows={4}
              className="form-control"
              placeholder="e.g. Excellent analysis and structure. Ensure citations follow IEEE format in the next assignment."
              value={evalForm.feedback}
              onChange={(e) => setEvalForm({ ...evalForm, feedback: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
