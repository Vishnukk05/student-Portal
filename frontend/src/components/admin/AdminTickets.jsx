import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api";
import { IconLifeBuoy, IconPaperclip } from "../common/Icons";
import { Modal } from "../Modal";

export function AdminTickets({ addToast }) {
  const [tickets, setTickets] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  // Response Modal
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [responseStatus, setResponseStatus] = useState("In Progress");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    loadTickets();
  }, [statusFilter]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const url = statusFilter !== "all" ? `/tickets/?status=${statusFilter}` : "/tickets/";
      const res = await apiRequest(url);
      setTickets(res.data.results || res.data || []);
    } catch (err) {
      addToast(err.message || "Failed to load support tickets.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenResponse = (ticket) => {
    setSelectedTicket(ticket);
    setResponseStatus(ticket.status || "In Progress");
    setRemarks(ticket.response || "");
  };

  const handleResponseSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    try {
      await apiRequest(`/tickets/${selectedTicket.id}/`, {
        method: "PUT",
        body: JSON.stringify({
          ...selectedTicket,
          status: responseStatus,
          response: remarks,
        }),
      });
      addToast(`Ticket #${selectedTicket.ticket_id} updated and notification sent to student!`, "success");
      setSelectedTicket(null);
      loadTickets();
    } catch (err) {
      addToast(err.message || "Could not update ticket.", "error");
    }
  };

  const filtered = tickets.filter((t) => {
    if (priorityFilter !== "all" && t.priority?.toLowerCase() !== priorityFilter.toLowerCase()) return false;
    return true;
  });

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}><IconLifeBuoy size={18} style={{ color: "var(--primary)" }} /><span>Support Desk Tickets ({filtered.length})</span></h2>
      </div>

      <div className="filter-bar">
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {["all", "Pending", "In Progress", "Completed"].map((st) => (
            <button
              key={st}
              className={`btn btn-sm ${statusFilter === st ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setStatusFilter(st)}
            >
              {st === "all" ? "All Tickets" : st}
            </button>
          ))}
        </div>

        <select
          className="form-control"
          style={{ width: "auto", marginLeft: "auto" }}
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="all">Priority: All</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Student</th>
              <th>Category</th>
              <th>Priority</th>
              <th>Subject</th>
              <th>Status</th>
              <th>Created Time</th>
              <th>Updated Time</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: "center", padding: "32px" }}>Loading tickets...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: "center", padding: "32px", color: "var(--slate-500)" }}>No tickets found matching current filters.</td></tr>
            ) : (
              filtered.map((t) => (
                <tr key={t.id}>
                  <td><code>{t.ticket_id || `#${t.id}`}</code></td>
                  <td>
                    <b>{t.student_name || `Student #${t.student}`}</b>
                    <div style={{ fontSize: "12px", color: "var(--slate-500)" }}>{t.student_code}</div>
                  </td>
                  <td><span className="badge badge-info">{t.category}</span></td>
                  <td>
                    <span className={`badge badge-${t.priority === "High" ? "danger" : t.priority === "Medium" ? "warning" : "info"}`}>
                      {t.priority}
                    </span>
                  </td>
                  <td>
                    <b>{t.subject}</b>
                    <div style={{ fontSize: "12px", color: "var(--slate-500)", maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t.description}
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-${t.status === "Completed" ? "success" : t.status === "In Progress" ? "info" : "warning"}`}>
                      {t.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-main)" }}>
                      {new Date(t.created_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--slate-500)" }}>
                      {new Date(t.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-main)" }}>
                      {new Date(t.updated_at || t.created_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--slate-500)" }}>
                      {new Date(t.updated_at || t.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </td>
                  <td>
                    <button className="btn btn-primary btn-sm" onClick={() => handleOpenResponse(t)}>
                      Respond
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Response Modal */}
      <Modal
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title={`Review Ticket #${selectedTicket?.ticket_id || ""}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setSelectedTicket(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleResponseSubmit}>Save & Notify Student</button>
          </>
        }
      >
        {selectedTicket && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ background: "var(--slate-50)", padding: "14px", borderRadius: "8px", border: "1px solid var(--slate-200)" }}>
              <div style={{ fontSize: "14px", color: "var(--text-main)", marginBottom: "4px" }}>
                <b>Student:</b> {selectedTicket.student_name} ({selectedTicket.student_code})
              </div>
              <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "var(--slate-500)", marginBottom: "8px" }}>
                <span><b>Created:</b> {new Date(selectedTicket.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</span>
                <span><b>Updated:</b> {new Date(selectedTicket.updated_at || selectedTicket.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</span>
              </div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--slate-900)", marginBottom: "6px" }}>
                Subject: {selectedTicket.subject}
              </div>
              <p style={{ fontSize: "13px", color: "var(--slate-700)", whiteSpace: "pre-wrap" }}>
                {selectedTicket.description}
              </p>
              {selectedTicket.attachment_url && (
                <div style={{ marginTop: "10px" }}>
                  <a href={selectedTicket.attachment_url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                    View Attached File
                  </a>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Update Ticket Status</label>
              <select
                className="form-control"
                value={responseStatus}
                onChange={(e) => setResponseStatus(e.target.value)}
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed / Resolved</option>
              </select>
            </div>

            <div className="form-group">
              <label>Admin Remarks / Response to Student</label>
              <textarea
                className="form-control"
                rows={4}
                placeholder="Enter instructions, resolution details or feedback for the student..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
