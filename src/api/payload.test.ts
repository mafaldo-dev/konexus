import { asList, asObject, pickData } from "./payload";
import { ApiResponse } from "./client";

const ok = <T>(data: T): ApiResponse<T> => ({
  data,
  error: null,
  status: 200,
  ok: true,
});

const failure = (status = 500): ApiResponse<null> => ({
  data: null,
  error: "Falha no servidor",
  status,
  ok: false,
});

describe("normalização de payloads da API", () => {
  it("aceita uma lista direta", () => {
    const response = asList<{ id: number }>(ok([{ id: 1 }]), ["items"], "itens");
    expect(response.ok).toBe(true);
    expect(response.data).toEqual([{ id: 1 }]);
  });

  it("extrai uma lista de um envelope explicitamente informado", () => {
    const response = asList<{ id: number }>(
      ok({ products: [{ id: 7 }], pagination: {} }),
      ["products", "data"],
      "produtos"
    );
    expect(response.ok).toBe(true);
    expect(response.data).toEqual([{ id: 7 }]);
  });

  it("preserva uma lista vazia legítima", () => {
    const response = asList(ok({ products: [] }), ["products"], "produtos");
    expect(response.ok).toBe(true);
    expect(response.data).toEqual([]);
  });

  it("não transforma envelope inesperado em lista vazia", () => {
    const response = asList(ok({ unexpected: [] }), ["products"], "produtos");
    expect(response.ok).toBe(false);
    expect(response.code).toBe("INVALID_API_CONTRACT");
    expect(response.status).toBe(502);
    expect(response.data).toBeNull();
  });

  it("preserva erros HTTP sem tentar desembrulhar", () => {
    const response = asList(failure(403), ["products"], "produtos");
    expect(response.ok).toBe(false);
    expect(response.status).toBe(403);
    expect(response.error).toBe("Falha no servidor");
  });

  it("extrai entidade de envelope e exige opt-in para corpo direto", () => {
    expect(
      asObject<{ id: number }>(ok({ product: { id: 2 } }), ["product"], "produto")
        .data
    ).toEqual({ id: 2 });

    expect(
      asObject<{ id: number }>(ok({ id: 3 }), ["product"], "produto").ok
    ).toBe(false);

    expect(
      asObject<{ id: number }>(
        ok({ id: 3 }),
        ["product"],
        "produto",
        { allowDirect: true }
      ).data
    ).toEqual({ id: 3 });
  });

  it("rejeita array onde a entidade deveria ser objeto", () => {
    const response = asObject(ok([{ id: 1 }]), ["product"], "produto");
    expect(response.ok).toBe(false);
    expect(response.code).toBe("INVALID_API_CONTRACT");
  });

  it("pickData falha quando o seletor não encontra o contrato", () => {
    expect(pickData(ok({ other: 1 }), () => undefined, "relatório").ok).toBe(
      false
    );
    expect(pickData(ok({ other: 1 }), () => null, "relatório").ok).toBe(false);
  });

  it("pickData protege contra exceção do seletor", () => {
    const response = pickData(
      ok({ value: 1 }),
      () => {
        throw new Error("boom");
      },
      "relatório"
    );
    expect(response.ok).toBe(false);
    expect(response.code).toBe("INVALID_API_CONTRACT");
  });
});
