import { apiClient, apiRequest } from "../api/client";
import { listProducts, createProduct } from "./productService";
import { listSuppliers } from "./supplierService";
import { listOrders } from "./orderService";
import {
  createPurchaseOrder,
  listPurchaseOrders,
} from "./purchaseService";
import { createEmployee, listEmployees } from "./employeeService";
import {
  listAccountingAccounts,
  listAccountingEntries,
  reverseAccountingEntry,
} from "./accountingService";
import { listAuditEvents, listWorkStations } from "./auditService";
import { listCustomers } from "./customerService";
import { listEmploymentContributors } from "./employmentService";
import {
  getPaymentsByCustomer,
  listPaymentAccounts,
  listPayments,
} from "./financialService";
import { listNfe } from "./nfeService";
import { getKardexByProduct } from "./kardexService";

jest.mock("../api/client", () => ({
  apiRequest: jest.fn(),
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const get = apiClient.get as jest.Mock;
const post = apiClient.post as jest.Mock;
const request = apiRequest as jest.Mock;

const ok = (data: any) => ({ data, error: null, status: 200, ok: true });
const fail = (status = 500, error = "Falha no servidor") => ({
  data: null,
  error,
  status,
  ok: false,
});

beforeEach(() => {
  jest.clearAllMocks();
  request.mockClear();
});

describe("contratos dos serviços após normalização", () => {
  it("lista produtos tanto no envelope atual quanto em array direto", async () => {
    get.mockResolvedValueOnce(
      ok({ Info: "Lista de produtos", products: [{ id: 1, name: "A" }] })
    );
    await expect(listProducts()).resolves.toMatchObject({
      ok: true,
      data: [{ id: 1, name: "A" }],
    });

    get.mockResolvedValueOnce(ok([{ id: 2, name: "B" }]));
    await expect(listProducts()).resolves.toMatchObject({
      ok: true,
      data: [{ id: 2, name: "B" }],
    });
  });

  it("retorna erro de contrato para produto em formato desconhecido", async () => {
    get.mockResolvedValueOnce(ok({ items: [] }));
    const response = await listProducts();
    expect(response.ok).toBe(false);
    expect(response.code).toBe("INVALID_API_CONTRACT");
  });

  it("desembrulha produto criado", async () => {
    post.mockResolvedValueOnce(ok({ Info: "Produto criado", product: { id: 9 } }));
    await expect(createProduct({} as any)).resolves.toMatchObject({
      ok: true,
      data: { id: 9 },
    });
  });

  it("lista clientes pelo envelope data validado", async () => {
    get.mockResolvedValueOnce(
      ok({ status: "success", data: [{ id: 3, name: "Cliente" }] })
    );
    await expect(listCustomers()).resolves.toMatchObject({
      ok: true,
      data: [{ id: 3, name: "Cliente" }],
    });

    get.mockResolvedValueOnce(ok({ status: "success", data: "inválido" }));
    await expect(listCustomers()).resolves.toMatchObject({
      ok: false,
      code: "INVALID_API_CONTRACT",
    });
  });

  it("lista o diretório de RH pelo contrato de vínculos", async () => {
    get.mockResolvedValueOnce(
      ok({
        success: true,
        data: [
          {
            id: 4,
            username: "maria",
            active: true,
            position_title: "Analista",
            employer_cnpj: "123",
          },
        ],
      })
    );
    await expect(listEmploymentContributors()).resolves.toMatchObject({
      ok: true,
      data: [
        {
          id: 4,
          username: "maria",
          position_title: "Analista",
        },
      ],
    });
  });

  it("valida a página de contas a pagar sem esconder contrato inválido", async () => {
    get.mockResolvedValueOnce(
      ok({
        data: [{ id: 1, title: "Energia", total_amount: 90 }],
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
      })
    );
    await expect(listPaymentAccounts()).resolves.toMatchObject({
      ok: true,
      data: {
        data: [{ id: 1, title: "Energia", total_amount: 90 }],
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
      },
    });

    get.mockResolvedValueOnce(ok({ status: "success", rows: [] }));
    await expect(listPaymentAccounts()).resolves.toMatchObject({
      ok: false,
      code: "INVALID_API_CONTRACT",
    });
  });

  it("valida pagamentos e o histórico do cliente", async () => {
    get.mockResolvedValueOnce(
      ok({
        status: "success",
        data: [{ id: 10, amount: 50, payment_status: "pending" }],
        pagination: { total: 1, page: 1, limit: 50, totalPages: 1 },
      })
    );
    await expect(listPayments()).resolves.toMatchObject({
      ok: true,
      data: {
        data: [{ id: 10, amount: 50, payment_status: "pending" }],
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
      },
    });

    get.mockResolvedValueOnce(
      ok({
        customer: { id: 2, name: "Cliente" },
        orders: [{ id: 1, ordernumber: "P-1" }],
        payments: [{ id: 3, amount: 10, payment_status: "pending" }],
        pagination: { total: 1, page: 1, limit: 50, totalPages: 1 },
      })
    );
    await expect(getPaymentsByCustomer(2)).resolves.toMatchObject({
      ok: true,
      data: {
        customer: { id: 2, name: "Cliente" },
        orders: [{ id: 1, ordernumber: "P-1" }],
        payments: [{ id: 3, amount: 10, payment_status: "pending" }],
      },
    });

    get.mockResolvedValueOnce(ok({ customer: { id: 2, name: "Cliente" } }));
    await expect(getPaymentsByCustomer(2)).resolves.toMatchObject({
      ok: false,
      code: "INVALID_API_CONTRACT",
    });
  });

  it("valida as notas fiscais e o Kardex do produto", async () => {
    get.mockResolvedValueOnce(
      ok({ success: true, total: 1, notas: [{ id: "nfe-1" }] })
    );
    await expect(listNfe()).resolves.toMatchObject({
      ok: true,
      data: { notas: [{ id: "nfe-1" }], total: 1 },
    });

    get.mockResolvedValueOnce(
      ok({ Info: "Sucesso!", product: { id: 1, stock: 2 }, movements: [] })
    );
    await expect(getKardexByProduct(1)).resolves.toMatchObject({
      ok: true,
      data: { product: { id: 1, stock: 2 }, movements: [] },
    });

    get.mockResolvedValueOnce(ok({ Info: "Sucesso!" }));
    await expect(getKardexByProduct(1)).resolves.toMatchObject({
      ok: false,
      code: "INVALID_API_CONTRACT",
    });
  });

  it("lista fornecedores vazios sem erro", async () => {
    get.mockResolvedValueOnce(
      ok({ info: "Lista de fornecedores", suppliers: [], pagination: {} })
    );
    await expect(listSuppliers()).resolves.toMatchObject({
      ok: true,
      data: [],
    });
  });

  it("preserva erro HTTP ao listar fornecedores", async () => {
    get.mockResolvedValueOnce(fail(403, "Acesso negado"));
    const response = await listSuppliers();
    expect(response).toMatchObject({ ok: false, status: 403, data: null });
    expect(response.error).toBe("Acesso negado");
  });

  it("lista pedidos de venda pelo envelope orders", async () => {
    get.mockResolvedValueOnce(
      ok({ Info: "Pedidos", orders: [{ id: 1 }], pagination: {} })
    );
    await expect(listOrders()).resolves.toMatchObject({
      ok: true,
      data: [{ id: 1 }],
    });
  });

  it("lista compras e desembrulha pedido criado", async () => {
    get.mockResolvedValueOnce(ok({ data: [{ id: 4 }], pagination: {} }));
    await expect(listPurchaseOrders()).resolves.toMatchObject({
      ok: true,
      data: [{ id: 4 }],
    });

    post.mockResolvedValueOnce(ok({ message: "Criado", order: { id: 10 } }));
    await expect(createPurchaseOrder({} as any)).resolves.toMatchObject({
      ok: true,
      data: { id: 10 },
    });
  });

  it("lista colaboradores pelo envelope data", async () => {
    get.mockResolvedValueOnce(
      ok({ status: "success", messageInfo: "Lista", data: [{ id: 3 }] })
    );
    await expect(listEmployees()).resolves.toMatchObject({
      ok: true,
      data: [{ id: 3 }],
    });
  });

  it("desembrulha colaborador criado em data", async () => {
    post.mockResolvedValueOnce(
      ok({ Info: "Criado", data: { id: 12, username: "ana" } })
    );
    await expect(createEmployee({} as any)).resolves.toMatchObject({
      ok: true,
      data: { id: 12, username: "ana" },
    });
  });

  it("desembrulha plano de contas contábil", async () => {
    get.mockResolvedValueOnce(ok({ success: true, data: [{ id: 1 }] }));
    await expect(listAccountingAccounts()).resolves.toMatchObject({
      ok: true,
      data: [{ id: 1 }],
    });
  });

  it("lê lançamentos e total do envelope contábil", async () => {
    get.mockResolvedValueOnce(
      ok({ success: true, data: [{ id: 5 }], total: 42 })
    );
    const response = await listAccountingEntries();
    expect(response.ok).toBe(true);
    expect(response.data).toEqual([{ id: 5 }]);
    expect(response.total).toBe(42);
  });

  it("desembrulha estorno contábil composto", async () => {
    post.mockResolvedValueOnce(
      ok({ success: true, data: { reversal: { id: 6 }, reversed: 5 } })
    );
    await expect(
      reverseAccountingEntry(5, { description: "Estorno" })
    ).resolves.toMatchObject({
      ok: true,
      data: { reversal: { id: 6 }, reversed: 5 },
    });
  });

  it("normaliza histórico de auditoria e estações", async () => {
    request.mockResolvedValueOnce(
      ok({
        success: true,
        data: [{ id: 1, action: "login" }],
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
      })
    );
    const events = await listAuditEvents();
    expect(events.ok).toBe(true);
    expect(events.data).toMatchObject({
      data: [{ id: 1, action: "login" }],
      total: 1,
      page: 1,
      limit: 50,
      totalPages: 1,
    });

    request.mockResolvedValueOnce(
      ok({
        success: true,
        data: [
          { id: 1, installation_uuid: null, name: "Caixa" },
          { id: 2, installation_uuid: "instalada", name: "Ignorada" },
        ],
      })
    );
    await expect(listWorkStations()).resolves.toMatchObject({
      ok: true,
      data: [{ id: 1, installation_uuid: null, name: "Caixa" }],
    });
  });
});
