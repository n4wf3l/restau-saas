interface ModalOverlayProps {
  children: React.ReactNode;
  onClose?: () => void;
  width?: string;
}

export function ModalOverlay({ children, onClose, width = "w-96" }: ModalOverlayProps) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-overlay-fade-in"
      onClick={onClose ? (e) => { if (e.target === e.currentTarget) onClose(); } : undefined}
    >
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 ${width} border border-gray-200 dark:border-gray-700 animate-modal-slide-in`}>
        {children}
      </div>
    </div>
  );
}
