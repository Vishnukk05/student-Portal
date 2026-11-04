import { showConfirm } from "../ConfirmModal";
import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api";
import { IconCalendar } from "./Icons";
import { Modal } from "../Modal";

export function CalendarWidget({ user, compact = false, addToast }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const isAdmin = user.role === "admin" || user.role === "staff";

  // Month navigation state
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), today.getDate())
  );

  // Add Event Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    title: "",
    event_type: "Lecture",
    start_time: new Date().toISOString().slice(0, 16),
    end_time: "",
    meeting_link: "https://meet.google.com/new",
    description: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("/calendar/");
      setEvents(res.data.results || res.data || []);
    } catch {
      // silent fallback
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const openAddModalForDate = (dt) => {
    const target = dt || selectedDate || new Date();
    const y = target.getFullYear();
    const m = String(target.getMonth() + 1).padStart(2, "0");
    const d = String(target.getDate()).padStart(2, "0");
    setForm({
      title: "",
      event_type: "Event Announcement",
      start_time: `${y}-${m}-${d}T09:00`,
      end_time: "",
      meeting_link: "",
      description: "",
    });
    setShowAddModal(true);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiRequest("/calendar/", {
        method: "POST",
        body: JSON.stringify({
          title: form.title.trim(),
          event_type: form.event_type,
          start_time: form.start_time,
          end_time: form.end_time || null,
          meeting_link: form.meeting_link.trim(),
          description: form.description.trim(),
        }),
      });
      if (addToast) addToast("Campus event added to calendar!", "success");
      setShowAddModal(false);
      loadEvents();
    } catch (err) {
      if (addToast) addToast(err.message || "Failed to create event.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ev) => {
    const ok = await showConfirm({
      title: "Delete Calendar Event",
      message: `Delete calendar event "${ev.title}"?`,
      confirmText: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await apiRequest(`/calendar/${ev.id}/`, { method: "DELETE" });
      if (addToast) addToast("Event deleted from calendar.", "success");
      loadEvents();
    } catch (err) {
      if (addToast) addToast(err.message || "Could not delete event.", "error");
    }
  };

  // Generate calendar days
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const calendarCells = [];
  // Previous month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarCells.push({
      day: daysInPrevMonth - i,
      month: currentMonth - 1,
      year: currentYear,
      isOtherMonth: true,
    });
  }
  // Current month days
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    calendarCells.push({
      day: d,
      month: currentMonth,
      year: currentYear,
      isOtherMonth: false,
    });
  }
  // Next month leading days to fill grid (35 or 42 cells)
  const remainingCells = (calendarCells.length > 35 ? 42 : 35) - calendarCells.length;
  for (let d = 1; d <= remainingCells; d++) {
    calendarCells.push({
      day: d,
      month: currentMonth + 1,
      year: currentYear,
      isOtherMonth: true,
    });
  }

  // Filter events for a given day
  const getEventsForDate = (y, m, d) => {
    return events.filter((ev) => {
      if (!ev.start_time) return false;
      const evDate = new Date(ev.start_time);
      return (
        evDate.getFullYear() === y &&
        evDate.getMonth() === m &&
        evDate.getDate() === d
      );
    });
  };

  const selectedDateEvents = selectedDate
    ? getEventsForDate(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())
    : [];

  const displayEvents = selectedDateEvents.length > 0 ? selectedDateEvents : events.slice(0, 3);

  return (
    <div className="panel calendar-widget-panel" style={{ display: "flex", flexDirection: "column", padding: "22px 24px" }}>
      {/* Panel Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid var(--border-color)" }}>
        <div>
          <h3 style={{ fontSize: "16.5px", fontWeight: 700, margin: 0, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
            <IconCalendar size={18} style={{ color: "var(--primary)" }} />
            <span>Academic Calendar & Campus Announcements</span>
          </h3>
          <p style={{ fontSize: "12px", color: "var(--slate-500)", margin: "2px 0 0" }}>
            Scheduled lectures, live sessions, exams & daily event announcements
          </p>
        </div>

      </div>

      {/* Two-Column Unified Layout in ONE outer box */}
      <div className="calendar-split-layout">
        {/* Left Column: Compact Monthly Calendar */}
        <div className="calendar-left-pane">
          {/* Month Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <button
              type="button"
              onClick={handlePrevMonth}
              style={{ background: "var(--bg-main)", border: "1px solid var(--border-color)", borderRadius: "6px", width: "28px", height: "28px", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-main)" }}
              title="Previous Month"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-main)" }}>
              {monthNames[currentMonth]} {currentYear}
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              style={{ background: "var(--bg-main)", border: "1px solid var(--border-color)", borderRadius: "6px", width: "28px", height: "28px", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-main)" }}
              title="Next Month"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          {/* Calendar Month Grid */}
          <table className="mini-calendar" style={{ width: "100%", borderCollapse: "separate", borderSpacing: "2px", textAlign: "center" }}>
            <thead>
              <tr>
                {dayNames.map((d, i) => (
                  <th key={i} style={{ fontSize: "11px", fontWeight: 700, color: "var(--slate-400)", padding: "6px 0", textTransform: "uppercase" }}>
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: Math.ceil(calendarCells.length / 7) }).map((_, weekIdx) => (
                <tr key={weekIdx}>
                  {calendarCells.slice(weekIdx * 7, weekIdx * 7 + 7).map((cell, cellIdx) => {
                    const cellEvents = !cell.isOtherMonth ? getEventsForDate(cell.year, cell.month, cell.day) : [];
                    const isToday =
                      !cell.isOtherMonth &&
                      today.getFullYear() === cell.year &&
                      today.getMonth() === cell.month &&
                      today.getDate() === cell.day;
                    const isSelected =
                      !cell.isOtherMonth &&
                      selectedDate &&
                      selectedDate.getFullYear() === cell.year &&
                      selectedDate.getMonth() === cell.month &&
                      selectedDate.getDate() === cell.day;

                    return (
                      <td key={cellIdx} style={{ padding: "2px", textAlign: "center" }}>
                        <button
                          type="button"
                          disabled={cell.isOtherMonth}
                          onClick={() => {
                            if (!cell.isOtherMonth) {
                              setSelectedDate(new Date(cell.year, cell.month, cell.day));
                            }
                          }}
                          className={`calendar-day-btn ${cell.isOtherMonth ? "other-month" : ""} ${isToday ? "is-today" : ""} ${isSelected ? "is-selected" : ""}`}
                          style={{
                            width: "34px",
                            height: "34px",
                            margin: "0 auto",
                            borderRadius: "50%",
                            border: isToday && !isSelected ? "1.5px solid var(--primary)" : "none",
                            background: isSelected ? "var(--primary)" : "transparent",
                            color: isSelected ? "#ffffff" : cell.isOtherMonth ? "var(--text-muted)" : "var(--text-main)",
                            fontWeight: isToday || isSelected ? 700 : 500,
                            fontSize: "13px",
                            cursor: cell.isOtherMonth ? "default" : "pointer",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            position: "relative",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <span>{cell.day}</span>
                          {cellEvents.length > 0 && (
                            <span
                              className="calendar-event-dot"
                              style={{
                                width: "4px",
                                height: "4px",
                                borderRadius: "50%",
                                background: isSelected ? "#ffffff" : "#f59e0b",
                                position: "absolute",
                                bottom: "3px",
                              }}
                            />
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right Column: Events & Announcements for Selected Date */}
        <div className="calendar-right-pane">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", paddingBottom: "10px", borderBottom: "1px solid var(--border-color)" }}>
            <div>
              <h4 style={{ fontSize: "14.5px", fontWeight: 700, margin: 0, color: "var(--text-main)" }}>
                {selectedDate
                  ? `Events on ${selectedDate.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: "numeric" })}`
                  : "Upcoming Campus Events"}
              </h4>
              <span style={{ fontSize: "11.5px", color: "var(--slate-500)" }}>
                {selectedDateEvents.length} event{selectedDateEvents.length !== 1 ? "s" : ""} on this date
              </span>
            </div>

          </div>

          {loading ? (
            <p style={{ textAlign: "center", padding: "24px", color: "var(--slate-400)", fontSize: "13px" }}>Loading events...</p>
          ) : selectedDateEvents.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "var(--bg-main)", borderRadius: "8px", border: "1px solid var(--border-color)", fontSize: "12px" }}>
                <span style={{ color: "var(--text-muted)" }}>
                  No sessions for <strong>{selectedDate ? selectedDate.toLocaleDateString([], { month: "short", day: "numeric" }) : "today"}</strong>. Showing upcoming schedule:
                </span>
                {isAdmin && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => openAddModalForDate(selectedDate)}
                    style={{ fontSize: "11px", padding: "2px 8px" }}
                  >
                    + Add Event
                  </button>
                )}
              </div>
              {events.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 16px", background: "var(--bg-main)", borderRadius: "10px", border: "1px dashed var(--border-color)", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "6px" }}>
                  <IconCalendar size={20} style={{ color: "var(--primary)" }} />
                  <p style={{ fontSize: "13px", fontWeight: 700, margin: 0, color: "var(--text-main)" }}>No Campus Events Scheduled Yet</p>
                  <p style={{ fontSize: "11.5px", color: "var(--slate-500)", margin: 0 }}>Check back later for newly announced sessions.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto", maxHeight: "300px" }}>
                  {events.slice(0, 4).map((ev) => {
                    const hasLink = ev.meeting_link && ev.meeting_link.trim().startsWith("http");
                    return (
                      <div
                        key={ev.id}
                        style={{
                          border: "1px solid var(--border-color)",
                          borderRadius: "10px",
                          padding: "10px 14px",
                          background: "var(--bg-main)",
                          display: "flex",
                          flexDirection: "column",
                          gap: "5px",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                          <div>
                            <div style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--text-main)" }}>{ev.title}</div>
                            <div style={{ fontSize: "11.5px", color: "var(--primary)", fontWeight: 600, marginTop: "2px" }}>
                              {new Date(ev.start_time).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>
                          <span className="badge badge-primary" style={{ fontSize: "10px", padding: "2px 8px" }}>{ev.event_type}</span>
                        </div>
                        {ev.description && (
                          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0, lineHeight: 1.4 }}>{ev.description}</p>
                        )}
                        {hasLink && (
                          <div style={{ marginTop: "4px" }}>
                            <a href={ev.meeting_link} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{ fontSize: "11px", padding: "3px 8px", fontWeight: 600 }}>
                              Join Meeting
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto", maxHeight: "320px" }}>
              {selectedDateEvents.map((ev) => {
                const hasLink = ev.meeting_link && ev.meeting_link.trim().startsWith("http");
                return (
                  <div
                    key={ev.id}
                    style={{
                      border: "1px solid var(--border-color)",
                      borderRadius: "10px",
                      padding: "12px 14px",
                      background: "var(--bg-main)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-main)" }}>
                          {ev.title}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--slate-500)", marginTop: "2px" }}>
                          {new Date(ev.start_time).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                        </div>
                      </div>
                      <span className="badge badge-primary" style={{ fontSize: "10.5px", padding: "2px 8px" }}>
                        {ev.event_type}
                      </span>
                    </div>

                    {ev.description && (
                      <p style={{ fontSize: "12.5px", color: "var(--text-muted)", margin: 0, lineHeight: 1.45 }}>
                        {ev.description}
                      </p>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
                      {hasLink ? (
                        <a
                          href={ev.meeting_link}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-primary btn-sm"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            fontSize: "11.5px",
                            padding: "4px 10px",
                            fontWeight: 600,
                          }}
                        >
                          Join Event / Meeting
                        </a>
                      ) : (
                        <span style={{ fontSize: "11px", color: "var(--slate-400)" }}>Campus Venue / Hall</span>
                      )}

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDelete(ev)}
                          style={{ background: "transparent", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: "12px" }}
                          title="Delete event"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>


      {/* Add Event Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Schedule Academic Event / Meeting"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleCreateSubmit} disabled={saving}>
              {saving ? "Scheduling..." : "Add to Calendar"}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="form-group">
            <label>Event / Meeting Title *</label>
            <input
              required
              className="form-control"
              placeholder="e.g. Guest Lecture: Cloud Computing Architecture"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Event Category</label>
              <select
                className="form-control"
                value={form.event_type}
                onChange={(e) => setForm({ ...form, event_type: e.target.value })}
              >
                <option value="Event Announcement">Event Announcement</option>
                <option value="Lecture">Live Lecture</option>
                <option value="Webinar">Webinar / Workshop</option>
                <option value="Meeting">Academic Meeting</option>
                <option value="Exam">Examination</option>
                <option value="Holiday">Campus Holiday</option>
                <option value="Activity">Campus Activity</option>
              </select>
            </div>
            <div className="form-group">
              <label>Start Date & Time *</label>
              <input
                type="datetime-local"
                required
                className="form-control"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Meeting / Join Link (Google Meet, Zoom, MS Teams)</label>
            <input
              type="url"
              className="form-control"
              placeholder="https://meet.google.com/xyz-abc-def"
              value={form.meeting_link}
              onChange={(e) => setForm({ ...form, meeting_link: e.target.value })}
            />
            <div className="form-text">Students and staff can click "Join Event" to launch this meeting.</div>
          </div>

          <div className="form-group">
            <label>Description / Agenda</label>
            <textarea
              rows={3}
              className="form-control"
              placeholder="Meeting agenda, reading material, or room info..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
