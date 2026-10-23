import { apiClient } from "../api/client";
import {
  createBankAccount,
  listBankAccounts,
} from "./bankAccountService";
import { getCashFlow } from "./cashFlowService";
import {
  createPurchaseReturn,
  listPurchaseReturns,
} from "./purchaseReturnService";
import {
  enrollTraining,
  getTraining,
  listTrainingCategories,
} from "./trainingService";
import {
  calculatePayroll,
  createPayrollRubric,
  postPayrollToFinance,
} from "./payrollService";

jest.mock("../api/client", () => ({
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

const ok = (data: any) => ({ data, error: null, status: 200, ok: true });
const fail = (error = "Falha no servidor", status = 500) => ({
  data: null,
  error,
  status,
  ok: false,
});

beforeEach(() => jest.clearAllMocks());

describe("contratos dos novos recursos operacionais", () => {
  it("lista contas bancárias e rejeita envelope inesperado", async () => {
    get.mockResolvedValueOnce(
      ok({ success: true, data: [{ id: 1, bank_name: "Banco" }] })
    );
    await expect(listBankAccounts()).resolves.toMatchObject({
      ok: true,
      data: [{ id: 1, bank_name: "Banco" }],
    });

    get.mockResolvedValueOnce(ok({ success: true, accounts: [] }));
    const invalid = await listBankAccounts();
    expect(invalid.ok).toBe(false);
    expect(invalid.code).toBe("INVALID_API_CONTRACT");
  });

  it("envia a criação de conta com os campos do contrato", async () => {
    post.mockResolvedValueOnce(ok({ data: { id: 8, bank_name: "Banco" } }));
    await expect(
      createBankAccount({
        bankCode: "001",
        bankName: "Banco",
        agency: "1",
        accountNumber: "2",
        accountType: "checking",
        holderName: "Empresa",
        initialBalance: "100.00",
      })
    ).resolves.toMatchObject({ ok: true, data: { id: 8 } });
    expect(post).toHaveBeenCalledWith(
      "finance/bank-accounts",
      expect.objectContaining({ bankCode: "001", initialBalance: "100.00" })
    );
  });

  it("carrega o fluxo de caixa somente com o objeto data", async () => {
    get.mockResolvedValueOnce(
      ok({
        data: {
          period: { from: "2026-10-01", to: "2026-10-31", granularity: "day" },
          summary: { closingBalance: 10 },
          details: { realized: [], forecast: [] },
          series: [],
          daily: [],
          categories: [],
          settled: {
            receivables: { count: 0, total: 0 },
            payables: { count: 0, total: 0 },
            note: "informativo",
          },
        },
      })
    );
    await expect(
      getCashFlow({ from: "2026-10-01", to: "2026-10-31", granularity: "day" })
    ).resolves.toMatchObject({
      ok: true,
      data: { summary: { closingBalance: 10 } },
    });

    get.mockResolvedValueOnce(ok({ status: "success", result: {} }));
    const invalid = await getCashFlow({});
    expect(invalid.ok).toBe(false);
    expect(invalid.code).toBe("INVALID_API_CONTRACT");
  });

  it("normaliza devoluções e envia itens parciais", async () => {
    get.mockResolvedValueOnce(
      ok({ data: [{ id: 3, return_number: "DEV-3", status: "draft" }] })
    );
    await expect(listPurchaseReturns()).resolves.toMatchObject({
      ok: true,
      data: [{ id: 3, return_number: "DEV-3" }],
    });

    post.mockResolvedValueOnce(ok({ data: { id: 4, status: "draft" } }));
    await createPurchaseReturn({
      purchaseOrderId: 10,
      reason: "Avaria",
      requiresNfe: false,
      idempotencyKey: "return-test",
      items: [{ purchaseOrderItemId: 20, quantity: 1 }],
    });
    expect(post).toHaveBeenCalledWith(
      "purchase/returns",
      expect.objectContaining({
        purchaseOrderId: 10,
        idempotencyKey: "return-test",
        items: [{ purchaseOrderItemId: 20, quantity: 1 }],
      })
    );
  });

  it("carrega treinamento e envia inscrição por vínculo", async () => {
    get.mockResolvedValueOnce(
      ok({ data: { id: 5, title: "Integração", sessions: [], enrollments: [] } })
    );
    await expect(getTraining(5)).resolves.toMatchObject({
      ok: true,
      data: { id: 5, title: "Integração" },
    });

    get.mockResolvedValueOnce(ok({ data: [{ id: 1, name: "Segurança" }] }));
    await expect(listTrainingCategories()).resolves.toMatchObject({
      ok: true,
      data: [{ id: 1, name: "Segurança" }],
    });

    post.mockResolvedValueOnce(ok({ data: { id: 9, status: "enrolled" } }));
    await enrollTraining(7, 11, "Turma da manhã");
    expect(post).toHaveBeenCalledWith(
      "rh/trainings/sessions/7/enrollments",
      { employmentLinkId: 11, notes: "Turma da manhã" }
    );
  });

  it("exige fonte da rubrica e usa as rotas da folha", async () => {
    post.mockResolvedValueOnce(ok({ data: { id: 1, code: "ADIANT" } }));
    await createPayrollRubric({
      code: "ADIANT",
      name: "Adiantamento",
      kind: "deduction",
      calculationType: "fixed",
      fixedAmount: "100.00",
      sourceNote: "Acordo interno validado",
      effectiveFrom: "2026-01-01",
    });
    expect(post).toHaveBeenCalledWith(
      "rh/payroll/rubrics",
      expect.objectContaining({
        code: "ADIANT",
        sourceNote: "Acordo interno validado",
      })
    );

    post.mockResolvedValueOnce(ok({ data: { id: 4, status: "calculated" } }));
    await expect(calculatePayroll(4)).resolves.toMatchObject({
      ok: true,
      data: { status: "calculated" },
    });
    expect(post).toHaveBeenCalledWith(
      "rh/payroll/competencies/4/calculate"
    );

    post.mockResolvedValueOnce(
      ok({ data: { paymentAccountId: 15, replayed: true } })
    );
    await expect(postPayrollToFinance(4)).resolves.toMatchObject({
      ok: true,
      data: { paymentAccountId: 15, replayed: true },
    });
  });

  it("propaga erros de autorização sem transformar em lista vazia", async () => {
    get.mockResolvedValueOnce(fail("Acesso negado.", 403));
    const response = await listPurchaseReturns();
    expect(response.ok).toBe(false);
    expect(response.status).toBe(403);
    expect(response.error).toBe("Acesso negado.");
  });
});
