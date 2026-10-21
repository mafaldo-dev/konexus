import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "./api/client";
import { loginEmployee, loginAdmin } from "./services/authService";
import Swal from "sweetalert2";
import {
  canAccessMenuItemWithPermissions,
  canAccessSubmenuWithPermissions,
  canAccessRoute as checkRouteAccess,
  filterMenuItems,
  filterSubmenuItems,
  hasAnyPermission as checkAnyPermission,
  hasPermission as checkPermission,
  menuKeyToModuleKey as mapMenuKeyToModule,
  PermissionGroup,
} from "./utils/moduleMapping";
import { EmployeeDesignation } from "./types";
import { AuthContextType, UserInfo, CompanyInfo } from "./utils/authContext";
import { saveSystemAdminSession } from "./services/systemAdminService";

export type AccessType = "Full-access" | "Normal";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function readStoredPermissions(rawUser: string | null): PermissionGroup[] {
  if (!rawUser) return [];
  try {
    const userData = JSON.parse(rawUser);
    return Array.isArray(userData.permissions) ? userData.permissions : [];
  } catch {
    return [];
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [modules, setModules] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<PermissionGroup[]>([]);
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const invalid = () => {
      setUser(null); setCompany(null); setToken(null); setModules([]);
      setPermissions([]); setIsCompanyAdmin(false); setMustChangePassword(false);
      navigate('/');
    };
    window.addEventListener('konexus:session-invalid', invalid);
    return () => window.removeEventListener('konexus:session-invalid', invalid);
  }, [navigate]);

  useEffect(() => {
    if (!token || mustChangePassword) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const interval = Math.max(30000, Number(process.env.REACT_APP_HEARTBEAT_MS) || 60000);
    const communicate = async () => {
      if (stopped || localStorage.getItem('token') !== token) return;
      const response = await apiClient.post('devices/heartbeat', undefined, { token, reauth: false });
      if (!stopped && response.status !== 401) timer = setTimeout(communicate, interval);
    };
    const start = async () => {
      if (window.ipcRenderer) {
        try {
          const installation = await window.ipcRenderer.invoke('get_installation');
          if (stopped) return;
          const registered = await apiClient.post('devices/register', installation, { token, reauth: false });
          if (!registered.ok) {
            if (!stopped && [0,408,503].includes(registered.status)) {
              timer = setTimeout(start, interval);
              return;
            }
            if (!stopped) await Swal.fire('Rastreabilidade indisponível', registered.error || 'Falha ao registrar computador.', 'error');
            return;
          }
        } catch {
          if (!stopped) await Swal.fire('Identificação indisponível', 'Não foi possível ler a identidade local da instalação.', 'error');
          return;
        }
      }
      if (!stopped) void communicate();
    };
    void start();
    return () => { stopped = true; clearTimeout(timer); };
  }, [token, mustChangePassword]);

  const hasModule = (moduleKey: string): boolean => {
    const moduleKeyFromMenu = mapMenuKeyToModule(moduleKey);
    return modules.includes(moduleKeyFromMenu);
  };

  const hasPermission = (moduleKey: string, actionKey: string): boolean =>
    checkPermission(permissions, mapMenuKeyToModule(moduleKey), actionKey);

  const hasAnyPermission = (requirements: Array<[string, string]>): boolean =>
    checkAnyPermission(
      permissions,
      requirements.map(([moduleKey, actionKey]) => [
        mapMenuKeyToModule(moduleKey),
        actionKey,
      ])
    );

  const hasRole = (allowedRoles: string[]): boolean => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  const canAccessMenuItem = (menuKey: string, _allowedRoles?: string[]): boolean => {
    return canAccessMenuItemWithPermissions(
      menuKey,
      modules,
      permissions,
      isCompanyAdmin
    );
  };

  const canAccessSubmenuItem = (path: string, _allowedRoles?: string[]): boolean => {
    return canAccessSubmenuWithPermissions(
      path,
      modules,
      permissions,
      isCompanyAdmin
    );
  };

  const filterMenu = <T extends { key: string; access?: string[]; submenu?: any[] }>(
    items: T[]
  ): T[] => {
    if (!user) return [];

    const filteredItems = filterMenuItems(
      items,
      modules,
      user.role,
      permissions,
      isCompanyAdmin
    );

    return filteredItems.map((item) => ({
      ...item,
      submenu: item.submenu
        ? filterSubmenuItems(
            item.submenu,
            modules,
            user.role,
            undefined,
            permissions,
            isCompanyAdmin
          )
        : undefined,
    }));
  };

  const canAccessRoute = (pathname: string): boolean => {
    if (!user) return false;
    return checkRouteAccess(
      pathname,
      modules,
      user.role,
      permissions,
      isCompanyAdmin
    );
  };

  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = localStorage.getItem("userData");
      const storedCompany = localStorage.getItem("companyData");
      const storedToken = localStorage.getItem("token");
      const storedModules = localStorage.getItem("companyModules");

      if (storedUser && storedToken) {
        try {
          const current = await apiClient.get('login/session', { token: storedToken, reauth: false });
          if (!current.ok) {
            setLoading(false);
            return;
          }
          const userData: UserInfo = JSON.parse(storedUser);
          Object.assign(userData, current.data?.user);
          const storedPermissions = Array.isArray(current.data?.user?.permissions)
            ? current.data.user.permissions : readStoredPermissions(storedUser);
          setUser(userData);
          setToken(storedToken);
          setPermissions(storedPermissions);
          setIsCompanyAdmin(Boolean(userData.isCompanyAdmin));
          setMustChangePassword(Boolean(userData.mustChangePassword));

          if (storedCompany) {
            const companyData = JSON.parse(storedCompany);
            setCompany(companyData);

            if (Array.isArray(current.data?.user?.modules)) {
              setModules(current.data.user.modules);
            } else if (storedModules) {
              setModules(JSON.parse(storedModules));
            } else if (companyData.modules) {
              setModules(companyData.modules);
              localStorage.setItem(
                "companyModules",
                JSON.stringify(companyData.modules)
              );
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasAccess = (requiredAccess: AccessType | AccessType[]): boolean => {
    if (!user) return false;

    const userAccess = user.access as AccessType;
    const requiredAccesses = Array.isArray(requiredAccess)
      ? requiredAccess
      : [requiredAccess];

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
      let userPermissions: PermissionGroup[] = [];
      let userIsCompanyAdmin = false;
      let userMustChangePassword = false;

      try {
        const adminResponse = await loginAdmin(username, password);

        if (adminResponse.ok && adminResponse.data?.user && adminResponse.data?.token) {
          const { user: adminUser, token: adminToken } = adminResponse.data;

          // Administrador global do sistema (F1): workspace separado.
          if (adminUser.userType === "Administrator" && !adminUser.companyId) {
            saveSystemAdminSession(adminToken, {
              id: adminUser.id,
              username: adminUser.username,
              role: adminUser.role,
              userType: adminUser.userType,
            });
            navigate("/system-admin");
            return;
          }

          userData = {
            id: adminUser.id,
            username: adminUser.username,
            active: adminUser.active !== false,
            access: EmployeeDesignation.ADMIN,
            role: adminUser.role || "Administrador",
            roleId: adminUser.roleId ?? null,
            roleName: adminUser.roleName || adminUser.role,
            designation: adminUser.sector || "Administrador",
            sector: adminUser.sector || "Administrador",
            companyId: adminUser.companyId,
            isCompanyAdmin: Boolean(adminUser.isCompanyAdmin),
            mustChangePassword: Boolean(adminUser.mustChangePassword),
            modules: adminUser.modules || [],
            permissions: adminUser.permissions || [],
          };

          if (adminUser.companyName) {
            companyData = {
              id: adminUser.companyId as number,
              name: adminUser.companyName,
              email: adminUser.companyEmail,
              phone: adminUser.companyPhone,
              companyIcon: adminUser.companyIcon || "S/L",
              cnpj: adminUser.companyCnpj || "",
              modules: adminUser.modules || [],
            };
          }

          companyModules = adminUser.modules || [];
          userPermissions = adminUser.permissions || [];
          userIsCompanyAdmin = Boolean(adminUser.isCompanyAdmin);
          userMustChangePassword = Boolean(adminUser.mustChangePassword);
          authToken = adminToken;
        }
      } catch {
        // Credenciais de colaborador seguem para o login de colaborador.
      }

      if (!userData) {
        try {
          const employeeResponse = await loginEmployee(username, password);

          if (
            employeeResponse.ok &&
            employeeResponse.data?.user &&
            employeeResponse.data?.token
          ) {
            const { user: empUser, token: employeeToken } = employeeResponse.data;
            userData = {
              id: empUser.id,
              username: empUser.username,
              active: empUser.active !== false,
              access: empUser.isCompanyAdmin
                ? EmployeeDesignation.ADMIN
                : EmployeeDesignation.EMPLOYEE,
              role: empUser.role,
              roleId: empUser.roleId ?? null,
              roleName: empUser.roleName || empUser.role,
              designation: empUser.sector || "Geral",
              sector: empUser.sector || "Geral",
              companyId: empUser.companyId,
              isCompanyAdmin: Boolean(empUser.isCompanyAdmin),
              mustChangePassword: Boolean(empUser.mustChangePassword),
              modules: empUser.modules || [],
              permissions: empUser.permissions || [],
            };

            if (empUser.companyName) {
              companyData = {
                id: empUser.companyId,
                name: empUser.companyName,
                email: empUser.companyEmail,
                phone: empUser.companyPhone,
                companyIcon: empUser.companyIcon || "S/L",
                cnpj: empUser.companyCnpj,
                modules: empUser.modules || [],
              };
            }

            companyModules = empUser.modules || [];
            userPermissions = empUser.permissions || [];
            userIsCompanyAdmin = Boolean(empUser.isCompanyAdmin);
            userMustChangePassword = Boolean(empUser.mustChangePassword);
            authToken = employeeToken;
          }
        } catch {
          // Erro tratado abaixo como credenciais inválidas.
        }
      }

      if (!userData || !authToken) {
        await Swal.fire("Erro", "Usuário ou senha inválidos", "error");
        return;
      }

      // Identifica a instalacao antes de liberar a interface e executar operacoes.
      if (window.ipcRenderer && !userMustChangePassword) {
        const installation = await window.ipcRenderer.invoke('get_installation');
        const registered = await apiClient.post('devices/register', installation, { token:authToken, reauth:false });
        if (!registered.ok) {
          await apiClient.post('login/logout', undefined, {token:authToken,reauth:false});
          await Swal.fire('Computador não registrado', registered.error || 'Tente novamente.', 'error');
          return;
        }
      }

      // Persiste a sessão antes de qualquer chamada autenticada.
      setUser(userData);
      setCompany(companyData);
      setToken(authToken);
      setModules(companyModules);
      setPermissions(userPermissions);
      setIsCompanyAdmin(userIsCompanyAdmin);
      setMustChangePassword(userMustChangePassword);

      localStorage.setItem("userData", JSON.stringify(userData));
      localStorage.setItem("companyData", JSON.stringify(companyData));
      localStorage.setItem("token", authToken);
      localStorage.setItem("companyModules", JSON.stringify(companyModules));

      if (userMustChangePassword) {
        navigate("/change-password");
        return;
      }

      try {
        // Presenca do proprio colaborador: parte do ciclo de sessao (login),
        // nao e alteracao de negocio. Nao deve abrir o modal de confirmacao
        // de senha (a senha ja foi confirmada no acesso).
        const statusResponse = await apiClient.put(
          `employees/${userData.id}/status`,
          { status: "Ativo" },
          { token: authToken, reauth: false }
        );
        if (!statusResponse.ok) {
          console.warn("Não foi possível atualizar a presença:", statusResponse.error);
        }
      } catch (statusError) {
        console.warn("Erro ao atualizar presença:", statusError);
      }

      navigate("/dashboard");
    } catch (error) {
      console.error("Erro inesperado no login:", error);
      clearLocalStorage();
      await Swal.fire(
        "Erro",
        "Ocorreu um erro inesperado ao realizar login",
        "error"
      );
    }
  };

  const logout = async (status?: boolean) => {
    setToken(null); // Interrompe presenca antes de iniciar o logout remoto.
    try {
      if (user?.id && !mustChangePassword) {
        const tokenFromStorage = localStorage.getItem("token");
        // Presenca do proprio colaborador na saida: igual ao login, nao abre
        // o modal de confirmacao de senha.
        const res = await apiClient.put(
          `employees/${user.id}/status`,
          { status: "Ausente" },
          { token: tokenFromStorage as string, reauth: false }
        );
        if (!res.ok) {
          console.warn("Erro ao atualizar status no logout:", res.error);
        }
      }
    } catch (error) {
      console.warn("Erro ao atualizar status no logout:", error);
    }

    // Encerramento de sessao no servidor: registra o evento de saida.
    try {
      await apiClient.post("login/logout", undefined, {
        token: localStorage.getItem("token") || undefined,
        reauth: false,
      });
    } catch (error) {
      console.warn("Erro ao encerrar a sessao no servidor:", error);
    }

    setUser(null);
    setCompany(null);
    setToken(null);
    setModules([]);
    setPermissions([]);
    setIsCompanyAdmin(false);
    setMustChangePassword(false);
    clearLocalStorage();
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
        modules,
        permissions,
        isCompanyAdmin,
        mustChangePassword,
        hasModule,
        hasPermission,
        hasAnyPermission,
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
