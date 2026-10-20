import { FormEvent, useEffect, useState } from "react";
import { LockKeyhole, ShieldAlert } from "lucide-react";

export interface ReauthModalProps {
  open: boolean;
  /** Frase no formato "a alteração do pedido de venda". */
  description: string;
  /** Identificador do registro afetado (ex.: 123). */
  entityId?: string | null;
  loading: boolean;
  error: string | null;
  onConfirm: (password: string) => void;
  onCancel: () => void;
}

/**
 * Modal de confirmacao de identidade.
 *
 * Reutilizado por todas as operacoes protegidas: o usuario digita a senha da
 * conta autenticada. A senha nao e exibida em nenhum lugar e nao e
 * armazenada; quem valida e o backend.
 */
export default function ReauthModal({
  open,
  description,
  entityId,
  loading,
  error,
  onConfirm,
  onCancel,
}: ReauthModalProps) {
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (open) {
      setPassword("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, loading, onCancel]);

  if (!open) return null;

  const target = entityId ? ` nº ${entityId}` : "";

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (loading || !password.trim()) return;
    onConfirm(password);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reauth-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-blue-50 p-2.5">
            <LockKeyhole className="h-5 w-5 text-blue-700" />
          </div>
          <h2 id="reauth-title" className="text-lg font-semibold text-slate-900">
            Confirme sua identidade
          </h2>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-slate-600">
          Para {description}
          {target}, confirme a senha da sua conta.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <label
            htmlFor="reauth-password"
            className="block text-sm font-medium text-slate-700"
          >
            Senha
          </label>
          <input
            id="reauth-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={loading}
            autoFocus
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
            placeholder="Digite sua senha"
          />

          {error ? (
            <p className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
              <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </p>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Confirmando..." : "Confirmar e continuar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
