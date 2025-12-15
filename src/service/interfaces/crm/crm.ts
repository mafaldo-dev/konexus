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
    createdAt?: any
}

export interface Stats {
    totalCustomer: number
    totalDeals: number;
    activeCustomers: number
    pipelineValue: number;
    winRate: number;
}