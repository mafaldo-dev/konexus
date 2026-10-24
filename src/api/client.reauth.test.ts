import { apiRequest, apiRequestBlob } from "./client";
import { setReauthHandler } from "./reauth";

/**
 * O fluxo de reautenticacao e comandado pelo backend: quando a rota
 * protegida responde 403/REAUTH_REQUIRED, o cliente pede a confirmacao de
 * senha e repete a requisicao com a concessao. Nunca repete em laco.
 */
describe("fluxo de reautenticacao do cliente HTTP", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    setReauthHandler(null);
    jest.restoreAllMocks();
    localStorage.clear();
    delete (window as any).ipcRenderer;
  });

  function mockFetch(responses: Array<{ status: number; body: any }>) {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    let index = 0;

    global.fetch = jest.fn(async (url: any, init: any) => {
      calls.push({ url: String(url), init });
      const response = responses[Math.min(index, responses.length - 1)];
      index += 1;
      return {
        status: response.status,
        ok: response.status >= 200 && response.status < 300,
        text: async () => JSON.stringify(response.body),
      } as any;
    }) as any;

    return calls;
  }

  it("pede a confirmacao e repete a requisicao com a concessao", async () => {
    const calls = mockFetch([
      {
        status: 403,
        body: {
          success: false,
          code: "REAUTH_REQUIRED",
          message: "Confirme sua identidade para concluir esta alteração.",
          reauth: {
            correlationId: '8aa94a0a-5232-4d75-bd92-dca673c62574',
            moduleKey: "vendas",
            action: "update",
            entityType: "order",
            entityId: "123",
            description: "alterar o pedido de venda",
          },
        },
      },
      { status: 200, body: { success: true, data: { id: 99 } } },
    ]);

    const handler = jest.fn(async (_intent: any, _payload: any) => "grant-123");
    setReauthHandler(handler as any);

    const response = await apiRequest("orders/123", "PUT", {
      orderStatus: "approved",
    });

    expect(response.ok).toBe(true);
    expect(response.data).toEqual({ success: true, data: { id: 99 } });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0]).toMatchObject({
      moduleKey: "vendas",
      entityId: "123",
    });
    expect(calls).toHaveLength(2);

    const headers = (calls[1].init.headers || {}) as Record<string, string>;
    expect(headers["X-Reauth-Grant"]).toBe("grant-123");
    expect(headers['X-Correlation-Id']).toBe('8aa94a0a-5232-4d75-bd92-dca673c62574');
    expect(calls[1].init.body).toBe(JSON.stringify({ orderStatus: "approved" }));
  });

  it('401 autenticado invalida contexto, mas senha incorreta não encerra sessão', async () => {
    localStorage.setItem('token','current');
    mockFetch([{status:401,body:{}}]);
    const listener=jest.fn();
    window.addEventListener('konexus:session-invalid',listener);
    await apiRequest('audit/reauth','POST',{password:'wrong'});
    expect(localStorage.getItem('token')).toBe('current');
    await apiRequest('orders/all');
    expect(localStorage.getItem('token')).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener('konexus:session-invalid',listener);
  });

  it('401 atrasado de sessão anterior não encerra nova sessão', async () => {
    localStorage.setItem('token','new');
    mockFetch([{status:401,body:{}}]);
    await apiRequest('orders/all','GET',undefined,{token:'old'});
    expect(localStorage.getItem('token')).toBe('new');
  });

  it('download mantém bytes como Blob', async () => {
    const blob=new Blob(['PDF bytes']);
    global.fetch=jest.fn(async()=>({ok:true,status:200,blob:async()=>blob})) as any;
    expect((await apiRequestBlob('report')).data).toBe(blob);
  });

  it("nao repete a requisicao quando o usuario cancela", async () => {
    const calls = mockFetch([
      {
        status: 403,
        body: {
          success: false,
          code: "REAUTH_REQUIRED",
          message: "Confirme sua identidade para concluir esta alteração.",
          reauth: { moduleKey: "vendas", action: "update" },
        },
      },
    ]);

    setReauthHandler(async () => null);

    const response = await apiRequest("orders/123", "PUT", { status: "x" });

    expect(response.ok).toBe(false);
    expect(response.status).toBe(403);
    expect(response.code).toBe("REAUTH_REQUIRED");
    expect(calls).toHaveLength(1);
  });

  it("nao entra em laco quando a repeticao volta a ser negada", async () => {
    const calls = mockFetch([
      {
        status: 403,
        body: {
          success: false,
          code: "REAUTH_REQUIRED",
          message: "Confirme sua identidade.",
          reauth: { moduleKey: "vendas", action: "update" },
        },
      },
    ]);

    const handler = jest.fn(async (_intent: any, _payload: any) => "grant-123");
    setReauthHandler(handler as any);

    const response = await apiRequest("orders/123", "PUT", { status: "x" });

    expect(response.ok).toBe(false);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(calls).toHaveLength(2);
  });

  it("403 de autorização sinaliza recarga de sessão, menus e CNPJs", async () => {
    mockFetch([
      {
        status: 403,
        body: {
          success: false,
          code: "PERMISSION_DENIED",
          message: "Você não possui permissão para executar esta ação.",
        },
      },
    ]);
    const listener = jest.fn();
    window.addEventListener("konexus:access-changed", listener);

    await apiRequest("orders/123", "PUT", { status: "x" });

    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener("konexus:access-changed", listener);
  });

  it("nao dispara reautenticacao em outros erros 403", async () => {
    const calls = mockFetch([
      {
        status: 403,
        body: {
          success: false,
          code: "PERMISSION_DENIED",
          message: "Você não possui permissão para executar esta ação.",
        },
      },
    ]);

    const handler = jest.fn(async (_intent: any, _payload: any) => "grant-123");
    setReauthHandler(handler as any);

    const response = await apiRequest("orders/123", "PUT", { status: "x" });

    expect(response.ok).toBe(false);
    expect(response.code).toBe("PERMISSION_DENIED");
    expect(handler).not.toHaveBeenCalled();
    expect(calls).toHaveLength(1);
  });

  it("envia o codigo da estacao de trabalho quando ele existe", async () => {
    localStorage.setItem("konexus.stationToken", "CODIGO-ESTACAO");
    const calls = mockFetch([{ status: 200, body: { success: true } }]);

    await apiRequest("orders/all", "GET");

    const headers = (calls[0].init.headers || {}) as Record<string, string>;
    expect(headers["X-Station-Token"]).toBe("CODIGO-ESTACAO");
  });

  it("também envia a estação no Electron, onde a reserva offline é vinculada à sessão", async () => {
    (window as any).ipcRenderer = {};
    localStorage.setItem("konexus.stationToken", "ESTACAO-DESKTOP");
    const calls = mockFetch([{ status: 200, body: { success: true } }]);

    await apiRequest("orders/reservations", "GET");

    const headers = (calls[0].init.headers || {}) as Record<string, string>;
    expect(headers["X-Station-Token"]).toBe("ESTACAO-DESKTOP");
  });
});
