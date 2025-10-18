import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "./service/api/api";
import { handleLoginEmployee, handleLoginAdmin } from "./service/api/login";
import Swal from "sweetalert2";

export type AccessType = "Full-access" | "Normal";

export interface CompanyInfo {
  id: number;
  name: string;
  logo: string | null;
  logoUrl?: string | null;
  cnpj?: string
  email?: string
}

export interface UserInfo {
  id: string;
  username: string;
  role: string;
  designation: string;
  active: boolean;
  access?: AccessType | string;
  sector?: string;
  companyId?: number;
}

export enum EmployeeDesignation {
  ADMIN = "Full-access",
  EMPLOYEE = "Normal"
}

interface AuthContextType {
  isAuthenticate: boolean;
  user: UserInfo | null;
  company: CompanyInfo | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasAccess: (requiredAccess: AccessType | AccessType[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = localStorage.getItem("userData");
      const storedCompany = localStorage.getItem("companyData");
      const token = localStorage.getItem("token");

      if (storedUser && token) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          
          if (storedCompany) {
            const companyData = JSON.parse(storedCompany);
            setCompany(companyData);
          }
        } catch (error) {
          console.error("Erro ao ler dados do localStorage:", error);
          localStorage.removeItem("userData");
          localStorage.removeItem("companyData");
          localStorage.removeItem("token");
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const hasAccess = (requiredAccess: AccessType | AccessType[]): boolean => {
    if (!user) return false;

    const userAccess = user.access as AccessType;
    const requiredAccesses = Array.isArray(requiredAccess) ? requiredAccess : [requiredAccess];

    return requiredAccesses.includes(userAccess);
  };

  const login = async (username: string, password: string) => {
    try {
      let userData: UserInfo | null = null;
      let companyData: CompanyInfo | null = null;
      let token: string | null = null;

      // 🔹 Tenta Admin primeiro - COM TRATAMENTO SILENCIOSO
      try {
        const adminResponse = await handleLoginAdmin(username, password);

        if (adminResponse?.user && adminResponse?.token) {
          userData = {
            id: adminResponse.user.id,
            username: adminResponse.user.username,
            active: adminResponse.user.active || true,
            access: EmployeeDesignation.ADMIN,
            role: adminResponse.user.role || "Administrador",
            designation: adminResponse.user.sector || "Administrador",
            sector: adminResponse.user.sector || "Administrador",
            companyId: adminResponse.user.companyId
            
          };
          
          // ✅ EXTRAIR DADOS DA EMPRESA DO RESPONSE
          if (adminResponse.user.companyName) {
            companyData = {
              id: adminResponse.user.companyId,
              name: adminResponse.user.companyName,
              logo: adminResponse.user.companyLogo,
        
              logoUrl: adminResponse.user.companyLogo 
                ? `data:image/png;base64,${adminResponse.user.companyLogo}` 
                : null,
            };
          }
          
          token = adminResponse.token;
        }
      } catch (adminError: any) {
        if (adminError.message?.includes("404") || adminError.message?.includes("não encontrado")) {
          // Silencia erro
        } else {
          // Silencia erro
        }
      }

      // 🔹 Se não for admin, tenta Employee - COM TRATAMENTO SILENCIOSO
      if (!userData) {
        try {
          const employeeResponse = await handleLoginEmployee(username, password);

          if (employeeResponse?.user && employeeResponse?.token) {
            userData = {
              id: employeeResponse.user.id,
              username: employeeResponse.user.username,
              active: employeeResponse.user.active,
              access: EmployeeDesignation.EMPLOYEE,
              role: employeeResponse.user.role,
              designation: employeeResponse.user.sector || "Geral",
              sector: employeeResponse.user.sector || "Geral",
              companyId: employeeResponse.user.companyId
            };
            
            // ✅ EXTRAIR DADOS DA EMPRESA DO RESPONSE
            if (employeeResponse.user.companyName) {
              companyData = {
                id: employeeResponse.user.companyId,
                name: employeeResponse.user.companyName,
                logo: employeeResponse.user.companyLogo,
                logoUrl: employeeResponse.user.companyLogo 
                  ? `data:image/png;base64,${employeeResponse.user.companyLogo}` 
                  : null,
              };
            }
            
            token = employeeResponse.token;
          }
        } catch (employeeError: any) {
          if (employeeError.message?.includes("404") || employeeError.message?.includes("não encontrado")) {
            // Silencia erro
          } else {
            // Silencia erro
          }
        }
      }

      // 🔹 Se não conseguiu logar em nenhum
      if (!userData || !token) {
        await Swal.fire("Erro", "Usuário ou senha inválidos", "error");
        return;
      }

      // 🔹 Salva no estado e localStorage
      setUser(userData);
      setCompany(companyData);
      localStorage.setItem("userData", JSON.stringify(userData));
      localStorage.setItem("companyData", JSON.stringify(companyData));
      localStorage.setItem("token", token);

      // 🔹 Navegação baseada no SECTOR
      const userSector = userData.sector;
      const sectorRouteMap: Record<string, string> = {
        "Administrador": "/dashboard",
        "Comercial": "/sales/orders",
        "Estoque": "/sales/order-list",
        "Gerencia": "/dashboard",
        "Escritorio": "/financial",
        "Geral": "/"
      };

      const route = sectorRouteMap[userSector || ""] || "/";
      navigate(route);

    } catch (error: any) {
      console.error("❌ Erro inesperado no login:", error);

      // Limpa dados em caso de erro inesperado
      localStorage.removeItem("userData");
      localStorage.removeItem("companyData");
      localStorage.removeItem("token");

      await Swal.fire("Erro", "Ocorreu um erro inesperado ao realizar login", "error");
    }
  };

  const logout = async (status?: boolean) => {
    try {
      if (user?.id) {
        const token = localStorage.getItem("token");
        await apiRequest(`employees/${user.id}/status`, "PUT", { status: 'Inativo' }, 
          token as string);
      }
    } catch (error) {
      console.warn("Erro ao atualizar status no logout:", error);
    }

    setUser(null);
    setCompany(null);
    localStorage.removeItem("userData");
    localStorage.removeItem("companyData");
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticate: !!user,
        user,
        company,
        loading,
        login,
        logout,
        hasAccess,
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