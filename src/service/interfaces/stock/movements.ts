export interface Movement {
  id?: string;
  productId: string;
  type: "entrada" | "saida" | "ajuste" | "previsao";
  quantity: number;
  date: string; // melhor padronizar como ISO string
  description: string;
  nfNumber?: string;
  order_number?: string;
  user?: string;
  balance: number;
  movement: number; // contador da movimentação por produto
}