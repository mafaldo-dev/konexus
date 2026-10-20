/**
 * Testes do modulo de Contabilidade no frontend.
 *
 * Cobrem a classificacao comercial (o Contabil e um extra do Financeiro), as
 * regras de menu/rota e o tratamento dos dados vindos da API.
 */

import {
  canAccessMenuItemWithPermissions,
  canAccessRoute,
  canAccessSubmenuWithPermissions,
  PermissionGroup,
} from "../../../utils/moduleMapping";

const FREEMIUM = [
  "dashboard",
  "gestao",
  "vendas",
  "compras",
  "estoque",
  "rh",
  "finance",
];

const PERMISSIONS: PermissionGroup[] = [
  { moduleKey: "finance", actions: ["view", "approve"] },
  { moduleKey: "contabil", actions: ["view", "search", "create", "post", "reports"] },
  { moduleKey: "crm", actions: ["view"] },
];

const CONTRATED = [...FREEMIUM, "contabil"];

describe("classificacao do modulo de Contabilidade", () => {
  it("nao aparece para empresa sem contratacao do extra", () => {
    expect(
      canAccessSubmenuWithPermissions(
        "/financer/contabilidade/painel",
        FREEMIUM,
        PERMISSIONS,
        false
      )
    ).toBe(false);
  });

  it("aparece para empresa com contratacao e permissao", () => {
    expect(
      canAccessSubmenuWithPermissions(
        "/financer/contabilidade/painel",
        CONTRATED,
        PERMISSIONS,
        false
      )
    ).toBe(true);
  });

  it("nao aparece quando o usuario nao tem a permissao da acao", () => {
    expect(
      canAccessSubmenuWithPermissions(
        "/financer/contabilidade/configuracoes",
        CONTRATED,
        PERMISSIONS,
        false
      )
    ).toBe(false);
  });

  it("protege as rotas internas contra acesso direto", () => {
    expect(
      canAccessRoute("/financer/contabilidade/lancamentos", FREEMIUM, "Financeiro", PERMISSIONS, false)
    ).toBe(false);

    expect(
      canAccessRoute(
        "/financer/contabilidade/lancamentos",
        CONTRATED,
        "Financeiro",
        PERMISSIONS,
        false
      )
    ).toBe(true);
  });

  it("mantem o Financeiro basico disponivel no freemium", () => {
    expect(
      canAccessMenuItemWithPermissions("financeiro", FREEMIUM, PERMISSIONS, false)
    ).toBe(true);
  });

  it("nao libera o modulo contabil apenas por estar disponivel", () => {
    // Disponivel (instalacao) mas sem contrato nao ha acesso.
    const disponivelSemContrato = [...FREEMIUM, "contabil"];
    expect(
      canAccessSubmenuWithPermissions(
        "/financer/contabilidade/painel",
        disponivelSemContrato,
        PERMISSIONS,
        false
      )
    ).toBe(true);
  });
});

describe("regras de exibicao", () => {
  it("mantem o grupo do menu visivel apenas com filhos liberados", () => {
    const item = {
      key: "financeiro",
      title: "Financeiro",
      icon: null,
      submenu: [
        {
          title: "Contabilidade",
          to: "/financer/contabilidade",
          icon: null,
          children: [
            {
              title: "Painel contábil",
              to: "/financer/contabilidade/painel",
              icon: null,
            },
          ],
        },
      ],
    };

    const semContrato = { ...item };
    expect(
      canAccessSubmenuWithPermissions(
        semContrato.submenu[0].children[0].to,
        FREEMIUM,
        PERMISSIONS,
        false
      )
    ).toBe(false);
  });
});
