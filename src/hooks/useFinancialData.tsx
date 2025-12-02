import { getPaymentAccounts } from '../service/api/Administrador/financial/paymentAccounts';
import { handleAllOrders } from '../service/api/Administrador/orders';
import { OrderResponse } from '../service/interfaces';
import { PaymentAccount, FinancialStats, PaginationResponse } from '../service/interfaces/financial/paymentAccounts';
import { useState } from 'react';

export const useFinancialData = () => {
  const [contasReceber, setContasReceber] = useState<OrderResponse[]>([]);
  const [contasPagar, setContasPagar] = useState<PaymentAccount[]>([]);
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

  const calcularVencimentosHoje = (contas: PaymentAccount[]): number => {
    const hojeBrasil = getDataAtualBrasil();
    console.log("Data atual no Brasil:", hojeBrasil);

    return contas.filter(conta => {
      if (conta.payment_status !== 'pending') return false;
      if (!conta.payment_date) return false;

      console.log(`Comparando: ${conta.payment_date} === ${hojeBrasil}`);
      return conta.payment_date === hojeBrasil;
    }).length;
  };


  const loadContasReceber = async () => {
    try {
      setIsLoadingContasReceber(true);
      setError(null);

      const response = await handleAllOrders();
      const pedidosPendentes = response.filter(order => order.orderStatus === 'pending');

      setContasReceber(pedidosPendentes);
      setPedidos(pedidosPendentes);

      const totalReceber = pedidosPendentes.reduce((sum, order) =>
        sum + (parseFloat(order.totalAmount) || 0), 0
      );

      const payment_date = response.filter(order =>
        order.payment?.status === 'due_today'
      ).length;

      setStats(prev => ({
        ...prev,
        totalReceber,
        pedidosPendentes: pedidosPendentes.length
      }));
    } catch (error) {
      console.error("Erro ao carregar contas a receber:", error);
      setError("Erro ao carregar contas a receber");
    } finally {
      setIsLoadingContasReceber(false);
    }
  };

  const loadContasPagar = async () => {
    try {
      setIsLoadingContasPagar(true);
      setError(null);

      const response: PaginationResponse<PaymentAccount> = await getPaymentAccounts({
        page: 1,
        limit: 50
      });

      if (response && response.data) {
        setContasPagar(response.data);
        console.log("aqui meu patrao response =>", response.data)

        const totalPagar = response.data
          .filter(conta => conta.payment_status !== 'paid' && conta.payment_status !== 'cancelled')
          .reduce((sum, conta) => sum + (parseFloat(conta.total_amount || '0')), 0);
        console.log("aqui meu patrao total a pagar =>", totalPagar)
        // Agora calcula CORRETAMENTE os vencimentos de hoje
        const payment_date = calcularVencimentosHoje(response.data);
        console.log("aqui meu patrao payment_date =>", payment_date)

        setStats(prev => ({
          ...prev,
          totalPagar,
          payment_date
        }));
      } else {
        setContasPagar([]);
      }
    } catch (error) {
      console.error("Erro ao carregar contas a pagar:", error);
      setError("Erro ao carregar contas a pagar");
      setContasPagar([]);
    } finally {
      setIsLoadingContasPagar(false);
    }
  };
  const loadContasPagarByStatus = async (status?: string) => {
    try {
      setIsLoadingContasPagar(true);
      setError(null);

      const response: PaginationResponse<PaymentAccount> = await getPaymentAccounts({
        payment_status: status,
        page: 1,
        limit: 50
      });

      if (response && response.data) {
        setContasPagar(response.data);
      } else {
        setContasPagar([]);
      }
    } catch (error) {
      console.error("Erro ao carregar contas a pagar:", error);
      setError("Erro ao carregar contas a pagar");
      setContasPagar([]);
    } finally {
      setIsLoadingContasPagar(false);
    }
  };

  const loadContasPagarByPeriod = async (date_start: string, date_end: string) => {
    try {
      setIsLoadingContasPagar(true);
      setError(null);

      const response: PaginationResponse<PaymentAccount> = await getPaymentAccounts({
        date_start,
        date_end,
        page: 1,
        limit: 50
      });

      if (response && response.data) {
        setContasPagar(response.data);

        const totalPagar = response.data
          .filter(conta => conta.payment_status !== 'paid' && conta.payment_status !== 'cancelled')
          .reduce((sum, conta) => sum + (conta.total_amount || 0), 0);

        setStats(prev => ({
          ...prev,
          totalPagar
        }));
      } else {
        setContasPagar([]);
      }
    } catch (error) {
      console.error("Erro ao carregar contas a pagar:", error);
      setError("Erro ao carregar contas a pagar por período");
      setContasPagar([]);
    } finally {
      setIsLoadingContasPagar(false);
    }
  };

  const loadContasPagarBySupplier = async (supplier: string) => {
    try {
      setIsLoadingContasPagar(true);
      setError(null);

      const response: PaginationResponse<PaymentAccount> = await getPaymentAccounts({
        supplier,
        page: 1,
        limit: 50
      });

      if (response && response.data) {
        setContasPagar(response.data);
      } else {
        setContasPagar([]);
      }
    } catch (error) {
      console.error("Erro ao carregar contas a pagar:", error);
      setError("Erro ao carregar contas a pagar por fornecedor");
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
