/**
 * pages/configurations/audit/format.ts
 * Traducao dos eventos de auditoria para linguagem de negocio.
 *
 * O objetivo e que o usuario final leia o historico sem jargao tecnico:
 * quem estava na sessao, em qual estacao, o que tentou fazer, se a identidade
 * foi confirmada e qual foi o resultado.
 */

import { AuditEvent } from "../../../services/auditService";

/**
 * Campos minimos de um evento para a descricao em linguagem de negocio.
 * Permite reutilizar o mesmo texto na tela da empresa e no painel global.
 */
export interface DescribableAuditEvent {
  action: string;
  outcome: string;
  reauth_outcome: string | null;
  entity_type: string | null;
  entity_id: string | null;
  module_key: string | null;
  username: string | null;
  station_name: string | null;
  created_at: string;
}

const ACTION_VERBS: Record<string, string> = {
  create: "cadastrar",
  update: "alterar",
  delete: "excluir",
  update_status: "alterar o status de",
  update_stock: "alterar o estoque de",
  cancel: "cancelar",
  approve: "dar baixa em",
  issue: "emitir",
  configure: "configurar",
  test_config: "testar a configuração de",
  reset_password: "redefinir a senha de",
  change_password: "alterar a senha de",
  revoke: "revogar",
  upload_logo: "enviar a logomarca de",
  delete_logo: "remover a logomarca de",
  read: "marcar como lido em",
  reauth: "confirmar a identidade para",
  login: "entrar no sistema",
  logout: "sair do sistema",
};

const ENTITY_LABELS: Record<string, string> = {
  order: "o pedido de venda",
  purchase_order: "o pedido de compra",
  product: "o produto",
  customer: "o cliente",
  supplier: "o fornecedor",
  payment: "o pagamento",
  payment_account: "a conta a pagar",
  stock_movement: "a movimentação de estoque",
  employee: "o colaborador",
  collaborator: "o colaborador",
  collaborator_permissions: "as permissões do colaborador",
  role: "o cargo",
  invoice: "a nota de entrada",
  service_order: "a ordem de serviço",
  nfe: "a nota fiscal",
  company: "a empresa",
  work_station: "a estação de trabalho",
  work_station_token: "o acesso da estação",
  plugnotas_config: "a configuração fiscal",
  commercial_authorization: "a autorização comercial",
  support_contract: "o contrato de suporte",
  plan: "o plano",
  plan_module: "a composição do plano",
  subscription: "a assinatura",
  company_extra_module: "a contratação de módulo",
  company_logo: "a logomarca",
  message: "a mensagem",
};

const MODULE_LABELS: Record<string, string> = {
  vendas: "Vendas",
  compras: "Compras",
  estoque: "Estoque",
  finance: "Financeiro",
  gestao: "Gestão",
  rh: "RH",
  crm: "CRM",
  nfe: "NF-e",
  audit: "Auditoria",
};

export function formatDateTime(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR");
}

export function getActionLabel(action: string): string {
  return ACTION_VERBS[action] || action;
}

export function getEntityLabel(entityType?: string | null): string {
  if (!entityType) return "o registro";
  return ENTITY_LABELS[entityType] || entityType;
}

export function getModuleLabel(moduleKey?: string | null): string {
  if (!moduleKey) return "Sistema";
  return MODULE_LABELS[moduleKey] || moduleKey;
}

export function getOutcomeLabel(outcome: string): string {
  switch (outcome) {
    case "success":
      return "Concluída";
    case "denied":
      return "Não autorizada";
    case "failed":
      return "Falhou";
    case "cancelled":
      return "Cancelada";
    default:
      return "Em andamento";
  }
}

export function getReauthLabel(reauthOutcome?: string | null): string {
  switch (reauthOutcome) {
    case "valid":
      return "Identidade confirmada";
    case "invalid":
      return "Senha não validada";
    case "expired":
      return "Confirmação expirada";
    case "reused":
      return "Confirmação já utilizada";
    case "not_attempted":
      return "Identidade não confirmada";
    case "cancelled":
      return "Confirmação cancelada";
    default:
      return "Não exigida";
  }
}

/**
 * Texto em linguagem de negocio do evento.
 */
export function describeAuditEvent(event: DescribableAuditEvent): string {
  const when = formatDateTime(event.created_at);
  const who = event.username ? `a sessão de ${event.username}` : "uma sessão";
  const where = event.station_name
    ? `, na estação ${event.station_name}`
    : ", em uma estação não identificada";
  const target = event.entity_id ? ` nº ${event.entity_id}` : "";

  if (event.action === "login") {
    return `Às ${when}, ${who}${where} entrou no sistema.`;
  }

  if (event.action === "logout") {
    return `Às ${when}, ${who}${where} saiu do sistema.`;
  }

  if (event.action === "reauth") {
    const confirmed = event.reauth_outcome === "valid";
    return `Às ${when}, ${who}${where} tentou confirmar a identidade${
      confirmed ? " e a senha foi validada" : " e a senha informada não foi validada"
    }.`;
  }

  const verb = getActionLabel(event.action);
  const entity = getEntityLabel(event.entity_type);
  const attempt = `tentou ${verb} ${entity}${target}`;

  let outcome = "A operação foi concluída.";
  if (event.outcome === "denied") {
    switch (event.reauth_outcome) {
      case "invalid":
        outcome =
          "A senha informada não foi validada e a alteração não foi executada.";
        break;
      case "not_attempted":
        outcome =
          "A operação foi bloqueada porque a identidade não foi confirmada.";
        break;
      case "expired":
        outcome =
          "A confirmação expirou e a alteração não foi executada.";
        break;
      case "reused":
        outcome =
          "A confirmação já havia sido utilizada e a alteração não foi executada.";
        break;
      default:
        outcome = "A operação não foi autorizada e nada foi alterado.";
    }
  } else if (event.outcome === "failed") {
    outcome = "A operação falhou e não foi concluída.";
  } else if (event.outcome === "cancelled") {
    outcome = "A operação foi cancelada e nada foi alterado.";
  }

  return `Às ${when}, ${who}${where} ${attempt}. ${outcome}`;
}

export interface AuditFilterOption {
  value: string;
  label: string;
}

/**
 * Opcoes de filtro derivadas dos proprios eventos (nao ha modulo ou acao
 * inexistente na lista).
 */
export function deriveFilterOptions(events: AuditEvent[]): {
  modules: AuditFilterOption[];
  actions: AuditFilterOption[];
  stations: AuditFilterOption[];
  users: AuditFilterOption[];
} {
  const modules = new Map<string, string>();
  const actions = new Map<string, string>();
  const stations = new Map<string, string>();
  const users = new Map<string, string>();

  for (const event of events) {
    if (event.module_key) {
      modules.set(event.module_key, getModuleLabel(event.module_key));
    }
    if (event.action) {
      actions.set(event.action, getActionLabel(event.action));
    }
    if (event.station_id && event.station_name) {
      stations.set(String(event.station_id), event.station_name);
    }
    if (event.user_id && event.username) {
      users.set(String(event.user_id), event.username);
    }
  }

  const toOptions = (map: Map<string, string>): AuditFilterOption[] =>
    Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));

  return {
    modules: toOptions(modules),
    actions: toOptions(actions),
    stations: toOptions(stations),
    users: toOptions(users),
  };
}
