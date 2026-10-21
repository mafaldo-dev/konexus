import { PermissionCatalogModule } from "../../../../services/collaboratorService";
import { PermissionGroup } from "../../../../utils/moduleMapping";

interface PermissionMatrixProps {
  catalog: PermissionCatalogModule[];
  value: PermissionGroup[];
  onChange?: (permissions: PermissionGroup[]) => void;
  disabled?: boolean;
}

function toSelection(value: PermissionGroup[]): Set<string> {
  const selection = new Set<string>();
  for (const group of value || []) {
    for (const action of group.actions || []) {
      selection.add(`${group.moduleKey}:${action}`);
    }
  }
  return selection;
}

function fromSelection(selection: Set<string>): PermissionGroup[] {
  const grouped = new Map<string, string[]>();
  for (const key of Array.from(selection)) {
    const [moduleKey, actionKey] = key.split(":");
    if (!moduleKey || !actionKey) continue;
    const actions = grouped.get(moduleKey) || [];
    actions.push(actionKey);
    grouped.set(moduleKey, actions);
  }
  return Array.from(grouped.entries()).map(([moduleKey, actions]) => ({
    moduleKey,
    actions: actions.sort(),
  }));
}

export default function PermissionMatrix({
  catalog,
  value,
  onChange,
  disabled = false,
}: PermissionMatrixProps) {
  const selection = toSelection(value);
  const update = (next: Set<string>) => onChange?.(fromSelection(next));

  const toggleAction = (moduleKey: string, actionKey: string) => {
    if (disabled) return;
    const next = new Set(selection);
    const key = `${moduleKey}:${actionKey}`;
    if (next.has(key)) next.delete(key);
    else next.add(key);
    update(next);
  };

  const toggleModule = (module: PermissionCatalogModule) => {
    if (disabled || !module.available) return;
    const keys = module.actions.map((action) => `${module.key}:${action.key}`);
    const allSelected = keys.every((key) => selection.has(key));
    const next = new Set(selection);
    for (const key of keys) {
      if (allSelected) next.delete(key);
      else next.add(key);
    }
    update(next);
  };

  return (
    <div className="space-y-3">
      {catalog.map((module) => {
        const keys = module.actions.map(
          (action) => `${module.key}:${action.key}`
        );
        const selectedCount = keys.filter((key) => selection.has(key)).length;
        const allSelected = keys.length > 0 && selectedCount === keys.length;
        const moduleDisabled = disabled || !module.available;
        const unavailableWarning = !module.available
          ? module.isExtra
            ? "Módulo extra não contratado. A seleção é bloqueada e o backend rejeita a concessão até a contratação."
            : "Módulo indisponível nesta instalação. A seleção é bloqueada pelo backend."
          : null;

        return (
          <div
            key={module.key}
            className="rounded-xl border border-slate-200 bg-white p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-semibold text-slate-800">
                    {module.name}
                  </h4>
                  {!module.available ? (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                      Indisponível
                    </span>
                  ) : null}
                  {module.isExtra ? (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        module.available
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {module.available
                        ? "Extra contratado"
                        : `Extra ${module.extraModuleStatus || "não contratado"}`}
                    </span>
                  ) : null}
                  {selectedCount > 0 ? (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                      {selectedCount}/{keys.length} ações
                    </span>
                  ) : null}
                </div>
                {module.description ? (
                  <p className="mt-1 text-xs text-slate-500">{module.description}</p>
                ) : null}
                {unavailableWarning ? (
                  <p className="mt-1 text-xs text-amber-700">{unavailableWarning}</p>
                ) : null}
              </div>
              <button
                type="button"
                disabled={moduleDisabled}
                onClick={() => toggleModule(module)}
                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {allSelected ? "Limpar módulo" : "Marcar módulo"}
              </button>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {module.actions.map((action) => {
                const checked = selection.has(`${module.key}:${action.key}`);
                return (
                  <label
                    key={action.key}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs transition ${
                      checked
                        ? "border-blue-200 bg-blue-50 text-blue-800"
                        : "border-slate-100 bg-slate-50/60 text-slate-600"
                    } ${moduleDisabled ? "cursor-not-allowed opacity-60" : "hover:border-slate-300"}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={moduleDisabled}
                      onChange={() => toggleAction(module.key, action.key)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    {action.label}
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
