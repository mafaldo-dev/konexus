/**
 * src/types/stock/service.ts
 * Interfaces de ordens de serviço.
 */

export interface OrderService {
    id: number | any
    orderNumber: string | number
    username?: string
    receiver?: string | number
    receiver_name?: string
    orderStatus: string
    notes?: string
    message?: string
    orderDate?: string | Date | any
    sector?: string
    stock_movement?: boolean
    movement_type?: string
    orderItems?: Array<{
        productId?: string | number
        productCode?: string
        quantity: number
    }>
    createdAt?: string | Date
    updatedAt?: string
    userId?: number
    companyId?: number
}
