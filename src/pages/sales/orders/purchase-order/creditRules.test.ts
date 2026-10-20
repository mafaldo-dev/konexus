import {
  blocksOrderRelease,
  getCreditStatusView,
  isCreditExempt,
  isCreditReleased,
} from "./creditRules";

describe("verificação de crédito na liberação de pedidos", () => {
  it("não bloqueia pedido sem análise registrada", () => {
    expect(blocksOrderRelease(undefined)).toBe(false);
    expect(blocksOrderRelease(null)).toBe(false);
    expect(isCreditReleased(undefined)).toBe(true);
  });

  it("bloqueia pedido com análise pendente", () => {
    const credit = { status: "pending" as const };
    expect(blocksOrderRelease(credit)).toBe(true);
    expect(isCreditReleased(credit)).toBe(false);
  });

  it("bloqueia pedido com análise reprovada", () => {
    const credit = { status: "rejected" as const };
    expect(blocksOrderRelease(credit)).toBe(true);
  });

  it("libera pedido com análise aprovada", () => {
    const credit = { status: "approved" as const };
    expect(blocksOrderRelease(credit)).toBe(false);
    expect(isCreditReleased(credit)).toBe(true);
  });

  it("libera pedido explicitamente isento", () => {
    const credit = { status: "exempt" as const };
    expect(blocksOrderRelease(credit)).toBe(false);
    expect(isCreditExempt(credit)).toBe(true);
  });

  it("mostra o rótulo correto do crédito", () => {
    expect(getCreditStatusView(undefined).label).toBe("Sem análise");
    expect(getCreditStatusView({ status: "approved" }).label).toBe("Aprovado");
    expect(getCreditStatusView({ status: "rejected" }).label).toBe("Bloqueado");
    expect(getCreditStatusView({ status: "pending" }).label).toBe("Pendente");
    expect(getCreditStatusView({ status: "exempt" }).label).toBe("Isento");
  });
});
