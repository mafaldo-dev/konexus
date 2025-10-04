export interface Customer {
    id?: number | any;
    name: string;
    phone: string;
    email: string;
    code: string
    address: {
        id?:  string | number
        city: string;
        number: number
        street: string;
        zip: string;
        type: 'shipping' | 'billing';
    }
    createdAt: string | any
}
