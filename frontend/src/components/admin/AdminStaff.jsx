import { showConfirm } from "../ConfirmModal";
import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api";
import { IconUsers, IconShieldCheck } from "../common/Icons";
import { Modal } from "../Modal";

export function AdminStaff({ addToast }) {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "admin",
    subject: "",
    password: "",
  });

  useEffect(() => {
    loadStaff();
  }, [roleFilter]);

  const loadStaff = async () => {
    setLoading(true);
    try {
      const url = roleFilter === "all" ? "/staff/" : `/staff/?role=${roleFilter}`;
      const res = await apiRequest(url);
      setStaffList(res.data.results || res.data || []);
    } catch (err) {
      addToast(err.message || "Failed to load accounts list.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = (defaultRole = "admin") => {
    setEditingId(null);
    setForm({ name: "", email: "", role: defaultRole, subject: "", password: "" });
    setShowModal(true);
  };

  const handleOpenEdit = (staff) => {
    setEditingId(staff.id);
    setForm({
      name: staff.name,
      email: staff.email,
      role: staff.role || "staff",
      subject: staff.subject || "",
      password: "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        subject: form.role === "staff" ? form.subject.trim() : (form.subject.trim() || "System Administration"),
      };
      if (form.password.trim()) {
        payload.password = form.password.trim();
      }

      if (editingId) {
        await apiRequest(`/staff/${editingId}/`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        addToast("Account profile updated successfully!", "success");
      } else {
        if (!form.password.trim()) {
          addToast("Password is required for new accounts.", "error");
          return;
        }
        await apiRequest("/staff/", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        addToast(`New ${form.role === "admin" ? "Administrator" : "Faculty Staff"} account created successfully!`, "success");
      }
      setShowModal(false);
      loadStaff();
    } catch (err) {
      addToast(err.message || "Failed to save account.", "error");
    }
  };

  const handleDelete = async (staff) => {
    const isTargetAdmin = staff.role === "admin";
    const ok = await showConfirm({
      title: `Delete ${isTargetAdmin ? "Admin" : "Staff"} Account`,
      message: `Delete ${isTargetAdmin ? "administrator" : "faculty staff"} account "${staff.name}" (${staff.email})?`,
      confirmText: "Delete Account",
      danger: true,
    });
    if (!ok) return;
    try {
      await apiRequest(`/staff/${staff.id}/`, { method: "DELETE" });
      addToast("Account removed successfully.", "success");
      loadStaff();
    } catch (err) {
      addToast(err.message || "Failed to delete account.", "error");
    }
  };

  const filteredStaff = staffList.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.subject?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="panel">
      <div className="panel-header" style={{ flexWrap: "wrap", gap: "14px" }}>
        <div>
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}><IconUsers size={18} style={{ color: "var(--primary)" }} /><span>Staff & Administrators Management ({staffList.length})</span></h2>
          <p style={{ fontSize: "13px", color: "var(--slate-500)", marginTop: "4px" }}>
            Add and manage system administrators, managers, and teaching faculty.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn btn-secondary" onClick={() => handleOpenAdd("staff")}>
            + Add Faculty Staff
          </button>
          <button className="btn btn-primary" onClick={() => handleOpenAdd("admin")}>
            + Add New Admin
          </button>
        </div>
      </div>

      {/* Role Filter Tabs & Search Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", margin: "20px 0", flexWrap: "wrap" }}>
        <div style={{ display: "flex", background: "var(--slate-100)", padding: "4px", borderRadius: "10px", gap: "4px" }}>
          <button
            type="button"
            onClick={() => setRoleFilter("all")}
            className={roleFilter === "all" ? "btn btn-sm btn-primary" : "btn btn-sm btn-secondary"}
            style={{ border: "none" }}
          >
            All Accounts
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter("admin")}
            className={roleFilter === "admin" ? "btn btn-sm btn-primary" : "btn btn-sm btn-secondary"}
            style={{ border: "none" }}
          >
            Administrators
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter("staff")}
            className={roleFilter === "staff" ? "btn btn-sm btn-primary" : "btn btn-sm btn-secondary"}
            style={{ border: "none" }}
          >
            Faculty Staff
          </button>
        </div>

        <input
          type="text"
          className="form-control"
          placeholder="Search accounts by name, email, or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: "380px" }}
        />
      </div>

      {loading ? (
        <p style={{ textAlign: "center", padding: "32px" }}>Loading directory...</p>
      ) : filteredStaff.length === 0 ? (
        <p style={{ textAlign: "center", padding: "32px", color: "var(--slate-500)" }}>
          {search ? "No accounts match your search." : "No accounts found under this category."}
        </p>
      ) : (
        <div className="table-responsive" style={{ border: "1px solid var(--border-color)", borderRadius: "8px", background: "var(--bg-card)" }}>
          <table className="data-table" style={{ width: "100%", minWidth: "750px" }}>
            <thead>
              <tr>
                <th style={{ width: "26%" }}>Name & Role</th>
                <th style={{ width: "20%" }}>Department / Subject</th>
                <th style={{ width: "24%" }}>Email</th>
                <th style={{ width: "12%", textAlign: "center" }}>Security (2FA)</th>
                <th style={{ width: "10%" }}>Joined</th>
                <th style={{ width: "8%", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((staff) => {
                const isAdminAccount = staff.role === "admin";
                return (
                  <tr key={staff.id}>
                    <td style={{ fontWeight: 600 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            background: isAdminAccount
                              ? "linear-gradient(135deg, #7c3aed, #4f46e5)"
                              : "linear-gradient(135deg, #0284c7, #0369a1)",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: "14px",
                          }}
                        >
                          {(staff.name || "A")[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: "var(--slate-900)" }}>{staff.name}</div>
                          <span
                            className={isAdminAccount ? "badge badge-primary" : "badge badge-info"}
                            style={{ fontSize: "11px", padding: "2px 8px" }}
                          >
                            {isAdminAccount ? "Administrator" : "Faculty Staff"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          background: "var(--slate-100)",
                          color: "var(--slate-800)",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          fontWeight: 600,
                          fontSize: "13px",
                        }}
                      >
                        {isAdminAccount ? "Full Admin Access" : (staff.subject || "Faculty")}
                      </span>
                    </td>
                    <td>
                      <code>{staff.email}</code>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className={`badge badge-${staff.totp_enabled ? "success" : "danger"}`}>
                        {staff.totp_enabled ? "2FA Active" : "Disabled"}
                      </span>
                    </td>
                    <td style={{ fontSize: "13px", color: "var(--slate-500)" }}>
                      {new Date(staff.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEdit(staff)}>
                          Edit
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(staff)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Admin & Faculty Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? `Edit ${form.role === "admin" ? "Administrator" : "Faculty Staff"}` : `Add New ${form.role === "admin" ? "Administrator" : "Faculty Staff"}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              {editingId ? "Save Changes" : "Create Account"}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="form-group">
            <label>Account Role *</label>
            <select
              className="form-control"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="admin">Administrator (Full Portal & Settings Access)</option>
              <option value="staff">Faculty Staff (Course & Grading Management)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Full Name *</label>
            <input
              required
              className="form-control"
              placeholder="e.g. John Administrator or Dr. Alan Turing"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          {form.role === "staff" ? (
            <div className="form-group">
              <label>Teaching Subject / Specialization *</label>
              <input
                required
                className="form-control"
                placeholder="e.g. Computer Science & AI, Advanced Mathematics, Physics"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
            </div>
          ) : (
            <div className="form-group">
              <label>Designation / Department (Optional)</label>
              <input
                className="form-control"
                placeholder="e.g. Head of Academic Administration"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
            </div>
          )}

          <div className="form-group">
            <label>Email Address *</label>
            <input
              type="email"
              required
              className="form-control"
              placeholder="name@eduportal.edu"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>{editingId ? "New Password (leave blank to keep current)" : "Password *"}</label>
            <input
              type="password"
              required={!editingId}
              className="form-control"
              placeholder={editingId ? "••••••••" : "At least 6 characters"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
