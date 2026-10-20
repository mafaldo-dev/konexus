import { FormEvent, useEffect, useState } from "react";
import { Loader2, ShieldPlus, X } from "lucide-react";
import {
  CompanyRole,
  createCompanyRole,
  PermissionCatalogModule,
  updateCompanyRole,
} from "../../../../services/collaboratorService";
import { PermissionGroup } from "../../../../utils/moduleMapping";
import PermissionMatrix from "./PermissionMatrix";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
  catalog: PermissionCatalogModule[];
  role?: CompanyRole | null;
}

export default function RoleFormModal({
  open,
  onClose,
  onSaved,
  catalog,
  role,
}: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<PermissionGroup[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(role);
  const isSystemAdmin = Boolean(role?.is_system_admin);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setName(role?.name || "");
    setDescription(role?.description || "");
    setPermissions(
      role?.permissions?.length
        ? role.permissions
        : [{ moduleKey: "dashboard", actions: ["view"] }]
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, role?.id]);

  if (!open) return null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Informe o nome do cargo.");
      return;
    }

    setSaving(true);
    const response = isEditing && role
      ? await updateCompanyRole(role.id, {
          name: name.trim(),
          description: description.trim() || null,
          permissions,
        })
      : await createCompanyRole({
          name: name.trim(),
          description: description.trim() || null,
          permissions,
        });
    setSaving(false);

    if (!response.ok) {
      setError(response.error || "Não foi possível salvar o cargo.");
      return;
    }
    await onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
              <ShieldPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEditing ? "Editar cargo" : "Novo cargo"}
              </h2>
              <p className="text-xs text-slate-500">
                As permissões definem o acesso real, independentemente do nome do cargo.
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

        <form className="space-y-5 p-5" onSubmit={handleSubmit}>
          {isSystemAdmin ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              O cargo administrativo do sistema é protegido e não pode ser
              editado. Ele sempre possui acesso total aos módulos contratados.
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Nome do cargo
              </span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={isSystemAdmin}
                maxLength={60}
                required
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-100"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Descrição
              </span>
              <input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                disabled={isSystemAdmin}
                maxLength={255}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-100"
              />
            </label>
          </div>

          <div>
            <div className="mb-3">
              <h3 className="text-sm font-bold text-slate-800">Permissões do cargo</h3>
              <p className="text-xs text-slate-500">
                Marque as ações permitidas. Ajustes individuais podem ser feitos
                depois na aba Colaboradores.
              </p>
            </div>
            <PermissionMatrix
              catalog={catalog}
              value={permissions}
              onChange={setPermissions}
              disabled={isSystemAdmin}
            />
          </div>

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
              Fechar
            </button>
            <button
              type="submit"
              disabled={saving || isSystemAdmin}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? "Salvando..." : isEditing ? "Salvar cargo" : "Criar cargo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
