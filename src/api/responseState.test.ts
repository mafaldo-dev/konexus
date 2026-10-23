import { getResponseDataState } from "./responseState";
import { ApiResponse } from "./client";

const response = (
  status: number,
  code?: string
): ApiResponse<null> => ({
  data: null,
  error: "mensagem do backend",
  status,
  ok: false,
  code,
});

describe("estado visual para erros da API", () => {
  it("distingue empresa/CNPJ não selecionado mesmo com HTTP 400", () => {
    expect(getResponseDataState(response(400, "LEGAL_ENTITY_REQUIRED"))).toBe(
      "company-required"
    );
    expect(
      getResponseDataState(response(400, "LEGAL_ENTITY_EXPLICIT_REQUIRED"))
    ).toBe("company-required");
  });

  it("distingue módulo não contratado", () => {
    expect(
      getResponseDataState(response(403, "MODULE_NOT_CONTRACTED"))
    ).toBe("module-not-contracted");
  });

  it("distingue acesso negado de falha de comunicação", () => {
    expect(getResponseDataState(response(403, "PERMISSION_DENIED"))).toBe(
      "forbidden"
    );
    expect(getResponseDataState(response(500))).toBe("error");
    expect(getResponseDataState(response(0))).toBe("error");
  });
});
