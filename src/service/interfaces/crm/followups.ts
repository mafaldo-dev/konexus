export interface FollowUp {
  id?: string;
  relatedTo: "Lead" | "Opportunity" | "Client" | "Campaign" | "Atendimento";
  relatedId: string; // ID of the related entity
  subject: string;
  notes: string;
  dueDate: Date;
  status: "Pendente" | "Concluído" | "Cancelado";
  assignedTo?: string; // Employee ID or Name
  createdAt: Date;
}