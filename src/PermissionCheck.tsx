import { useAuth } from "./AuthContext";

const DesignationCheck = ({
  allowed,
  children,
}: {
  allowed: string[];
  children: React.ReactNode;
}) => {
  const { user, loading } = useAuth();
  console.log(user, loading)

  if (loading) return <p style={{ padding: 20 }}>Carregando...</p>;
  if (!user || !allowed.includes(user.designation)) {
    return <p style={{ padding: 20 }}>Acesso negado</p>;
  }

  return <>{children}</>;
};


export default DesignationCheck;
