import { Dashboard, Fornecedor, Pagamento, PaginationResponse, PaymentAccount } from "../../../interfaces/financial/paymentAccounts";
import { apiRequest, apiRequestBlob } from "../../api";

export async function getDashboard(token?: string): Promise<Dashboard> {
  const tkn = token || localStorage.getItem("token") as string;
  
  try {
    const response = await apiRequest("payment/dashboard", "GET", undefined, tkn);
    console.log(response)
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar dashboard:", error);
    throw new Error("Erro ao carregar dashboard");
  }
}

// ====================== CONTAS A PAGAR (PAYMENT ACCOUNTS) ====================== //

export async function getPaymentAccounts(
  filters?: {
    payment_status?: string;
    supplier?: string;
    date_start?: string;
    date_end?: string;
    companyid?: number;
    page?: number;
    limit?: number;
  },
  token?: string
): Promise<PaginationResponse<PaymentAccount>> {
  const tkn = token || localStorage.getItem("token") as string;
  
  try {
    const params = new URLSearchParams();
    if (filters?.payment_status) params.append('payment_status', filters.payment_status);
    if (filters?.supplier) params.append('supplier', filters.supplier);
    if (filters?.date_start) params.append('date_start', filters.date_start);
    if (filters?.date_end) params.append('date_end', filters.date_end);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await apiRequest(`payment/accounts${queryString}`, "GET", undefined, tkn);
    return response;
  } catch (error) {
    console.error("Erro ao buscar contas a pagar:", error);
    throw new Error("Erro ao carregar contas a pagar");
  }
}

export async function getPaymentAccountById(id: string | number, token?: string): Promise<PaymentAccount> {
  const tkn = token || localStorage.getItem("token") as string;
  
  try {
    const response = await apiRequest(`payment/accounts/${id}`, "GET", undefined, tkn);
    return response;
  } catch (error) {
    console.error("Erro ao buscar conta a pagar:", error);
    throw new Error("Erro ao carregar conta a pagar");
  }
}

export async function createPaymentAccount(
  data: {
    title: string;
    supplier: string;
    total_amount: number;
    description?: string;
    payment_date: string;
    payment_status?: string;
  },
  token?: string
): Promise<PaymentAccount> {
  const tkn = token || localStorage.getItem("token") as string;
  
  try {
    const response = await apiRequest("payment/accounts", "POST", data, tkn);
    return response.data;
  } catch (error) {
    console.error("Erro ao criar conta a pagar:", error);
    throw new Error("Erro ao criar conta a pagar");
  }
}

export async function updatePaymentAccount(
  id: string | number,
  data: Partial<PaymentAccount>,
  token?: string
): Promise<PaymentAccount> {
  const tkn = token || localStorage.getItem("token") as string;
  
  try {
    const response = await apiRequest(`payment/accounts/${id}`, "PUT", data, tkn);
    return response.data;
  } catch (error) {
    console.error("Erro ao atualizar conta a pagar:", error);
    throw new Error("Erro ao atualizar conta a pagar");
  }
}

export async function deletePaymentAccount(id: string | number, token?: string): Promise<void> {
  const tkn = token || localStorage.getItem("token") as string;
  
  try {
    await apiRequest(`payment/accounts/${id}`, "DELETE", undefined, tkn);
  } catch (error) {
    console.error("Erro ao deletar conta a pagar:", error);
    throw new Error("Erro ao deletar conta a pagar");
  }
}

export async function getPaymentSummary(
  companyid?: number,
  token?: string
): Promise<{
  pending: { count: number; total: number };
  paid: { count: number; total: number };
  overdue: { count: number; total: number };
  cancelled: { count: number; total: number };
}> {
  const tkn = token || localStorage.getItem("token") as string;
  
  try {
    const queryString = companyid ? `?companyid=${companyid}` : '';
    const response = await apiRequest(`payment/accounts/summary${queryString}`, "GET", undefined, tkn);
    return response;
  } catch (error) {
    console.error("Erro ao buscar resumo:", error);
    throw new Error("Erro ao carregar resumo");
  }
}

// ====================== PAGAMENTOS (mantido para compatibilidade) ====================== //

export async function registrarPagamento(
  data: {
    title: number;
    total_amount: number;
    data_pagamento: string;
    forma_pagamento: string;
    conta_bancaria?: string;
    juros?: number;
    multa?: number;
    desconto?: number;
    observacao?: string;
  },
  token?: string
): Promise<any> {
  const tkn = token || localStorage.getItem("token") as string;
  
  try {
    const response = await apiRequest("payment/pagamentos", "POST", data, tkn);
    return response.data;
  } catch (error) {
    console.error("Erro ao registrar pagamento:", error);
    throw new Error("Erro ao registrar pagamento");
  }
}

export async function estornarPagamento(id: string | number, token?: string): Promise<void> {
  const tkn = token || localStorage.getItem("token") as string;
  
  try {
    await apiRequest(`payment/pagamentos/${id}/estornar`, "DELETE", undefined, tkn);
  } catch (error) {
    console.error("Erro ao estornar pagamento:", error);
    throw new Error("Erro ao estornar pagamento");
  }
}

export async function getPagamentosByTitulo(
  titulo_id: string | number,
  token?: string
): Promise<Pagamento[]> {
  const tkn = token || localStorage.getItem("token") as string;
  
  try {
    const response = await apiRequest(
      `payment/pagamentos/titulo/${titulo_id}`,
      "GET",
      undefined,
      tkn
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar pagamentos:", error);
    throw new Error("Erro ao carregar pagamentos");
  }
}

// ====================== FORNECEDORES ====================== //

export async function getFornecedores(token?: string): Promise<Fornecedor[]> {
  const tkn = token || localStorage.getItem("token") as string;
  
  try {
    const response = await apiRequest("payment/fornecedores", "GET", undefined, tkn);
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar fornecedores:", error);
    throw new Error("Erro ao carregar fornecedores");
  }
}

export async function createFornecedor(
  data: Omit<Fornecedor, 'id' | 'ativo'>,
  token?: string
): Promise<Fornecedor> {
  const tkn = token || localStorage.getItem("token") as string;
  
  try {
    const response = await apiRequest("payment/fornecedores", "POST", data, tkn);
    return response.data;
  } catch (error) {
    console.error("Erro ao criar fornecedor:", error);
    throw new Error("Erro ao criar fornecedor");
  }
}

// ====================== RELATÓRIOS ====================== //

export async function getRelatorioContasPorPeriodo(
  data_inicio: string,
  data_fim: string,
  token?: string
): Promise<any> {
  const tkn = token || localStorage.getItem("token") as string;
  
  try {
    const response = await apiRequest(
      `payment/relatorios/periodo?data_inicio=${data_inicio}&data_fim=${data_fim}`,
      "GET",
      undefined,
      tkn
    );
    return response;
  } catch (error) {
    console.error("Erro ao gerar relatório:", error);
    throw new Error("Erro ao gerar relatório");
  }
}

export async function getRelatorioContasAtrasadas(token?: string): Promise<any> {
  const tkn = token || localStorage.getItem("token") as string;
  
  try {
    const response = await apiRequest(
      "payment/relatorios/atrasadas",
      "GET",
      undefined,
      tkn
    );
    return response;
  } catch (error) {
    console.error("Erro ao gerar relatório de atrasadas:", error);
    throw new Error("Erro ao gerar relatório");
  }
}

export async function getRelatorioRankingFornecedores(
  data_inicio?: string,
  data_fim?: string,
  token?: string
): Promise<any> {
  const tkn = token || localStorage.getItem("token") as string;
  
  try {
    let url = "payment/relatorios/ranking-fornecedores";
    if (data_inicio && data_fim) {
      url += `?data_inicio=${data_inicio}&data_fim=${data_fim}`;
    }
    
    const response = await apiRequest(url, "GET", undefined, tkn);
    return response;
  } catch (error) {
    console.error("Erro ao gerar ranking de fornecedores:", error);
    throw new Error("Erro ao gerar ranking");
  }
}

// ====================== EXPORTAÇÃO ====================== //

export async function exportarRelatorio(
  tipo: 'pdf' | 'xlsx',
  filtros: any,
  token?: string
): Promise<void> {
  const tkn = token || localStorage.getItem("token") as string;
  
  try {
    const blob = await apiRequestBlob(
      `payment/accounts/exportar?formato=${tipo}`,
      "GET",
      undefined,
      tkn
    );
    
    if (!blob) {
      throw new Error('Não foi possível gerar o arquivo');
    }
    
    // Criar link de download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contas-pagar.${tipo}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Erro ao exportar relatório:", error);
    throw new Error("Erro ao exportar");
  }
}

// ====================== FUNÇÕES LEGADAS (MAPEAMENTO) ====================== //
// Mantidas para compatibilidade com código existente

/**
 * @deprecated Use getPaymentAccounts ao invés
 */
export async function getTitulos(
  filters?: {
    status?: string;
    fornecedor_id?: number;
    data_inicio?: string;
    data_fim?: string;
    categoria?: string;
    page?: number;
    limit?: number;
  },
  token?: string
): Promise<PaginationResponse<PaymentAccount>> {
  console.warn('getTitulos está deprecated, use getPaymentAccounts');
  return getPaymentAccounts(
    {
      payment_status: filters?.status,
      date_start: filters?.data_inicio,
      date_end: filters?.data_fim,
      page: filters?.page,
      limit: filters?.limit,
    },
    token
  );
}

/**
 * @deprecated Use getPaymentAccountById ao invés
 */
export async function getTituloById(id: string | number, token?: string): Promise<PaymentAccount> {
  console.warn('getTituloById está deprecated, use getPaymentAccountById');
  return getPaymentAccountById(id, token);
}

/**
 * @deprecated Use createPaymentAccount ao invés
 */
export async function createTitulo(
  data: any,
  token?: string
): Promise<PaymentAccount> {
  console.warn('createTitulo está deprecated, use createPaymentAccount');
  return createPaymentAccount(data, token);
}

/**
 * @deprecated Use updatePaymentAccount ao invés
 */
export async function updateTitulo(
  id: string | number,
  data: Partial<PaymentAccount>,
  token?: string
): Promise<PaymentAccount> {
  console.warn('updateTitulo está deprecated, use updatePaymentAccount');
  return updatePaymentAccount(id, data, token);
}

/**
 * @deprecated Use deletePaymentAccount ao invés
 */
export async function deleteTitulo(id: string | number, token?: string): Promise<void> {
  console.warn('deleteTitulo está deprecated, use deletePaymentAccount');
  return deletePaymentAccount(id, token);
}