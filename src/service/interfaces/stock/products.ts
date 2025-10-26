export interface Products {
  // --- Dados Gerais do Produto ---
  id: number | any;
  name: string; // Nome do produto *OBRIGATÓRIO NF-e*
  code: string; // Código interno da empresa
  description: string; // Descrição do produto
  price: number; // Preço de venda
  coast: number; // Custo de aquisição
  stock: number; // Estoque atual
  location: string; // Localização no estoque
  minimum_stock: number; // Estoque mínimo
  brand: string; // Marca
  supplier_id: number | any; // ID do fornecedor
  category: string; // Categoria
  companyId: number; // ID da empresa
  created_at?: string | Date;
  updated_at?: string | Date;
  quantity?: number | any; // Usado em operações

  // --- Identificação Fiscal (OBRIGATÓRIOS para NF-e) ---
  ncm: string; // *OBRIGATÓRIO* - 8 dígitos
  cfop: string; // *OBRIGATÓRIO* - CFOP padrão (pode ser alterado na operação)
  unidade: string; // *OBRIGATÓRIO* - Unidade comercial (UN, CX, KG, etc)
  origem: number; // *OBRIGATÓRIO* - Origem da mercadoria (0 a 8)

  // --- Códigos de Barras ---
  ean?: string; // EAN/GTIN - Código de barras padrão (13 dígitos)
  codigo_barras?: string; // Código de barras interno da empresa
  
  // --- Classificação Fiscal Adicional ---
  cest?: string; // Código Especificador ST (7 dígitos) - obrigatório para alguns produtos

  // --- CSTs Padrão (Códigos de Situação Tributária) ---
  // Estes são os CSTs "padrão" do produto, mas podem ser alterados na operação
  cst_icms?: string; // CST/CSOSN do ICMS (ex: "00", "20", "101", etc)
  cst_pis?: string; // CST do PIS (ex: "01", "04", "49", etc)
  cst_cofins?: string; // CST do COFINS (ex: "01", "04", "49", etc)
  cst_ipi?: string; // CST do IPI (ex: "00", "49", "99", etc)

  // --- Alíquotas Padrão (%) ---
  // Usadas como base, mas podem variar por estado/operação
  aliquota_icms?: number; // Alíquota padrão do ICMS (%)
  aliquota_pis?: number; // Alíquota padrão do PIS (%)
  aliquota_cofins?: number; // Alíquota padrão do COFINS (%)
  aliquota_ipi?: number; // Alíquota padrão do IPI (%)

  // --- Informações Complementares ---
  codigo_beneficio_fiscal?: string; // Código de benefício fiscal (quando aplicável)
  cnpj_fabricante?: string; // CNPJ do fabricante (obrigatório para alguns casos)
  informacoes_adicionais?: string; // Informações adicionais do produto
}