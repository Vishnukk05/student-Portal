import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api";
import { IconCalendar, IconSearch, IconDownload, IconFileText } from "../common/Icons";
import { Modal } from "../Modal";

export function StudentTimetable({ user, addToast }) {
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterMode, setFilterMode] = useState("my"); // "my" or "all"
  const [previewItem, setPreviewItem] = useState(null);

  useEffect(() => {
    loadTimetables();
  }, [filterMode]);

  const loadTimetables = async () => {
    setLoading(true);
    try {
      const url = filterMode === "my" && user.course ? `/timetables/?course=${encodeURIComponent(user.course)}` : "/timetables/";
      const res = await apiRequest(url);
      setTimetables(res.data.results || res.data || []);
    } catch (err) {
      addToast(err.message || "Failed to load course timetables.", "error");
    } finally {
      setLoading(false);
    }
  };

  const isImageFile = (url = "") => {
    return /\.(png|jpe?g|webp|gif|svg)($|\?)/i.test(url);
  };

  return (
    <div className="panel" style={{ padding: "24px" }}>
      <div className="panel-header" style={{ flexWrap: "wrap", gap: "14px", marginBottom: "20px" }}>
        <div>
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}><IconCalendar size={18} style={{ color: "var(--primary)" }} /><span>Class Routine & Timetable Schedules</span></h2>
          <p style={{ fontSize: "13px", color: "var(--slate-500)", marginTop: "4px" }}>
            Official class routine, lecture timings, and practical laboratory venue details.
          </p>
        </div>

        {/* View Filter Toggles */}
        <div style={{ display: "flex", gap: "8px", background: "var(--slate-100)", padding: "4px", borderRadius: "8px" }}>
          <button
            type="button"
            className={filterMode === "my" ? "btn btn-sm btn-primary" : "btn btn-sm btn-secondary"}
            onClick={() => setFilterMode("my")}
            style={{ border: "none" }}
          >
            My Department ({user.course || "Course"})
          </button>
          <button
            type="button"
            className={filterMode === "all" ? "btn btn-sm btn-primary" : "btn btn-sm btn-secondary"}
            onClick={() => setFilterMode("all")}
            style={{ border: "none" }}
          >
            All Campus Schedules
          </button>
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign: "center", padding: "40px", color: "var(--slate-400)" }}>Loading timetable routines...</p>
      ) : timetables.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--slate-500)" }}>
          <div style={{ display: "inline-flex", padding: "14px", borderRadius: "50%", background: "var(--primary-light)", color: "var(--primary)", marginBottom: "12px" }}><IconCalendar size={36} /></div>
          <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--slate-800)" }}>No timetable routines posted yet</p>
          <p style={{ fontSize: "13.5px", marginTop: "4px" }}>Your faculty or department coordinator will upload class routines here.</p>
          {filterMode === "my" && (
            <button className="btn btn-secondary btn-sm" onClick={() => setFilterMode("all")} style={{ marginTop: "12px" }}>
              View All Campus Schedules
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "20px" }}>
          {timetables.map((item) => {
            const hasImage = item.file_url && isImageFile(item.file_url);
            return (
              <div
                key={item.id}
                style={{
                  border: "1px solid var(--border-color)",
                  borderRadius: "12px",
                  padding: "20px",
                  background: "var(--bg-card)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                    <h3 style={{ fontSize: "17px", fontWeight: 700, color: "var(--slate-900)", margin: 0 }}>{item.title}</h3>
                    <span className="badge badge-primary">{item.course || "All Courses"}</span>
                  </div>

                  <div style={{ fontSize: "12px", color: "var(--slate-500)", marginTop: "6px" }}>
                    Published on {new Date(item.uploaded_at).toLocaleDateString()} by <b>{item.uploader_name || "Faculty Coordinator"}</b>
                  </div>

                  {item.notes && (
                    <div
                      style={{
                        background: "var(--slate-50)",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        marginTop: "12px",
                        fontSize: "13px",
                        color: "var(--slate-700)",
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.5,
                        border: "1px solid var(--slate-100)",
                      }}
                    >
                      {item.notes}
                    </div>
                  )}

                  {/* Box Preview Section */}
                  {item.file_url && (
                    <div style={{ marginTop: "14px" }}>
                      {hasImage ? (
                        <div
                          onClick={() => setPreviewItem(item)}
                          style={{
                            position: "relative",
                            borderRadius: "10px",
                            overflow: "hidden",
                            border: "1px solid var(--slate-200)",
                            cursor: "pointer",
                            height: "170px",
                            background: "var(--slate-100)",
                          }}
                          title="Click for big full-size preview"
                        >
                          <img
                            src={item.file_url}
                            alt={item.title}
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          />
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              background: "rgba(15, 23, 42, 0.45)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#ffffff",
                              fontSize: "13px",
                              fontWeight: 600,
                              gap: "8px",
                              transition: "opacity 0.2s ease",
                            }}
                          >
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><IconSearch size={14} /><span>Preview Routine</span></span>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => setPreviewItem(item)}
                          style={{
                            padding: "16px",
                            background: "var(--slate-50)",
                            border: "1px dashed var(--slate-300)",
                            borderRadius: "10px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "14px",
                          }}
                          title="Click to preview timetable document"
                        >
                          <IconFileText size={32} style={{ color: "var(--primary)" }} />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--slate-800)" }}>Class Routine Document</div>
                            <div style={{ fontSize: "12px", color: "var(--primary)", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}><IconSearch size={13} /><span>Click to Open Preview</span></div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div style={{ marginTop: "18px", paddingTop: "14px", borderTop: "1px solid var(--slate-100)", display: "flex", gap: "10px" }}>
                  {item.file_url ? (
                    <>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setPreviewItem(item)}
                        style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><IconSearch size={14} /><span>Preview</span></span>
                      </button>
                      <a
                        href={item.file_url}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><IconDownload size={14} /><span>Download</span></span>
                      </a>
                    </>
                  ) : (
                    <div style={{ textAlign: "center", width: "100%", fontSize: "12px", color: "var(--slate-400)" }}>
                      Routine published as text notes above
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Big Preview Modal */}
      {previewItem && (
        <Modal
          isOpen={!!previewItem}
          onClose={() => setPreviewItem(null)}
          title={`${previewItem.title} - Fullscreen Timetable`}
          large
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setPreviewItem(null)}>
                Close Preview
              </button>
              {previewItem.file_url && (
                <a
                  href={previewItem.file_url}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><IconDownload size={14} /><span>Download</span></span> Timetable File
                </a>
              )}
            </>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--slate-50)", padding: "12px 16px", borderRadius: "8px", fontSize: "13px" }}>
              <span>Department: <b>{previewItem.course || "All Courses"}</b> • Batch: <b>{previewItem.batch || "All"}</b></span>
              <span>Published: <b>{new Date(previewItem.uploaded_at).toLocaleDateString()}</b></span>
            </div>

            {previewItem.notes && (
              <div style={{ background: "var(--slate-50)", padding: "12px 16px", borderRadius: "8px", fontSize: "13.5px", color: "var(--slate-700)" }}>
                <b>Notes:</b> {previewItem.notes}
              </div>
            )}

            {previewItem.file_url ? (
              isImageFile(previewItem.file_url) ? (
                <div style={{ textAlign: "center", background: "#0f172a", borderRadius: "10px", padding: "16px", overflow: "auto", maxHeight: "70vh" }}>
                  <img
                    src={previewItem.file_url}
                    alt={previewItem.title}
                    style={{ maxWidth: "100%", height: "auto", borderRadius: "6px", display: "inline-block" }}
                  />
                </div>
              ) : (
                <div style={{ height: "65vh", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--slate-200)" }}>
                  <iframe
                    src={previewItem.file_url}
                    title={previewItem.title}
                    style={{ width: "100%", height: "100%", border: "none" }}
                  />
                </div>
              )
            ) : null}
          </div>
        </Modal>
      )}
    </div>
  );
}
