export interface Movement {
  id?: string;
  productId: string;
  type: "entrada" | "saida" | "ajuste" | "previsao";
  quantity: number;
  date: Date | string;
  description: string;
  nfNumber?: string;
  user?: string;
  balance: number;
}