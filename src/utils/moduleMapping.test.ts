import {
  canAccessMenuItemWithPermissions,
  canAccessRoute,
  canAccessSubmenuWithPermissions,
  filterMenuItems,
  getAvailableModulesForPlan,
  PermissionGroup,
} from "./moduleMapping";

/**
 * Conjunto padrão (freemium) calculado pelo backend a partir do catálogo:
 * dashboard, gestão, vendas, compras, estoque, RH e Financeiro.
 */
const FREEMIUM_MODULES = [
  "dashboard",
  "gestao",
  "vendas",
  "compras",
  "estoque",
  "rh",
  "finance",
];

const FULL_PERMISSIONS: PermissionGroup[] = [
  { moduleKey: "dashboard", actions: ["view"] },
  { moduleKey: "gestao", actions: ["view"] },
  { moduleKey: "vendas", actions: ["view"] },
  { moduleKey: "compras", actions: ["view"] },
  { moduleKey: "estoque", actions: ["view"] },
  { moduleKey: "rh", actions: ["view"] },
  { moduleKey: "finance", actions: ["view", "approve"] },
];

const withCrm = [...FREEMIUM_MODULES, "crm"];
const withNfe = [...FREEMIUM_MODULES, "nfe"];

describe("classificação comercial dos módulos", () => {
  it("Financeiro é módulo do freemium", () => {
    expect(getAvailableModulesForPlan("free")).toContain("finance");
    expect(getAvailableModulesForPlan("professional")).toContain("finance");
    expect(getAvailableModulesForPlan("enterprise")).toContain("finance");
  });

  it("planos não concedem módulos extras", () => {
    for (const plan of ["free", "starter", "professional", "enterprise"]) {
      const modules = getAvailableModulesForPlan(plan);
      expect(modules).not.toContain("crm");
      expect(modules).not.toContain("nfe");
      expect(modules).not.toContain("contabil");
    }
  });
});

describe("menu lateral", () => {
  it("mostra o Financeiro para usuário autorizado no freemium", () => {
    expect(
      canAccessMenuItemWithPermissions(
        "financeiro",
        FREEMIUM_MODULES,
        FULL_PERMISSIONS,
        false
      )
    ).toBe(true);
  });

  it("esconde o Financeiro de quem não acessa nenhum domínio do grupo", () => {
    const semFinanceiro = FULL_PERMISSIONS.filter(
      (group) =>
        !["finance", "rh", "contabil", "nfe"].includes(group.moduleKey)
    );

    expect(
      canAccessMenuItemWithPermissions(
        "financeiro",
        FREEMIUM_MODULES,
        semFinanceiro,
        false
      )
    ).toBe(false);
  });

  it("não mostra o CRM para empresa sem contratação", () => {
    expect(
      canAccessMenuItemWithPermissions(
        "crm",
        FREEMIUM_MODULES,
        [...FULL_PERMISSIONS, { moduleKey: "crm", actions: ["view"] }],
        false
      )
    ).toBe(false);
  });

  it("mostra o CRM para empresa com contratação válida e permissão", () => {
    expect(
      canAccessMenuItemWithPermissions(
        "crm",
        withCrm,
        [...FULL_PERMISSIONS, { moduleKey: "crm", actions: ["view"] }],
        false
      )
    ).toBe(true);
  });

  it("mantém o CRM escondido mesmo para administrador da empresa sem contratação", () => {
    expect(
      canAccessMenuItemWithPermissions("crm", FREEMIUM_MODULES, [], true)
    ).toBe(false);
  });

  it("filtra a navegação com a mesma classificação do backend", () => {
    const menu = [
      { key: "financeiro", title: "Financeiro" },
      { key: "crm", title: "CRM" },
      { key: "vendas", title: "Vendas" },
    ];

    const freemium = filterMenuItems(
      menu,
      FREEMIUM_MODULES,
      "Colaborador",
      FULL_PERMISSIONS,
      false
    ).map((item) => item.key);
    expect(freemium).toEqual(["financeiro", "vendas"]);
    expect(freemium).not.toContain("crm");

    const comCrm = filterMenuItems(
      menu,
      withCrm,
      "Colaborador",
      [...FULL_PERMISSIONS, { moduleKey: "crm", actions: ["view"] }],
      false
    ).map((item) => item.key);
    expect(comCrm).toContain("crm");
  });
});

describe("rotas e submenus protegidos", () => {
  it("bloqueia o acesso direto ao CRM sem contratação", () => {
    expect(canAccessRoute("/crm", FREEMIUM_MODULES, "Colaborador", [], false)).toBe(
      false
    );
  });

  it("libera o CRM para empresa com contratação e permissão", () => {
    expect(
      canAccessRoute(
        "/crm",
        withCrm,
        "Colaborador",
        [{ moduleKey: "crm", actions: ["view"] }],
        false
      )
    ).toBe(true);
  });

  it("mantém o Financeiro acessível no freemium", () => {
    expect(
      canAccessRoute(
        "/financer/financial",
        FREEMIUM_MODULES,
        "Colaborador",
        FULL_PERMISSIONS,
        false
      )
    ).toBe(true);
  });

  it("mantém a NF-e condicionada à contratação", () => {
    expect(
      canAccessSubmenuWithPermissions(
        "/financial/order-nfe",
        FREEMIUM_MODULES,
        FULL_PERMISSIONS,
        false
      )
    ).toBe(false);

    expect(
      canAccessSubmenuWithPermissions(
        "/financial/order-nfe",
        withNfe,
        [...FULL_PERMISSIONS, { moduleKey: "nfe", actions: ["view"] }],
        false
      )
    ).toBe(true);
  });

  it("mantém a configuração do PlugNotas (NF-e) condicionada", () => {
    expect(
      canAccessRoute("/config/system", FREEMIUM_MODULES, "Administrador", [], true)
    ).toBe(false);

    expect(
      canAccessRoute("/config/system", withNfe, "Administrador", [], true)
    ).toBe(true);
  });

  it("separa visualização, criação e edição de pedidos de venda", () => {
    const somenteVisualiza: PermissionGroup[] = [
      { moduleKey: "vendas", actions: ["view"] },
    ];
    expect(
      canAccessRoute("/sales/orders", FREEMIUM_MODULES, "Vendedor", somenteVisualiza, false)
    ).toBe(true);
    expect(
      canAccessRoute(
        "/sales/newOrder",
        FREEMIUM_MODULES,
        "Vendedor",
        somenteVisualiza,
        false
      )
    ).toBe(false);
    expect(
      canAccessRoute(
        "/sales/orders/edit/42",
        FREEMIUM_MODULES,
        "Vendedor",
        somenteVisualiza,
        false
      )
    ).toBe(false);

    const criaEEdita: PermissionGroup[] = [
      { moduleKey: "vendas", actions: ["view", "create", "edit"] },
    ];
    expect(
      canAccessRoute("/sales/newOrder", FREEMIUM_MODULES, "Vendedor", criaEEdita, false)
    ).toBe(true);
    expect(
      canAccessRoute(
        "/sales/orders/edit/42",
        FREEMIUM_MODULES,
        "Vendedor",
        criaEEdita,
        false
      )
    ).toBe(true);
  });

  it("protege rotas de gestão e dados sensíveis de RH", () => {
    expect(
      canAccessRoute("/manager/services", FREEMIUM_MODULES, "Gestor", [], false)
    ).toBe(false);
    expect(
      canAccessRoute(
        "/manager/services",
        FREEMIUM_MODULES,
        "Gestor",
        [{ moduleKey: "gestao", actions: ["view"] }],
        false
      )
    ).toBe(true);
    expect(
      canAccessRoute(
        "/rh/infos",
        FREEMIUM_MODULES,
        "RH",
        [{ moduleKey: "rh", actions: ["view"] }],
        false
      )
    ).toBe(false);
    expect(
      canAccessRoute(
        "/rh/infos",
        FREEMIUM_MODULES,
        "RH",
        [{ moduleKey: "rh", actions: ["edit"] }],
        false
      )
    ).toBe(true);
  });

  it("separa acesso à folha e aos treinamentos por permissão específica", () => {
    expect(
      canAccessRoute(
        "/rh/folha",
        FREEMIUM_MODULES,
        "RH",
        [{ moduleKey: "rh", actions: ["view"] }],
        false
      )
    ).toBe(false);
    expect(
      canAccessRoute(
        "/rh/folha",
        FREEMIUM_MODULES,
        "RH",
        [{ moduleKey: "rh", actions: ["view_payroll"] }],
        false
      )
    ).toBe(true);
    expect(
      canAccessRoute(
        "/rh/treinamentos",
        FREEMIUM_MODULES,
        "RH",
        [{ moduleKey: "rh", actions: ["view"] }],
        false
      )
    ).toBe(true);
    expect(
      canAccessRoute(
        "/rh/treinamentos",
        FREEMIUM_MODULES,
        "RH",
        [],
        false
      )
    ).toBe(false);
  });
});
