import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api";

export function AdminDatabase({ addToast }) {
  const [dbData, setDbData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showFullUrl, setShowFullUrl] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await apiRequest("/database/status/");
      setDbData(res.data);
    } catch (err) {
      addToast(err.message || "Failed to load database status.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncDatabase = async () => {
    try {
      setSyncing(true);
      const res = await apiRequest("/database/sync/", { method: "POST" });
      setDbData(res.data);
      addToast("Neon PostgreSQL sequences synchronized & verified successfully!", "success");
    } catch (err) {
      addToast(err.message || "Database synchronization failed.", "error");
    } finally {
      setSyncing(false);
    }
  };

  const copyConnectionString = () => {
    if (!dbData) return;
    const url = showFullUrl ? dbData.raw_url : dbData.masked_url;
    navigator.clipboard.writeText(url);
    addToast("Database connection URL copied to clipboard!", "success");
  };

  const filteredTables = (dbData?.tables || []).filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.label.toLowerCase().includes(q) ||
      t.desc.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Top Banner */}
      <div
        className="card"
        style={{
          padding: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          border: "1px solid var(--border-color)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <span style={{ fontSize: "14px", fontWeight: 700, padding: "3px 8px", borderRadius: "6px", background: "var(--primary-light)", color: "var(--primary)" }}>SQL</span>
            <h2 style={{ fontSize: "22px", fontWeight: 800, margin: 0, color: "var(--text-main)" }}>
              Neon Cloud PostgreSQL Database
            </h2>
            <span
              className="badge badge-success"
              style={{
                fontSize: "12px",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "#10b981",
                }}
              />
              Live & Synced
            </span>
          </div>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "14px", maxWidth: "650px" }}>
            Serverless cloud database engine. All student records, credentials, timetables, and messaging data are persisted directly to Neon AWS cloud with SSL encryption.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fetchStatus}
            disabled={loading || syncing}
          >
            Refresh Metrics
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleSyncDatabase}
            disabled={loading || syncing}
          >
            {syncing ? "Syncing Sequences..." : "Sync & Reset Sequences"}
          </button>
          <a
            href="https://console.neon.tech"
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary btn-sm"
            style={{ fontWeight: 600 }}
          >
            Open Neon Console ↗
          </a>
        </div>
      </div>

      {/* Metrics Row - Unified Consistent Colors */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        <div className="card" style={{ padding: "18px 20px" }}>
          <div style={{ fontSize: "12px", color: "var(--slate-500)", fontWeight: 600, textTransform: "uppercase", marginBottom: "6px" }}>
            Database Health
          </div>
          <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>Operational</span>
            <span style={{ fontSize: "12px", color: "var(--slate-500)", fontWeight: 500 }}>
              ({dbData?.latency_ms || "--"} ms)
            </span>
          </div>
          <div style={{ fontSize: "12.5px", color: "var(--slate-500)", marginTop: "4px" }}>
            Direct TLS connection to Neon
          </div>
        </div>

        <div className="card" style={{ padding: "18px 20px" }}>
          <div style={{ fontSize: "12px", color: "var(--slate-500)", fontWeight: 600, textTransform: "uppercase", marginBottom: "6px" }}>
            Total Tables
          </div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-main)" }}>
            {dbData?.total_tables || 0}
          </div>
          <div style={{ fontSize: "12.5px", color: "var(--slate-500)", marginTop: "4px" }}>
            PostgreSQL relational schemas
          </div>
        </div>

        <div className="card" style={{ padding: "18px 20px" }}>
          <div style={{ fontSize: "12px", color: "var(--slate-500)", fontWeight: 600, textTransform: "uppercase", marginBottom: "6px" }}>
            Total Data Records
          </div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-main)" }}>
            {dbData?.total_records || 0}
          </div>
          <div style={{ fontSize: "12.5px", color: "var(--slate-500)", marginTop: "4px" }}>
            Synced rows across all models
          </div>
        </div>

        <div className="card" style={{ padding: "18px 20px" }}>
          <div style={{ fontSize: "12px", color: "var(--slate-500)", fontWeight: 600, textTransform: "uppercase", marginBottom: "6px" }}>
            SSL Security Mode
          </div>
          <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-main)" }}>
            Require / Channel-Binding
          </div>
          <div style={{ fontSize: "12.5px", color: "var(--slate-500)", marginTop: "4px" }}>
            End-to-end encrypted transport
          </div>
        </div>
      </div>

      {/* Connection & Cloud Telemetry Card */}
      <div className="card" style={{ padding: "24px" }}>
        <h3 style={{ margin: "0 0 16px", fontSize: "17px", fontWeight: 700, color: "var(--slate-800)" }}>
          Serverless Connection Specifications
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginBottom: "20px" }}>
          <div style={{ background: "var(--slate-50)", padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
            <span style={{ fontSize: "12px", color: "var(--slate-500)", display: "block", marginBottom: "4px" }}>Engine & Host</span>
            <span style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--text-main)", wordBreak: "break-all" }}>
              {dbData?.host || "ep-winter-queen-...neon.tech"}
            </span>
          </div>

          <div style={{ background: "var(--slate-50)", padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
            <span style={{ fontSize: "12px", color: "var(--slate-500)", display: "block", marginBottom: "4px" }}>Database Name & Port</span>
            <span style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--text-main)" }}>
              {dbData?.database || "neondb"} (Port {dbData?.port || 5432})
            </span>
          </div>

          <div style={{ background: "var(--slate-50)", padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
            <span style={{ fontSize: "12px", color: "var(--slate-500)", display: "block", marginBottom: "4px" }}>Database Role / User</span>
            <span style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--text-main)" }}>
              {dbData?.user || "neondb_owner"}
            </span>
          </div>
        </div>

        {/* Masked Connection String Bar */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--slate-700)" }}>
              Neon Connection URI String:
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowFullUrl(!showFullUrl)}
                style={{ fontSize: "12px", padding: "4px 10px" }}
              >
                {showFullUrl ? "Hide Password" : "Reveal Password"}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={copyConnectionString}
                style={{ fontSize: "12px", padding: "4px 10px" }}
              >
                Copy URI
              </button>
            </div>
          </div>
          <div
            style={{
              padding: "12px 16px",
              background: "#0f172a",
              color: "#38bdf8",
              fontFamily: "monospace",
              fontSize: "13px",
              borderRadius: "8px",
              overflowX: "auto",
              wordBreak: "break-all",
              border: "1px solid #1e293b",
            }}
          >
            {showFullUrl ? dbData?.raw_url : dbData?.masked_url || "postgresql://neondb_owner:••••••••••••@ep-winter-queen-...neon.tech/neondb?sslmode=require"}
          </div>
        </div>
      </div>

      {/* Table Breakdown Table */}
      <div className="card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "var(--slate-800)" }}>
              Synced Neon Table Inventory ({filteredTables.length})
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--slate-500)" }}>
              Individual table record counts synchronized in the PostgreSQL serverless instance.
            </p>
          </div>
          <div style={{ maxWidth: "280px", width: "100%" }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search table or module..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ height: "38px", fontSize: "13.5px" }}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: "24%" }}>Table Name</th>
                <th style={{ width: "24%" }}>Module / Entity</th>
                <th style={{ width: "16%" }}>Record Count</th>
                <th style={{ width: "24%" }}>Schema Description</th>
                <th style={{ width: "12%", textAlign: "right" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTables.map((t) => (
                <tr key={t.name}>
                  <td>
                    <code style={{ background: "var(--slate-100)", padding: "2px 6px", borderRadius: "4px", fontSize: "13px", color: "var(--slate-800)" }}>
                      {t.name}
                    </code>
                  </td>
                  <td>
                    <b style={{ color: "var(--slate-800)", fontSize: "13.5px" }}>{t.label}</b>
                  </td>
                  <td>
                    <span
                      style={{
                        background: t.count > 0 ? "var(--primary-light, #f3efff)" : "var(--slate-100)",
                        color: t.count > 0 ? "var(--primary, #7c3aed)" : "var(--slate-500)",
                        padding: "3px 10px",
                        borderRadius: "12px",
                        fontSize: "12.5px",
                        fontWeight: 700,
                      }}
                    >
                      {t.count} rows
                    </span>
                  </td>
                  <td style={{ fontSize: "13px", color: "var(--slate-600)" }}>
                    {t.desc}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <span className="badge badge-success" style={{ fontSize: "11px" }}>
                      ● Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
