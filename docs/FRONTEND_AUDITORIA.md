# Auditoria Completa do Frontend - Konexus ERP

> Documento obrigatório da Fase 1 da refatoração do frontend.
> Fonte de verdade: código-fonte em `/home/dev/projects/ERP/konexus` (pasta externa rastreada pelo git).
> Data: 18/10/2026
>
> OBS: existe uma cópia duplicada e não rastreada em `konexus/konexus/` (mostrada pelo git como `?? konexus/`). Ela não é o source of truth e não foi considerada na auditoria.

---

## 1. Estrutura atual do frontend

### Stack tecnológica
| Item | Versão / Observação |
|------|---------------------|
| Framework | React 19.0.0 |
| Linguagem | TypeScript 4.9.5 |
| Build / bundler | Create React App (`react-scripts` 5.0.1) — Webpack |
| Roteamento | `react-router-dom` 7.2.0 (usando `HashRouter`) |
| Estilização | Tailwind CSS 3.4.14 + CSS global (`src/global.css`) |
| Formulários | `react-hook-form` 7.54.2 |
| Validação de schema | NÃO há (zod/yup ausentes) |
| Notificações | `react-toastify` 11.0.5 + `sweetalert2` 11.22.0 |
| Cliente HTTP | `fetch` nativo via `src/service/api/api.ts` (não há axios) |
| Sockets / tempo real | `socket.io-client` 4.8.1 (`ChatContext`) |
| Ícones | `lucide-react`, `react-icons` |
| Tabelas / gráficos | `recharts`, `xlsx`, `jspdf`, `jspdf-autotable`, `html2pdf.js` |
| Desktop | Electron 39.2.6 (`electron/main.js`, `electron/paths.js`) |
| Testes | NÃO EXISTEM (nenhum `*.test.*`, `*.spec.*` ou `__tests__`) |
| Lint | ESLint apenas `extends: react-app` (sem regras customizadas) |
| Variáveis de ambiente | NÃO há `.env` nem `.env.example` (URL da API hardcoded) |

### Ponto de entrada
- `src/index.tsx` — `HashRouter` > `AuthProvider` > `App`.
- `src/App.tsx` — providers (Network, SystemStatus, ErrorBoundary, Chat, Toast) + `AppRoutes`.
- `src/routes/AppRoutes.tsx` — todas as rotas da aplicação, protegidas por `DesignationCheck` (PermissionCheck).

### Autenticação e sessão
- `src/AuthContext.tsx` — gerencia `user`, `company`, `token`, `modules`, `loading` em `localStorage` (`userData`, `companyData`, `token`, `companyModules`).
- Login via `src/service/api/login` (`handleLoginAdmin`, `handleLoginEmployee`) para `POST /login/auth` e `POST /employees/auth-employee`.
- **Falha grave:** o "login administrador do sistema" (atalho F1 no `src/login/index.tsx`, função `handleAdminLg`) chama `handleLoginAdmin` diretamente e grava o token no `localStorage`, mas **não invoca `AuthContext.login`**. Resultado: `useAuth()` continua com `user`/`token` nulos após esse login (sessão não estabelecida no contexto).
- `LoginForm` também navega para `/loginAdmin` (rota que NÃO existe em `AppRoutes` → cai em `NotFound`).

### Rotas registradas (`AppRoutes.tsx`)
Login; vendas (`/sales/orders`, `/sales/order-list`, `/sales/newOrder`, `/sales/orders/edit/:id`, `/sales/completed`, `/sales/goals`, `/sales/comissions`, `/sales/reports`); gerenciamento (`/manager/products`, `/manager/customer`, `/manager/suppliers`, `/manager/categories`, `/manager/services`); compras (`/shopping/purchase-order`, `/shopping/purchase-requisition`, `/shopping/invoice-entry`); financeiro (`/financer/financial`, `/financial/order-nfe`); RH (`/rh/employee`, `/rh/infos`); estoque (`/stock/inventory`); dashboard (`/dashboard`); CRM (`/crm`); configurações (`/config/users-permissions`, `/config/security-area`, `/config/notifications`, `/config/system`); `* → NotFound`.

### Módulos e páginas identificados
| Módulo | Páginas / pastas em `src/pages` |
|--------|---------------------------------|
| Vendas | `sales/orders/` (purchase-order, create-order, editOrderPage, orders-list, OrderForm, confereceModal), `sales/completed/`, `sales/goals/`, `sales/reports/` |
| Gerenciamento | `manager/Products/`, `manager/Customers/`, `manager/Suppliers/`, `manager/categories/` |
| Compras | `_shopping/purchase-requisition/`, `_shopping/entry-notes/`, `_shopping/_quotes/`, `_shopping/returns/` |
| Financeiro | `Financial/` (index, nfe-list, paymentAccounts, service/financialService.ts) |
| RH | `RH/employees/`, `RH/positions&salaries/`, `RH/commissions/` |
| Estoque | `stock/inventory/`, `stock/movements/` (KardexModal, LocationModal, ContextMenu) |
| Serviços (OS) | `ServiceOrder/` (index, createOS, parseItensOrder, NotificationBagde) |
| CRM | `CRM/index.tsx` |
| Configurações | `configurations/security/`, `configurations/notifications/`, `configurations/users&permissions/`, `configurations/system/plugnotasConfig.tsx`, `configurations/parametersOfSystem/index.tsx` |
| Outros | `NOT-FOUND/` |

### Layout e navegação
- Layout principal: `src/components/dashboard/Dashboard.tsx` (Sidebar fixa + Header + main).
- Menu: `src/components/dashboard/menu.ts` (`menuItems`) com chaves, títulos, ícones, `to`, `access` e `submenu`.
- `Sidebar.tsx` usa `useAuth().filterMenu(menuItems)` para filtrar por módulo/perfil.
- `PermissionCheck.tsx` (`DesignationCheck`) envolve rotas e retorna `<NotFound />` quando o usuário não tem o papel exigido (oculta a falha de autorização como 404).
- Header com logout, busca (não conectada a API), contador de mensagens (localStorage) e usuário.

### Componentes
- `src/components/dashboard/components/ui/` — Button, Input, Select, Modal, Table, Card, Badge, DatePicker, Avatar, Separator (sistema de mini-design usado principalmente pelo dashboard).
- `src/components/AdminScreen/` — AdministrationScreen (dashboard principal), tabs-component, table-products.
- `src/components/dashboard/ChatComunication/` — chat global.
- Páginas trazem formulários e modais próprios (ex.: `Products/Form-add.tsx`, `Products/modal-edit.tsx`, `Customers/Form-add.tsx`, `Customer/modal-edit.tsx`, `Suppliers/...`).

### Clientes HTTP e integrações com API
- `src/service/api/api.ts` — `apiRequest` (fetch) e `apiRequestBlob`. URL base **hardcoded** `http://localhost:3010/` (sem `.env`). Inclui token Bearer do `localStorage`. Trata 403 (limpa storage e lança erro). Não padroniza formato de resposta (`response.data` vs `response.products` vs `response.orders` varia por serviço). Não envia `companyId` (o backend deriva do JWT — aceitável, mas o frontend não gerencia troca de empresa).
- Serviços por domínio em `src/service/api/Administrador/<domain>/` (auth, products, suppliers, customers, employee, orders, financial, kardex, invoices, purchaseRequests, reports, orderService, configs, opportunities, goals).
- Chamadas diretas a `fetch` em `configs/index.ts` (fallback com URL externa hardcoded `https://backend-oi68.onrender.com`) — mistura `fetch` com `apiRequest`.

---

## 2. Módulos e páginas identificados

Mesmo quadro acima. Total de rotas: ~29. Todas protegidas por `DesignationCheck` exceto login e `*`.

---

## 3. Padrões arquiteturais encontrados

- **SPA com CRA + HashRouter.** Não há separação clara de camadas (services existem, mas páginas chamam serviços diretamente sem hooks padronizados).
- **Auth centralizado em contexto**, consumo disperso (`useAuth()` em páginas e componentes).
- **Rotas protegidas por HOC-like `DesignationCheck`** (role-based, não module-based consistente).
- **UI fragmentada:** componentes `ui/` usados só pelo dashboard; páginas de cadastro usam estilos inline e modais próprios.
- **Estado:** `localStorage` para auth; `localStorage` para mensagens do setor (`sector_messages`); estados locais `useState` nas páginas.
- **Não há** cliente HTTP padronizado com interceptadores, base URL por env, headers de empresa, cancelamento de requisição ou tratamento unificado de erros.

---

## 4. Problemas e inconsistências detectados

### P-01 Chamadas a endpoints que NÃO existem no backend (quebra de contrato)
- `payment/dashboard` → backend tem `payments/dashboard` (plural).
- `payment/fornecedores`, `payment/pagamentos`, `payment/pagamentos/:id/estornar`, `payment/pagamentos/titulo/:id`, `payment/relatorios/*`, `payment/accounts/exportar` → backend não possui essas rotas.
- `products/product/:id` → backend tem `products/:id`.
- `products/:id/location` → backend não possui essa rota.
- `orders/:id/kardex` → backend tem `kardex/orders/:id`.
- `suppliers/code/:code`, `suppliers/search?term=` → backend não possui.
- `employee/:id/status` (chat.ts) → backend tem `employees/:id/status`.
- `/opportunities`, `/goals` → backend não possui essas rotas.

### P-02 Tratamento inconsistente de respostas da API
- Alguns serviços retornam `response.data`, outros `response.products`, `response.suppliers`, `response.orders`, `response.order`, `response.notas`, ou o objeto bruto. Nenhum contrato padronizado.

### P-03 Autenticação admin bypassa o AuthContext
- `handleAdminLg` no `login/index.tsx` grava token no `localStorage` mas não chama `AuthContext.login`, deixando `user`/`token` nulos no React.

### P-04 Rotas do menu que não existem no AppRoutes (levam a NotFound)
- Menu aponta para `/rh/folha` e `/rh/treinamentos` (inexistentes).
- `LoginForm` navega para `/loginAdmin` (inexistente).
- "Alertas de Estoque" aponta para `/shopping/purchase-order` (rota errada, não é tela de alertas).

### P-05 Duplicação de serviços/funções
- `products`: `handleProductWithCode` vs `handleProductWithCodeSilent`; `handlekardexMoviment` vs `getKardexByProduct` (mesma chamada).
- `employee`: `updatedEmployee` está comentado (código morto).
- `financial/paymentAccounts.tsx` mantém funções legacy `getTitulos`/`createTitulo`/etc. marcadas `@deprecated`.

### P-06 Dados simulados (mock) em produção
- `reports/index.ts`: `getPurchaseReports` retorna valores hardcoded via `setTimeout` (mock). `getTopProducts` importa tipo de uma página (acoplamento inverso).

### P-07 URL base da API hardcoded + fallback externo
- `api.ts` usa `http://localhost:3010/` fixo; `configs/index.ts` tenta `https://backend-oi68.onrender.com` como fallback. Não há `.env`.

### P-08 `companyId` não é gerenciado no frontend
- `companyId` vem do JWT (backend) e é armazenado, mas não há troca de empresa ativa, nem invalidação de dados ao mudar contexto, nem envio explícito de `companyId` quando o contrato exigir.

### P-09 DesignationCheck retorna NotFound em vez de 403 informativo
- Falhas de autorização são mascaradas como "página não encontrada".

### P-10 Não há testes de frontend.

---

## 5. Componentes duplicados

- Vários modais de cadastro/edição próprios por página (`Products/Form-add` + `modal-edit`, `Customers/Form-add` + `modal-edit`, `Suppliers/Form-add` + `modal-edit`) — mesmos campos, implementações separadas.
- `KardexModal`, `LocationModal`, `ContextMenu` em `stock/movements` usados por `Products` — reutilização parcial.
- `ui/` (Button, Input, Select, Modal, Table, Card, Badge) subutilizado; páginas não o consomem consistentemente.

---

## 6. Problemas de integração com a API

Ver P-01 e P-02. Além disso:
- Nenhum serviço envia `companyId` nos payloads (backend deriva do token; OK para rotas atuais, mas contratos futuros podem exigir).
- `configs/index.ts` usa `fetch` direto com fallback externo, ignorando `apiRequest` e seus headers de auth padronizados.
- `updatePaymentStatus` (payments.ts) faz `response.data.data` (duplo `.data`) — frágil.
- `markAsPaid` faz `response.data` enquanto `updatePaymentStatus` faz `response.data.data` para a mesma rota `payments/:id/status` — inconsistência entre serviços de mesmo domínio.

---

## 7. Problemas de navegação e permissões

Ver P-04 e P-09. Além disso:
- `DesignationCheck` valida apenas `user.role`, não combina com módulos (`modules`) de forma consistente com o menu.
- Não há `ProtectedRoute` que redirecione para login quando `!user`; retorna `NotFound` (esconde sessão expirada).

---

## 8. Funcionalidades incompletas

- Cadastro de empresas (`AdminSetupModal` no login) funciona mas fica escondido atrás do atalho F1 e não estabelece sessão no AuthContext.
- Relatórios (`reports/index.ts`) com mock hardcoded.
- `employee/updatedEmployee` comentado.
- Busca de fornecedores por código/termo aponta para rotas inexistentes.
- Rotas `/rh/folha`, `/rh/treinamentos`, `/loginAdmin` não implementadas.


---

## Status das correções realizadas (Fases 3 e 4 — em execução)

### Concluído
- Criação de `src/api/config.ts`: URL base da API via variável de ambiente `REACT_APP_API_URL` (padrão `http://localhost:3010`), eliminando endereços hardcoded e o fallback externo `https://backend-oi68.onrender.com`.
- Criação de `src/api/client.ts`: cliente HTTP centralizado (`apiClient` com `get/post/put/patch/delete` + `apiRequest`/`apiRequestBlob`).
  - Token Bearer automático a partir do `localStorage`.
  - Cabeçalho `X-Company-Id` a partir do contexto da empresa (`localStorage.companyData`).
  - Tratamento unificado de erros: 401 (limpa sessão), 403 (autorização), 404 (não encontrado), 500+, timeout e falha de rede.
  - Resposta padronizada `ApiResponse<T> = { data, error, status, ok }`.
  - Suporte a JSON, `FormData` (uploads) e `blob` (downloads PDF/Excel).
  - Timeout de 30s com `AbortController`.
- Criação de 17 serviços por domínio em `src/services/`, todos consumindo `apiClient` e mapeando **exclusivamente endpoints reais do backend**:
  - `authService` (login admin + colaborador)
  - `companyService` (empresas/global)
  - `productService`, `customerService`, `supplierService`, `employeeService`
  - `orderService` (pedidos de venda)
  - `purchaseService` (pedidos de compra)
  - `invoiceService` (notas fiscais de entrada)
  - `kardexService` (estoque)
  - `serviceOrderService` (ordens de serviço)
  - `financialService` (contas a pagar + pagamentos de pedidos)
  - `nfeService`, `plugnotasService`
  - `messageService` (chat HTTP)
  - `reportService` (relatórios sem mock)
- Criação de `src/services/index.ts` (barrel de exportação).
- Verificação TypeScript (`tsc --noEmit`) aprovada para todos os arquivos novos.

### Endpoints inexistentes corrigidos/removidos dos serviços
| Chamada antiga (inexistente) | Substituição correta |
|------------------------------|----------------------|
| `payment/dashboard` | `payments/dashboard` |
| `products/product/:id` | `products/:id` |
| `products/:id/location` | removida (não existe no backend) |
| `orders/:id/kardex` | `kardex/orders/:id` |
| `suppliers/code/:code`, `suppliers/search` | removidas (não existem) |
| `employee/:id/status` (chat.ts) | `employees/:id/status` |
| `/opportunities`, `/goals` | removidas (não existem no backend) |
| `payment/fornecedores`, `payment/pagamentos`, `payment/pagamentos/:id/estornar`, `payment/pagamentos/titulo/:id`, `payment/relatorios/*`, `payment/accounts/exportar` | removidas (não existem) |

### Pendente (não corrigido ainda)
- Chamadas HTTP diretas ainda espalhadas em páginas/componentes (ex.: `src/pages/manager/Products/index.tsx` chama `handleAllProducts` do serviço antigo; `AdminScreen/index.tsx` chama `handleAllOrders`/`handleAllEmployee` antigos).
- Serviços antigos em `src/service/api/Administrador/*` ainda existentes (duplicados com os novos de `src/services/`).
- `configs/index.ts` ainda usa `fetch` direto com fallback externo.
- `chat.ts` ainda usa `apiRequest` antigo.
- Autenticação admin (F1) ainda bypassa `AuthContext.login`.
- Rotas do menu inexistentes (`/rh/folha`, `/rh/treinamentos`, `/loginAdmin`).
- `companyId` não é invalidado/recarregado ao trocar de contexto.
- Não há testes de frontend.

---

## 9. Plano de refatoração (ordem obrigatória)

1. Auditoria completa do frontend (este documento).
2. Inventário de inconsistências (este documento, seções 4-8).
3. Definição da arquitetura frontend padrão (`ARCHITECTURE_FRONTEND.md`).
4. Refatoração geral: centralizar HTTP em `src/api/client.ts`, criar serviços por domínio em `src/services/`, padronizar resposta/erro.
5. Padronização das chamadas à API: corrigir endpoints inexistentes (P-01), unificar formato de resposta, eliminar `fetch` direto e fallback externo.
6. Revisão de formulários, cadastros, listagens, navegação e permissões (padronizar UI, corrigir menu/rotas).
7. Transferência do cadastro de empresas para o painel administrativo (remover do login, criar rota/admin protegida).
8. Auditoria final e testes de regressão (instalar node_modules, rodar build e testes).
9. Ajustes do painel administrativo (última etapa).

---

## 10. Arquitetura final proposta

Manter a stack (React 19, TS, CRA, HashRouter, Tailwind). Adicionar apenas organização de pastas (nenhuma nova biblioteca principal):

```
src/
  api/
    client.ts        # fetch wrapper centralizado (baseURL por env, token, companyId, interceptores de erro, padronização de resposta)
    config.ts        # BASE_URL (dotenv)
  services/          # domínio
    authService.ts
    companyService.ts
    productService.ts
    customerService.ts
    supplierService.ts
    employeeService.ts
    orderService.ts
    purchaseService.ts
    invoiceService.ts
    kardexService.ts
    serviceOrderService.ts
    financialService.ts
    nfeService.ts
    plugnotasService.ts
    messageService.ts
    reportService.ts
  hooks/             # useAuth, useCompany, useProducts, etc.
  contexts/          # AuthContext (mantido), CompanyContext
  components/
    ui/              # componentes de interface consolidados
    layout/          # Dashboard, Sidebar, Header
    common/          # tabelas, modais, formulários reutilizáveis
  pages/             # páginas (mantida estrutura, padronizada)
  routes/            # AppRoutes + PrivateRoute
  types/             # interfaces/DTOs
  utils/             # formatters, masks, moduleMapping (mantidos)
  assets/
```

- Cliente HTTP centralizado: `get`, `post`, `put`, `delete`, `patch`, `blob`; base URL por env; `Authorization: Bearer <token>`; header `X-Company-Id` quando disponível; tratamento unificado de 401/403/404/500; retorno padronizado `{ data, error, status }`.
- Serviços por domínio consomem o cliente; páginas consomem serviços via hooks.
- Autenticação: consertar `handleAdminLg` para usar `AuthContext.login`; remover navegação para `/loginAdmin` inexistente.
- Navegação: alinhar `menu.ts` com `AppRoutes.tsx` (remover `/rh/folha`, `/rh/treinamentos`, corrigir "Alertas de Estoque").
- Empresas: mover `AdminSetupModal` do login para uma rota administrativa protegida (painel administrativo).
- Testes: adicionar testes de serviços e de rotas/permissões.
