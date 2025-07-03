export interface Atendimento {
  id?: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  subject: string;
  description: string;
  status: "Aberto" | "Em Andamento" | "Resolvido" | "Fechado";
  priority: "Baixa" | "Média" | "Alta";
  assignedTo?: string; // Employee ID or Name
  createdAt: Date;
  resolvedAt?: Date;
}