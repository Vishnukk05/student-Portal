import React, { useEffect, useState } from "react";
import { apiRequest, downloadContent } from "../../api";
import { IconBookOpen, IconDownload, IconFileText } from "../common/Icons";

export function StudentContent({ addToast }) {
  const [contentList, setContentList] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

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
      addToast(err.message || "Failed to load learning materials.", "error");
    } finally {
      setLoading(false);
    }
  };

  const categories = Array.from(new Set(contentList.map((c) => c.category).filter(Boolean)));

  const filtered = contentList.filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return item.title?.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q);
  });

  const getFileIcon = (fileType) => {
    return (
      <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <IconFileText size={22} />
      </div>
    );
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}><IconBookOpen size={18} style={{ color: "var(--primary)" }} /><span>Academic E-Content Repository ({filtered.length})</span></h2>
      </div>

      <div className="filter-bar">
        <div className="search-input-group">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            className="form-control"
            placeholder="Search learning materials by title or topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            className={`btn btn-sm ${categoryFilter === "all" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setCategoryFilter("all")}
          >
            All
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

      {loading ? (
        <p style={{ textAlign: "center", padding: "32px" }}>Loading materials...</p>
      ) : filtered.length === 0 ? (
        <p style={{ textAlign: "center", padding: "32px", color: "var(--slate-500)" }}>No materials found.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
          {filtered.map((item) => (
            <div
              key={item.id}
              style={{
                border: "1px solid var(--slate-200)",
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div style={{ fontSize: "28px" }}>{getFileIcon(item.file_type)}</div>
                  <span className="badge badge-info">{item.category}</span>
                </div>
                <h3 style={{ fontSize: "16px", color: "var(--slate-900)", marginBottom: "6px" }}>{item.title}</h3>
                <p style={{ fontSize: "13px", color: "var(--slate-600)", lineHeight: 1.5, marginBottom: "16px" }}>
                  {item.description || "No description provided."}
                </p>
              </div>

              <div>
                <div style={{ fontSize: "12px", color: "var(--slate-400)", marginBottom: "12px" }}>
                  Uploaded by {item.uploader_name || "Administration"} • <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}><IconDownload size={12} /><span>{item.download_count || 0} downloads</span></span>
                </div>
                <button
                  className="btn btn-primary"
                  style={{ width: "100%" }}
                  onClick={async () => {
                    try {
                      await downloadContent(item.id, item.title || "material");
                      addToast(`Downloading "${item.title}"...`, "info");
                    } catch (err) {
                      addToast(err.message, "error");
                    }
                  }}
                >
                  Download Material
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
