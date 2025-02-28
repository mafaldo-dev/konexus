import { Produto } from "../../interfaces/produtos";

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


// PRODUCTS REQUESTS IN API 
export const allProducts = async(): Promise<Produto[]> =>{
    const token = localStorage.getItem('tokenAdmin')
    const data = await apiRequest("/products/allproducts", "GET", undefined, token)

    if(data){
        console.log("Response data is:",data.products)
        return data.products
    }
     return []
}

export const getProductByCode = async(code: number): Promise<Produto[]> => {
    const token = localStorage.getItem('tokenAdmin')
    const data = await apiRequest(`/products/productBy/${code}`, 'GET', undefined, token)

    try {
        if(data){
            return data.product
        }

    }catch(exe) {
        console.error("Erro ao recuperar produto:", exe)
    }
    return []
}

export const handleProductWithId = async(id: string) => {
    return apiRequest("Produtos/${id", "GET", `name=${id}`)
}

export const updateProductWhitId = async(id: string): Promise<Produto> =>{
    return apiRequest("Produtos/${id}", "PUT", `name=${id}`)
}

export const deleteProductWidthId = async(id: string): Promise<Produto> => {
    return apiRequest("Produtos/${id}", "DELETE", `name=${id}`)
}

export const submitProduct = async(produto: Produto) =>{
    return apiRequest("Produtos/cadastrar", "POST", produto)
}

