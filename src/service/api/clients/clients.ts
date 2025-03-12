import { Cliente } from "../../interfaces/client";



export const apiRequest = async (
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body?: any,
    token?: string | any,
) => {
    const url = `http://localhost:3001/admin${endpoint}`;

    try {
        // SALVA NA VARIAVEL HEADERS O FORMATO DA REQUISIÇÃO 
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };
        // FAZ A PASSAGEM DO TOKEN NO HEADERS PRA AUTENTICAÇAO
        if (token) {
            headers["Authorization"] = `Bearer ${token}`; // Garante que o token seja enviado corretamente
        }
        //DEFINI O QUE VAI SER PASSADO NA REQUISIÇÃO
        const options: RequestInit = {
            method,
            headers,
        };
// VERIFICA O METODO QUE ESTA SENDO PASSADO E SO EXIGE BODY CASO ATENDA O QUE FOI SETADO
        if (body && (method === "POST" || method === "PUT")) {
            options.body = JSON.stringify(body);
        }
        // PEGA A RESPOSTA DA REQUISIÇÃO
        const response = await fetch(url, options);

// VERIFICA SI OS ENDPOINTS ESTAO CORRETOS E FUNCIONANDO CASO CONTRARIO RETORNA STATUS 500
        if (!response.ok) {
            const errorDetails = await response.text();
            console.error(`Erro na API (${endpoint}):`, response.status, errorDetails);
            throw new Error(`Erro na requisição ${endpoint}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Erro ao acessar a API (${endpoint}):`, error);
        return null;
    }
};

// CLIENT REQUESTS IN API
export const allClients = async(client: Cliente):Promise<Cliente[]> => {
    const token = localStorage.getItem('tokenAdmin')
    
    
    try {
        const data = await apiRequest("/clients/allclients", "GET", client, token)
        console.log(data)
        if(data.clients) {
            console.log(data.clients)
            return data.clients
        } else {
            console.error("O retorno de data e null")
        }
        
    }catch(exe) {
        console.error("Erro ao recuperar clientes", exe)
    }
    return []
}

export const registerClient = async(client: Cliente): Promise<Cliente> => {
    const token = localStorage.getItem("tokenAdmin")
    return apiRequest("/clients/register", "POST", client, token )
}




export const handleClienteWithId = async(id: string): Promise<Cliente[]> => {
    return apiRequest(`Cliente/${id}`, "GET", `name=${id}`)
}


export const updateClient = async(id: string): Promise<Cliente> => {
    return apiRequest(`clients/${id}`, "PUT", undefined)
}

export const deleteClient = async(id: string):Promise<Cliente> => {
    return apiRequest(`Cliente/${id}`, "DELETE", `name=${id}`)
}
