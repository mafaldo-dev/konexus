// productsApi.ts
import Swal from "sweetalert2";
import { apiRequest } from "../../api";
import { Products } from "../../../interfaces";

/**
 * Insere um produto e registra entrada no Kardex via backend
 */
export const insertProductComKardex = async (produto: Products, token?: string): Promise<string | null> => {
  try {
    const response = await apiRequest("products/create", "POST", produto, token);
    if (!response || !response.product) {
      console.error("Erro ao criar produto: resposta inválida");
      return null;
    }
    return response.product.id;
  } catch (error: any) {
    console.error("Erro ao adicionar produto:", error.message || error);
    Swal.fire("Erro", error.message || "Erro ao adicionar produto", "error");
    return null;
  }
};

/**
 * Atualiza produto
 */
export const updateProduct = async (id: string, updatedData: any, token?: string) => {
  try {
    const response = await apiRequest(`products/${id}`, "PUT", updatedData, token);
    return response;
  } catch (error: any) {
    console.error("Erro ao atualizar produto:", error.message || error);
    Swal.fire("Erro", error.message || "Erro ao atualizar produto", "error");
    return null;
  }
};

/**
 * Busca todos os produtos e filtra pelo código
 */
export const handleProductWithCode = async (code: string | number, token?: string): Promise<Products | null> => {
  try {
    // Busca todos os produtos
    const response = await apiRequest("products/all", "GET", undefined, token);
    
    if (!response || !response.products) {
      throw new Error("Nenhum produto encontrado");
    }

    // Converte o código para string para comparação (caso seja número)
    const searchCode = code.toString().trim();
    
    // Filtra os produtos pelo código
    const foundProduct = response.products.find((product: Products) => 
      product.code?.toString().trim() === searchCode
    );

    if (!foundProduct) {
      throw new Error(`Produto com código ${code} não encontrado`);
    }

    return foundProduct;
  } catch (error: any) {
    console.error("Erro ao buscar produto pelo código:", error.message || error);
    throw new Error(error.message || "Erro ao buscar produto pelo código");
  }
};

// Versão alternativa que retorna null em vez de erro (se preferir)
export const handleProductWithCodeSilent = async (code: string | number, token?: string): Promise<Products | null> => {
  try {
    const response = await apiRequest("products/all", "GET", undefined, token);
    
    if (!response || !response.products) {
      return null;
    }

    const searchCode = code.toString().trim();
    const foundProduct = response.products.find((product: Products) => 
      product.code?.toString().trim() === searchCode
    );

    return foundProduct || null;
  } catch (error: any) {
    console.error("Erro ao buscar produto pelo código:", error.message || error);
    return null;
  }
};

/**
 * Recupera todos os produtos
 */
export const handleAllProducts = async (token?: string): Promise<Products[]> => {
  try {
    const response = await apiRequest("products/all", "GET", undefined, token);
    
    // Garante que sempre teremos um array
    const product: Products[] = Array.isArray(response?.products) ? response.products : [];

    return product;

  } catch (error: any) {
    console.error("Erro ao recuperar lista de produtos:", error.message || error);
    Swal.fire("Erro", "Erro ao recuperar lista de produtos", "error");
    return [];
  }
};


/**
 * Exclui produto
 */
export const deleteProduct = async (id: string, token?: string): Promise<boolean> => {
  const result = await Swal.fire({
    title: "Tem certeza?",
    text: "Deseja excluir este produto?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Sim, excluir!",
    cancelButtonText: "Cancelar"
  });

  if (!result.isConfirmed) return false;

  try {
    await apiRequest(`products/${id}`, "DELETE", undefined, token);
    Swal.fire("Excluído!", "Produto excluído com sucesso.", "success");
    return true;
  } catch (error: any) {
    console.error("Erro ao deletar produto:", error.message || error);
    Swal.fire("Erro", "Erro ao excluir produto", "error");
    return false;
  }
};

// ✅ FUNÇÕES DE KARDEX E ESTOQUE (ADICIONADAS)

// ✅ APENAS CORRIJA ESTAS FUNÇÕES NOVAS:

/**
 * Atualiza estoque do produto - ✅ CORREÇÃO: Rota correta
 */
export const updateProductStock = async (productId: number, quantity: number, token?: string): Promise<any> => {
  try {
    const response = await apiRequest(`products/${productId}/stock`, 'PUT', {
      quantity: quantity
    }, token);
    return response;
  } catch (error: any) {
    console.error('Erro ao atualizar estoque:', error.message || error);
    Swal.fire("Erro", "Erro ao atualizar estoque do produto", "error");
    throw error;
  }
};

/**
 * Cria movimentação no Kardex - ✅ CORREÇÃO: Rota correta
 */
export const createKardexMovement = async (kardexData: {
  productId: number;
  orderId?: number;
  movementType: string;
  quantity: number;
  unitPrice: number;
  companyId: number;
}, token?: string): Promise<any> => {
  try {
    const response = await apiRequest('kardex/create', 'POST', kardexData, token); // ✅ CORREÇÃO: /create
    return response;
  } catch (error: any) {
    console.error('Erro ao criar movimentação no Kardex:', error.message || error);
    Swal.fire("Erro", "Erro ao registrar movimentação no Kardex", "error");
    throw error;
  }
};

/**
 * Busca movimentações do Kardex por produto - ✅ CORREÇÃO: Rota correta
 */
export const getKardexByProduct = async (productId: string, token?: string): Promise<any> => {
  try {
    const response = await apiRequest(`kardex/products/${productId}`, 'GET', undefined, token);
    return response;
  } catch (error: any) {
    console.error('Erro ao buscar movimentações do produto:', error.message || error);
    throw error;
  }
};

/**
 * Busca movimentações do Kardex por pedido - ✅ CORREÇÃO: Rota correta
 */
export const getKardexByOrder = async (orderId: string, token?: string): Promise<any> => {
  try {
    const response = await apiRequest(`kardex/orders/${orderId}`, 'GET', undefined, token); // ✅ CORREÇÃO: kardex/orders/
    return response;
  } catch (error: any) {
    console.error('Erro ao buscar movimentações do pedido:', error.message || error);
    throw error;
  }
};

/**
 * Processa atualizações de inventário completo - ✅ CORREÇÃO: Rota correta
 */
export const processInventoryUpdates = async (orderData: {
  orderId: number;
  orderItems: Array<{
    productId: number;
    quantity: number;
    unitPrice: number;
  }>;
  companyId: number;
}, token?: string): Promise<any> => {
  try {
    // Para cada item do pedido, criar movimentação no Kardex
    const kardexPromises = orderData.orderItems.map(item =>
      createKardexMovement({
        productId: item.productId,
        orderId: orderData.orderId,
        movementType: 'saida',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        companyId: orderData.companyId
      }, token)
    );

    const results = await Promise.all(kardexPromises);
    return results;
  } catch (error: any) {
    console.error('Erro ao processar atualizações de inventário:', error.message || error);
    Swal.fire("Erro", "Erro ao processar atualizações de estoque", "error");
    throw error;
  }
};

// ✅ CORREÇÃO: Função com rota consistente
export const handlekardexMoviment = async (productId?: string, token?: string): Promise<any> => { 
  try {
    if (!productId) {
      throw new Error("ID do produto é obrigatório");
    }
    
    const response = await apiRequest(`kardex/products/${productId}`, "GET", undefined, token);
    return response;
  } catch (error: any) {
    console.error("Erro ao recuperar movimentações do produto:", error.message || error);
    throw error;
  }
};

// ✅ CORREÇÃO: Busca produto por ID - rota correta
export const getProductById = async (productId: string, token?: string): Promise<Products | null> => {
  try {
    const response = await apiRequest(`products/${productId}`, "GET", undefined, token); // ✅ CORREÇÃO: products/
    return response?.product || null;
  } catch (error: any) {
    console.error("Erro ao buscar produto por ID:", error.message || error);
    return null;
  }
};

// ✅ CORREÇÃO: Atualiza localização - rota correta
export const updateProductLocation = async (productId: string, location: string, token?: string): Promise<any> => {
  try {
    const response = await apiRequest(`products/${productId}/location`, 'PUT', { location }, token); // ✅ CORREÇÃO: products/
    return response;
  } catch (error: any) {
    console.error('Erro ao atualizar localização do produto:', error.message || error);
    throw error;
  }
};