import {
  canAccessMenuItemWithPermissions,
  canAccessRoute,
  getRouteModules,
  PermissionGroup,
} from "./moduleMapping";

const RH_VIEW: PermissionGroup[] = [{ moduleKey: "rh", actions: ["view"] }];
const FINANCE_VIEW: PermissionGroup[] = [
  { moduleKey: "finance", actions: ["view"] },
];

const STANDARD = [
  "dashboard",
  "gestao",
  "vendas",
  "compras",
  "estoque",
  "rh",
  "finance",
];

const WITHOUT_RH = STANDARD.filter((moduleKey) => moduleKey !== "rh");

describe("acesso ao RH dentro da navegação do Financeiro", () => {
  it("não concede RH por possuir permissão financeira", () => {
    expect(
      canAccessRoute("/rh", STANDARD, "Financeiro", FINANCE_VIEW, false)
    ).toBe(false);
  });

  it("libera RH somente com contratação e permissão próprias", () => {
    expect(
      canAccessRoute("/rh", STANDARD, "Financeiro", RH_VIEW, false)
    ).toBe(true);
  });

  it("exige o módulo contratado mesmo para o administrador da empresa", () => {
    expect(
      canAccessRoute("/rh", WITHOUT_RH, "Administrador", [], true)
    ).toBe(false);
  });

  it("mostra o grupo Financeiro para quem só possui permissão de RH", () => {
    expect(
      canAccessMenuItemWithPermissions(
        "financeiro",
        STANDARD,
        RH_VIEW,
        false
      )
    ).toBe(true);
    expect(
      canAccessMenuItemWithPermissions(
        "financeiro",
        ["rh"],
        FINANCE_VIEW,
        false
      )
    ).toBe(false);
  });

  it("identifica o módulo responsável pela rota de Contabilidade", () => {
    expect(
      getRouteModules("/financer/contabilidade/lancamentos")
    ).toEqual(["contabil"]);
    expect(getRouteModules("/rh/folha")).toEqual(["rh"]);
    expect(getRouteModules("/stock/alerts")).toEqual(["estoque"]);
  });
});
