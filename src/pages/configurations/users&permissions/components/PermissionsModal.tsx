import { useEffect, useState } from "react";
import { Info, Loader2, RotateCcw, ShieldCheck, X } from "lucide-react";
import {
  Collaborator,
  getCollaboratorPermissions,
  PermissionCatalogModule,
  updateCollaboratorPermissions,
} from "../../../../services/collaboratorService";
import { PermissionGroup } from "../../../../utils/moduleMapping";
import PermissionMatrix from "./PermissionMatrix";

interface Props {
  open: boolean;
  onClose: () => void;
  collaborator: Collaborator | null;
  catalog: PermissionCatalogModule[];
  onSaved: () => Promise<void> | void;
}

function countActions(groups: PermissionGroup[]): number {
  return groups.reduce((total, group) => total + (group.actions?.length || 0), 0);
}

export default function PermissionsModal({
  open,
  onClose,
  collaborator,
  catalog,
  onSaved,
}: Props) {
  const [permissions, setPermissions] = useState<PermissionGroup[]>([]);
  const [rolePermissions, setRolePermissions] = useState<PermissionGroup[]>([]);
  const [roleName, setRoleName] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !collaborator) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getCollaboratorPermissions(collaborator.id).then((response) => {
      if (cancelled) return;
      setLoading(false);
      if (!response.ok || !response.data) {
        setError(response.error || "Não foi possível carregar as permissões.");
        return;
      }
      setPermissions(response.data.effectivePermissions || []);
      setRolePermissions(response.data.rolePermissions || []);
      setRoleName(response.data.collaborator.roleName || "Cargo atual");
    });
    return () => {
      cancelled = true;
    };
  }, [open, collaborator?.id]);

  if (!open || !collaborator) return null;

  const isSystemAdmin = collaborator.is_system_admin;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const response = await updateCollaboratorPermissions(
      collaborator.id,
      permissions
    );
    setSaving(false);
    if (!response.ok) {
      setError(response.error || "Não foi possível salvar as permissões.");
      return;
    }
    await onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Permissões de {collaborator.username}
              </h2>
              <p className="text-xs text-slate-500">
                Cargo: {roleName || "não vinculado"} · permissões individuais
                prevalecem sobre o cargo.
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

        <div className="space-y-4 p-5">
          {isSystemAdmin ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Esta é uma conta administrativa protegida. O cargo administrativo
              possui acesso total aos módulos contratados e não pode ter
              permissões reduzidas por esta tela.
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              <span className="inline-flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600" />
                Permissões do cargo: {countActions(rolePermissions)} ações.
                Ajustes individuais: {countActions(permissions)} ações efetivas.
              </span>
              <button
                type="button"
                onClick={() => setPermissions(rolePermissions)}
                disabled={loading || saving}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Restaurar permissões do cargo
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center gap-2 py-10 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando permissões...
            </div>
          ) : (
            <PermissionMatrix
              catalog={catalog}
              value={permissions}
              onChange={setPermissions}
              disabled={isSystemAdmin || saving}
            />
          )}

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
              type="button"
              onClick={handleSave}
              disabled={saving || loading || isSystemAdmin}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? "Salvando..." : "Salvar permissões"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
