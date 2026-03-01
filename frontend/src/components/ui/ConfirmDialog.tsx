import { useEffect, useRef } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  const confirmColors =
    variant === "danger"
      ? "bg-red-600 hover:bg-red-700 text-white"
      : "bg-amber-500 hover:bg-amber-600 text-white";

  const iconBg =
    variant === "danger"
      ? "bg-red-50 dark:bg-red-900/20"
      : "bg-amber-50 dark:bg-amber-900/20";

  const iconColor =
    variant === "danger"
      ? "text-red-500"
      : "text-amber-500";

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-overlay-fade-in"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        className="bg-white dark:bg-surface-card rounded-2xl w-full max-w-sm shadow-2xl border border-cream-200/30 dark:border-surface-border-light overflow-hidden animate-modal-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          <div className={`w-12 h-12 rounded-full ${iconBg} flex items-center justify-center mx-auto mb-4`}>
            <ExclamationTriangleIcon className={`w-6 h-6 ${iconColor}`} />
          </div>
          <h3
            id="confirm-dialog-title"
            className="text-lg font-semibold text-gray-900 dark:text-cream-100 mb-2"
          >
            {title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {message}
          </p>
        </div>
        <div className="px-6 pb-6 flex flex-col gap-2">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="w-full py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-semibold text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`w-full py-2.5 rounded-xl font-medium text-sm transition-colors ${confirmColors}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
