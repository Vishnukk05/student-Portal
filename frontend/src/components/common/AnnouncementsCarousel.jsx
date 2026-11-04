import React, { useState, useEffect } from "react";
import { IconMegaphone, IconCalendar, IconArrowRight } from "./Icons";

export function AnnouncementsCarousel({ announcements = [], onRead, onViewAll, isAdmin = false, onPost }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const total = announcements.length;

  useEffect(() => {
    if (currentIndex >= total && total > 0) {
      setCurrentIndex(0);
    }
  }, [total]);

  if (!announcements || announcements.length === 0) {
    return (
      <div className="panel announcements-panel-modern">
        <div className="panel-header" style={{ marginBottom: "14px" }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <IconMegaphone size={18} style={{ color: "var(--primary)" }} />
            <span>Campus Announcements</span>
          </h2>
          {isAdmin && onPost && (
            <button className="btn btn-primary btn-sm" onClick={onPost} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <span>+ Post Notice</span>
            </button>
          )}
        </div>
        <div className="empty-announcements-card">
          <div className="empty-icon-glow" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IconMegaphone size={32} />
          </div>
          <h4 style={{ margin: "10px 0 6px", color: "var(--slate-800)", fontWeight: 700 }}>
            No Announcements Published
          </h4>
          <p style={{ color: "var(--slate-500)", fontSize: "13px", maxWidth: "340px", margin: "0 auto" }}>
            Campus schedules, academic updates, and administrative alerts will appear here in the announcement reel.
          </p>
          {isAdmin && onPost && (
            <button className="btn btn-primary btn-sm" style={{ marginTop: "16px" }} onClick={onPost}>
              Broadcast First Notice
            </button>
          )}
        </div>
      </div>
    );
  }

  const current = announcements[currentIndex] || announcements[0];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  return (
    <div className="panel announcements-panel-modern">
      <div className="panel-header" style={{ marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <IconMegaphone size={18} style={{ color: "var(--primary)" }} />
            <span>Campus Broadcasts</span>
          </h2>
          <span className="badge badge-primary" style={{ fontSize: "11px", fontWeight: 700 }}>
            {total} Live Notice{total > 1 ? "s" : ""}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {total > 1 && (
            <div className="announcement-nav-btns">
              <button
                type="button"
                className="btn-round-nav"
                onClick={handlePrev}
                title="Previous announcement"
                aria-label="Previous announcement"
              >
                ‹
              </button>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--slate-500)", padding: "0 4px" }}>
                {currentIndex + 1} / {total}
              </span>
              <button
                type="button"
                className="btn-round-nav"
                onClick={handleNext}
                title="Next announcement"
                aria-label="Next announcement"
              >
                ›
              </button>
            </div>
          )}
          {onViewAll && (
            <button className="btn btn-secondary btn-sm" onClick={onViewAll}>
              View All
            </button>
          )}
          {isAdmin && onPost && (
            <button className="btn btn-primary btn-sm" onClick={onPost} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <span>+ Post</span>
            </button>
          )}
        </div>
      </div>

      {/* Modern Slide Card */}
      <div
        className="announcement-slide-card"
        onClick={() => onRead ? onRead(current) : onViewAll ? onViewAll() : null}
      >
        <div className="announcement-slide-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span className="announcement-tag-official">OFFICIAL BROADCAST</span>
            {!current.is_read && (
              <span className="badge badge-success" style={{ fontSize: "10.5px" }}>NEW</span>
            )}
          </div>
          <span className="announcement-date" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <IconCalendar size={13} />
            <span>
              {new Date(current.created_at || current.published_at || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </span>
        </div>

        <h3 className="announcement-slide-title">
          {current.title}
        </h3>

        <p className="announcement-slide-body">
          {current.content}
        </p>

        <div className="announcement-slide-footer">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div className="author-mini-avatar">
              {(current.author_name || "A")[0].toUpperCase()}
            </div>
            <span style={{ fontSize: "12.5px", color: "var(--slate-600)", fontWeight: 500 }}>
              Posted by <b>{current.author_name || "Administration"}</b>
            </span>
          </div>

          <span className="read-more-link" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span>Open Notice</span>
            <IconArrowRight size={13} />
          </span>
        </div>
      </div>

      {/* Bottom Mini Thumbnails / Dots for Slides */}
      {total > 1 && (
        <div className="announcements-dots-row">
          {announcements.map((item, idx) => (
            <button
              key={item.id || idx}
              type="button"
              className={`announcement-dot ${idx === currentIndex ? "active" : ""}`}
              onClick={() => setCurrentIndex(idx)}
              title={item.title}
              aria-label={`Announcement slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
