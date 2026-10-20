# Arquitetura de Referência do Frontend - Konexus ERP

> Documento da Fase 2. Define o padrão único do frontend.
> Stack mantida: React 19, TypeScript 4.9, Create React App, react-router-dom (HashRouter), Tailwind, fetch (sem novas bibliotecas principais).

---

## 1. Objetivo

Estabelecer **uma única arquitetura frontend**, consistente em todos os módulos, com:
- cliente HTTP centralizado (comunicação com o backend);
- serviços por domínio (camada de API);
- páginas consumindo serviços (não chamadas HTTP diretas);
- autenticação e contexto de empresa centralizados;
- rotas protegidas e navegação alinhada ao backend;
- componentes de UI reutilizáveis e padronizados.

Não mudar o framework nem substituir bibliotecas principais.

---

## 2. Estrutura de diretórios de destino

```
konexus/src/
├── api/                    # Camada de comunicação centralizada
│   ├── config.ts           # BASE_URL (via .env)
│   └── client.ts           # Cliente fetch centralizado (get/post/put/delete/patch/blob)
│                           # - base URL, token Bearer, X-Company-Id
│                           # - tratamento unificado de erro (401/403/404/500)
│                           # - resposta padronizada { data, error, status }
├── services/               # Serviços por domínio (chamadas à API)
│   ├── authService.ts
│   ├── companyService.ts
│   ├── productService.ts
│   ├── customerService.ts
│   ├── supplierService.ts
│   ├── employeeService.ts
│   ├── orderService.ts
│   ├── purchaseService.ts
│   ├── invoiceService.ts
│   ├── kardexService.ts
│   ├── serviceOrderService.ts
│   ├── financialService.ts (payments + paymentAccounts)
│   ├── nfeService.ts
│   ├── plugnotasService.ts
│   ├── messageService.ts
│   └── reportService.ts
├── hooks/                  # Hooks reutilizáveis (useAuth, useCompany, useProducts...)
├── contexts/               # AuthContext (mantido), CompanyContext
├── components/
│   ├── ui/                 # Componentes de interface (Button, Input, Select, Modal, Table, Card, Badge...)
│   ├── layout/             # Dashboard, Sidebar, Header
│   └── common/             # Tabelas, modais, formulários reutilizáveis
├── pages/                  # Páginas (estrutura mantida, padronizada)
├── routes/                 # AppRoutes + PrivateRoute
├── types/                  # Interfaces/DTOs
├── utils/                  # formatters, masks, moduleMapping (mantidos)
├── assets/
├── App.tsx
└── index.tsx
```

---

## 3. Responsabilidade de cada camada

| Camada | Responsabilidade |
|--------|-----------------|
| `api/client.ts` | Comunicação HTTP centralizada. Nunca chamada direta de `fetch` em páginas/componentes. |
| `services/*` | Chamadas de API por domínio. Converte resposta para tipos. Não contém lógica de apresentação. |
| `hooks/*` | Lógica reutilizável que envolve serviços + estado (ex.: `useProducts()` carrega lista). |
| `contexts/*` | Estado compartilhado: autenticação (`AuthContext`) e empresa ativa (`CompanyContext`). |
| `routes/` | Definição de rotas e proteção (`PrivateRoute`). |
| `pages/` | Orquestração: chama hooks/serviços, renderiza componentes. Sem `fetch` direto. |
| `components/ui/` | Componentes visuais puros (sem chamada à API quando possível). |
| `types/` | Contratos TypeScript (request/response). |
| `utils/` | Formatação, máscaras, mapeamento de módulos. |
| `data/` | Dados curados de produto (ex.: `productUpdates.ts`, fonte do histórico de novidades). |

---

## 4. Fluxo de uma requisição

```
Componente/Página -> Hook (opcional) -> Service (domínio) -> api/client.ts (fetch)
                                                -> backend (Express + PostgreSQL)
                                                -> resposta padronizada { data, error, status }
```

---

## 5. Cliente HTTP centralizado (regras)

- Base URL via variável de ambiente (`REACT_APP_API_URL`, padrão `http://localhost:3010`).
- Cabeçalho `Authorization: Bearer <token>` automático a partir do `localStorage`/contexto.
- Cabeçalho `X-Company-Id` a partir do contexto da empresa quando disponível.
- Tratamento unificado:
  - 401 → limpa sessão e redireciona para login.
  - 403 → erro de autorização (exibido ao usuário, sem mascarar como 404).
  - 404 → recurso não encontrado.
  - 500+ → erro inesperado.
- Resposta padronizada para todos os serviços.
- Suporta `blob` (downloads PDF/Excel) e `FormData` (uploads).
- Não usar `fetch` direto fora de `api/client.ts`.

---

## 6. Autenticação e contexto multiempresa

- `AuthContext` continua sendo a fonte de `user`, `token`, `company`, `modules`.
- `companyId` vem do JWT (backend) e é armazenado no contexto.
- **Não** confiar em `companyId` enviado por formulário como autorização.
- Troca de empresa invalida dados (limpa listas/cache e recarrega).
- O backend continua sendo o responsável pela autorização e isolamento; o frontend apenas integra.

---

## 6.1 Módulos, menu e rotas

- `utils/moduleMapping.ts` centraliza as regras de menu, submenu e rota.
- Regra de acesso: **módulo disponível para a empresa** (calculado pelo backend
  e entregue no login) **e** permissão individual (ou administrador da empresa).
- Módulos padrão (freemium): dashboard, gestão, vendas, compras, estoque, RH e
  **Financeiro**.
- Módulos extras, contratados de forma independente: **CRM**, **Contábil** e
  **NF-e**. Contratar um não libera os outros.
- Esconder um item de menu **não** é proteção: o backend aplica `checkModule`,
  `checkSubscription` e `requirePermission` nas rotas.
- Detalhes: [`docs/MODULOS_E_COMERCIAL.md`](docs/MODULOS_E_COMERCIAL.md).

---

## 6.2 Histórico de novidades ("Últimas Atualizações")

- Fonte: `src/data/productUpdates.ts` (curadoria com módulo, versão, título,
  descrição, data e visibilidade).
- O painel `src/components/AdminScreen/ProductUpdatesPanel.tsx` filtra por
  módulo no navegador, sem recarregar a página.
- Novidades de módulos extras só aparecem para empresa com contratação e
  usuário com permissão.
- Política editorial e histórico técnico: [`docs/HISTORICO_VERSOES.md`](docs/HISTORICO_VERSOES.md).

---

## 7. Convenções

- Nenhuma chamada `fetch`/`axios` direta em páginas/componentes: usar sempre os serviços de `src/services/`.
- Respostas de serviço sempre tipadas (evitar `any`).
- Tratamento de erro visível ao usuário (toast/SweetAlert) + log no console.
- Estados de carregamento, sucesso, erro e vazio padronizados nas páginas.
- Nomes de arquivos em `camelCase`; serviços com sufixo `Service` ou nomes de domínio claros.
