import { useState, useEffect } from 'react';
import { FilterState } from '../service/interfaces/financial/paymentAccounts';


export const useFinancialFilters = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    status: '',
    startDate: '',
    endDate: '',
    minValue: '',
    maxValue: ''
  });

  const aplicarFiltros = (dados: any[], termo: string, filtros: FilterState) => {
    let filtrados = dados;

    if (termo) {
      filtrados = filtrados.filter(item =>
        item.orderNumber?.toLowerCase().includes(termo.toLowerCase()) ||
        item.customer?.name?.toLowerCase().includes(termo.toLowerCase()) ||
        item.customer_name?.toLowerCase().includes(termo.toLowerCase()) ||
        item.fornecedor_nome?.toLowerCase().includes(termo.toLowerCase()) ||
        item.ordernumber?.toLowerCase().includes(termo.toLowerCase()) ||
        item.descricao?.toLowerCase().includes(termo.toLowerCase())
      );
    }

    if (filtros.status) {
      filtrados = filtrados.filter(item =>
        item.payment_status === filtros.status || item.status === filtros.status
      );
    }

    if (filtros.startDate && filtros.endDate) {
      filtrados = filtrados.filter(item => {
        const itemDate = item.due_date || item.data_vencimento || item.orderDate;
        if (!itemDate) return false;

        const date = new Date(itemDate);
        const start = new Date(filtros.startDate);
        const end = new Date(filtros.endDate);
        end.setHours(23, 59, 59, 999);

        return date >= start && date <= end;
      });
    }

    if (filtros.minValue) {
      const min = parseFloat(filtros.minValue);
      filtrados = filtrados.filter(item => {
        const valor = item.totalAmount || item.amount || item.valor_total || 0;
        return parseFloat(valor) >= min;
      });
    }

    if (filtros.maxValue) {
      const max = parseFloat(filtros.maxValue);
      filtrados = filtrados.filter(item => {
        const valor = item.totalAmount || item.amount || item.valor_total || 0;
        return parseFloat(valor) <= max;
      });
    }

    return filtrados;
  };

  return {
    searchTerm,
    setSearchTerm,
    activeFilters,
    setActiveFilters,
    aplicarFiltros
  };
};