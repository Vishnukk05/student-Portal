import React, { useEffect, useState } from "react";

let confirmResolver = null;
let setDialogState = null;

/**
 * Custom Promise-based confirmation popup replacing native window.confirm.
 * Usage:
 *   const confirmed = await showConfirm({
 *     title: "Delete Assignment",
 *     message: "Delete assignment 'bhgf' and all student submissions?",
 *     danger: true
 *   });
 *   if (!confirmed) return;
 */
export function showConfirm({
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = true,
}) {
  return new Promise((resolve) => {
    confirmResolver = resolve;
    if (setDialogState) {
      setDialogState({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        danger,
      });
    } else {
      // Fallback if component is not yet mounted
      resolve(window.confirm(message));
    }
  });
}

export function ConfirmModal() {
  const [dialog, setDialog] = useState({ isOpen: false });

  useEffect(() => {
    setDialogState = setDialog;
    return () => {
      setDialogState = null;
    };
  }, []);

  if (!dialog.isOpen) return null;

  const handleCancel = () => {
    setDialog({ isOpen: false });
    if (confirmResolver) {
      confirmResolver(false);
      confirmResolver = null;
    }
  };

  const handleConfirm = () => {
    setDialog({ isOpen: false });
    if (confirmResolver) {
      confirmResolver(true);
      confirmResolver = null;
    }
  };

  return (
    <div
      className="modal-overlay active"
      onClick={handleCancel}
      style={{
        zIndex: 100000,
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        className="modal-box"
        style={{
          maxWidth: "460px",
          width: "100%",
          borderRadius: "14px",
          background: "var(--bg-card)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
          overflow: "hidden",
          border: "1px solid var(--border-color)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: "26px 24px 20px", display: "flex", gap: "16px", alignItems: "flex-start" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              background: dialog.danger ? "#fee2e2" : "#fef3c7",
              color: dialog.danger ? "#ef4444" : "#f59e0b",
              display: "grid",
              placeItems: "center",
              fontSize: "22px",
              flexShrink: 0,
            }}
          >
            {dialog.danger ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: "17.5px", fontWeight: 700, color: "var(--slate-900)" }}>
              {dialog.title}
            </h3>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--slate-600)", lineHeight: 1.55 }}>
              {dialog.message}
            </p>
          </div>
        </div>

        <div
          style={{
            padding: "14px 24px",
            background: "var(--slate-50)",
            borderTop: "1px solid var(--slate-200)",
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
          }}
        >
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleCancel}
            style={{ padding: "8px 18px", fontSize: "13.5px" }}
          >
            {dialog.cancelText || "Cancel"}
          </button>
          <button
            type="button"
            className={`btn btn-sm ${dialog.danger ? "btn-danger" : "btn-primary"}`}
            onClick={handleConfirm}
            autoFocus
            style={{ padding: "8px 20px", fontSize: "13.5px", fontWeight: 600 }}
          >
            {dialog.confirmText || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
