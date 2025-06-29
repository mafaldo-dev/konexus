import React, { useEffect, useState } from 'react';
import Dashboard from '../../../../src/components/dashboard';
import { handleAllEmployee } from '../../../service/api/employee';
import { handleAllOrders } from '../../../service/api/orders';
import { Employee } from '../../../service/interfaces/employees';

interface EmployeeCommission extends Employee {
  totalCommission: number;
  bonus: number;
}

const Commissions: React.FC = () => {
  const [employeesData, setEmployeesData] = useState<EmployeeCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const employees = await handleAllEmployee();
        const orders = await handleAllOrders();

        const completedSales = orders.filter(order => order.status === "Enviado");

        const employeesWithCommissions: EmployeeCommission[] = employees.map(employee => {
          let totalCommission = 0;
          let bonus = 0; // Placeholder for bonus

          if (employee.designation === "Vendedor") {
            const salesByThisSalesperson = completedSales.filter(
              order => order.salesperson === employee.username // Assuming salesperson name matches username
            );
            totalCommission = salesByThisSalesperson.reduce(
              (sum, order) => sum + (order.total_amount * 0.015),
              0
            );

            // TODO: Implement bonus logic based on monthly target
            // For now, bonus is 0 unless a condition is met.
            // Example: if (monthlySalesMetTarget(employee.username)) { bonus = 800; }
          } else {
            // Non-salesperson only gets bonus if target is met
            // TODO: Implement bonus logic for non-salesperson based on overall company target or other criteria
            // Example: if (companyMonthlyTargetMet()) { bonus = 800; }
          }

          return { ...employee, totalCommission, bonus };
        });

        setEmployeesData(employeesWithCommissions);
      } catch (err) {
        console.error("Error fetching data for commissions:", err);
        setError("Failed to load commission data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <Dashboard>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Comissões e Bônus</h1>

        {loading && <p>Carregando dados de comissões...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {!loading && !error && employeesData.length === 0 && (
          <p>Nenhum dado de funcionário encontrado.</p>
        )}

        {!loading && !error && employeesData.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b">Nome do Funcionário</th>
                  <th className="py-2 px-4 border-b">Cargo</th>
                  <th className="py-2 px-4 border-b">Comissão Total (1.5%)</th>
                  <th className="py-2 px-4 border-b">Bônus (R$800)</th>
                  <th className="py-2 px-4 border-b">Total a Receber</th>
                </tr>
              </thead>
              <tbody>
                {employeesData.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b text-center">{employee.username}</td>
                    <td className="py-2 px-4 border-b text-center">{employee.designation}</td>
                    <td className="py-2 px-4 border-b text-center">R$ {employee.totalCommission.toFixed(2)}</td>
                    <td className="py-2 px-4 border-b text-center">R$ {employee.bonus.toFixed(2)}</td>
                    <td className="py-2 px-4 border-b text-center">R$ {(employee.totalCommission + employee.bonus).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Dashboard>
  );
};

export default Commissions;
