import { apiRequest } from "../../api";
import { Customer } from "../../../interfaces";
import Swal from "sweetalert2";

// Criar cliente
export async function insertCustomer(customer: Customer, token?: string) {
  try {
    const result = await apiRequest("customers/create", "POST", customer, token);
    
    return result?.id;

  } catch (error) {
    console.error("Erro ao inserir o Cliente ao sistema.", error);
    Swal.fire("Erro!", "Erro ao cadastrar cliente!!!", "error");
  }
}

// Atualizar cliente
export async function updateCustomer(id: string, updatedData: any, token?: string) {
  try {
    const response = await apiRequest(`customers/${id}`, "PUT", updatedData, token);
    
    return response

  } catch (error) {
    console.error("Erro ao atualizar os dados do cliente!", error);
    Swal.fire("Erro!", "Erro ao atualizar cliente!", "error");
  }
}

// Listar clientes
export const handleAllCustomers = async (): Promise<Customer[]> => {
  const tkn = localStorage.getItem("token")
  
  try {
    const response = await apiRequest("customers/all", "GET", undefined, tkn as string);

    const customers = response.data || response.customers || [];
    
    if (!Array.isArray(customers)) {
      console.warn("Customers não é um array:", customers);
      return [];
    }
    
    return customers;
    
  } catch (error: any) {
    console.error("Erro ao recuperar lista de clientes:", error.message || error);
    Swal.fire("Erro", "Erro ao recuperar lista de clientes", "error");
    return [];
  }
};
// Deletar cliente
export const deleteCustomer = async (id: string, token?: string): Promise<boolean> => {
  const result = await Swal.fire({
    title: "Tem certeza?",
    text: "Deseja excluir este cliente?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Sim, excluir!",
    cancelButtonText: "Cancelar"
  });

  if (!result.isConfirmed) return false;

  try {
    await apiRequest(`customers/${id}`, "DELETE", undefined, token);
    Swal.fire("Excluído!", "Cliente excluído com sucesso.", "success");
    return true;
  } catch (error) {
    console.error("Erro ao deletar cliente: ", error);
    Swal.fire("Erro!", "Erro ao excluir cliente.", "error");
    return false;
  }
};
