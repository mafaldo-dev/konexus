import type React from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  wide = false,
}: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`my-auto w-full ${
          wide ? "max-w-5xl" : "max-w-2xl"
        } rounded-xl border border-slate-200 bg-white shadow-2xl`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            {description && (
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && (
          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
