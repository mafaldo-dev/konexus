import Swal from "sweetalert2";
import { apiRequest } from "../api"

export interface LoginResponse {
  user: {
    id: string;
    username: string;
    email?: string;
    sector: string;
    access: string;
    role: string;
    
  };
  token: string;
}

export const handleLoginAdmin = async (username: string, password: string) => {
    try {
        const response = await apiRequest("login/auth", "POST", {username, password});
        
        if (!response || !response.user) {
            throw new Error("Credenciais inválidas ou usuário não encontrado");
        }

        if (response.token) {
            localStorage.setItem("token", response.token);
        } else {
            console.error("❌ Token não veio na resposta");
            Swal.fire("Info","Token não recebido do servidor","info");
        }

        return {
            user: response.user,
            token: response.token
        };
        
    } catch (error: any) {
        console.warn("Erro ao efetuar login:", error)
        localStorage.removeItem("token");
        localStorage.removeItem("userData");        
        throw error;

        
    }
}

export const handleLoginEmployee = async (username: string, password: string) => {
    try {
        const response = await apiRequest("employees/auth-employee", "POST", { username, password });
        console.log(response)
        if (!response || !response.user) {
            Swal.fire("Alerta","Credenciais inválidas ou usuário não encontrado", "warning");
        }

        if (response.token) {
            localStorage.setItem("token", response.token);
        } else {
            console.error("❌ Token não veio na resposta");
            Swal.fire("Info","Token não recebido do servidor", "info");
        }

        return {
            user: response.user,
            token: response.token
        };
        
    } catch (error: any) {
        console.warn("Erro ao realizar login:", error);
        
        localStorage.removeItem("token");
        localStorage.removeItem("userData");
        
        throw error;
    }
}