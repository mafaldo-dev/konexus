export interface PlugNotasConfig {
  id?: number;
  company_id: number;
  api_key?: string;
  api_key_masked?: string;
  cnpj: string;
  razao_social?: string;
  ambiente: 'homologacao' | 'producao';
  producao: boolean;
  ativo: boolean;
  
  // Certificado (opcional)
  certificado_pfx?: string;
  senha_certificado?: string;
  validade_certificado?: string;
  status_certificado?: string;
  
  // NFS-e (opcional)
  usuario_prefeitura?: string;
  senha_prefeitura?: string;
  
  // Regime
  regime_tributario: '1' | '2' | '3';
  
  created_at?: string;
  updated_at?: string;
}