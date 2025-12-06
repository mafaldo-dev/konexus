import { apiRequest } from "../api";

export interface CompanyData {
  companyName: string;
  adminUsername: string;
  adminPassword: string;
  installation_id: number | any
  icon?: string | null;
}

export const createCompanyAdmin = async (data: CompanyData) => {
  try {
    const response = await apiRequest("admin/create-company", "POST", data)

    if (!response.ok) {
      throw new Error(response.Info || response.Error || "Erro ao criar empresa");
    }

    return response?.id;

  } catch (err: any) {
    console.error("Erro ao criar empresa: ", err )
    throw new Error(err.message || "Erro de comunicação com o servidor");
  }
};


