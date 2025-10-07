// supplierApi.ts
import Swal from "sweetalert2";
import { apiRequest } from "../../api";
import { Supplier } from "../../../interfaces";

/**
 * Cria um novo fornecedor
 */
export const insertSupplier = async (supplier: Supplier, token?: string): Promise<string | null> => {
  try {
    const response = await apiRequest("suppliers/create", "POST", supplier, token);
    if (!response || !response.supplier) {
      console.error("Erro ao adicionar fornecedor: resposta inválida");
      return null;
    }
    return response.supplier.id;
  } catch (error: any) {
    console.error("Erro ao adicionar fornecedor:", error.message || error);
    Swal.fire("Erro", error.message || "Erro ao adicionar fornecedor", "error");
    return null;
  }
};

/**
 * Atualiza informações de um fornecedor
 */
export const updateSupplier = async (id: string, updateData: any, token?: string): Promise<boolean> => {
  try {
    await apiRequest(`suppliers/${id}`, "PUT", updateData, token);
    return true;
  } catch (error: any) {
    console.error("Erro ao atualizar fornecedor:", error.message || error);
    Swal.fire("Erro", error.message || "Erro ao atualizar fornecedor", "error");
    return false;
  }
};

/**
 * Retorna todos os fornecedores
 */
export const handleAllSuppliers = async (token?: string): Promise<Supplier[]> => {
  try {
    const response = await apiRequest("suppliers/all", "GET", undefined, token);
    
    const supplier = response.suppliers
    if(supplier.length === 0){
      Array.isArray(supplier.suppliers)
      return [supplier.suppliers]
    } 
    return response?.suppliers || [];
  } catch (error: any) {
    console.error("Erro ao recuperar fornecedores:", error.message || error);
    Swal.fire("Erro", "Erro ao recuperar fornecedores", "error");
    return [];
  }
};

/**
 * Busca fornecedor pelo código
 */
export const handleSupplierWithCode = async (code: string, token?: string): Promise<Supplier | null> => {
  try {
    const response = await apiRequest(`suppliers/code/${code}`, "GET", undefined, token);
    return response?.supplier || null;
  } catch (error: any) {
    console.error("Erro ao buscar fornecedor pelo código:", error.message || error);
    return null;
  }
};

/**
 * Busca fornecedores por termo (nome ou código)
 */
export const searchSuppliers = async (searchTerm: string, token?: string): Promise<Supplier[]> => {
  try {
    const response = await apiRequest(`suppliers/search?term=${encodeURIComponent(searchTerm)}`, "GET", undefined, token);
    return response?.suppliers || [];
  } catch (error: any) {
    console.error("Erro ao buscar fornecedores:", error.message || error);
    return [];
  }
};

/**
 * Exclui fornecedor
 */
export const deleteSupplier = async (id: string, token?: string): Promise<boolean> => {
  const result = await Swal.fire({
    title: "Tem certeza?",
    text: "Deseja excluir este Fornecedor?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Sim, excluir!",
    cancelButtonText: "Cancelar"
  });

  if (!result.isConfirmed) return false;

  try {
    await apiRequest(`suppliers/${id}`, "DELETE", undefined, token);
    Swal.fire("Excluído!", "Fornecedor excluído com sucesso.", "success");
    return true;
  } catch (error: any) {
    console.error("Erro ao deletar fornecedor:", error.message || error);
    Swal.fire("Erro!", "Erro ao excluir fornecedor.", "error");
    return false;
  }
};
