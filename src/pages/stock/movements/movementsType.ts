
import { Movement, Products } from "../../../service/interfaces";

export interface FilterState {
    name: string;
    code: string;
    brand: string;
    description: string;
    supplier: string;
    category: string;
}

export interface ReportConfig {
    includeCode: boolean;
    includeName: boolean;
    includeDescription: boolean;
    includeBrand: boolean;
    includeSupplier: boolean;
    includeCategory: boolean;
    includePrice: boolean;
    includeStock: boolean;
    includeLocation: boolean;
}

export interface ContextMenuPosition {
    x: number;
    y: number;
}

export interface ContextMenuState {
    show: boolean;
    position: ContextMenuPosition;
    product: Products | null;
}

