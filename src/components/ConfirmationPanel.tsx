import React, { useEffect, useId, useRef } from 'react';

interface ConfirmationPanelProps {
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmVariant?: 'primary' | 'danger';
  autoFocusAction?: 'confirm' | 'cancel';
  className?: string;
}

const ConfirmationPanel: React.FC<ConfirmationPanelProps> = ({
  title,
  message,
  confirmLabel,
  cancelLabel = 'Annuller',
  onConfirm,
  onCancel,
  confirmVariant = 'primary',
  autoFocusAction = 'confirm',
  className = ''
}) => {
  const titleId = useId();
  const descriptionId = useId();
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonClassName = confirmVariant === 'danger'
    ? 'bg-red-600 hover:bg-red-700 focus-visible:outline-red-600'
    : 'bg-blue-600 hover:bg-blue-700 focus-visible:outline-blue-600';

  useEffect(() => {
    if (autoFocusAction === 'confirm') {
      confirmButtonRef.current?.focus();
      return;
    }

    cancelButtonRef.current?.focus();
  }, [autoFocusAction]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
      return;
    }

    if (event.key !== 'Tab') return;

    const firstButton = autoFocusAction === 'confirm' ? confirmButtonRef.current : cancelButtonRef.current;
    const lastButton = autoFocusAction === 'confirm' ? cancelButtonRef.current : confirmButtonRef.current;

    if (!firstButton || !lastButton) return;

    if (event.shiftKey && document.activeElement === firstButton) {
      event.preventDefault();
      lastButton.focus();
    } else if (!event.shiftKey && document.activeElement === lastButton) {
      event.preventDefault();
      firstButton.focus();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handleKeyDown}
        className={`w-full max-w-md rounded-lg border border-gray-200 bg-white p-4 shadow-xl ${className}`.trim()}
      >
        <h3 id={titleId} className="text-lg font-bold text-gray-900">
          {title}
        </h3>
        <div id={descriptionId} className="mt-2 text-sm text-gray-700">{message}</div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            className={`rounded px-4 py-2 font-bold text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${confirmButtonClassName}`}
          >
            {confirmLabel}
          </button>
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            className="rounded border border-gray-300 bg-white px-4 py-2 font-bold text-gray-700 transition hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPanel;
