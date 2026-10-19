import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiClient } from "./api/client";
import { loginEmployee, loginAdmin } from "./services/authService";
import Swal from "sweetalert2";
import { shouldShowMenuItem, canAccessSubmenu, filterMenuItems, filterSubmenuItems, menuKeyToModuleKey as mapMenuKeyToModule, canAccessRoute as checkRouteAccess, } from "./utils/moduleMapping";
import { EmployeeDesignation } from "./types";
import { AuthContextType, UserInfo, CompanyInfo } from "./utils/authContext";


export type AccessType = "Full-access" | "Normal";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [modules, setModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Verifica se tem um módulo específico
  const hasModule = (moduleKey: string): boolean => {
    // Se for uma chave de menu (como "financeiro"), converte para module key ("finance")
    const moduleKeyFromMenu = mapMenuKeyToModule(moduleKey);
    return modules.includes(moduleKeyFromMenu);
  };

  // Verifica se o usuário tem um dos cargos permitidos
  const hasRole = (allowedRoles: string[]): boolean => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  // Verificação combinada para itens do menu principal
  const canAccessMenuItem = (menuKey: string, allowedRoles?: string[]): boolean => {
    // 1. Verifica se o módulo está ativo
    if (!shouldShowMenuItem(menuKey, modules)) {
      return false;
    }

    // 2. Se houver verificação de cargo, verifica
    if (allowedRoles && allowedRoles.length > 0) {
      if (!hasRole(allowedRoles)) {
        return false;
      }
    }

    // 3. Caso especial: config só para administradores
    if (menuKey === 'config' && user?.role !== 'Administrador') {
      return false;
    }

    return true;
  };

  // Verificação para subitens do menu
  const canAccessSubmenuItem = (path: string, allowedRoles?: string[]): boolean => {
    if (!user) return false;

    return canAccessSubmenu(path, modules, user.role, allowedRoles);
  };

  // Filtra um array de itens de menu
  const filterMenu = <T extends { key: string; access?: string[]; submenu?: any[] }>(
    items: T[]
  ): T[] => {
    if (!user) return [];

    const filteredItems = filterMenuItems(items, modules, user.role);

    // Filtra também os subitens
    return filteredItems.map(item => ({
      ...item,
      submenu: item.submenu ? filterSubmenuItems(item.submenu, modules, user.role) : undefined,
    }));
  };

  // Verifica se uma rota pode ser acessada
  const canAccessRoute = (pathname: string): boolean => {
    if (!user) return false;

    return checkRouteAccess(pathname, modules, user.role); // ← Usa o nome renomeado
  };

  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = localStorage.getItem("userData");
      const storedCompany = localStorage.getItem("companyData");
      const storedToken = localStorage.getItem("token");
      const storedModules = localStorage.getItem("companyModules");

      if (storedUser && storedToken) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setToken(storedToken);

          if (storedCompany) {
            const companyData = JSON.parse(storedCompany);
            setCompany(companyData);

            // Carrega módulos
            if (storedModules) {
              const parsedModules = JSON.parse(storedModules);
              setModules(parsedModules);
            } else if (companyData.modules) {
              setModules(companyData.modules);
              localStorage.setItem("companyModules", JSON.stringify(companyData.modules));
            }
          }
        } catch (error) {
          console.error("Erro ao ler dados do localStorage:", error);
          clearLocalStorage();
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

  const clearLocalStorage = () => {
    localStorage.removeItem("userData");
    localStorage.removeItem("companyData");
    localStorage.removeItem("token");
    localStorage.removeItem("companyModules");
  };

  const login = async (username: string, password: string) => {
    try {
      let userData: UserInfo | null = null;
      let companyData: CompanyInfo | null = null;
      let authToken: string | null = null;
      let companyModules: string[] = [];

      try {
        const adminResponse = await loginAdmin(username, password);

        if (adminResponse.ok && adminResponse.data?.user && adminResponse.data?.token) {
          const { user: adminUser, token } = adminResponse.data;
          userData = {
            id: adminUser.id,
            username: adminUser.username,
            active: adminUser.active || true,
            access: EmployeeDesignation.ADMIN,
            role: adminUser.role || "Administrador",
            designation: adminUser.sector || "Administrador",
            sector: adminUser.sector || "Administrador",
            companyId: adminUser.companyId
          };

          if (adminUser.companyName) {
            companyData = {
              id: adminUser.companyId as number,
              name: adminUser.companyName,
              email: adminUser.companyEmail,
              phone: adminUser.companyPhone,
              companyIcon: adminUser.companyIcon || "S/L",
              cnpj: adminUser.companyCnpj || "",
              modules: adminUser.modules || []
            };

            if (adminUser.modules) {
              companyModules = adminUser.modules;
            }
          }

          authToken = token;
        }
      } catch (adminError: any) {

      }

      if (!userData) {
        try {
          const employeeResponse = await loginEmployee(username, password);

          if (employeeResponse.ok && employeeResponse.data?.user && employeeResponse.data?.token) {
            const { user: empUser, token } = employeeResponse.data;
            userData = {
              id: empUser.id,
              username: empUser.username,
              active: empUser.active,
              access: EmployeeDesignation.EMPLOYEE,
              role: empUser.role,
              designation: empUser.sector || "Geral",
              sector: empUser.sector || "Geral",
              companyId: empUser.companyId
            };

            if (empUser.companyName) {
              companyData = {
                id: empUser.companyId,
                name: empUser.companyName,
                email: empUser.companyEmail,
                phone: empUser.companyPhone,
                companyIcon: empUser.companyIcon || "S/L",
                cnpj: empUser.companyCnpj,
                modules: empUser.modules || []
              };

              if (empUser.modules) {
                companyModules = empUser.modules;
              }
            }

            authToken = token;
          }
        } catch (employeeError: any) {

        }
      }

      if (!userData || !authToken) {
        await Swal.fire("Erro", "Usuário ou senha inválidos", "error");
        return;
      }
      const tkn = localStorage.getItem("token")
      try {
        const statusResponse = await apiClient.put(
          `employees/${userData.id}/status`,
          { status: 'Ativo' },
          { token: tkn as string }
        );
        if (!statusResponse.ok) {
          console.error("❌ ERRO ao atualizar status:", statusResponse.error);
        }
      } catch (statusError) {
        console.error("❌ ERRO ao atualizar status:", statusError);
      
      }

      setUser(userData);
      setCompany(companyData);
      setToken(authToken);
      setModules(companyModules);

      localStorage.setItem("userData", JSON.stringify(userData));
      localStorage.setItem("companyData", JSON.stringify(companyData));
      localStorage.setItem("token", authToken);
      localStorage.setItem("companyModules", JSON.stringify(companyModules));

      navigate("/dashboard")

    } catch (error: any) {
      console.error("❌ Erro inesperado no login:", error);
      clearLocalStorage();
      await Swal.fire("Erro", "Ocorreu um erro inesperado ao realizar login", "error");
    }
  };

  const logout = async (status?: boolean) => {
    try {
      if (user?.id) {
        const tokenFromStorage = localStorage.getItem("token");
        const res = await apiClient.put(
          `employees/${user.id}/status`,
          { status: 'Ausente' },
          { token: tokenFromStorage as string }
        );
        if (!res.ok) {
          console.warn("Erro ao atualizar status no logout:", res.error);
        }
      }
    } catch (error) {
      console.warn("Erro ao atualizar status no logout:", error);
    }

    // Limpa todos os estados
    setUser(null);
    setCompany(null);
    setToken(null);
    setModules([]);

    // Limpa localStorage
    clearLocalStorage();

    // Redireciona para login
    navigate("/");
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticate: !!user,
        user,
        company,
        token,
        loading,
        login,
        logout,
        hasAccess,

        // Módulos
        modules,
        hasModule,
        hasRole,
        canAccessMenuItem,
        canAccessSubmenuItem,
        filterMenu,
        canAccessRoute,
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