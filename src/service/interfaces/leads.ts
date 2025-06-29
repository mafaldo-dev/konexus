export interface Lead {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  source?: string;
  status: "new" | "contacted" | "qualified" | "converted" | "lost" | "Novo" | "Contato Feito" | "Qualificado" | "Não Qualificado" | "Convertido";
  score?: number;
  estimated_value?: number | "";
  notes?: string;
  last_contact?: string;
  createdAt?: Date;
}