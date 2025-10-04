// useAuthService.tsx - CORRIJA TAMBÉM
import { useState } from "react";
import { useAuth } from "../AuthContext";

export default function useAuthService() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();

  const executeLogin = async (username: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      await login(username, password);
      
    } catch (err: any) {
      console.error("Erro no login:", err);
      setError(err.message || "Erro ao fazer login. Tente novamente.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { 
    loading, 
    error, 
    handleLogin: executeLogin
  };
}