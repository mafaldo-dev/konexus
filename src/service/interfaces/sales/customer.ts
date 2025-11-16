export interface Customer {
    id?: number | any;
    name: string;
    phone: string;
    email: string;
    code: string
    status?: string
    cpf_cnpj: string
    address: {
        id?:  string | number
        city: string;
        number: number
        street: string;
        zip: string;
        state: string
        city_code: string
        type: 'shipping' | 'billing';
    }
    createdAt: string | any
}
