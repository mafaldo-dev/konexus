import { apiRequest } from "../../api";
import { OpportunityData, Opportunity } from "../../../interfaces";

// Criar oportunidade
export async function createOpportunity(opportunityData: OpportunityData): Promise<Opportunity> {
  try {
    const body = {
      ...opportunityData,
      createdAt: new Date().toISOString()
    };

    const opportunity = await apiRequest("/opportunities", "POST", body);
    return opportunity;
  } catch (error) {
    console.error("Erro ao adicionar oportunidade:", error);
    throw new Error("Falha ao criar oportunidade.");
  }
}

// Buscar todas oportunidades
export async function getAllOpportunities(): Promise<Opportunity[]> {
  try {
    const opportunities = await apiRequest("/opportunities", "GET");
    return opportunities;
  } catch (error) {
    console.error("Erro ao buscar oportunidades:", error);
    throw new Error("Falha ao buscar oportunidades.");
  }
}
