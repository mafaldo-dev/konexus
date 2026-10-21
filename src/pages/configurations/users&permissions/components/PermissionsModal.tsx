import { useEffect, useState } from "react";
import {
  Building2,
  Info,
  Loader2,
  RotateCcw,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  Collaborator,
  CollaboratorLegalEntityAccess,
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
  const [legalEntities, setLegalEntities] = useState<CollaboratorLegalEntityAccess[]>([]);
  const [selectedLegalEntityIds, setSelectedLegalEntityIds] = useState<number[]>([]);
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
      setLegalEntities(response.data.legalEntities || []);
      setSelectedLegalEntityIds(response.data.legalEntityIds || []);
    });
    return () => {
      cancelled = true;
    };
  }, [open, collaborator?.id]);

  if (!open || !collaborator) return null;

  const isSystemAdmin = collaborator.is_system_admin;
  const availableModules = new Set(
    catalog.filter((module) => module.available).map((module) => module.key)
  );
  const permissionsToSave = permissions.filter((group) =>
    availableModules.has(group.moduleKey)
  );

  const toggleLegalEntity = (id: number) => {
    setSelectedLegalEntityIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const handleSave = async () => {
    if (
      !isSystemAdmin &&
      legalEntities.length > 0 &&
      selectedLegalEntityIds.length === 0
    ) {
      setError(
        "Selecione pelo menos um CNPJ. Para retirar todo o acesso operacional, desative a conta."
      );
      return;
    }
    setSaving(true);
    setError(null);
    const response = await updateCollaboratorPermissions(
      collaborator.id,
      permissionsToSave,
      selectedLegalEntityIds
    );
    setSaving(false);
    if (!response.ok) {
      setError(response.error || "Não foi possível salvar as permissões.");
      return;
    }
    await onSaved();
    // Atualiza menus/rotas do ator e sinaliza outras abas para recarregar a
    // sessão. A revogação no backend já vale para a próxima requisição.
    window.dispatchEvent(new Event("konexus:access-changed"));
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
            <>
              <PermissionMatrix
                catalog={catalog}
                value={permissions}
                onChange={setPermissions}
                disabled={isSystemAdmin || saving}
              />

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-indigo-600" />
                      <h3 className="text-sm font-bold text-slate-800">
                        Empresas jurídicas (CNPJs)
                      </h3>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      O colaborador só poderá selecionar e operar os CNPJs
                      marcados abaixo. Toda requisição é revalidada no backend.
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                    {selectedLegalEntityIds.length} de {legalEntities.length}
                  </span>
                </div>

                {isSystemAdmin ? (
                  <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
                    O administrador principal acessa implicitamente todos os
                    CNPJs ativos. Esta seleção é somente informativa e não pode
                    ser restringida por aqui.
                  </p>
                ) : null}

                {legalEntities.length === 0 ? (
                  <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
                    A organização não possui CNPJ ativo. Cadastre uma empresa
                    em Configurações → Empresas para liberar operações.
                  </p>
                ) : (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {legalEntities.map((entity) => {
                      const checked = selectedLegalEntityIds.includes(entity.id);
                      return (
                        <label
                          key={entity.id}
                          className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs transition ${
                            checked
                              ? "border-indigo-200 bg-indigo-50/70"
                              : "border-slate-100 bg-slate-50/60"
                          } ${
                            isSystemAdmin || saving
                              ? "cursor-not-allowed opacity-70"
                              : "cursor-pointer hover:border-slate-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={isSystemAdmin || saving}
                            onChange={() => toggleLegalEntity(entity.id)}
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-slate-800">
                              {entity.tradeName || entity.legalName}
                            </span>
                            <span className="block text-slate-500">
                              {entity.cnpjFormatted || entity.cnpj || "CNPJ não informado"}
                            </span>
                            <span className="mt-0.5 flex flex-wrap gap-1">
                              {entity.isPrimary ? (
                                <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                                  Principal
                                </span>
                              ) : null}
                              {entity.status === "regularization" ? (
                                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                                  Em regularização
                                </span>
                              ) : null}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
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
