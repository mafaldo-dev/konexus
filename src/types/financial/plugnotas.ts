export interface PlugNotasConfig {
  id?: number;
  config_id?: number;
  company_id: number;
  api_key: string;
  api_key_masked?: string;
  cnpj?: string;
  razao_social?: string;
  ambiente: string;
  producao: boolean;
  ativo: boolean;

  // Certificado (opcional)
  certificado_pfx?: string | null;
  senha_certificado?: string | null;
  validade_certificado?: string | null;
  status_certificado?: string;

  // NFS-e (opcional)
  usuario_prefeitura?: string | null;
  senha_prefeitura?: string | null;

  // Regime
  regime_tributario?: string;

  created_at?: string;
  updated_at?: string;
}
