import React, { useEffect } from "react";
import { AlertCircle, Info, XCircle, CheckCircle2 } from "lucide-react";
import "./Dialog.css";

interface DialogProps {
  isOpen: boolean;
  type?: "alert" | "info" | "error" | "success";
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

const Dialog: React.FC<DialogProps> = ({
  isOpen,
  type = "info",
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  showCancel = true,
  onConfirm,
  onCancel,
}) => {
  // Escape key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && onCancel) {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "error":
        return <XCircle size={28} className="dialog-icon" />;
      case "alert":
        return <AlertCircle size={28} className="dialog-icon" />;
      case "success":
        return <CheckCircle2 size={28} className="dialog-icon" />;
      case "info":
      default:
        return <Info size={28} className="dialog-icon" />;
    }
  };

  return (
    <div className={`dialog-overlay open`} onClick={onCancel ? onCancel : undefined}>
      <div
        className={`dialog-content dialog-${type}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          {getIcon()}
          <h3 className="dialog-title">{title}</h3>
        </div>

        <p className="dialog-message">{message}</p>

        <div className="dialog-actions">
          {showCancel && onCancel && (
            <button className="dialog-btn dialog-btn-cancel" onClick={onCancel}>
              {cancelText}
            </button>
          )}
          <button className="dialog-btn dialog-btn-confirm" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dialog;
