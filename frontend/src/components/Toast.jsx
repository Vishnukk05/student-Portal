import React from "react";
import { IconCheckCircle, IconAlertCircle, IconLifeBuoy } from "./common/Icons";

export function ToastContainer({ toasts, removeToast }) {
  if (!toasts || toasts.length === 0) return null;

  const renderIcon = (type) => {
    switch (type) {
      case "success":
        return <IconCheckCircle size={18} />;
      case "error":
      case "danger":
        return <IconAlertCircle size={18} />;
      case "warning":
        return <IconAlertCircle size={18} />;
      default:
        return <IconLifeBuoy size={18} />;
    }
  };

  return (
    <div className="toast-container" id="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type || "info"}`} onClick={() => removeToast(t.id)}>
          <span className="toast-icon">{renderIcon(t.type)}</span>
          <span className="toast-msg">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
