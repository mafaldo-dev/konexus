/**
 * services/index.ts
 * Barrel de exportacao dos servicos de dominio do Konexus ERP.
 * Centraliza o acesso aos servicos para evitar imports dispersos e quebrados.
 */

export * from "./authService";
export * from "./companyService";
export * from "./productService";
export * from "./customerService";
export * from "./supplierService";
export * from "./employeeService";
export * from "./orderService";
export * from "./purchaseService";
export * from "./invoiceService";
export * from "./kardexService";
export * from "./serviceOrderService";
export * from "./financialService";
export * from "./nfeService";
export * from "./plugnotasService";
export * from "./messageService";
export * from "./reportService";
export * from "./systemAdminService";
export * from "./collaboratorService";
export * from "./mockDataService";

export {
  apiClient,
  apiRequest,
  apiRequestBlob,
} from "../api/client";
export type { ApiResponse } from "../api/client";
