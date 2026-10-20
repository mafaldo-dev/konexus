import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import NotFound from "./pages/NOT-FOUND";

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
    return <NotFound />;
  }

  return <>{children}</>;
};

export default DesignationCheck;
