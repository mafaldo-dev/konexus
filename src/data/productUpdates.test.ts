import {
  PRODUCT_UPDATES,
  ProductUpdate,
  UPDATE_MODULE_LABELS,
  filterProductUpdates,
  formatProductUpdateDate,
  getProductUpdateFilters,
  getVisibleProductUpdates,
} from "./productUpdates";

/**
 * Vocabulário de desenvolvimento que não pode aparecer no histórico
 * apresentado ao cliente final.
 */
const TERMOS_TECNICOS = [
  "refator",
  "middleware",
  "endpoint",
  "schema",
  "hook",
  "react",
  "typescript",
  "tipagem",
  "ci/cd",
  "pipeline",
  "dependência",
  "dependencia",
  "commit",
  "deploy",
  "backend",
  "frontend",
  "token",
  "autopdater",
  "build",
  "controller",
];

const STANDARD_MODULES = [
  "dashboard",
  "gestao",
  "vendas",
  "compras",
  "estoque",
  "rh",
  "finance",
];

describe("conteúdo das novidades", () => {
  it("cada registro tem módulo, versão, título, descrição e data", () => {
    for (const update of PRODUCT_UPDATES) {
      expect(update.module).toBeTruthy();
      expect(update.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(update.title.length).toBeGreaterThan(5);
      expect(update.description.length).toBeGreaterThan(20);
      expect(update.releasedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(update.status).toBe("published");
    }
  });

  it("não exibe vocabulário técnico de desenvolvimento", () => {
    for (const update of PRODUCT_UPDATES) {
      const text = `${update.title} ${update.description}`.toLowerCase();
      for (const termo of TERMOS_TECNICOS) {
        expect(text).not.toContain(termo);
      }
    }
  });

  it("mantém as descrições curtas e objetivas", () => {
    for (const update of PRODUCT_UPDATES) {
      expect(update.description.length).toBeLessThanOrEqual(200);
      expect(update.title.split(" ").length).toBeLessThanOrEqual(12);
    }
  });

  it("evita registros duplicados", () => {
    const ids = PRODUCT_UPDATES.map((update) => update.id);
    expect(new Set(ids).size).toBe(ids.length);

    const unique = new Set(
      PRODUCT_UPDATES.map(
        (update) => `${update.version}:${update.module}:${update.title}`
      )
    );
    expect(unique.size).toBe(PRODUCT_UPDATES.length);
  });

  it("usa apenas módulos reais do sistema", () => {
    const chaves = Object.keys(UPDATE_MODULE_LABELS);
    for (const update of PRODUCT_UPDATES) {
      expect(chaves).toContain(update.module);
    }
  });

  it("não inventa versões nem datas futuras", () => {
    for (const update of PRODUCT_UPDATES) {
      const data = new Date(`${update.releasedAt}T00:00:00Z`);
      expect(Number.isNaN(data.getTime())).toBe(false);
      expect(data.getTime()).toBeLessThanOrEqual(Date.now());
    }
  });
});

describe("visibilidade por contrato e permissão", () => {
  it("esconde novidades de módulos extras sem contratação", () => {
    const visiveis = getVisibleProductUpdates(PRODUCT_UPDATES, {
      availableModules: STANDARD_MODULES,
      permissions: [{ moduleKey: "crm", actions: ["view"] }],
      isCompanyAdmin: false,
    });

    expect(visiveis.some((update) => update.module === "crm")).toBe(false);
    expect(visiveis.some((update) => update.module === "nfe")).toBe(false);
    expect(visiveis.length).toBeGreaterThan(0);
  });

  it("mostra novidades de módulos extras para empresa contratada e autorizada", () => {
    const visiveis = getVisibleProductUpdates(PRODUCT_UPDATES, {
      availableModules: [...STANDARD_MODULES, "crm"],
      permissions: [{ moduleKey: "crm", actions: ["view"] }],
      isCompanyAdmin: false,
    });

    expect(visiveis.some((update) => update.module === "crm")).toBe(true);
  });

  it("esconde novidades de extras para quem não tem permissão", () => {
    const visiveis = getVisibleProductUpdates(PRODUCT_UPDATES, {
      availableModules: [...STANDARD_MODULES, "crm"],
      permissions: [],
      isCompanyAdmin: false,
    });

    expect(visiveis.some((update) => update.module === "crm")).toBe(false);
  });

  it("permite que o administrador da empresa veja os extras contratados", () => {
    const visiveis = getVisibleProductUpdates(PRODUCT_UPDATES, {
      availableModules: [...STANDARD_MODULES, "crm", "nfe"],
      permissions: [],
      isCompanyAdmin: true,
    });

    expect(visiveis.some((update) => update.module === "crm")).toBe(true);
    expect(visiveis.some((update) => update.module === "nfe")).toBe(true);
  });

  it("não revela módulos indisponíveis para a empresa", () => {
    const visiveis = getVisibleProductUpdates(PRODUCT_UPDATES, {
      availableModules: ["dashboard", "gestao"],
      permissions: [],
      isCompanyAdmin: true,
    });

    expect(visiveis.every((update) => update.module === "gestao")).toBe(true);
  });
});

describe("filtros por módulo", () => {
  it("gera filtros apenas para módulos com novidades", () => {
    const visiveis = getVisibleProductUpdates(PRODUCT_UPDATES, {
      availableModules: STANDARD_MODULES,
      permissions: [],
      isCompanyAdmin: false,
    });
    const filtros = getProductUpdateFilters(visiveis);

    expect(filtros[0].key).toBe("all");
    const modulos = filtros.slice(1).map((filtro) => filtro.key);
    expect(new Set(modulos).size).toBe(modulos.length);
    for (const modulo of modulos) {
      expect(visiveis.some((update) => update.module === modulo)).toBe(true);
    }
  });

  it("filtra a lista sem depender de recarga", () => {
    const visiveis = getVisibleProductUpdates(PRODUCT_UPDATES, {
      availableModules: STANDARD_MODULES,
      permissions: [],
      isCompanyAdmin: false,
    });

    const vendas = filterProductUpdates(visiveis, "vendas");
    expect(vendas.length).toBeGreaterThan(0);
    expect(vendas.every((update) => update.module === "vendas")).toBe(true);

    const todas = filterProductUpdates(visiveis, "all");
    expect(todas.length).toBe(visiveis.length);
  });

  it("trata lista vazia sem quebrar", () => {
    const visiveis = getVisibleProductUpdates(PRODUCT_UPDATES, {
      availableModules: [],
      permissions: [],
      isCompanyAdmin: false,
    });

    expect(visiveis).toEqual([]);
    expect(getProductUpdateFilters(visiveis)).toHaveLength(1);
    expect(filterProductUpdates(visiveis, "vendas")).toEqual([]);
  });
});

describe("apresentação", () => {
  it("formata a data no padrão brasileiro", () => {
    expect(formatProductUpdateDate("2025-12-01")).toBe("01/12/2025");
    expect(formatProductUpdateDate("data inválida")).toBe("");
  });

  it("ordena as novidades da mais recente para a mais antiga", () => {
    const visiveis = getVisibleProductUpdates(PRODUCT_UPDATES, {
      availableModules: STANDARD_MODULES,
      permissions: [],
      isCompanyAdmin: false,
    });

    const datas = visiveis.map((update) => update.releasedAt);
    const ordenadas = [...datas].sort().reverse();
    expect(datas).toEqual(ordenadas);
  });

  it("mantém o módulo e a versão em cada registro exibido", () => {
    const visiveis: ProductUpdate[] = getVisibleProductUpdates(
      PRODUCT_UPDATES,
      {
        availableModules: STANDARD_MODULES,
        permissions: [],
        isCompanyAdmin: false,
      }
    );

    for (const update of visiveis) {
      expect(UPDATE_MODULE_LABELS[update.module]).toBeTruthy();
      expect(update.version).toMatch(/^\d+\.\d+\.\d+$/);
    }
  });
});
