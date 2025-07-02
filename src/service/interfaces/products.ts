export interface Products {
    id?: number | any;
    name: string;
    description: string;
    price: number
    quantity: number 
    code: string
    addedAt: string | any
    supplier: string
    address?: string
    minimum_stock: number
}