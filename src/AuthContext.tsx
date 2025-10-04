// AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "./service/api/api";
import { handleLoginEmployee, handleLoginAdmin } from "./service/api/login";
import Swal from "sweetalert2";

export type AccessType = "Full-access" | "Normal";

export interface UserInfo {
  id: string;
  username: string;
  role: string;
  designation: string
  active: boolean
  access?: AccessType | string;
}

interface AuthContextType {
  isAuthenticate: boolean;
  user: UserInfo | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>; // 🔁 CORRIGIDO
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = localStorage.getItem("userData");
      const token = localStorage.getItem("token");

      if (storedUser && token) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
        } catch (error) {
          console.error("Erro ao ler userData:", error);
          localStorage.removeItem("userData");
          localStorage.removeItem("token");
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

const login = async (username: string, password: string) => {
  try {
    let userData: UserInfo | null = null;
    let token: string | null = null;
    
    // 🔹 Primeiro tenta Admin (sem barulho no console)
    const adminResponse = await handleLoginAdmin(username, password).catch(() => null);

    if (adminResponse?.user && adminResponse?.token) {
      userData = {
        id: adminResponse.user.id,
        username: adminResponse.user.username,
        active: adminResponse.user.active || "True",
        access: adminResponse.user.access || "Full-access",
        role: adminResponse.user.role || "Administrador",
        designation: adminResponse.user.sector || "Geral"
      };
      token = adminResponse.token;
    }

    // 🔹 Se não for admin, tenta Employee
    if (!userData) {
      const employeeResponse = await handleLoginEmployee(username, password).catch(() => null);
      console.log(employeeResponse)
      if (employeeResponse?.user && employeeResponse?.token) {
        userData = {
          id: employeeResponse.user.id,
          username: employeeResponse.user.username,
          active: employeeResponse.user.active,
          access: employeeResponse.user.access,
          role: employeeResponse.user.role,
          designation: employeeResponse.user.sector || "Geral"
        };
        token = employeeResponse.token;
      }
    }  

    // 🔹 Se não conseguiu logar em nenhum
    if (!userData || !token) {
      await Swal.fire("Erro", "Usuário ou senha inválidos", "error");
      return;
    }

    // 🔹 Salva no estado e localStorage
    setUser(userData);
    localStorage.setItem("userData", JSON.stringify(userData));
    localStorage.setItem("token", token);

    navigate("/dashboard");
  } catch (error: any) {
    console.error("Erro inesperado no login:", error.message || error);

    // Limpa dados em caso de erro inesperado
    localStorage.removeItem("userData");
    localStorage.removeItem("token");

    await Swal.fire("Erro", "Ocorreu um erro inesperado ao realizar login", "error");
  }
};


  const logout = async () => {
    try {
      if (user?.id) {
        const token = localStorage.getItem("token");
        await apiRequest(`employee/${user.id}/status`, "PUT", {
          active: false,
          status: false
        }, token || undefined);
      }
    } catch (error) {
      console.warn("Erro ao atualizar status no logout:", error);
    }

    setUser(null);
    localStorage.removeItem("adminData");
    localStorage.removeItem("employeeData");
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticate: !!user,
        user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  return context;
};