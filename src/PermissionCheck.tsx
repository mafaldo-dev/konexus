import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { DataState } from "./components/ui/DataState";
import { getRouteModules } from "./utils/moduleMapping";

/**
 * Proteção visual de rotas.
 *
 * A decisão de acesso usa as permissões efetivas carregadas do backend, não o
 * nome do cargo. A segurança real continua sendo aplicada em cada endpoint.
 */
const DesignationCheck = ({
  children,
}: {
  allowed?: string[];
  children: React.ReactNode;
}) => {
  const { user, loading, mustChangePassword, canAccessRoute, modules } =
    useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-sm">
          <DataState variant="loading" />
        </div>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (mustChangePassword && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  if (
    location.pathname !== "/change-password" &&
    !canAccessRoute(location.pathname)
  ) {
    const requiredModules = getRouteModules(location.pathname);
    const moduleUnavailable =
      requiredModules.length > 0 &&
      !requiredModules.some((moduleKey) => modules.includes(moduleKey));

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <DataState
            variant={moduleUnavailable ? "module-not-contracted" : "forbidden"}
          />
          <Link
            to="/dashboard"
            className="mt-2 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Voltar ao painel
          </Link>
        </div>
      </main>
    );
  }

  return <>{children}</>;
};

export default DesignationCheck;
