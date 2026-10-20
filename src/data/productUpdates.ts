/**
 * Histórico de novidades funcionais do Konexus.
 *
 * Esta é a fonte de dados da seção "Últimas atualizações" exibida no painel
 * administrativo. Ela é curada: cada registro descreve uma mudança que
 * realmente foi entregue ao cliente, em linguagem simples, identificada pelo
 * módulo e pela versão em que entrou.
 *
 * Regras de curadoria:
 *  - nada de vocabulário de desenvolvimento (refatoração, endpoint, schema,
 *    hook, tipagem, pipeline de CI, dependências...);
 *  - a descrição explica o que mudou e qual o benefício para o usuário;
 *  - a versão e a data correspondem à versão efetivamente disponibilizada
 *    (histórico de `src/version.ts` do repositório);
 *  - módulos extras (CRM, NF-e, Contábil) só aparecem para empresas que têm a
 *    contratação ativa e permissões sobre o módulo;
 *  - registros sem evidência funcional suficiente não são publicados.
 *
 * O histórico técnico original (mensagens de commit, correções internas e
 * ajustes de build) permanece em `docs/HISTORICO_VERSOES.md` para auditoria.
 */

export type ProductUpdateModuleKey =
  | "gestao"
  | "vendas"
  | "compras"
  | "estoque"
  | "rh"
  | "finance"
  | "crm"
  | "nfe";

export type ProductUpdateVisibility = "standard" | "contract";

export interface ProductUpdate {
  id: string;
  /** Módulo do sistema (mesma chave usada pelo backend). */
  module: ProductUpdateModuleKey;
  /** Versão em que a novidade foi disponibilizada. */
  version: string;
  /** Título curto da novidade. */
  title: string;
  /** Descrição funcional, em linguagem simples. */
  description: string;
  /** Data de disponibilização da versão (ISO). */
  releasedAt: string;
  /**
   * "standard": módulo do freemium, a novidade é sempre exibida.
   * "contract": módulo extra, só aparece para empresa que o contratou.
   */
  visibility: ProductUpdateVisibility;
  /** Estado de publicação do registro. */
  status: "published";
  /** Origem da evidência (auditoria). Não é exibida ao usuário. */
  evidence: string;
}

export const UPDATE_MODULE_LABELS: Record<ProductUpdateModuleKey, string> = {
  gestao: "Gestão",
  vendas: "Vendas",
  compras: "Compras",
  estoque: "Estoque",
  rh: "RH",
  finance: "Financeiro",
  crm: "CRM",
  nfe: "NF-e",
};

/**
 * Novidades do produto, da mais recente para a mais antiga.
 */
export const PRODUCT_UPDATES: ProductUpdate[] = [
  {
    id: "1.3.2-conferencia-com-senha",
    module: "vendas",
    version: "1.3.2",
    title: "Conferência de pedido com confirmação de senha",
    description:
      "A liberação do pedido de venda agora pede a senha do usuário logado. O registro guarda quem liberou, o conferente, o separador, o peso e os volumes, e aparece na listagem de pedidos.",
    releasedAt: "2026-10-20",
    visibility: "standard",
    status: "published",
    evidence: "Release 1.3.2 (conferência final com reautenticação e rastro no pedido)",
  },
  {
    id: "1.2.11-actualizacao-instalador",
    module: "gestao",
    version: "1.2.11",
    title: "Atualização do aplicativo com o instalador correto",
    description:
      "A tela de login baixa a nova versão direto do Konexus, mostra o progresso do download e permite reiniciar o programa para aplicar a atualização.",
    releasedAt: "2026-10-20",
    visibility: "standard",
    status: "published",
    evidence: "Release 1.2.11 (fluxo de atualização e instalador publicado)",
  },
  {
    id: "1.2.3-atualizacao-automatica",
    module: "gestao",
    version: "1.2.3",
    title: "Atualização automática do aplicativo",
    description:
      "O Konexus passa a baixar sozinho a nova versão, sem precisar abrir a página da release no navegador.",
    releasedAt: "2026-10-20",
    visibility: "standard",
    status: "published",
    evidence: "Release 1.2.3 (download automático de atualização)",
  },
  {
    id: "1.2.1-colaboradores-permissoes",
    module: "gestao",
    version: "1.2.1",
    title: "Nova tela de colaboradores",
    description:
      "Cada pessoa passa a ter um cargo, um setor e somente as permissões que realmente usa, com a opção de liberar ou bloquear cada ação.",
    releasedAt: "2026-10-20",
    visibility: "standard",
    status: "published",
    evidence: "Release 1.2.1 (colaboradores, cargos e permissões por módulo/ação)",
  },
  {
    id: "1.2.1-seguranca-contas",
    module: "gestao",
    version: "1.2.1",
    title: "Mais segurança no acesso das contas",
    description:
      "A troca de senha passa a ser obrigatória na primeira entrada e encerrar um colaborador invalida o acesso dele imediatamente.",
    releasedAt: "2026-10-20",
    visibility: "standard",
    status: "published",
    evidence: "Release 1.2.1 (troca de senha e revogação de sessão)",
  },
  {
    id: "1.2.1-planos-modulos",
    module: "gestao",
    version: "1.2.1",
    title: "Tela de planos e módulos",
    description:
      "Você passa a ver em uma única tela o que já está incluído na sua empresa e quais módulos extras ainda pode contratar com o suporte.",
    releasedAt: "2026-10-20",
    visibility: "standard",
    status: "published",
    evidence: "Release 1.2.1 (tela comercial de planos e módulos)",
  },
  {
    id: "1.2.0-varias-empresas",
    module: "gestao",
    version: "1.2.0",
    title: "Mais de uma empresa no mesmo sistema",
    description:
      "O Konexus passa a atender várias empresas ao mesmo tempo, cada uma com seus próprios dados, usuários e permissões.",
    releasedAt: "2026-10-19",
    visibility: "standard",
    status: "published",
    evidence: "Release 1.2.0 (consolidação multiempresa)",
  },
  {
    id: "1.1.10-modulo-crm",
    module: "crm",
    version: "1.1.10",
    title: "Novo módulo de CRM",
    description:
      "Chegou o CRM com cadastro de clientes, histórico de negócios e visão do funil de vendas da sua empresa.",
    releasedAt: "2025-12-15",
    visibility: "contract",
    status: "published",
    evidence: "Release 1.1.10 (novo módulo de CRM)",
  },
  {
    id: "1.1.9-orcamentos-compra",
    module: "compras",
    version: "1.1.9",
    title: "Orçamentos de compra mais simples",
    description:
      "A tela de orçamentos de compra foi reformulada para facilitar a busca e o acompanhamento dos pedidos em andamento.",
    releasedAt: "2025-12-10",
    visibility: "standard",
    status: "published",
    evidence: "Release 1.1.9 (reformulação dos orçamentos de compra)",
  },
  {
    id: "1.1.9-configuracao-plugnotas",
    module: "nfe",
    version: "1.1.9",
    title: "Configuração da emissão de notas fiscais",
    description:
      "Adicionada a tela de configuração do PlugNotas, com o cadastro do certificado e dos dados da prefeitura da sua empresa.",
    releasedAt: "2025-12-10",
    visibility: "contract",
    status: "published",
    evidence: "Release 1.1.9 (tela de configuração do PlugNotas)",
  },
  {
    id: "1.1.8-contas-financeiras",
    module: "finance",
    version: "1.1.8",
    title: "Contas a pagar e a receber",
    description:
      "Adicionadas as telas de contas a pagar, contas a receber e contas da empresa, com filtros, indicadores e relatórios para acompanhar os pagamentos.",
    releasedAt: "2025-12-01",
    visibility: "standard",
    status: "published",
    evidence: "Release 1.1.8 (contas a pagar, contas a receber e contas da empresa)",
  },
  {
    id: "1.1.5-chat-interno",
    module: "gestao",
    version: "1.1.5",
    title: "Chat interno da empresa",
    description:
      "Adicionado o chat para conversar com outras áreas em tempo real e acompanhar quem está online.",
    releasedAt: "2025-11-19",
    visibility: "standard",
    status: "published",
    evidence: "Release 1.1.5 (chat interno em tempo real)",
  },
  {
    id: "1.1.5-cadastro-colaboradores",
    module: "rh",
    version: "1.1.5",
    title: "Cadastro de colaboradores corrigido",
    description:
      "Corrigido o cadastro de colaboradores do RH, que passa a gravar os dados corretamente ao salvar.",
    releasedAt: "2025-11-19",
    visibility: "standard",
    status: "published",
    evidence: "Release 1.1.5 (correções no cadastro de colaboradores)",
  },
  {
    id: "1.0.8-cadastro-produtos",
    module: "gestao",
    version: "1.0.8",
    title: "Cadastro de produtos mais rápido",
    description:
      "Reformulamos o cadastro de produtos, clientes e fornecedores para deixar a busca e a edição mais rápidas e sem travamentos.",
    releasedAt: "2025-10-25",
    visibility: "standard",
    status: "published",
    evidence: "Release 1.0.8 (reformulação dos cadastros de Gestão)",
  },
  {
    id: "1.0.7-ordens-servico",
    module: "gestao",
    version: "1.0.7",
    title: "Ordens de serviço",
    description:
      "Criado o módulo de ordens de serviço para registrar, acompanhar e imprimir os pedidos de serviço da empresa.",
    releasedAt: "2025-10-23",
    visibility: "standard",
    status: "published",
    evidence: "Release 1.0.7 (módulo de ordens de serviço)",
  },
  {
    id: "1.0.7-etiquetas-pedido",
    module: "vendas",
    version: "1.0.7",
    title: "Etiquetas de pedido de venda",
    description:
      "As etiquetas dos pedidos de venda e dos produtos ficaram disponíveis para baixar ou imprimir direto, com código de barras e localização da peça.",
    releasedAt: "2025-10-23",
    visibility: "standard",
    status: "published",
    evidence: "Release 1.0.7 (etiquetas de pedido e de produto)",
  },
  {
    id: "1.0.6-conferencia-estoque",
    module: "estoque",
    version: "1.0.6",
    title: "Conferência de estoque em PDF",
    description:
      "Adicionado o relatório de conferência de estoque para baixar ou imprimir, e corrigida a visualização do inventário e do histórico de movimentação por produto.",
    releasedAt: "2025-10-20",
    visibility: "standard",
    status: "published",
    evidence: "Release 1.0.6 (relatório de conferência de estoque)",
  },
  {
    id: "1.0.6-dados-da-empresa",
    module: "gestao",
    version: "1.0.6",
    title: "Dados vindos do servidor da empresa",
    description:
      "O aplicativo passa a buscar produtos, clientes e pedidos direto do servidor da empresa, em vez de usar a base de teste.",
    releasedAt: "2025-10-20",
    visibility: "standard",
    status: "published",
    evidence: "Release 1.0.6 (integração com o servidor da empresa)",
  },
  {
    id: "1.0.4-liberacao-pedidos",
    module: "vendas",
    version: "1.0.4",
    title: "Pedidos de venda passam pelo Financeiro",
    description:
      "O pedido de venda passa a entrar no Financeiro como pendente e só pode ser separado depois da liberação do financeiro.",
    releasedAt: "2025-07-27",
    visibility: "standard",
    status: "published",
    evidence: "Release 1.0.4 (liberação de pedido de venda pelo Financeiro)",
  },
  {
    id: "1.0.4-organizacao-financeira",
    module: "finance",
    version: "1.0.4",
    title: "Organização das telas do Financeiro",
    description:
      "As telas de movimentações, fluxo de caixa e relatórios do Financeiro foram reorganizadas para facilitar a consulta do dia a dia.",
    releasedAt: "2025-07-27",
    visibility: "standard",
    status: "published",
    evidence: "Release 1.0.4 (reorganização das abas do Financeiro)",
  },
];

export type ProductUpdateFilterKey = ProductUpdateModuleKey | "all";

export interface ProductUpdateFilter {
  key: ProductUpdateFilterKey;
  label: string;
}

export interface ProductUpdateVisibilityContext {
  /** Módulos disponíveis para a empresa (calculado pelo backend). */
  availableModules: string[];
  /** Permissões efetivas do colaborador. */
  permissions?: Array<{ moduleKey: string; actions: string[] }>;
  /** Administrador da empresa: tem todas as ações dos módulos disponíveis. */
  isCompanyAdmin?: boolean;
}

function hasModulePermission(
  context: ProductUpdateVisibilityContext,
  moduleKey: string
): boolean {
  if (context.isCompanyAdmin) return true;
  const permissions = context.permissions || [];
  return permissions.some(
    (group) =>
      group.moduleKey === moduleKey &&
      Array.isArray(group.actions) &&
      group.actions.includes("view")
  );
}

/**
 * Novidades que a empresa atual pode ver.
 *
 * - Módulos do freemium: basta o módulo estar disponível para a empresa.
 * - Módulos extras: precisam de contratação ativa e de permissão do usuário.
 */
export function getVisibleProductUpdates(
  updates: ProductUpdate[] = PRODUCT_UPDATES,
  context: ProductUpdateVisibilityContext = { availableModules: [] }
): ProductUpdate[] {
  const available = new Set(context.availableModules || []);

  return updates
    .filter((update) => update.status === "published")
    .filter((update) => available.has(update.module))
    .filter(
      (update) =>
        update.visibility === "standard" ||
        hasModulePermission(context, update.module)
    )
    .sort((a, b) => {
      if (a.releasedAt !== b.releasedAt) {
        return a.releasedAt < b.releasedAt ? 1 : -1;
      }
      return a.version === b.version
        ? a.id.localeCompare(b.id)
        : a.version < b.version
          ? 1
          : -1;
    });
}

/**
 * Filtros de módulo derivados das novidades visíveis. Só aparecem módulos que
 * realmente têm novidades publicadas.
 */
export function getProductUpdateFilters(
  updates: ProductUpdate[] = PRODUCT_UPDATES
): ProductUpdateFilter[] {
  const modules = Array.from(new Set(updates.map((update) => update.module)));

  return [
    { key: "all" as ProductUpdateFilterKey, label: "Todos os módulos" },
    ...modules.map((module) => ({
      key: module as ProductUpdateFilterKey,
      label: UPDATE_MODULE_LABELS[module],
    })),
  ];
}

/**
 * Filtra as novidades por módulo, sem recarregar a página.
 */
export function filterProductUpdates(
  updates: ProductUpdate[],
  moduleKey: ProductUpdateFilterKey
): ProductUpdate[] {
  if (moduleKey === "all") return updates;
  return updates.filter((update) => update.module === moduleKey);
}

/**
 * Formata a data no padrão brasileiro. Datas inválidas não são exibidas.
 */
export function formatProductUpdateDate(releasedAt: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(releasedAt || "");
  if (!match) return "";
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}
