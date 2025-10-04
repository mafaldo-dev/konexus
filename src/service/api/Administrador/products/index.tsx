// productsApi.ts
import Swal from "sweetalert2";
import { apiRequest } from "../../api";
import { Products } from "../../../interfaces";

/**
 * Insere um produto e registra entrada no Kardex via backend
 */
export const insertProductComKardex = async (produto: Products, token?: string): Promise<string | null> => {
  try {
    const response = await apiRequest("product/create", "POST", produto, token);
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
    const response = await apiRequest(`product/${id}`, "PUT", updatedData, token);
    return response;
  } catch (error: any) {
    console.error("Erro ao atualizar produto:", error.message || error);
    Swal.fire("Erro", error.message || "Erro ao atualizar produto", "error");
    return null;
  }
};

/**
 * Busca produto pelo código
 */
// productsApi.ts ou ordersApi.ts

/**
 * Busca todos os produtos e filtra pelo código
 */
export const handleProductWithCode = async (code: string | number, token?: string): Promise<Products | null> => {
  try {
    // Busca todos os produtos
    const response = await apiRequest("product/all", "GET", undefined, token);
    
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
    const response = await apiRequest("product/all", "GET", undefined, token);
    
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
    const response = await apiRequest("product/all", "GET", undefined, token);
    const product = response.products

    if(product.length === 0){
      Array.isArray(product.products)
      return [product.products]
    } 
   
    return response?.products || [];
  
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
    await apiRequest(`product/${id}`, "DELETE", undefined, token);
    Swal.fire("Excluído!", "Produto excluído com sucesso.", "success");
    return true;
  } catch (error: any) {
    console.error("Erro ao deletar produto:", error.message || error);
    Swal.fire("Erro", "Erro ao excluir produto", "error");
    return false;
  }
};
