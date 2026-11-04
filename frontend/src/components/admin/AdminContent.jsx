import { showConfirm } from "../ConfirmModal";
import React, { useEffect, useState } from "react";
import { apiRequest, downloadContent } from "../../api";
import { IconBookOpen, IconDownload, IconFileText } from "../common/Icons";
import { Modal } from "../Modal";

export function AdminContent({ addToast }) {
  const [contentList, setContentList] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", category: "Computer Science", description: "" });
  const [uploadFile, setUploadFile] = useState(null);

  useEffect(() => {
    loadContent();
  }, [categoryFilter]);

  const loadContent = async () => {
    try {
      setLoading(true);
      const url = categoryFilter !== "all" ? `/content/?category=${categoryFilter}` : "/content/";
      const res = await apiRequest(url);
      setContentList(res.data.results || res.data || []);
    } catch (err) {
      addToast(err.message || "Failed to load academic materials.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      addToast("Please select a file to upload.", "error");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("category", form.category);
      formData.append("description", form.description);
      formData.append("file", uploadFile);

      await apiRequest("/content/", {
        method: "POST",
        body: formData,
      });

      addToast("Learning material uploaded successfully!", "success");
      setShowModal(false);
      setForm({ title: "", category: "Computer Science", description: "" });
      setUploadFile(null);
      loadContent();
    } catch (err) {
      addToast(err.message || "Could not upload material.", "error");
    }
  };

  const handleDelete = async (item) => {
    const ok = await showConfirm({
      title: "Delete E-Content",
      message: `Delete "${item.title}"?`,
      confirmText: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await apiRequest(`/content/${item.id}/`, { method: "DELETE" });
      addToast("Material removed.", "success");
      loadContent();
    } catch (err) {
      addToast(err.message || "Could not delete material.", "error");
    }
  };

  const categories = Array.from(new Set(contentList.map((c) => c.category).filter(Boolean)));

  const getFileIcon = (fileType) => {
    switch (fileType?.toLowerCase()) {
      case "image": return "Image";
      case "video": return "Video";
      case "audio": return "Audio";
      default: return "Document";
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}><IconBookOpen size={18} style={{ color: "var(--primary)" }} /><span>Academic E-Content Repository ({contentList.length})</span></h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
          + Upload Material
        </button>
      </div>

      <div className="filter-bar">
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            className={`btn btn-sm ${categoryFilter === "all" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setCategoryFilter("all")}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`btn btn-sm ${categoryFilter === cat ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setCategoryFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Material Title</th>
              <th>Category</th>
              <th>Uploaded By</th>
              <th>Downloads</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: "32px" }}>Loading materials...</td></tr>
            ) : contentList.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "var(--slate-500)" }}>No academic content found.</td></tr>
            ) : (
              contentList.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontSize: "20px" }}>{getFileIcon(item.file_type)}</td>
                  <td>
                    <b>{item.title}</b>
                    {item.description && (
                      <div style={{ fontSize: "12px", color: "var(--slate-500)", maxWidth: "280px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.description}
                      </div>
                    )}
                  </td>
                  <td><span className="badge badge-info">{item.category}</span></td>
                  <td>{item.uploader_name || "Admin"}</td>
                  <td><span className="badge badge-secondary">{item.download_count} downloads</span></td>
                  <td style={{ fontSize: "12px", color: "var(--slate-500)" }}>
                    {new Date(item.uploaded_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        title="Download file"
                        onClick={() => downloadContent(item.id, item.title || "material").catch((err) => addToast(err.message, "error"))}
                      >
                        Download
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item)} title="Delete material">
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

      {/* Upload Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Upload Academic Material"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleUploadSubmit}>Upload Material</button>
          </>
        }
      >
        <form onSubmit={handleUploadSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="form-group">
            <label>Material Title *</label>
            <input
              required
              className="form-control"
              placeholder="e.g. Database Management Systems Comprehensive Guide"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Category *</label>
            <input
              required
              className="form-control"
              placeholder="e.g. Computer Science, Mathematics, Guides"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              rows={3}
              className="form-control"
              placeholder="Provide a short synopsis or syllabus reference..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Choose File (PDF, Docs, Images, Media) *</label>
            <input
              type="file"
              required
              className="form-control"
              onChange={(e) => setUploadFile(e.target.files[0])}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
