import React from 'react';
import { motion } from 'framer-motion';
import { User, DollarSign, Award, TrendingUp, CheckCircle, XCircle } from 'lucide-react';

const formatCurrency = (value: any) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const TableSkeleton = () => (
    <div className="animate-pulse">
        <div className="h-12 bg-slate-200 rounded-t-lg"></div>
        {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-white border-b border-slate-100 flex items-center px-6 gap-4">
                <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
            </div>
        ))}
    </div>
);


export default function CommissionTable({ employees, loading }: any) {
    if (loading) {
        return <TableSkeleton />;
    }

    const totalToPay = employees.reduce((sum: any, emp: any) => sum + emp.totalCommission + emp.bonus, 0);

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 font-semibold text-slate-600 uppercase text-sm">Funcionário</th>
              <th className="px-6 py-4 font-semibold text-slate-600 uppercase text-sm">Cargo</th>
              <th className="px-6 py-4 font-semibold text-slate-600 uppercase text-sm text-right">Comissão (1.5%)</th>
              <th className="px-6 py-4 font-semibold text-slate-600 uppercase text-sm text-center">Bônus</th>
              <th className="px-6 py-4 font-semibold text-slate-600 uppercase text-sm text-right">Total a Receber</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp: any, idx: any) => (
              <motion.tr 
                key={emp.id} 
                className="border-b border-slate-100"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 text-slate-500">
                        <User className="w-5 h-5"/>
                    </div>
                    <div>
                        <div className="font-bold text-slate-900">{emp.username}</div>
                        <div className="text-xs text-slate-500">{emp.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-600">{emp.designation}</td>
                <td className="px-6 py-4 text-right">
                    <div className="font-semibold text-green-600">{formatCurrency(emp.totalCommission)}</div>
                    <div className="text-xs text-slate-500">de {formatCurrency(emp.totalSales)}</div>
                </td>
                <td className="px-6 py-4 text-center">
                  {emp.bonus > 0 ? (
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1 font-semibold text-indigo-600">
                         <Award className="w-4 h-4" /> {formatCurrency(emp.bonus)}
                      </div>
                      <span className="text-xs text-slate-500">Meta atingida</span>
                    </div>
                  ) : (
                    <span className="text-slate-400 text-xs">Sem bônus</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right text-lg font-extrabold text-slate-900">
                  {formatCurrency(emp.totalCommission + emp.bonus)}
                </td>
              </motion.tr>
            ))}
             {employees.length === 0 && (
                <tr>
                    <td colSpan={5} className="text-center py-16 text-slate-500">
                        <p className="font-medium">Nenhum dado de comissão para o período selecionado.</p>
                        <p className="text-sm">Tente selecionar outro mês.</p>
                    </td>
                </tr>
             )}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100">
              <td colSpan={4} className="px-6 py-4 text-right font-bold text-slate-700 uppercase">
                Total Geral
              </td>
              <td className="px-6 py-4 text-right font-extrabold text-xl text-slate-900">
                {formatCurrency(totalToPay)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}