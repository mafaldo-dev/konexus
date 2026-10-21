# Auditoria técnica Konexus — 21/10/2026

## Diagnóstico inicial (antes das alterações)

Escopo encontrado: dois repositórios limpos, `konexus` e `../konexus-back`.
React **19**, TypeScript, CRA; Electron 39; Express 5, `pg`, SQL direto.
Não foi acessado o banco configurado em `.env`, nem serviços fiscais/produção.

### Mapa de módulos e dependências

| Módulo | Interface | API montada | Entidades / fluxo crítico |
|---|---|---|---|
| Autenticação | AuthContext, services/authService | /login, /collaborators | contributor, Administrator, user_sessions; login/senha/logout |
| Empresas/RH | configurations, RH | /admin, /employees, /collaborators | companies, cargos, permissões, colaboradores |
| Comercial | planos, system-admin | /subscription, /admin/system | modules, installation_modules, company_extra_modules, assinaturas |
| Cadastros | manager | /products, /customers, /suppliers | produtos, clientes, fornecedores, endereços |
| Vendas | sales/orders | /orders | pedidos, OrderItems, pagamentos, conferência, estoque |
| Compras | _shopping | /purchase, /invoice | pedidos, itens, fornecedores, recebimentos |
| Estoque | stock | /kardex | produtos/saldo, movimentos |
| Financeiro | Financial | /payments, /payment | contas, pagamentos, análise/liberação |
| Contabilidade | Financial/accounting | /accounting | contas, lançamentos/partidas, períodos, ativos, relatórios |
| CRM | CRM | clientes via /customers | negócios mantidos em estado React; persistência não comprovada |
| Fiscal | Financial/nfe-list | /nfe, /plugnotas | notas, configuração PlugNotas; emissão externa |
| Serviços/chat | ServiceOrder, ChatContext | /service, /message | ordens de serviço, mensagens, Socket.IO |
| Auditoria | configurations/audit, stations | /audit | audit_events, work_stations, tokens, reauth_grants |

Fontes canônicas das rotas: `src/routes/AppRoutes.tsx` (frontend),
`../konexus-back/src/http/routes/index.js` e seus routers (backend).
Matriz de mutações: `../konexus-back/src/http/routes/protectedOperations.js`.
Repositórios SQL: `../konexus-back/src/domain/repositories`; migrações em `migrations`.

### Fluxos e estruturas existentes

- UI → services → api/client → Express → auth/permissions → controller → service → repository → PostgreSQL.
- JWT com sid e versão sv; autenticação recarrega colaborador/permissões/empresa.
  Interface restaura localStorage sem confirmar validade; 401 limpa storage, não o contexto React.
- Reautenticação: 403 REAUTH_REQUIRED → modal → /audit/reauth → grant único,
  vinculado à sessão/empresa/ação/recurso/conteúdo → repetição da requisição.
- Sessões: user_sessions, created_at/last_seen_at/ended_at/end_reason TIMESTAMPTZ.
  Logout grava encerramento, mas authMiddleware não o verifica.
- Auditoria: audit_events com trigger append-only e JSON de changes; histórico
  preservado. Hook `finish` usa recordSafe e não garante atomicidade com mutação.
- Estações: work_stations por empresa + código de pareamento; sem UUID persistente Electron.
- Electron: main.js, updateAssets.js; updater valida asset/SHA-512, mantém estado;
  renderer acessa require/ipcRenderer; userData ainda não contém identidade.
- Logs técnicos: console backend, electron-log atualizador. Logs de segurança e
  negócio compartilham audit_events; não há garantia de cobertura integral.
- Configuração: frontend api/config; backend config/env/database; não copiar segredos
  de `.env` para relatórios. Scripts dist publicam: não executar.

### Achados priorizados

| Gravidade | Evidência | Ação |
|---|---|---|
| Crítica | Electron nodeIntegration=true, contextIsolation=false, webSecurity=false | preload restrito e proteções padrão |
| Alta | authMiddleware ignora encerramento de user_sessions | validar sid/empresa/usuário antes das operações |
| Alta | AuthService ignora erro ao persistir sessão/logout | falhar fechado; resultado real |
| Alta | hook de auditoria após commit/resposta | pendência estrutural: integrar cada transação de negócio |
| Alta | kardexService lê/grava saldo sem transação | transação e bloqueio da linha do produto |
| Alta | vendas aceitam total/status cliente e agendam NF-e dentro da transação | revisar regras; não testar contra provedor real |
| Alta | stationContext resolve pareamento antes da identidade sem restringir empresa | restringir ao contexto autenticado |
| Média | cliente 401 não atualiza AuthContext; blob interpretado como texto | corrigir cliente e testar regressão |
| Média | CRM possui negócios apenas em estado local | não aprovar persistência |
| Média | ausência UUID, heartbeat e painel de sessões | evolução aditiva reutilizando estações/sessões |

### Plano

1. Correções de sessão/isolamento e estoque; regressões automatizadas isoladas.
2. Identidade Electron em userData e IPC controlado, sem hardware fingerprint.
3. Migração aditiva: instalações globais + associação em work_stations + metadados
   por empresa; expiração/comunicação/atividade separados nas sessões.
4. APIs autenticadas, heartbeat sem renovação JWT, painel paginado.
5. Builds/testes locais; matriz estática de cobertura com limitações explícitas.
6. Documentar pendências transacionais, validações PostgreSQL/Windows e operação.

Este inventário não é aprovação E2E dos módulos. Resultados executados serão
registrados ao final; números de auditorias antigas no README não são evidência atual.
