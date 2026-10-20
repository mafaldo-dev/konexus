/**
 * Regressao de layout do modulo de Contabilidade.
 *
 * Garante que as telas continuem dentro do layout base do ERP (menu lateral +
 * cabecalho) e que as listagens usem a tabela padrao do projeto. Sem isso, a
 * tela fica sem caminho de volta para o menu.
 */
import fs from "fs";
import path from "path";

const DIR = path.join(__dirname);

function read(file: string): string {
  return fs.readFileSync(path.join(DIR, file), "utf8");
}

describe("layout do modulo de Contabilidade", () => {
  it("o componente de pagina usa o layout base (Dashboard)", () => {
    const source = read("components.tsx");

    expect(source).toContain("components/dashboard/Dashboard");
    expect(source).toContain("<Dashboard>");
    expect(source).toContain("</Dashboard>");
  });

  it("o componente de pagina oferece trilha de volta ao Financeiro", () => {
    const source = read("components.tsx");

    expect(source).toContain('to="/financer/financial"');
    expect(source).toContain("ArrowLeft");
  });

  it("as listagens usam a tabela padrao do projeto (DynamicTable)", () => {
    expect(read("components.tsx")).toContain("utils/Table/DynamicTable");
  });

  it("todas as telas do modulo passam pelo componente de pagina", () => {
    const pages = fs
      .readdirSync(DIR)
      .filter((file) => file.endsWith(".tsx") && !file.includes("components"));

    expect(pages.length).toBeGreaterThan(8);

    for (const page of pages) {
      const source = read(page);
      expect(source).toContain("AccountingPage");
      expect(source).not.toMatch(/<div className="min-h-screen bg-slate-50 p-4/);
    }
  });

  it("nenhuma tela do modulo fica fora do layout base", () => {
    const pages = fs
      .readdirSync(DIR)
      .filter((file) => file.endsWith(".tsx") && !file.includes("components"));

    for (const page of pages) {
      // a pagina so pode ser renderizada via AccountingPage (que ja inclui o Dashboard)
      expect(read(page)).not.toMatch(/import Dashboard/);
    }
  });
});
