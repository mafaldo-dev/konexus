import { menuItems } from "./menu";

describe("navegação do Financeiro, Contabilidade e RH", () => {
  const finance: any = menuItems.find((item: any) => item.key === "financeiro");
  const stock: any = menuItems.find((item: any) => item.key === "estoque");
  const config: any = menuItems.find((item: any) => item.key === "config");

  it("não mantém Recursos Humanos como item independente", () => {
    expect(menuItems.find((item: any) => item.key === "rh")).toBeUndefined();
  });

  it("apresenta o grupo de RH dentro do Financeiro", () => {
    const rhGroup = finance.submenu.find(
      (item: any) => item.title === "Recursos Humanos"
    );
    expect(rhGroup).toBeDefined();
    expect(rhGroup.children.map((child: any) => child.to)).toEqual(
      expect.arrayContaining([
        "/rh",
        "/rh/employees",
        "/rh/infos",
        "/rh/folha",
        "/rh/treinamentos",
      ])
    );
  });

  it("preserva o Financeiro e a Contabilidade no mesmo grupo", () => {
    const paths = finance.submenu.flatMap((item: any) =>
      item.children ? item.children.map((child: any) => child.to) : [item.to]
    );
    expect(paths).toEqual(
      expect.arrayContaining([
        "/financer/financial",
        "/financer/contabilidade/painel",
        "/rh",
      ])
    );
  });

  it("aponta alertas de estoque para a rota dedicada", () => {
    const alerts = stock.submenu.find(
      (item: any) => item.title === "Alertas de Estoque"
    );
    expect(alerts.to).toBe("/stock/alerts");
  });

  it("remove a antiga área de Segurança das configurações", () => {
    expect(
      config.submenu.find((item: any) => item.to === "/config/security-area")
    ).toBeUndefined();
  });
});
