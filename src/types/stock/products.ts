/**
 * src/types/stock/products.ts
 * Interface de produtos.
 */

export interface Products {
  id: number | any;
  name: string;
  code: string;
  description: string;
  price: number;
  coast: number;
  stock: number;
  location: string;
  minimum_stock: number;
  brand: string;
  supplier_id: number | any;
  category: string;
  companyId: number;
  created_at?: string | Date;
  updated_at?: string | Date;
  quantity?: number | any;

  // Identificação Fiscal
  ncm?: string;
  cfop?: string;
  unidade?: string;
  origem?: number | string;

  // Códigos de Barras
  ean?: string;
  codigo_barras?: string;

  // Classificação Fiscal Adicional
  cest?: string;

  // CSTs
  cst_icms?: string;
  cst_pis?: string;
  cst_cofins?: string;
  cst_ipi?: string;

  // Alíquotas
  aliquota_icms?: number;
  aliquota_pis?: number;
  aliquota_cofins?: number;
  aliquota_ipi?: number;

  // Complementares
  codigo_beneficio_fiscal?: string;
  cnpj_fabricante?: string;
  informacoes_adicionais?: string;
}
