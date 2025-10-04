import { apiRequest } from "../../api"
import { GoalsData } from "../../../interfaces"

// Criar uma nova meta
export async function insertGoal(goal: GoalsData) {
  try {
    const createdGoal = await apiRequest("/goals", "POST", goal)
    return createdGoal.id // garante o retorno do id criado
  } catch (error) {
    console.error("Erro ao criar nova Meta: ", error)
    alert("Erro ao adicionar nova meta a base de dados!!!")
    throw new Error("Erro interno do servidor!")
  }
}

// Listar todas as metas
export async function handleAllGoals(searchTerm?: string): Promise<GoalsData[]> {
  try {
    const goals = await apiRequest("/goals", "GET")
    return goals as GoalsData[]
  } catch (error) {
    console.error("Erro ao recuperar a lista de Metas: ", error)
    alert("Erro interno do servidor!!!")
    throw new Error("Erro interno do servidor!")
  }
}

// Atualizar o status de uma meta
export async function updateGoalsStatus(goalId: string | number, status: string) {
  try {
    await apiRequest(`/goals/${goalId}`, "PUT", { status })
  } catch (error) {
    console.error("Erro ao atualizar status da Meta:", error)
    alert("Erro ao atualizar o status da Meta no banco de dados.")
    throw new Error("Falha ao atualizar status da Meta")
  }
}
