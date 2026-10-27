import { act } from "react";
import { createRoot } from "react-dom/client";
import CompaniesTab from "./CompaniesTab";

const mockListCompanies = jest.fn();
const mockSetCompanyActive = jest.fn();

jest.mock("../../services/systemAdminService", () => ({
  systemAdminService: {
    listCompanies: (...args: unknown[]) => mockListCompanies(...args),
    setCompanyActive: (...args: unknown[]) => mockSetCompanyActive(...args),
  },
}));

function company(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: "Empresa Alfa",
    cnpj: "11222333000181",
    email: null,
    phone: null,
    installation_id: 1,
    active: true,
    deactivated_at: null,
    deactivation_reason: null,
    createdat: "2026-10-01T12:00:00.000Z",
    users_count: 1,
    subscription_id: null,
    subscription_status: null,
    plan_id: null,
    subscription_started_at: null,
    subscription_ended_at: null,
    plan_name: null,
    plan_price_cents: null,
    plan_currency: null,
    support_id: null,
    support_status: null,
    support_plan_name: null,
    support_monthly_fee_cents: null,
    support_started_at: null,
    support_ended_at: null,
    support_notes: null,
    ...overrides,
  };
}

function findButton(container: HTMLElement, text: string) {
  return Array.from(container.querySelectorAll("button")).find((button) =>
    button.textContent?.includes(text)
  );
}

it("separa empresas ativas e desativadas e permite reativar e desativar", async () => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  mockListCompanies.mockResolvedValue([
    company(),
    company({
      id: 2,
      name: "Empresa Beta",
      active: false,
      deactivated_at: "2026-10-20T12:00:00.000Z",
      deactivation_reason: "teste interno",
    }),
  ]);
  mockSetCompanyActive.mockResolvedValue(company({ active: true }));

  const container = document.createElement("div");
  const root = createRoot(container);

  try {
    await act(async () => {
      root.render(
        <CompaniesTab
          refreshKey={0}
          onNewCompany={jest.fn()}
          onManageSubscription={jest.fn()}
          onManageSupport={jest.fn()}
        />
      );
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Ativas (1)");
    expect(container.textContent).toContain("Desativadas (1)");
    expect(container.textContent).toContain("Empresa Alfa");
    expect(container.textContent).not.toContain("Empresa Beta");

    const inactiveTab = findButton(container, "Desativadas");
    await act(async () => {
      inactiveTab?.click();
    });

    expect(container.textContent).toContain("Empresa Beta");
    expect(container.textContent).toContain("Motivo: teste interno");
    expect(container.textContent).not.toContain("Empresa Alfa");

    const reactivateButton = findButton(container, "Reativar");
    await act(async () => {
      reactivateButton?.click();
    });
    const confirmReactivate = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.trim() === "Reativar empresa"
    );
    await act(async () => {
      confirmReactivate?.click();
      await Promise.resolve();
    });

    expect(mockSetCompanyActive).toHaveBeenCalledWith(2, true, null);

    const activeTab = findButton(container, "Ativas");
    await act(async () => {
      activeTab?.click();
    });
    const deactivateButton = findButton(container, "Desativar");
    await act(async () => {
      deactivateButton?.click();
    });
    const confirmDeactivate = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.trim() === "Desativar empresa"
    );
    await act(async () => {
      confirmDeactivate?.click();
      await Promise.resolve();
    });

    expect(mockSetCompanyActive).toHaveBeenCalledWith(1, false, "");
  } finally {
    act(() => root.unmount());
  }
});
