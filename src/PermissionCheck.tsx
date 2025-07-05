import { useAuth } from "./AuthContext";
import NotFound from "./pages/NOT-FOUND";

const DesignationCheck = ({
  allowed,
  children,
}: {
  allowed: string[];
  children: React.ReactNode;
}) => {
  const { user, loading } = useAuth();
  //console.log("DesignationCheck: User", user, "Allowed roles:", allowed);

  if (loading) return <p style={{ padding: 20 }}>Carregando...</p>;
  if (!user || !allowed.includes(user.designation)) {
    return (
        <NotFound />
    )

  }

  return <>{children}</>;
};


export default DesignationCheck;
