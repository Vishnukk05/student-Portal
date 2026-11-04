import React from "react";

export function Modal({ isOpen = true, onClose, title, children, footer, large = false }) {
  if (isOpen === false) return null;
  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div
        className={`modal-box modal-content ${large ? "large" : ""}`}
        style={large ? { maxWidth: "820px" } : {}}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 style={{ fontSize: "18px", margin: 0, fontWeight: 700 }}>{title}</h3>
          <button type="button" className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
