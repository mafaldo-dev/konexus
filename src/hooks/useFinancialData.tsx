import { listOrders } from '../services/orderService';
import { listPaymentAccounts } from '../services/financialService';
import { OrderResponse, FinancialStats } from '../types';
import { useState } from 'react';
import { DataStateVariant } from '../components/ui/DataState';
import { getResponseDataState } from '../api/responseState';

export const useFinancialData = () => {
  const [contasReceber, setContasReceber] = useState<OrderResponse[]>([]);
  const [contasPagar, setContasPagar] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<OrderResponse[]>([]);
  const [stats, setStats] = useState<FinancialStats>({
    totalReceber: 0,
    totalPagar: 0,
    pedidosPendentes: 0,
    payment_date: 0,
    due_date: 0
  });

  const [isLoadingContasReceber, setIsLoadingContasReceber] = useState(false);
  const [isLoadingContasPagar, setIsLoadingContasPagar] = useState(false);
  const [isLoadingPedidos, setIsLoadingPedidos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorVariant, setErrorVariant] = useState<DataStateVariant>('error');

  const registerError = (
    response: { error?: string | null } & Parameters<typeof getResponseDataState>[0],
    fallback: string
  ) => {
    setError(response.error || fallback);
    setErrorVariant(getResponseDataState(response));
  };

  const getDataAtualBrasil = (): string => {
    const agora = new Date();
    const dataBrasil = new Date(agora.toLocaleString('en-US', {
      timeZone: 'America/Sao_Paulo'
    }));
    const ano = dataBrasil.getFullYear();
    const mes = String(dataBrasil.getMonth() + 1).padStart(2, '0');
    const dia = String(dataBrasil.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  };

  const calcularVencimentosHoje = (contas: any[]): number => {
    const hojeBrasil = getDataAtualBrasil();
    return contas.filter(conta => {
      if (conta.payment_status !== 'pending') return false;
      if (!conta.payment_date) return false;
      return conta.payment_date === hojeBrasil;
    }).length;
  };

  const loadContasReceber = async () => {
    try {
      setIsLoadingContasReceber(true);
      setError(null);
      setErrorVariant('error');

      const response = await listOrders();
      if (!response.ok || !response.data) {
        setContasReceber([]);
        setPedidos([]);
        registerError(
          response,
          'Não foi possível carregar as contas a receber.'
        );
        return;
      }

      const orders = response.data;
      const pedidosPendentes = orders.filter(order => order.orderStatus === 'pending');

      setContasReceber(pedidosPendentes);
      setPedidos(pedidosPendentes);

      const totalReceber = pedidosPendentes.reduce((sum, order) =>
        sum + (Number(order.totalAmount) || 0), 0
      );

      const payment_date = orders.filter(order =>
        order.payment?.status === 'due_today'
      ).length;

      setStats(prev => ({
        ...prev,
        totalReceber,
        pedidosPendentes: pedidosPendentes.length
      }));
    } catch (error) {
      console.error("Erro ao carregar contas a receber:", error);
      setError("Não foi possível carregar as contas a receber. Tente novamente.");
      setErrorVariant("error");
      setContasReceber([]);
      setPedidos([]);
    } finally {
      setIsLoadingContasReceber(false);
    }
  };

  const loadContasPagar = async () => {
    try {
      setIsLoadingContasPagar(true);
      setError(null);
      setErrorVariant('error');

      const response = await listPaymentAccounts({ page: 1, limit: 50 });
      if (!response.ok || !response.data) {
        setContasPagar([]);
        registerError(response, 'Não foi possível carregar as contas a pagar.');
        return;
      }

      const data = response.data.data;
      setContasPagar(data);

      const totalPagar = data
        .filter(conta => conta.payment_status !== 'paid' && conta.payment_status !== 'cancelled')
        .reduce((sum, conta) => sum + (Number(conta.total_amount) || 0), 0);

      const payment_date = calcularVencimentosHoje(data);

      setStats(prev => ({
        ...prev,
        totalPagar,
        payment_date
      }));
    } catch (error) {
      console.error("Erro ao carregar contas a pagar:", error);
      setError("Não foi possível carregar as contas a pagar. Tente novamente.");
      setErrorVariant("error");
      setContasPagar([]);
    } finally {
      setIsLoadingContasPagar(false);
    }
  };

  const loadContasPagarByStatus = async (status?: string) => {
    try {
      setIsLoadingContasPagar(true);
      setError(null);
      setErrorVariant('error');

      const response = await listPaymentAccounts({ payment_status: status, page: 1, limit: 50 });
      if (!response.ok || !response.data) {
        setContasPagar([]);
        registerError(response, 'Não foi possível carregar as contas a pagar.');
        return;
      }
      setContasPagar(response.data.data);
    } catch (error) {
      console.error("Erro ao carregar contas a pagar:", error);
      setError("Não foi possível carregar as contas a pagar. Tente novamente.");
      setErrorVariant("error");
      setContasPagar([]);
    } finally {
      setIsLoadingContasPagar(false);
    }
  };

  const loadContasPagarByPeriod = async (date_start: string, date_end: string) => {
    try {
      setIsLoadingContasPagar(true);
      setError(null);
      setErrorVariant('error');

      const response = await listPaymentAccounts({ date_start, date_end, page: 1, limit: 50 });
      if (!response.ok || !response.data) {
        setContasPagar([]);
        registerError(response, 'Não foi possível carregar as contas a pagar.');
        return;
      }

      const data = response.data.data;
      setContasPagar(data);

      const totalPagar = data
        .filter(conta => conta.payment_status !== 'paid' && conta.payment_status !== 'cancelled')
        .reduce((sum, conta) => sum + (Number(conta.total_amount) || 0), 0);

      setStats(prev => ({
        ...prev,
        totalPagar
      }));
    } catch (error) {
      console.error("Erro ao carregar contas a pagar:", error);
      setError("Não foi possível carregar as contas a pagar por período. Tente novamente.");
      setErrorVariant("error");
      setContasPagar([]);
    } finally {
      setIsLoadingContasPagar(false);
    }
  };

  const loadContasPagarBySupplier = async (supplier: string) => {
    try {
      setIsLoadingContasPagar(true);
      setError(null);
      setErrorVariant('error');

      const response = await listPaymentAccounts({ supplier, page: 1, limit: 50 });
      if (!response.ok || !response.data) {
        setContasPagar([]);
        registerError(response, 'Não foi possível carregar as contas a pagar.');
        return;
      }
      setContasPagar(response.data.data);
    } catch (error) {
      console.error("Erro ao carregar contas a pagar:", error);
      setError("Não foi possível carregar as contas a pagar por fornecedor. Tente novamente.");
      setErrorVariant("error");
      setContasPagar([]);
    } finally {
      setIsLoadingContasPagar(false);
    }
  };

  return {
    contasReceber,
    contasPagar,
    pedidos,
    stats,
    isLoadingContasReceber,
    isLoadingContasPagar,
    isLoadingPedidos,
    error,
    errorVariant,
    loadContasReceber,
    loadContasPagar,
    loadContasPagarByStatus,
    loadContasPagarByPeriod,
    loadContasPagarBySupplier,
    setContasReceber,
    setContasPagar,
    setPedidos,
    setStats
  };
};
