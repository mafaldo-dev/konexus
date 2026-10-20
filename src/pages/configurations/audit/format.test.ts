import { AuditEvent } from "../../../services/auditService";
import {
  deriveFilterOptions,
  describeAuditEvent,
  formatDateTime,
  getActionLabel,
  getEntityLabel,
  getModuleLabel,
  getOutcomeLabel,
  getReauthLabel,
} from "./format";

function makeEvent(overrides: Partial<AuditEvent> = {}): AuditEvent {
  return {
    id: 1,
    company_id: 3,
    user_id: 7,
    username: "Marcos",
    session_id: "sessao-1",
    station_id: 2,
    station_name: "Expedição - Máquina 3",
    module_key: "vendas",
    entity_type: "order",
    entity_id: "123",
    action: "update",
    outcome: "success",
    reauth_outcome: "valid",
    reason: null,
    correlation_id: "corr-1",
    metadata: null,
    changes: null,
    ip_address: "10.0.0.9",
    user_agent: "Konexus",
    created_at: "2026-10-20T14:22:00.000Z",
    ...overrides,
  };
}

describe("traducao do historico para linguagem de negocio", () => {
  it("descreve a alteracao concluida com usuario, estacao e registro", () => {
    const text = describeAuditEvent(makeEvent());

    expect(text).toContain("Marcos");
    expect(text).toContain("Expedição - Máquina 3");
    expect(text).toContain("alterar o pedido de venda");
    expect(text).toContain("nº 123");
    expect(text).toContain("A operação foi concluída");
  });

  it("descreve a tentativa com senha invalida sem afirmar alteracao", () => {
    const text = describeAuditEvent(
      makeEvent({
        outcome: "denied",
        reauth_outcome: "invalid",
        action: "update",
      })
    );

    expect(text).toContain("A senha informada não foi validada");
    expect(text).toContain("a alteração não foi executada");
    expect(text).not.toContain("foi concluída");
  });

  it("descreve a confirmacao de identidade valida", () => {
    const text = describeAuditEvent(
      makeEvent({ action: "reauth", outcome: "success", reauth_outcome: "valid" })
    );

    expect(text).toContain("tentou confirmar a identidade");
    expect(text).toContain("a senha foi validada");
  });

  it("descreve o login e o logout", () => {
    expect(describeAuditEvent(makeEvent({ action: "login" }))).toContain(
      "entrou no sistema"
    );
    expect(describeAuditEvent(makeEvent({ action: "logout" }))).toContain(
      "saiu do sistema"
    );
  });

  it("nao usa jargao tecnico", () => {
    const textos = [
      describeAuditEvent(makeEvent()),
      describeAuditEvent(
        makeEvent({ outcome: "denied", reauth_outcome: "not_attempted" })
      ),
      describeAuditEvent(
        makeEvent({ outcome: "failed", reauth_outcome: "valid" })
      ),
    ];

    for (const texto of textos) {
      for (const termo of [
        "token",
        "grant",
        "concessao",
        "endpoint",
        "middleware",
        "http",
        "api",
        "hash",
        "correlacao",
      ]) {
        expect(texto.toLowerCase()).not.toContain(termo);
      }
    }
  });
});

describe("rotulos", () => {
  it("traduz acoes, entidades, modulos e resultados", () => {
    expect(getActionLabel("update")).toBe("alterar");
    expect(getActionLabel("delete")).toBe("excluir");
    expect(getEntityLabel("order")).toBe("o pedido de venda");
    expect(getModuleLabel("finance")).toBe("Financeiro");
    expect(getOutcomeLabel("denied")).toBe("Não autorizada");
    expect(getReauthLabel("invalid")).toBe("Senha não validada");
  });

  it("formata a data e hora no padrao brasileiro", () => {
    const formatted = formatDateTime("2026-10-20T14:22:00.000Z");
    expect(formatted).toContain("/");
    expect(formatted.length).toBeGreaterThan(8);
  });
});

describe("filtros derivados dos proprios eventos", () => {
  it("cria filtros apenas para modulos, acoes, estacoes e usuarios existentes", () => {
    const options = deriveFilterOptions([
      makeEvent(),
      makeEvent({
        id: 2,
        module_key: "finance",
        action: "approve",
        entity_type: "payment",
        station_id: 3,
        station_name: "Financeiro - Balcão",
        user_id: 9,
        username: "Rodrigo",
      }),
    ]);

    expect(options.modules.map((o) => o.value)).toEqual(["finance", "vendas"]);
    expect(options.actions.map((o) => o.value)).toEqual(["update", "approve"]);
    expect(options.stations.map((o) => o.value)).toEqual(["2", "3"]);
    expect(options.users.map((o) => o.value)).toEqual(["7", "9"]);
  });

  it("nao cria filtro de modulo inexistente", () => {
    const options = deriveFilterOptions([makeEvent()]);
    expect(options.modules).toHaveLength(1);
    expect(options.modules[0].value).toBe("vendas");
  });
});
