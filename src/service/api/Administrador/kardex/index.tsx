import { apiRequest } from "../../api";
import { Movement } from "../../../interfaces";

// Criar movimentação no Kardex
export const createKardexEntry = async (
  productId: string,
  type: "entrada" | "saida" | "ajuste",
  quantity: number,
  description: string,
  nfNumber?: string,
  userId?: string,
  order_number?: string,
  initialBalance?: number
): Promise<Movement> => {
  try {
    if (!productId) throw new Error("ID do produto é obrigatório");
    if (quantity <= 0) throw new Error("Quantidade deve ser maior que zero");

    const body = {
      productId,
      type,
      quantity,
      description,
      nfNumber: nfNumber || "N/A",
      order_number: order_number || "N/A",
      user: userId || "system",
      initialBalance: initialBalance ?? null
    };

    const movement = await apiRequest("/kardex", "POST", body);
    return movement;
  } catch (error) {
    console.error("Erro ao criar movimentação:", error);
    throw new Error("Falha ao registrar movimentação no Kardex");
  }
};

// Buscar todas as movimentações de um produto
export const getKardexMovements = async (productId: string): Promise<Movement[]> => {
  try {
    if (!productId) throw new Error("ID do produto é obrigatório");

    const movements = await apiRequest(`/kardex/${productId}`, "GET");
    return movements;
  } catch (error) {
    console.error("Erro ao buscar movimentações:", error);
    throw new Error("Falha ao carregar histórico de movimentações");
  }
};

// Buscar movimentações paginadas
export const getKardexPaginated = async (
  productId: string,
  page: number,
  pageSize: number
): Promise<{ movements: Movement[]; lastPage: boolean }> => {
  try {
    const result = await apiRequest(
      `/kardex/${productId}?page=${page}&pageSize=${pageSize}`,
      "GET"
    );

    return {
      movements: result.movements,
      lastPage: result.lastPage
    };
  } catch (error) {
    console.error("Erro na paginação:", error);
    throw new Error("Falha ao carregar movimentações paginadas");
  }
};
