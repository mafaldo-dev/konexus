import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "./service/api/api";
import { handleLoginEmployee, handleLoginAdmin } from "./service/api/login";
import Swal from "sweetalert2";
import { shouldShowMenuItem, canAccessSubmenu, filterMenuItems, filterSubmenuItems, menuKeyToModuleKey as mapMenuKeyToModule, canAccessRoute as checkRouteAccess, } from "./utils/moduleMapping";
import { EmployeeDesignation } from "./service/interfaces";
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

          if (adminResponse.user.companyName) {
            companyData = {
              id: adminResponse.user.companyId,
              name: adminResponse.user.companyName,
              email: adminResponse.user.companyEmail,
              phone: adminResponse.user.companyPhone,
              companyIcon: adminResponse.user.companyIcon || "S/L",
              cnpj: adminResponse.user.companyCnpj || "",
              modules: adminResponse.user.modules || []
            };

            if (adminResponse.user.modules) {
              companyModules = adminResponse.user.modules;
            }
          }

          authToken = adminResponse.token;
        }
      } catch (adminError: any) {

      }

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

            if (employeeResponse.user.companyName) {
              companyData = {
                id: employeeResponse.user.companyId,
                name: employeeResponse.user.companyName,
                email: employeeResponse.user.companyEmail,
                phone: employeeResponse.user.companyPhone,
                companyIcon: employeeResponse.user.companyIcon || "S/L",
                cnpj: employeeResponse.user.companyCnpj,
                modules: employeeResponse.user.modules || []
              };

              if (employeeResponse.user.modules) {
                companyModules = employeeResponse.user.modules;
              }
            }

            authToken = employeeResponse.token;
          }
        } catch (employeeError: any) {

        }
      }

      if (!userData || !authToken) {
        await Swal.fire("Erro", "Usuário ou senha inválidos", "error");
        return;
      }
      try {
        await apiRequest(`employees/${userData.id}/status`, "PUT",
          { status: 'Ativo' },
          authToken
        );

      } catch (statusError) {
        console.warn("Erro ao atualizar status no login:", statusError);

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
        await apiRequest(`employees/${user.id}/status`, "PUT", { status: 'Ausente' },
          tokenFromStorage as string);
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