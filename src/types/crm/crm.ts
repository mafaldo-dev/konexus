/**
 * src/types/crm/crm.ts
 * Interfaces de CRM.
 */

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  status: 'lead' | 'prospect' | 'customer' | 'inactive';
  value: number;
  createdAt: string;
  lastContact: string;
  notes: string;
  avatarColor: string;
  isFavorite: boolean;
}

export interface Customer {
  id?: number | any;
  name: string;
  phone: string;
  email: string;
  code: string;
  status?: string;
  cpf_cnpj: string;
  address: {
    id?: string | number;
    city: string;
    number: number | string;
    street: string;
    zip: string;
    state: string;
    city_code: string;
    neighborhood: string;
    type?: 'shipping' | 'billing';
  };
  createdAt: string | any;
}

export interface Deal {
  id: string;
  contactId: string;
  title: string;
  value: number;
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  probability: number;
  expectedCloseDate: string;
  notes: string;
  priority: 'low' | 'medium' | 'high';
  createdAt?: any;
}

export interface Stats {
  totalCustomer: number;
  totalDeals: number;
  activeCustomers: number;
  pipelineValue: number;
  winRate: number;
}
