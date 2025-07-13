import { useEffect, useState } from "react";
import Dashboard from "../../../components/dashboard/Dashboard";
import { handleAllEmployee } from "../../../service/api/Administrador/employee";
import { Employee } from "../../../service/interfaces";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Users, DollarSign, TrendingUp, Award } from 'lucide-react';

export default function PositionsAndSalaries() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [activeTab, setActiveTab] = useState<'list' | 'stats'>('list');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await handleAllEmployee();
        setEmployees(res || []);
      } catch (error) {
        console.error("Erro ao buscar funcionários:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const groupedByRole = employees.reduce((acc: Record<string, Employee[]>, emp) => {
    if (!emp.designation) return acc;
    acc[emp.designation] = [...(acc[emp.designation] || []), emp];
    return acc;
  }, {});

  const chartData = Object.entries(groupedByRole).map(([role, emps]) => {
    const totalRoleSalary = emps.reduce((sum, emp) => sum + (Number(emp.salary) || 0), 0);
    return {
      name: role,
      employees: emps.length,
      avgSalary: totalRoleSalary / emps.length
    };
  });

  const totalEmployees = employees.length;
  const totalSalary = employees.reduce((sum, emp) => sum + (Number(emp.salary) || 0), 0);
  const avgSalary = totalSalary / (totalEmployees || 1);

  const highestPaid = employees.length > 0
    ? employees.reduce((max, emp) =>
        Number(emp.salary) > Number(max.salary) ? emp : max, employees[0])
    : null;

  return (
    <Dashboard>
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Cargos e Salários</h1>
            <p className="text-gray-600">Visão geral da equipe por setor e remuneração</p>
          </div>

          <div className="flex mt-4 md:mt-0 bg-white rounded-lg shadow-sm p-1">
            {['list', 'stats'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as 'list' | 'stats')}
                className={`px-4 py-2 rounded-md font-medium transition-colors
                ${activeTab === tab ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                {tab === 'list' ? 'Lista' : 'Estatísticas'}
              </button>
            ))}
          </div>
        </div>

        {/* Conteúdo */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : activeTab === 'list' ? (
          <div className="space-y-6">
            {Object.entries(groupedByRole).map(([role, employees]) => {
              const totalRoleSalary = employees.reduce((sum, emp) => sum + (Number(emp.salary) || 0), 0);
              const avgRoleSalary = totalRoleSalary / employees.length;

              return (
                <div key={role} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                      <Users className="mr-2 text-blue-600" />
                      {role}
                      <span className="ml-2 text-sm font-normal bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                        {employees.length} {employees.length === 1 ? 'membro' : 'membros'}
                      </span>
                    </h2>
                    <div className="text-sm font-medium bg-white px-3 py-1 rounded-full shadow-sm">
                      Média salarial: <span className="text-blue-600">R$ {avgRoleSalary.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuário</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salário</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {employees.map((employee) => (
                          <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                                  {employee.dataEmployee?.fullname?.charAt(0) || employee.username?.charAt(0)}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{employee.dataEmployee?.fullname || 'Não informado'}</div>
                                  <div className="text-sm text-gray-500">{employee.dataEmployee?.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">{employee.username}</td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">R$ {Number(employee.salary).toFixed(2)}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${employee.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {employee.active ? 'Ativo' : 'Inativo'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Estatísticas gerais */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <TrendingUp className="mr-2 text-blue-600" />
                Estatísticas Gerais
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-blue-800">Total de Funcionários</div>
                  <div className="text-2xl font-bold text-blue-600 mt-1">{totalEmployees}</div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-green-800">Folha Salarial Total</div>
                  <div className="text-2xl font-bold text-green-600 mt-1">R$ {totalSalary.toFixed(2)}</div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-purple-800">Média Salarial</div>
                  <div className="text-2xl font-bold text-purple-600 mt-1">R$ {avgSalary.toFixed(2)}</div>
                </div>

                {highestPaid && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-yellow-800">Maior Salário</div>
                    <div className="text-xl font-bold text-yellow-600 mt-1">
                      {highestPaid.dataEmployee?.fullname || highestPaid.username} - R$ {Number(highestPaid.salary).toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Gráfico */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <DollarSign className="mr-2 text-blue-600" />
                Distribuição por Cargo
              </h3>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value, name) => name === 'avgSalary'
                      ? [`R$ ${Number(value).toFixed(2)}`, 'Média Salarial']
                      : [value, 'Funcionários']} />
                    <Bar dataKey="employees" fill="#3b82f6" name="Funcionários" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top cargos por média salarial */}
            <div className="md:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Award className="mr-2 text-blue-600" />
                Top Cargos por Média Salarial
              </h3>

              <div className="space-y-4">
                {chartData
                  .sort((a, b) => b.avgSalary - a.avgSalary)
                  .map(({ name, avgSalary, employees }) => (
                    <div key={name}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{name}</span>
                        <span className="text-sm font-semibold text-blue-600">R$ {avgSalary.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{ width: `${(avgSalary / (chartData[0]?.avgSalary || 1)) * 100}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{employees} {employees === 1 ? 'funcionário' : 'funcionários'}</div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Dashboard>
  );
}
