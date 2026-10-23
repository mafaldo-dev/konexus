import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, UserCheck } from "lucide-react";
import Dashboard from "../../../components/dashboard/Dashboard";
import { DynamicTable } from "../../../utils/Table/DynamicTable";
import { DataStateVariant } from "../../../components/ui/DataState";
import { getResponseDataState } from "../../../api/responseState";
import {
  EmploymentContributor,
  listEmploymentContributors,
} from "../../../services/employmentService";
import { useAuth } from "../../../AuthContext";

export default function EmployeesPage() {
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
      console.error("Erro ao carregar colaboradores:", err);
      setEmployees([]);
      setError("Não foi possível carregar os colaboradores. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Contas de acesso continuam sendo uma operação do administrador da
  // empresa. Possuir permissão de RH não permite criar credenciais.
  const canCreate = isCompanyAdmin;

  const columns = [
    {
      key: "username",
      header: "Colaborador",
      render: (employee: EmploymentContributor) => (
        <div>
          <p className="font-semibold text-gray-900">{employee.username || "—"}</p>
          <p className="text-xs text-gray-500">
            {employee.role || "Perfil de acesso não informado"}
          </p>
        </div>
      ),
    },
    {
      key: "sector",
      header: "Setor",
      render: (employee: EmploymentContributor) => (
        <span className="text-sm text-gray-700">{employee.sector || "—"}</span>
      ),
    },
    {
      key: "position_title",
      header: "Cargo / Departamento",
      render: (employee: EmploymentContributor) => (
        <div>
          <p className="text-sm text-gray-800">
            {employee.position_title || "—"}
          </p>
          <p className="text-xs text-gray-500">{employee.department || ""}</p>
        </div>
      ),
    },
    {
      key: "employer",
      header: "CNPJ empregador",
      render: (employee: EmploymentContributor) => (
        <div>
          <p className="text-sm text-gray-700">
            {employee.employer_trade_name || employee.employer_legal_name || "—"}
          </p>
          <p className="text-xs text-gray-500">{employee.employer_cnpj || ""}</p>
        </div>
      ),
    },
    {
      key: "active",
      header: "Situação",
      render: (employee: EmploymentContributor) => (
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
            employee.active
              ? "bg-emerald-50 text-emerald-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {employee.active ? "Ativo" : "Inativo"}
        </span>
      ),
    },
  ];

  return (
    <Dashboard>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                  <UserCheck className="h-6 w-6 text-slate-700" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Colaboradores</h1>
                  <p className="mt-1 text-gray-600">
                    Pessoas vinculadas à empresa e seus cargos.
                  </p>
                </div>
              </div>
            </div>
            {canCreate && (
              <Link
                to="/rh/employees/new"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-800 px-5 py-3 font-medium text-white transition-colors hover:bg-slate-900"
              >
                <Plus className="h-4 w-4" />
                Novo colaborador
              </Link>
            )}
          </div>

          <DynamicTable
            data={employees}
            columns={columns}
            loading={loading}
            error={error}
            errorVariant={errorVariant}
            onRetry={load}
            width="100%"
            emptyMessage="Não há dados disponíveis."
            emptyDescription={
              canCreate
                ? "Cadastre o primeiro colaborador para começar."
                : "A empresa ainda não possui colaboradores vinculados."
            }
          />
        </div>
      </div>
    </Dashboard>
  );
}
