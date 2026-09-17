import React, { useId } from 'react';

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
  const confirmButtonClassName = confirmVariant === 'danger'
    ? 'bg-red-600 hover:bg-red-700 focus-visible:outline-red-600'
    : 'bg-blue-600 hover:bg-blue-700 focus-visible:outline-blue-600';

  return (
    <div
      role="region"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className={`mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 ${className}`.trim()}
    >
      <h3 id={titleId} className="text-lg font-bold text-gray-900">
        {title}
      </h3>
      <div id={descriptionId} className="mt-2 text-sm text-gray-700">{message}</div>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onConfirm}
          autoFocus={autoFocusAction === 'confirm'}
          className={`rounded px-4 py-2 font-bold text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${confirmButtonClassName}`}
        >
          {confirmLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          autoFocus={autoFocusAction === 'cancel'}
          className="rounded border border-gray-300 bg-white px-4 py-2 font-bold text-gray-700 transition hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
        >
          {cancelLabel}
        </button>
      </div>
    </div>
  );
};

export default ConfirmationPanel;
