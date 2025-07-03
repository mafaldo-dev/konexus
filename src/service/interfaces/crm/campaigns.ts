export interface Campaign {
  id?: string;
  name: string;
  type: "Email" | "SMS" | "Telefone" | "Rede Social" | "Outro";
  startDate: Date;
  endDate: Date;
  status: "Planejada" | "Ativa" | "Concluída" | "Cancelada";
  targetAudience: string;
  budget?: number;
  description?: string;
  createdAt: Date;
}