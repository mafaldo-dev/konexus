import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Headphones,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  WalletCards,
  FileCheck2,
  X,
} from "lucide-react";
import {
  clearSystemAdminSession,
  getSystemAdminSession,
  SystemAdminPlan,
  systemAdminService,
} from "../../services/systemAdminService";
import { Alert, Button } from "./components";
import { cn } from "./utils";
import CompanyFormModal from "./CompanyFormModal";
import CompaniesTab from "./CompaniesTab";
import DashboardTab from "./DashboardTab";
import PlansTab from "./PlansTab";
import SubscriptionsTab from "./SubscriptionsTab";
import SupportTab from "./SupportTab";
import ExtraModulesTab from "./ExtraModulesTab";
import AuthorizationsTab from "./AuthorizationsTab";

type TabKey =
  | "dashboard"
  | "companies"
  | "subscriptions"
  | "support"
  | "plans"
  | "extraModules"
  | "authorizations";

const navigation: Array<{
  key: TabKey;
  label: string;
  description: string;
  icon: typeof LayoutDashboard;
}> = [
  {
    key: "dashboard",
    label: "Visão geral",
    description: "Indicadores da plataforma",
    icon: LayoutDashboard,
  },
  {
    key: "companies",
    label: "Empresas",
    description: "Cadastro e gestão",
    icon: Building2,
  },
  {
    key: "subscriptions",
    label: "Assinaturas",
    description: "Planos contratados",
    icon: CreditCard,
  },
  {
    key: "support",
    label: "Suporte técnico",
    description: "Contratos de suporte",
    icon: Headphones,
  },
  {
    key: "plans",
    label: "Planos e módulos",
    description: "Preços e recursos",
    icon: Layers,
  },
  {
    key: "extraModules",
    label: "Módulos extras",
    description: "Financeiro e NF-e",
    icon: WalletCards,
  },
  {
    key: "authorizations",
    label: "Autorizações",
    description: "Liberações comerciais",
    icon: FileCheck2,
  },
];

const tabTitles: Record<TabKey, string> = {
  dashboard: "Visão geral",
  companies: "Empresas",
  subscriptions: "Assinaturas",
  support: "Suporte técnico",
  plans: "Planos e módulos",
  extraModules: "Módulos extras",
  authorizations: "Autorizações comerciais",
};

function getInitials(name: string) {
  return (
    name
      .split(/[\s._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "AD"
  );
}

export default function SystemAdminWorkspace() {
  const navigate = useNavigate();
  const [session] = useState(() => getSystemAdminSession());
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [focusCompanyId, setFocusCompanyId] = useState<number | null>(null);
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [plans, setPlans] = useState<SystemAdminPlan[]>([]);
  const [flash, setFlash] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  useEffect(() => {
    if (!session.token) return;
    systemAdminService
      .listPlans()
      .then(setPlans)
      .catch(() => setPlans([]));
  }, [session.token, refreshKey]);

  useEffect(() => {
    if (!flash) return;
    const timer = window.setTimeout(() => setFlash(null), 7000);
    return () => window.clearTimeout(timer);
  }, [flash]);

  useEffect(() => {
    document.title = "Konexus Admin · Painel global";
    return () => {
      document.title = "Konexus ERP";
    };
  }, []);

  if (!session.token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-lg font-bold text-slate-900">Acesso restrito</h1>
          <p className="mt-1 text-sm text-slate-500">
            Entre pelo atalho F1 na tela de login para acessar o painel administrativo
            global.
          </p>
          <Button className="mt-5 w-full" onClick={() => navigate("/")}>
            Voltar para o login
          </Button>
        </div>
      </div>
    );
  }

  const user = session.user;
  const userLabel = user?.username || "Administrador";
  const refresh = () => setRefreshKey((value) => value + 1);

  const handleNavigate = (tab: TabKey, companyId?: number) => {
    setActiveTab(tab);
    setFocusCompanyId(companyId ?? null);
    setMobileOpen(false);
  };

  const handleCompanyCreated = (result: {
    company: { id: number; name: string };
    subscription: unknown;
  }) => {
    setFlash({
      type: "success",
      message: `Empresa ${result.company.name} criada com sucesso.${
        result.subscription ? " A assinatura inicial também foi registrada." : ""
      }`,
    });
    setActiveTab("companies");
    refresh();
  };

  const handleLogout = () => {
    clearSystemAdminSession();
    navigate("/", { replace: true });
  };

  const sidebar = (
    <div className="flex h-full flex-col bg-slate-950 text-slate-300">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 text-sm font-black text-white shadow-lg shadow-blue-500/20">
          K
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white">Konexus</p>
          <p className="truncate text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Admin Console
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Fechar menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-5">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
          Administração global
        </p>
        <nav className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleNavigate(item.key)}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition",
                  active
                    ? "bg-white/10 text-white shadow-inner"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition",
                    active
                      ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                      : "bg-white/5 text-slate-400 group-hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{item.label}</span>
                  <span className="block truncate text-[11px] text-slate-500">
                    {item.description}
                  </span>
                </span>
                {active ? <ChevronRight className="h-4 w-4 text-blue-400" /> : null}
              </button>
            );
          })}
        </nav>

        <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            <div>
              <p className="text-xs font-semibold text-white">Acesso do proprietário</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                Este workspace é exclusivo do administrador global do sistema.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-xs font-bold text-white">
            {getInitials(userLabel)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{userLabel}</p>
            <p className="truncate text-[11px] text-slate-500">Administrador global</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-300"
        >
          <LogOut className="h-4 w-4" />
          Sair do painel
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 lg:block">{sidebar}</aside>

        {mobileOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="relative h-full w-72 max-w-[85vw] shadow-2xl">{sidebar}</aside>
          </div>
        ) : null}

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-slate-100/90 backdrop-blur lg:hidden">
            <div className="flex items-center gap-3 px-4 py-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm"
                aria-label="Abrir menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">
                  {tabTitles[activeTab]}
                </p>
                <p className="text-[11px] text-slate-500">Konexus Admin Console</p>
              </div>
              <div className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                {getInitials(userLabel)}
              </div>
            </div>
          </header>

          <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {flash ? (
              <div className="mb-5">
                <Alert variant={flash.type}>
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                      {flash.message}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFlash(null)}
                      className="rounded p-0.5 opacity-70 hover:opacity-100"
                      aria-label="Fechar aviso"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </Alert>
              </div>
            ) : null}

            {activeTab === "dashboard" ? (
              <DashboardTab
                refreshKey={refreshKey}
                onNavigate={handleNavigate}
                onNewCompany={() => setCompanyModalOpen(true)}
              />
            ) : null}

            {activeTab === "companies" ? (
              <CompaniesTab
                refreshKey={refreshKey}
                onNewCompany={() => setCompanyModalOpen(true)}
                onManageSubscription={(companyId) =>
                  handleNavigate("subscriptions", companyId)
                }
                onManageSupport={(companyId) => handleNavigate("support", companyId)}
              />
            ) : null}

            {activeTab === "subscriptions" ? (
              <SubscriptionsTab
                refreshKey={refreshKey}
                initialCompanyId={focusCompanyId}
                onPresetConsumed={() => setFocusCompanyId(null)}
                onDataChanged={refresh}
              />
            ) : null}

            {activeTab === "support" ? (
              <SupportTab
                refreshKey={refreshKey}
                initialCompanyId={focusCompanyId}
                onPresetConsumed={() => setFocusCompanyId(null)}
                onDataChanged={refresh}
              />
            ) : null}

            {activeTab === "plans" ? (
              <PlansTab refreshKey={refreshKey} onDataChanged={refresh} />
            ) : null}

            {activeTab === "extraModules" ? (
              <ExtraModulesTab
                refreshKey={refreshKey}
                initialCompanyId={focusCompanyId}
                onPresetConsumed={() => setFocusCompanyId(null)}
                onDataChanged={refresh}
              />
            ) : null}

            {activeTab === "authorizations" ? (
              <AuthorizationsTab
                refreshKey={refreshKey}
                initialCompanyId={focusCompanyId}
                onPresetConsumed={() => setFocusCompanyId(null)}
                onDataChanged={refresh}
              />
            ) : null}
          </div>
        </main>
      </div>

      <CompanyFormModal
        open={companyModalOpen}
        onClose={() => setCompanyModalOpen(false)}
        plans={plans}
        onCreated={handleCompanyCreated}
      />
    </div>
  );
}
