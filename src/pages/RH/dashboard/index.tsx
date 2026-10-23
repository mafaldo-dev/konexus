import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpenCheck,
  Calculator,
  ChevronRight,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import Dashboard from "../../../components/dashboard/Dashboard";
import { DataState, DataStateVariant } from "../../../components/ui/DataState";
import { getResponseDataState } from "../../../api/responseState";
import {
  EmploymentContributor,
  listEmploymentContributors,
} from "../../../services/employmentService";
import { useAuth } from "../../../AuthContext";

const SHORTCUTS = [
  {
    title: "Colaboradores",
    description: "Consulte e cadastre os colaboradores da empresa.",
    to: "/rh/employees",
    icon: Users,
  },
  {
    title: "Cargos e setores",
    description: "Visão dos vínculos empregatícios por cargo e departamento.",
    to: "/rh/infos",
    icon: UserCheck,
  },
  {
    title: "Folha de pagamento",
    description: "Consulte a situação da folha e das competências.",
    to: "/rh/folha",
    icon: Calculator,
  },
  {
    title: "Treinamentos",
    description: "Acompanhe capacitações e trilhas de desenvolvimento.",
    to: "/rh/treinamentos",
    icon: BookOpenCheck,
  },
];

export default function HRDashboard() {
  const { isCompanyAdmin } = useAuth();
  const [employees, setEmployees] = useState<EmploymentContributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorVariant, setErrorVariant] = useState<DataStateVariant>("error");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setErrorVariant("error");
    try {
      const response = await listEmploymentContributors();
      if (!response.ok || !response.data) {
        setEmployees([]);
        setError(response.error || "Não foi possível carregar os colaboradores.");
        setErrorVariant(getResponseDataState(response));
        return;
      }
      setEmployees(response.data);
    } catch (err) {
      console.error("Erro ao carregar o dashboard de RH:", err);
      setEmployees([]);
      setError("Não foi possível carregar os colaboradores. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const active = employees.filter((employee) => employee.active).length;
  const departments = new Set(
    employees.map((employee) => employee.department).filter(Boolean)
  ).size;
  const positions = new Set(
    employees
      .map((employee) => employee.position_title || employee.role)
      .filter(Boolean)
  ).size;
  const canCreate = isCompanyAdmin;

  return (
    <Dashboard>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Recursos Humanos</h1>
              <p className="mt-1 text-gray-600">
                Painel de colaboradores, cargos e processos de pessoal.
              </p>
            </div>
            {canCreate && (
              <Link
                to="/rh/employees/new"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-800 px-5 py-3 font-medium text-white transition-colors hover:bg-slate-900"
              >
                <UserPlus className="h-4 w-4" />
                Novo colaborador
              </Link>
            )}
          </div>

          {loading ? (
            <div className="rounded-xl border border-gray-200 bg-white">
              <DataState variant="loading" />
            </div>
          ) : error ? (
            <div className="rounded-xl border border-gray-200 bg-white">
              <DataState
                variant={errorVariant}
                description={error}
                onAction={load}
              />
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Colaboradores", value: employees.length },
                  { label: "Ativos", value: active },
                  { label: "Cargos", value: positions },
                  { label: "Departamentos", value: departments },
                ].map((card) => (
                  <div
                    key={card.label}
                    className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {card.label}
                    </p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      {card.value}
                    </p>
                  </div>
                ))}
              </div>

              {employees.length === 0 && (
                <div className="rounded-xl border border-gray-200 bg-white">
                  <DataState
                    variant="empty"
                    description={
                      canCreate
                        ? "Cadastre o primeiro colaborador para começar."
                        : "A empresa ainda não possui colaboradores cadastrados."
                    }
                  />
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                {SHORTCUTS.map((shortcut) => (
                  <Link
                    key={shortcut.to}
                    to={shortcut.to}
                    className="group flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
                  >
                    <div className="rounded-lg bg-slate-100 p-3 text-slate-700">
                      <shortcut.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-gray-900">
                          {shortcut.title}
                        </p>
                        <ChevronRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-0.5" />
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        {shortcut.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </Dashboard>
  );
}
