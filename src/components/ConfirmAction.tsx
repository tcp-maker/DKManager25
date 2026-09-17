import React, { useId, useState } from 'react';

interface ConfirmActionProps {
  label: string;
  confirmLabel: string;
  confirmMessage: string;
  onConfirm: () => string | null | Promise<string | null>;
  disabled?: boolean;
  disabledMessage?: string;
  buttonClassName?: string;
  confirmButtonClassName?: string;
}

const ConfirmAction: React.FC<ConfirmActionProps> = ({
  label,
  confirmLabel,
  confirmMessage,
  onConfirm,
  disabled = false,
  disabledMessage,
  buttonClassName = 'bg-blue-600 hover:bg-blue-700 text-white',
  confirmButtonClassName = 'bg-blue-600 hover:bg-blue-700 text-white',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmationId = useId();

  const handleConfirm = async () => {
    if (disabled || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await onConfirm();
      if (result) {
        setError(result);
        return;
      }

      setIsOpen(false);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Handlingen kunne ikke gennemføres.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => {
          if (disabled) return;
          setError(null);
          setIsOpen(current => !current);
        }}
        aria-expanded={isOpen}
        aria-controls={confirmationId}
        disabled={disabled || isSubmitting}
        className={`w-full rounded px-4 py-3 font-bold transition disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 ${buttonClassName}`}
      >
        {isSubmitting ? 'Behandler…' : label}
      </button>

      {disabled && disabledMessage && (
        <p className="text-sm text-red-600">{disabledMessage}</p>
      )}

      {isOpen && !disabled && (
        <div id={confirmationId} className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-gray-800 shadow-sm">
          <p className="font-semibold text-amber-900">Bekræft handling</p>
          <p className="mt-1">{confirmMessage}</p>

          {error && (
            <p className="mt-3 rounded bg-red-100 px-3 py-2 text-red-700">{error}</p>
          )}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting}
              className={`flex-1 rounded px-4 py-2 font-bold transition disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 ${confirmButtonClassName}`}
            >
              {isSubmitting ? 'Behandler…' : confirmLabel}
            </button>
            <button
              type="button"
              onClick={() => {
                if (isSubmitting) return;
                setError(null);
                setIsOpen(false);
              }}
              disabled={isSubmitting}
              className="flex-1 rounded bg-white px-4 py-2 font-semibold text-gray-700 ring-1 ring-gray-300 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100"
            >
              Annuller
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfirmAction;
