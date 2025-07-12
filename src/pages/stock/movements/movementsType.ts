export interface Product {
    id: number
    code: string
    name: string
    description: string
    brand: string
    supplier: string
    category: string
    price: number
    stock: number
    location: string
    image?: string
}
export interface KardexEntry {
    date: string
    type: "entrada" | "saida" | "previsao"
    quantity: number
    description: string
    balance: number
}
export interface ContextMenuPosition {
    x: number
    y: number
}
export interface FilterState {
    name: string
    code: string
    brand: string
    description: string
    supplier: string
    category: string
}
 export interface ReportConfig {
    includeCode: boolean
    includeName: boolean
    includeDescription: boolean
    includeBrand: boolean
    includeSupplier: boolean
    includeCategory: boolean
    includePrice: boolean
    includeStock: boolean
    includeLocation: boolean
}