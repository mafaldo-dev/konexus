import { useEffect, useState, useMemo } from 'react';
import { Employee } from '../../../service/interfaces/humanResources/employees';
import { motion } from 'framer-motion';

import { handleAllEmployee } from '../../../service/api/Administrador/employee';
import { handleAllOrders } from '../../../service/api/Administrador/orders';

import { Award } from 'lucide-react';

import CommissionStats from '../commissions/components/CommisionStats';
import CommissionFilters from '../commissions/components/CommissionsFilter';
import CommissionTable from '../commissions/components/CommissionsTable';

import Dashboard from '../../../components/dashboard/Dashboard';

// --- Constantes de Configuração ---
const COMMISSION_RATE = 0.015; // 1.5%
const SALES_GOAL = 15000; // R$15.000
const BONUS_AMOUNT = 800; // R$800

const getAvailableMonths = () => {
  const months = [];
  const date = new Date();
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  for (let i = 0; i < 12; i++) {
    const year = date.getFullYear();
    const month = date.getMonth();
    months.push({
      label: `${monthNames[month]} de ${year}`,
      value: `${year}-${String(month + 1).padStart(2, '0')}`
    });
    date.setMonth(date.getMonth() - 1);
  }
  return months;
};
const availableMonths = getAvailableMonths();

interface EmployeeWithMonthlyData extends Employee {
  monthlyData: {
    [monthKey: string]: {
      totalSales: number;
      totalCommission: number;
      bonus: number;
    };
  };
}
type TopPerformer = {
  name: string;
  value: number;
};

export default function Commissions() {
  const [employeesData, setEmployeesData] = useState<EmployeeWithMonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>("");
  const [selectedMonth, setSelectedMonth] = useState(availableMonths[0].value);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [employees, orders] = await Promise.all([
          handleAllEmployee(),
          handleAllOrders()
        ]);

        const completedSales = orders.filter(order => order.orderStatus === "Enviado");

        const employeesWithCommissions = employees.map((employee: any) => {
          const salesByEmployee = completedSales.filter(
            order => order.salesperson === employee.username
          );

          // CORREÇÃO: Tipagem explícita com índice string
          const monthlyData: {
            [monthKey: string]: {
              totalSales: number;
              totalCommission: number;
              bonus: number;
            };
          } = {};

          availableMonths.forEach(month => {
            const [year, monthNum] = month.value.split('-').map(Number);

            const salesInMonth = salesByEmployee.filter(order => {
              const orderDate = new Date(order.orderDate);
              return orderDate.getFullYear() === year && (orderDate.getMonth() + 1) === monthNum;
            });

            const totalSales = salesInMonth.reduce((sum, order) => sum + order.totalAmount, 0);
            const totalCommission = totalSales * COMMISSION_RATE;
            const bonus = totalSales >= SALES_GOAL ? BONUS_AMOUNT : 0;

            monthlyData[month.value] = { totalSales, totalCommission, bonus };
          });

          return { ...employee, monthlyData };
        });

        setEmployeesData(employeesWithCommissions);
        setError(null);
      } catch (err) {
        console.error("Erro ao buscar dados:", err);
        setError("Falha ao carregar os dados de comissões.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const processedDataForMonth = useMemo(() => {
    return employeesData
      .map(emp => {
        const dataForMonth = emp.monthlyData ? (emp.monthlyData[selectedMonth] || { totalSales: 0, totalCommission: 0, bonus: 0 }) : { totalSales: 0, totalCommission: 0, bonus: 0 };
        return {
          ...emp,
          totalSales: dataForMonth.totalSales,
          totalCommission: dataForMonth.totalCommission,
          bonus: dataForMonth.bonus,
        };
      })
      .filter(emp => emp.role === "Vendedor"); // Apenas vendedores
  }, [employeesData, selectedMonth]);


  const commissionStats = useMemo(() => {
    const totalCommission = processedDataForMonth.reduce((sum, emp) => sum + emp.totalCommission, 0);
    const totalBonus = processedDataForMonth.reduce((sum, emp) => sum + emp.bonus, 0);
    const salesWithValue = processedDataForMonth.reduce((sum, emp) => sum + emp.totalSales, 0);

    const topPerformer = processedDataForMonth.reduce<TopPerformer>(
      (top, emp) => {
        if (emp.totalCommission > top.value) {
          return { name: emp.username, value: emp.totalCommission };
        }
        return top;
      },
      { name: '', value: 0 }
    );

    return { totalCommission, totalBonus, topPerformer, salesWithValue };
  }, [processedDataForMonth]);

  return (
    <Dashboard>
      <div className="min-h-screen bg-slate-50">
        <main className="max-w-7xl mx-auto p-6 sm:p-10">
          <motion.header
            className="mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                <Award className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900">Painel de Comissões</h1>
                <p className="mt-1 text-slate-600">Acompanhe comissões e bônus dos vendedores.</p>
              </div>
            </div>
          </motion.header>

          {error && <p className="text-red-600 text-center py-20 font-semibold">{error}</p>}

          {!error && (
            <>
              <CommissionStats stats={commissionStats} />
              <CommissionFilters selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} availableMonths={availableMonths} />
              <CommissionTable employees={processedDataForMonth} loading={loading} />
            </>
          )}
        </main>
      </div>
    </Dashboard>
  );
}