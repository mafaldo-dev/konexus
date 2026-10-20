import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { KeyRound, Loader2, LogOut, ShieldCheck } from "lucide-react";
import Swal from "sweetalert2";
import { useAuth } from "../../AuthContext";
import { apiClient } from "../../api/client";

/**
 * Troca de senha do próprio colaborador.
 *
 * É a única rota liberada quando o backend informa mustChangePassword=true.
 * A senha temporária nunca é recuperada do servidor: o administrador a entrega
 * uma única vez e o colaborador define a nova senha aqui.
 */
export default function ChangePasswordPage() {
  const { user, token, mustChangePassword, logout } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("A confirmação não confere com a nova senha.");
      return;
    }
    if (newPassword.length < 8) {
      setError("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }

    setSaving(true);
    const response = await apiClient.post(
      "collaborators/me/change-password",
      { currentPassword, newPassword },
      { token }
    );
    setSaving(false);

    if (!response.ok) {
      setError(response.error || "Não foi possível alterar a senha.");
      return;
    }

    await Swal.fire({
      title: "Senha alterada",
      text: "Entre novamente com a nova senha.",
      icon: "success",
      confirmButtonText: "Ir para o login",
    });
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {mustChangePassword ? "Defina sua nova senha" : "Alterar senha"}
            </h1>
            <p className="text-sm text-slate-500">
              {user.username} · {user.companyId ? "Colaborador" : "Administrador"}
            </p>
          </div>
        </div>

        {mustChangePassword ? (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Sua senha atual é provisória. Para continuar, defina uma nova senha
            pessoal. As demais áreas ficam bloqueadas até a troca.
          </div>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Senha atual / provisória
            </span>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Nova senha
            </span>
            <input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
              minLength={8}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
            <span className="mt-1 block text-xs text-slate-400">
              Mínimo de 8 caracteres, com letras e números.
            </span>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Confirmar nova senha
            </span>
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              minLength={8}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </label>

          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saving ? "Salvando..." : "Alterar senha"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => logout()}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          <LogOut className="h-4 w-4" />
          Sair e voltar ao login
        </button>
      </div>
    </div>
  );
}
