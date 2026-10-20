import { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, UserPlus, X } from "lucide-react";
import {
  Collaborator,
  CompanyRole,
  createCollaborator,
  updateCollaborator,
} from "../../../../services/collaboratorService";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
  roles: CompanyRole[];
  collaborator?: Collaborator | null;
  currentUserId?: string;
}

export default function CollaboratorFormModal({
  open,
  onClose,
  onSaved,
  roles,
  collaborator,
  currentUserId,
}: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [roleId, setRoleId] = useState<string>("");
  const [sector, setSector] = useState("");
  const [forcePasswordChange, setForcePasswordChange] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(collaborator);
  const isTargetAdmin = Boolean(collaborator?.is_system_admin);
  const isSelf = String(collaborator?.id || "") === String(currentUserId || "");
  const assignableRoles = roles.filter((role) => !role.is_system_admin && role.active);
  const suggestedRoles = isEditing && collaborator?.roleid
    ? assignableRoles.some((role) => role.id === collaborator.roleid)
      ? assignableRoles
      : [
          ...roles.filter((role) => role.id === collaborator.roleid),
          ...assignableRoles,
        ]
    : assignableRoles;

  useEffect(() => {
    if (!open) return;
    setError(null);
    setPassword("");
    setShowPassword(false);
    setUsername(collaborator?.username || "");
    setRoleId(
      collaborator?.roleid
        ? String(collaborator.roleid)
        : assignableRoles[0]
          ? String(assignableRoles[0].id)
          : ""
    );
    setSector(collaborator?.sector || "");
    setForcePasswordChange(Boolean(collaborator?.passwordmustchange) || !collaborator);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, collaborator?.id]);

  if (!open) return null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError("Informe o nome de acesso.");
      return;
    }
    if (!isEditing) {
      if (password.length < 8) {
        setError("A senha inicial deve ter pelo menos 8 caracteres.");
        return;
      }
      if (!/[A-Za-zÀ-ÿ]/.test(password) || !/\d/.test(password)) {
        setError("A senha inicial deve conter letras e números.");
        return;
      }
    }
    if (!isTargetAdmin && !roleId) {
      setError("Selecione um cargo.");
      return;
    }

    setSaving(true);
    const response = isEditing && collaborator
      ? await updateCollaborator(collaborator.id, {
          username: username.trim(),
          sector: sector.trim() || undefined,
          ...(!isTargetAdmin && !isSelf && roleId
            ? { roleId: Number(roleId) }
            : {}),
        })
      : await createCollaborator({
          username: username.trim(),
          password,
          roleId: roleId ? Number(roleId) : undefined,
          sector: sector.trim() || undefined,
          forcePasswordChange,
        });
    setSaving(false);

    if (!response.ok) {
      setError(response.error || "Não foi possível salvar o colaborador.");
      return;
    }
    await onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-start justify-between border-b border-slate-100 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEditing ? "Editar colaborador" : "Novo colaborador"}
              </h2>
              <p className="text-xs text-slate-500">
                O acesso é vinculado automaticamente à sua empresa.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="space-y-4 p-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Nome de acesso
            </span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              maxLength={60}
              required
              autoComplete="off"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </label>

          {!isEditing ? (
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Senha inicial
              </span>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 pr-11 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <span className="mt-1 block text-xs text-slate-400">
                Mínimo de 8 caracteres, com letras e números. A senha não será
                exibida novamente após o cadastro.
              </span>
            </label>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Cargo
              </span>
              <select
                value={roleId}
                onChange={(event) => setRoleId(event.target.value)}
                disabled={isTargetAdmin || isSelf}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-100 disabled:text-slate-500"
              >
                {isTargetAdmin ? (
                  <option value={roleId}>Administrador (protegido)</option>
                ) : null}
                {!isTargetAdmin
                  ? suggestedRoles.map((role) => (
                      <option key={role.id} value={role.id} disabled={!role.active}>
                        {role.name}
                        {role.active ? "" : " (inativo)"}
                      </option>
                    ))
                  : null}
              </select>
              {isTargetAdmin ? (
                <span className="mt-1 block text-xs text-amber-700">
                  O cargo administrativo do sistema não pode ser alterado.
                </span>
              ) : null}
              {isSelf ? (
                <span className="mt-1 block text-xs text-amber-700">
                  Você não pode alterar o próprio cargo.
                </span>
              ) : null}
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Setor / observação
              </span>
              <input
                value={sector}
                onChange={(event) => setSector(event.target.value)}
                maxLength={80}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </label>
          </div>

          {!isEditing ? (
            <label className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={forcePasswordChange}
                onChange={(event) => setForcePasswordChange(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>
                Exigir troca de senha no primeiro acesso
                <span className="block text-xs text-slate-500">
                  Recomendado. O colaborador define a própria senha ao entrar.
                </span>
              </span>
            </label>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? "Salvando..." : isEditing ? "Salvar alterações" : "Criar colaborador"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
