import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

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
  const { user, loading, mustChangePassword, canAccessRoute } = useAuth();
  const location = useLocation();

  if (loading) {
    return <p style={{ padding: 20 }}>Carregando...</p>;
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
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">
            Permissão necessária
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Acesso negado</h1>
          <p className="mt-3 text-sm text-slate-600">
            Seu cargo ou as permissões concedidas não permitem acessar esta tela.
            Se isso mudou recentemente, a navegação será atualizada automaticamente.
          </p>
          <Link
            to="/dashboard"
            className="mt-6 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
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
