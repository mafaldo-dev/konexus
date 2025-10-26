export interface OrderService {
    id: string | number
    orderNumber: string | number
    userCreate: string
    userReceiv: string
    orderStatus?: string
    notes?: string
    message: string
    orderDate?: string | Date | any
    sector: string
    orderItems: Array<{
        productCode: string | number
        quantity: number
    }>
    createdAt?: string | Date
    updatedAt?: string
}