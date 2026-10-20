import { useMemo, useState } from "react";
import { CheckCircle2, Settings } from "lucide-react";

import { useAuth } from "../../AuthContext";
import {
  PRODUCT_UPDATES,
  ProductUpdateFilterKey,
  UPDATE_MODULE_LABELS,
  filterProductUpdates,
  formatProductUpdateDate,
  getProductUpdateFilters,
  getVisibleProductUpdates,
} from "../../data/productUpdates";

/**
 * Painel "Últimas Atualizações".
 *
 * Mostra as novidades funcionais do produto, organizadas por módulo e
 * versão. O filtro funciona no navegador, sem recarregar a página, e a
 * lista só inclui módulos extras (CRM, NF-e, Contábil) quando a empresa tem
 * a contratação e o usuário tem permissão.
 */
export default function ProductUpdatesPanel() {
  const { modules, permissions, isCompanyAdmin } = useAuth();
  const [selectedModule, setSelectedModule] = useState<ProductUpdateFilterKey>(
    "all"
  );

  const visibleUpdates = useMemo(
    () =>
      getVisibleProductUpdates(PRODUCT_UPDATES, {
        availableModules: modules,
        permissions,
        isCompanyAdmin,
      }),
    [modules, permissions, isCompanyAdmin]
  );

  const filters = useMemo(
    () => getProductUpdateFilters(visibleUpdates),
    [visibleUpdates]
  );

  const listedUpdates = useMemo(
    () => filterProductUpdates(visibleUpdates, selectedModule),
    [visibleUpdates, selectedModule]
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Últimas Atualizações
          </h3>
          <Settings className="w-5 h-5 text-gray-500" />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Novidades disponíveis na sua empresa, por módulo e versão.
        </p>
      </div>

      {filters.length > 1 ? (
        <div
          className="px-5 pt-4 flex flex-wrap gap-2"
          role="group"
          aria-label="Filtrar atualizações por módulo"
        >
          {filters.map((filter) => {
            const active = filter.key === selectedModule;
            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => setSelectedModule(filter.key)}
                aria-pressed={active}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition ${
                  active
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="p-5">
        {listedUpdates.length === 0 ? (
          <p className="text-sm text-gray-500">
            Ainda não há novidades publicadas para este módulo.
          </p>
        ) : (
          <ul className="space-y-5">
            {listedUpdates.map((update) => {
              const date = formatProductUpdateDate(update.releasedAt);
              return (
                <li key={update.id} className="border-l-2 border-blue-200 pl-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                      {UPDATE_MODULE_LABELS[update.module]}
                    </span>
                    <span className="text-xs text-gray-500">
                      Versão {update.version}
                    </span>
                    {date ? (
                      <span className="text-xs text-gray-400">{date}</span>
                    ) : null}
                  </div>
                  <div className="flex items-start gap-2 mt-1.5">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {update.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {update.description}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
