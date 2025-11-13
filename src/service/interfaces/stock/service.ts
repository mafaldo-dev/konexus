export interface OrderService {
    id: number | any
    orderNumber: string | number
    username: string
    receiver?: string
    receiver_name: string
    orderStatus: string
    notes?: string
    message: string
    orderDate?: string | Date | any
    sector: string
    stock_movement: boolean
    movement_type?: string
    orderItems: Array<{
        productId: string | number
        quantity: number
    }>
    createdAt?: string | Date
    updatedAt?: string
}