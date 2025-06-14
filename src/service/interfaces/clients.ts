export interface Clients {
    id?: number | any;
    name: string;
    phone: string;
    email: string;
    code: string
    address: {
        state?: string;
        city: string;
        number: string
        street: string;
        zip_code: string;
    }
    addedAt: string | any
}
