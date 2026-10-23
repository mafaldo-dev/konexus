import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, Users } from "lucide-react";
import Dashboard from "../../../components/dashboard/Dashboard";
import { DynamicTable } from "../../../utils/Table/DynamicTable";
import { DataStateVariant } from "../../../components/ui/DataState";
import { getResponseDataState } from "../../../api/responseState";
import {
  EmploymentContributor,
  listEmploymentContributors,
} from "../../../services/employmentService";

interface RoleRow {
  role: string;
  department: string;
  total: number;
  active: number;
}

/**
 * Cargos e setores: visão real dos vínculos empregatícios retornados pelo
 * backend. Não exibe salários, pois a API atual não fornece remuneração.
 */
export default function PositionsAndSalaries() {
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
        setError(response.error || "Não foi possível carregar os cargos e setores.");
        setErrorVariant(getResponseDataState(response));
        return;
      }
      setEmployees(response.data);
    } catch (err) {
      console.error("Erro ao buscar cargos e setores:", err);
      setEmployees([]);
      setError("Não foi possível carregar os cargos e setores. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rowsMap = new Map<string, RoleRow>();
  employees.forEach((employee) => {
    const role = employee.position_title || employee.role || "Sem cargo";
    const department = employee.department || employee.sector || "Sem departamento";
    const key = `${role}::${department}`;
    const current = rowsMap.get(key) || {
      role,
      department,
      total: 0,
      active: 0,
    };
    current.total += 1;
    if (employee.active) current.active += 1;
    rowsMap.set(key, current);
  });
  const rows = Array.from(rowsMap.values()).sort((a, b) =>
    a.role.localeCompare(b.role)
  );

  const columns = [
    {
      key: "role",
      header: "Cargo",
      render: (row: RoleRow) => (
        <span className="font-semibold text-gray-900">{row.role}</span>
      ),
    },
    {
      key: "department",
      header: "Setor / Departamento",
      render: (row: RoleRow) => (
        <span className="text-sm text-gray-700">{row.department}</span>
      ),
    },
    {
      key: "total",
      header: "Colaboradores",
      render: (row: RoleRow) => (
        <span className="text-sm text-gray-800">{row.total}</span>
      ),
    },
    {
      key: "active",
      header: "Ativos",
      render: (row: RoleRow) => (
        <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          {row.active}
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
                  <Briefcase className="h-6 w-6 text-slate-700" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Cargos e Setores
                  </h1>
                  <p className="mt-1 text-gray-600">
                    Distribuição dos colaboradores por cargo e departamento.
                  </p>
                </div>
              </div>
            </div>
            <Link
              to="/rh/employees"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Users className="h-4 w-4" />
              Ver colaboradores
            </Link>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
            A API atual de colaboradores não fornece salário. Por isso esta tela
            apresenta apenas cargos, setores e situação dos vínculos, sem valores
            estimados.
          </div>

          <DynamicTable
            data={rows}
            columns={columns}
            loading={loading}
            error={error}
            errorVariant={errorVariant}
            onRetry={load}
            width="100%"
            emptyMessage="Não há dados disponíveis."
            emptyDescription="Cadastre colaboradores com cargo e departamento para visualizar esta distribuição."
          />
        </div>
      </div>
    </Dashboard>
  );
}
