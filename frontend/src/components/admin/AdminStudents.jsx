import { showConfirm } from "../ConfirmModal";
import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api";
import { IconGraduationCap, IconDownload, IconUpload } from "../common/Icons";
import { Modal } from "../Modal";

export function AdminStudents({ addToast }) {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const getTodayDate = () => new Date().toISOString().slice(0, 10);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    personal_email: "",
    phone: "",
    course: "",
    batch: "2024-2028",
    joining_date: getTodayDate(),
    username: "",
    status: "Pending",
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editStudent, setEditStudent] = useState(null);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailStudent, setDetailStudent] = useState(null);
  const [studentActivities, setStudentActivities] = useState([]);

  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importText, setImportText] = useState("");

  useEffect(() => {
    loadStudents();
  }, [search, statusFilter, courseFilter]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (courseFilter !== "all") params.set("course", courseFilter);

      const res = await apiRequest(`/students/?${params.toString()}`);
      setStudents(res.data.results || res.data || []);
    } catch (err) {
      addToast(err.message || "Failed to load students.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(students.map((s) => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.entries(addForm).forEach(([key, val]) => {
        if (val) formData.append(key, val);
      });
      if (photoFile) {
        formData.append("photo", photoFile);
      }

      const res = await apiRequest("/students/", {
        method: "POST",
        body: formData,
      });

      const tempPw = res.data?.temporary_password;
      if (tempPw) {
        addToast(`Student created! Temporary password: ${tempPw}`, "success");
      } else {
        addToast("Student added successfully and temporary password emailed!", "success");
      }
      setShowAddModal(false);
      setAddForm({
        name: "",
        personal_email: "",
        phone: "",
        course: "",
        batch: "2024-2028",
        joining_date: getTodayDate(),
        username: "",
        status: "Pending",
      });
      setPhotoFile(null);
      setPhotoPreview(null);
      loadStudents();
    } catch (err) {
      addToast(err.message || "Could not add student.", "error");
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editStudent) return;
    try {
      await apiRequest(`/students/${editStudent.id}/`, {
        method: "PUT",
        body: JSON.stringify(editStudent),
      });
      addToast("Student updated successfully!", "success");
      setShowEditModal(false);
      setEditStudent(null);
      loadStudents();
    } catch (err) {
      addToast(err.message || "Could not update student.", "error");
    }
  };

  const handleToggleStatus = async (student) => {
    try {
      const res = await apiRequest(`/students/${student.id}/toggle_status/`, {
        method: "PATCH",
      });
      addToast(`Status updated to ${res.data.status}`, "success");
      loadStudents();
    } catch (err) {
      addToast(err.message || "Could not toggle status.", "error");
    }
  };

  const handleResendEmail = async (student) => {
    try {
      const res = await apiRequest(`/students/${student.id}/resend_email/`, {
        method: "POST",
      });
      const pw = res.data?.temporary_password;
      addToast(pw ? `New temporary password: ${pw}` : (res.data?.message || "Temporary password sent!"), "success");
    } catch (err) {
      addToast(err.message || "Could not resend temporary password.", "error");
    }
  };

  const handleDeleteStudent = async (student) => {
    const ok = await showConfirm({
      title: "Delete Student",
      message: `Are you sure you want to delete student ${student.name} (${student.student_id})?`,
      confirmText: "Delete Student",
      danger: true,
    });
    if (!ok) return;
    try {
      await apiRequest(`/students/${student.id}/`, { method: "DELETE" });
      addToast("Student deleted successfully.", "success");
      loadStudents();
    } catch (err) {
      addToast(err.message || "Could not delete student.", "error");
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    const ok = await showConfirm({
      title: "Bulk Delete Students",
      message: `Delete ${selectedIds.length} selected students? This cannot be undone.`,
      confirmText: "Delete All",
      danger: true,
    });
    if (!ok) return;
    try {
      const res = await apiRequest("/students/bulk/", {
        method: "POST",
        body: JSON.stringify({ ids: selectedIds }),
      });
      addToast(res.data.message || "Students deleted.", "success");
      setSelectedIds([]);
      loadStudents();
    } catch (err) {
      addToast(err.message || "Bulk delete failed.", "error");
    }
  };

  const handleOpenDetail = async (student) => {
    setDetailStudent(student);
    setShowDetailModal(true);
    try {
      const res = await apiRequest(`/tracker/student/${student.id}/`);
      setStudentActivities(res.data.results || res.data || []);
    } catch {
      setStudentActivities([]);
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    try {
      if (importFile) {
        const formData = new FormData();
        formData.append("file", importFile);
        const res = await apiRequest("/students/bulk_import/", {
          method: "POST",
          body: formData,
        });
        addToast(res.data.message || `Imported ${res.data.imported} students!`, "success");
      } else if (importText.trim()) {
        const parsed = JSON.parse(importText);
        const res = await apiRequest("/students/bulk_import/", {
          method: "POST",
          body: JSON.stringify({ students: Array.isArray(parsed) ? parsed : [parsed] }),
        });
        addToast(res.data.message || `Imported ${res.data.imported} students!`, "success");
      }
      setShowImportModal(false);
      setImportFile(null);
      setImportText("");
      loadStudents();
    } catch (err) {
      addToast(err.message || "Bulk import failed. Please verify the format.", "error");
    }
  };

  const handleExportCSV = () => {
    if (!students.length) return;
    const headers = ["Student ID", "Name", "Personal Email", "Portal Email", "Phone", "Course", "Batch", "Status"];
    const rows = students.map((s) => [
      `"${s.student_id}"`,
      `"${s.name}"`,
      `"${s.personal_email}"`,
      `"${s.portal_email || ""}"`,
      `"${s.phone || ""}"`,
      `"${s.course || ""}"`,
      `"${s.batch || ""}"`,
      `"${s.status}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `students_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Derive unique courses for filter
  const courses = Array.from(new Set(students.map((s) => s.course).filter(Boolean)));

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}><IconGraduationCap size={18} style={{ color: "var(--primary)" }} /><span>Student Directory ({students.length})</span></h2>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          {selectedIds.length > 0 && (
            <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}>
              Delete Selected ({selectedIds.length})
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={() => setShowImportModal(true)}>
            Bulk Import
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleExportCSV}>
            Export CSV
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
            + Add Student
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="search-input-group">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            className="form-control"
            placeholder="Search by name, ID, username or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          <select
            className="form-control"
            style={{ width: "auto", minWidth: "160px" }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Pending">Pending</option>
          </select>

          <select
            className="form-control"
            style={{ width: "auto", minWidth: "180px" }}
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
          >
            <option value="all">All Courses</option>
            {courses.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: "40px" }}>
                <input
                  type="checkbox"
                  checked={selectedIds.length === students.length && students.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th>Student</th>
              <th>Student ID</th>
              <th>Course & Batch</th>
              <th>Contact Info</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: "32px" }}>Loading students...</td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "var(--slate-500)" }}>No student records found.</td></tr>
            ) : (
              students.map((s) => (
                <tr key={s.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(s.id)}
                      onChange={() => handleSelectOne(s.id)}
                    />
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div className="user-avatar" style={{ width: "36px", height: "36px", fontSize: "14px" }}>
                        {s.profile_photo ? (
                          <img src={s.profile_photo} alt={s.name} />
                        ) : (
                          (s.name || "S")[0].toUpperCase()
                        )}
                      </div>
                      <div>
                        <b>{s.name}</b>
                        <div style={{ fontSize: "12px", color: "var(--slate-500)" }}>@{s.username}</div>
                      </div>
                    </div>
                  </td>
                  <td><code>{s.student_id}</code></td>
                  <td>
                    <div>{s.course || "General"}</div>
                    <small style={{ color: "var(--slate-500)" }}>{s.batch || "—"}</small>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{s.personal_email}</div>
                    {s.portal_email && (
                      <div style={{ fontSize: "11.5px", color: "var(--primary)", marginTop: "1px" }}>{s.portal_email}</div>
                    )}
                    <small style={{ color: "var(--slate-500)", display: "block", marginTop: "2px" }}>{s.phone || "—"}</small>
                  </td>
                  <td>
                    <span
                      className={`badge badge-${s.status === "Active" ? "success" : s.status === "Pending" ? "warning" : "danger"}`}
                      style={{ cursor: "pointer" }}
                      title="Click to toggle status"
                      onClick={() => handleToggleStatus(s)}
                    >
                      {s.status} ⇄
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button className="btn btn-secondary btn-sm" title="View Details" onClick={() => handleOpenDetail(s)}>
                        View
                      </button>
                      <button className="btn btn-secondary btn-sm" title="Edit Student" onClick={() => { setEditStudent(s); setShowEditModal(true); }}>
                        Edit
                      </button>
                      <button className="btn btn-secondary btn-sm" title="Resend Temporary Password" onClick={() => handleResendEmail(s)}>
                        Email
                      </button>
                      <button className="btn btn-danger btn-sm" title="Delete" onClick={() => handleDeleteStudent(s)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Student Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Student Account"
        large
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={handleAddSubmit}>Create Student Account</button>
          </>
        }
      >
        <form className="form-grid" onSubmit={handleAddSubmit}>
          <div className="form-group">
            <label>Full Student Name *</label>
            <input
              required
              className="form-control"
              placeholder="e.g. John Doe"
              value={addForm.name}
              onChange={(e) => {
                const val = e.target.value;
                const slug = val.toLowerCase().replace(/[^a-z0-9]/g, '');
                const auto = slug ? `${slug.slice(0, 10)}${Math.floor(10 + Math.random() * 90)}` : '';
                setAddForm((prev) => ({
                  ...prev,
                  name: val,
                  username: (!prev.username || prev.username === prev._lastAuto) ? auto : prev.username,
                  _lastAuto: auto,
                }));
              }}
            />
          </div>
          <div className="form-group">
            <label>Student ID</label>
            <input
              disabled
              className="form-control"
              placeholder="Auto-generated e.g. STUD2026001"
              value="Auto-generated (e.g. STUD2026001)"
              style={{ background: "var(--slate-100)", cursor: "not-allowed", color: "var(--slate-500)" }}
            />
          </div>
          <div className="form-group">
            <label>Personal Email (e.g. Gmail / Yahoo) *</label>
            <input
              required
              type="email"
              className="form-control"
              placeholder="student@gmail.com"
              value={addForm.personal_email}
              onChange={(e) => setAddForm({ ...addForm, personal_email: e.target.value })}
            />
            <span style={{ fontSize: "12px", color: "var(--slate-500)", marginTop: "4px", display: "block" }}>
              College institutional email (@eduportal.edu) will be auto-generated.
            </span>
          </div>
          <div className="form-group">
            <label>Phone Number *</label>
            <input
              required
              type="tel"
              className="form-control"
              placeholder="+91 98765 00000"
              value={addForm.phone}
              onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Course / Department *</label>
            <select
              required
              className="form-control"
              value={addForm.course}
              onChange={(e) => setAddForm({ ...addForm, course: e.target.value })}
            >
              <option value="">Select Department</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Electronics">Electronics</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
              <option value="Civil Engineering">Civil Engineering</option>
              <option value="Information Technology">Information Technology</option>
            </select>
          </div>
          <div className="form-group">
            <label>Batch / Academic Year *</label>
            <input
              required
              className="form-control"
              placeholder="e.g. 2024-2028"
              value={addForm.batch}
              onChange={(e) => setAddForm({ ...addForm, batch: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Joining Date *</label>
            <input
              required
              type="date"
              className="form-control"
              value={addForm.joining_date}
              onChange={(e) => setAddForm({ ...addForm, joining_date: e.target.value })}
            />
          </div>
          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label>Portal Username</label>
              <button
                type="button"
                onClick={() => {
                  const slug = (addForm.name || "student").toLowerCase().replace(/[^a-z0-9]/g, '');
                  const gen = `${slug.slice(0, 10)}${Math.floor(10 + Math.random() * 90)}`;
                  setAddForm({ ...addForm, username: gen, _lastAuto: gen });
                }}
                style={{ background: "none", border: "none", color: "var(--primary)", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}
              >
                Auto-Generate
              </button>
            </div>
            <input
              className="form-control"
              placeholder="Auto-generated if left blank"
              value={addForm.username}
              onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
            />
            <span style={{ fontSize: "11px", color: "var(--slate-500)", marginTop: "2px", display: "block" }}>
              Leave blank to automatically generate from student name.
            </span>
          </div>
          <div className="form-group form-full">
            <label>Student Photo (Optional)</label>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginTop: "4px" }}>
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Selected Preview"
                  style={{ width: "52px", height: "52px", borderRadius: "50%", objectFit: "cover", border: "2px solid var(--primary)" }}
                />
              ) : (
                <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "var(--slate-100)", display: "grid", placeItems: "center", color: "var(--slate-400)" }}>
                  <IconGraduationCap size={22} />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <input
                  type="file"
                  accept="image/*"
                  className="form-control"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    setPhotoFile(file);
                    setPhotoPreview(file ? URL.createObjectURL(file) : null);
                  }}
                />
                <span style={{ fontSize: "11px", color: "var(--slate-500)", marginTop: "2px", display: "block" }}>
                  Upload JPG, PNG, or WEBP portrait photo.
                </span>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Edit Student Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Student Details"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleEditSubmit}>Save Changes</button>
          </>
        }
      >
        {editStudent && (
          <form className="form-grid" onSubmit={handleEditSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                className="form-control"
                value={editStudent.name}
                onChange={(e) => setEditStudent({ ...editStudent, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Personal Email</label>
              <input
                type="email"
                className="form-control"
                value={editStudent.personal_email}
                onChange={(e) => setEditStudent({ ...editStudent, personal_email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                className="form-control"
                value={editStudent.phone || ""}
                onChange={(e) => setEditStudent({ ...editStudent, phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Course / Department</label>
              <select
                className="form-control"
                value={editStudent.course || ""}
                onChange={(e) => setEditStudent({ ...editStudent, course: e.target.value })}
              >
                <option value="">Select Department</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Electronics">Electronics</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Civil Engineering">Civil Engineering</option>
                <option value="Information Technology">Information Technology</option>
              </select>
            </div>
            <div className="form-group">
              <label>Batch</label>
              <input
                className="form-control"
                value={editStudent.batch || ""}
                onChange={(e) => setEditStudent({ ...editStudent, batch: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                className="form-control"
                value={editStudent.status}
                onChange={(e) => setEditStudent({ ...editStudent, status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </form>
        )}
      </Modal>

      {/* Student Details Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={`Student Profile: ${detailStudent?.name || ""}`}
        large
        footer={<button className="btn btn-primary" onClick={() => setShowDetailModal(false)}>Close</button>}
      >
        {detailStudent && (
          <div>
            <div style={{ display: "flex", gap: "20px", alignItems: "center", marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px solid var(--border-color)" }}>
              <div className="user-avatar" style={{ width: "64px", height: "64px", fontSize: "24px" }}>
                {detailStudent.profile_photo ? (
                  <img src={detailStudent.profile_photo} alt={detailStudent.name} />
                ) : (
                  (detailStudent.name || "S")[0].toUpperCase()
                )}
              </div>
              <div>
                <h2>{detailStudent.name}</h2>
                <div style={{ color: "var(--slate-500)", fontSize: "14px" }}>
                  Student ID: <code>{detailStudent.student_id}</code> | Username: <code>@{detailStudent.username}</code>
                </div>
                <div style={{ marginTop: "6px" }}>
                  <span className={`badge badge-${detailStudent.status === "Active" ? "success" : "danger"}`}>{detailStudent.status}</span>
                  <span className={`badge badge-${detailStudent.totp_enabled ? "success" : "info"}`} style={{ marginLeft: "8px" }}>
                    2FA: {detailStudent.totp_enabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>
            </div>

            <div className="form-grid" style={{ marginBottom: "24px" }}>
              <div><b>Personal Email:</b> {detailStudent.personal_email}</div>
              <div><b>Portal Email:</b> {detailStudent.portal_email || "Auto-assigned"}</div>
              <div><b>Phone:</b> {detailStudent.phone || "N/A"}</div>
              <div><b>Course:</b> {detailStudent.course || "N/A"}</div>
              <div><b>Batch:</b> {detailStudent.batch || "N/A"}</div>
              <div><b>Last Login:</b> {detailStudent.last_login ? new Date(detailStudent.last_login).toLocaleString() : "Never logged in"}</div>
            </div>

            
          </div>
        )}
      </Modal>

      {/* Bulk Import Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Bulk Import Students"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowImportModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleImportSubmit}>Start Import</button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <p style={{ fontSize: "13px", color: "var(--slate-600)" }}>
            Upload a CSV file containing columns: <code>student_id, name, personal_email, course, batch, phone, username, password</code>
          </p>
          <div className="form-group">
            <label>Upload CSV File</label>
            <input
              type="file"
              accept=".csv"
              className="form-control"
              onChange={(e) => setImportFile(e.target.files[0])}
            />
          </div>
          <div style={{ textAlign: "center", color: "var(--slate-400)", fontSize: "12px" }}>— OR PASTE JSON —</div>
          <div className="form-group">
            <label>JSON Data</label>
            <textarea
              className="form-control"
              rows={4}
              placeholder='[{"student_id": "STU105", "name": "Deepak", "personal_email": "deepak@eduportal.edu", "course": "CS"}]'
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
