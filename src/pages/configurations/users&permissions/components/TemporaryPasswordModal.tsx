import { useState } from "react";
import { Check, Copy, KeyRound, ShieldAlert, X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  username: string;
  password: string;
  isFree: boolean;
  amountCents: number;
}

export default function TemporaryPasswordModal({
  open,
  onClose,
  username,
  password,
  isFree,
  amountCents,
}: Props) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Senha temporária gerada
              </h2>
              <p className="text-sm text-slate-500">{username}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="flex items-start gap-2 text-sm font-medium text-amber-900">
            <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0" />
            Esta senha será exibida apenas uma vez. Entregue ao colaborador por
            um canal seguro.
          </p>
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-white px-3 py-2.5">
            <code className="flex-1 break-all text-base font-bold tracking-wide text-slate-900">
              {password}
            </code>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-1 text-sm text-slate-600">
          <p>
            No próximo login, o colaborador deverá definir uma nova senha antes
            de acessar o sistema.
          </p>
          <p>
            {isFree
              ? "Esta redefinição utilizou a franquia gratuita do mês."
              : `Redefinição adicional registrada para acompanhamento comercial no valor informativo de R$ ${(amountCents / 100).toFixed(2)}. Nenhuma cobrança automática foi realizada.`}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Entendi, fechar
        </button>
      </div>
    </div>
  );
}
