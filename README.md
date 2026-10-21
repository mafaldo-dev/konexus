# Konéxus — Sistema de Gestão Empresarial

## Release 1.4.1

Multi-CNPJ por organização, com CNPJ emissor validado, isolamento operacional,
logos versionados e preservação histórica do emissor. A migração aditiva 013 foi
aplicada no Neon após backup completo e o backend 1.4.1 está publicado. Escopo e
limites: [notas da release](docs/releases/1.4.1.md). A publicação da 1.4.0
permanece documentada em [PUBLICACAO_1.4.0](docs/PUBLICACAO_1.4.0.md).

## Evolução dos quatro módulos

[Plano e matriz de lacunas](docs/EVOLUCAO_QUATRO_MODULOS.md) ·
[Entrega incremental M1 e testes](docs/ENTREGA_MODULOS_M1.md).

O CRM agora possui uma base persistente de leads, oportunidades e atividades, usando
a migração backend `012_crm_pipeline.sql`. A evolução completa dos quatro módulos
e a publicação da próxima release ainda estão em andamento; não confundir esta
entrega incremental com folha homologada, integração fiscal ou ERP integralmente validado.

## Auditoria e rastreabilidade — outubro/2026

Implementação em andamento, com validações locais e pendências E2E explícitas:

- [Diagnóstico](docs/AUDITORIA_2026.md)
- [Inventário de rotas e entidades SQL](docs/MATRIZ_ROTAS_2026.md)
- [Arquitetura de computadores, sessões e migração 011](docs/RASTREABILIDADE_COMPUTADORES.md)
- [Relatório de execução e limitações](docs/RESULTADOS_AUDITORIA_2026.md)

Identificação Electron por UUID em userData, painel de computadores/sessões,
heartbeat e revogação exigem a migração aditiva 011 no backend. Ela foi aplicada
somente no PostgreSQL temporário de testes, não no ambiente configurado no `.env`.
As métricas históricas abaixo não substituem os resultados desta auditoria.

Konéxus é um ERP desktop (Electron + React + TypeScript) para gestão de vendas,
compras, estoque, RH, financeiro, contabilidade e CRM. É multiempresa, com
controle de acesso por módulo e ação, trilha de auditoria append-only e
confirmação de senha nas alterações de negócio.

- **Frontend (este repositório):** `konexus/` — aplicação Electron/React
- **Backend:** repositório `konexus-back` — API Node/Express + PostgreSQL
- **Banco:** PostgreSQL (Neon), migrações versionadas em `konexus-back/migrations`

---

## 1. Funcionalidades

### 1.1 Módulos

| Módulo | Chave | Comercial | Observações |
| --- | --- | --- | --- |
| Dashboard | `dashboard` | Freemium | Painel inicial |
| Gestão (cadastros) | `gestao` | Freemium | Produtos, clientes, fornecedores, marcas, categorias, unidades, cargos, colaboradores |
| Vendas | `vendas` | Freemium | Pedidos de venda, separação, conferência, liberação, cancelamento, análise de crédito |
| Compras | `compras` | Freemium | Pedidos de compra |
| Estoque | `estoque` | Freemium | Movimentações (Kardex), ajuste de estoque |
| RH | `rh` | Freemium | Colaboradores, cargos e salários |
| Financeiro | `finance` | Freemium | Contas a pagar/receber, contas bancárias, pagamento |
| Auditoria | `audit` | Freemium | Histórico de ações, estações de trabalho |
| CRM | `crm` | **Extra contratado** | Independente dos demais |
| Contábil | `contabil` | **Extra contratado** | Dentro de Financeiro; independente de CRM e NF-e |
| NF-e | `nfe` | **Extra contratado** | Emissão via PlugNotas |

A classificação comercial é definida no **catálogo do código**
(`konexus-back/src/domain/security/moduleCatalog.js`), que é a fonte de verdade.
A coluna `modules.is_paid` do banco é apenas alinhada por migração. Extras são
liberados por empresa em `company_extra_modules`; **não há cobrança automática**.

### 1.2 Módulo de Contabilidade (`contabil`)

Entregue como extra contratado, dentro do **layout base** (Dashboard/sidebar) e
no padrão visual do projeto (`DynamicTable`, `Button`, `Card`, `Input`, `Modal`,
`Badge`), com caminho de volta e breadcrumb `← Financeiro › Contabilidade › …`.

- Plano de contas, centros de custo, razão, balancetes, demonstrativos
  (balanço, DRE, fluxo de caixa), razão de clientes/fornecedores
- Lançamentos em rascunho → contabilizados → estornados
- **Partidas dobradas validadas no backend** (lançamento sem equilíbrio é recusado)
- **Estorno** para correção de lançamento contabilizado (nunca edição)
- Relatórios **calculados a partir do banco**, nunca congelados no cliente
- Permissões `contabil:*` (16 ações)
- Seed demonstrativo idempotente: `konexus-back/seed-accounting-demo.mjs`
  (`--dry-run`, `--allow-demo-data`, `--verify`) — **recusa execução em produção**

Documentação: [`docs/MODULO_CONTABILIDADE.md`](docs/MODULO_CONTABILIDADE.md).

### 1.3 Auditoria e reautenticação por senha

Ver [`docs/MODULOS_E_COMERCIAL.md`](docs/MODULOS_E_COMERCIAL.md) e
`konexus-back/docs/AUDITORIA_RASTREABILIDADE.md`.

- **Trilha append-only por empresa** (`audit_events`): trigger no banco impede
  `UPDATE`/`DELETE`.
- **Confirmação de senha** exigida nas alterações de negócio: produtos,
  fornecedores, clientes, pedidos de venda/compra, Kardex, ordens de serviço,
  contabilidade, financeiro, TROUX collaborative/cargos/permissões e ações
  sensíveis do painel global.
- **Login e logout são livres** — o usuário acabou de se autenticar. Pelo
  mesmo motivo, o próprio colaborador marcando a **própria presença**
  ("Ativo" no login, "Ausente" no logout) **não** abre o modal de senha: é
  parte do ciclo de sessão, não uma alteração de negócio. A ação continua
  registrada na auditoria (`reauth_outcome = self_service`). Quando um
  administrador altera a situação de **outro** colaborador, a senha continua
  sendo exigida.
- A senha é validada **no backend**; o frontend apenas orquestra o modal
  (`ReauthProvider` + `ReauthModal`).
- A concessão é de **uso único**, dura 2 minutos e fica vinculada a
  sessão, usuário, empresa, módulo, ação, recurso e *hash* do conteúdo: se o
  corpo mudar depois da confirmação, a operação é recusada.
- **Estação de trabalho** é um rótulo do ambiente (par por código de
  pareamento), **nunca prova de identidade**.
- Aba **Auditoria** no painel administrativo global, com seletor de empresa.

### 1.4 Conferência e liberação de pedidos de venda

A tela **Realizar Conferência** (Vendas › Pedidos) exige a senha do usuário
logado para concluir a liberação:

- o backend responde `403 REAUTH_REQUIRED` e o frontend abre o modal de
  confirmação de identidade;
- após a confirmação, o pedido passa a `shipped` e **grava o rastro da
  conferência**: usuário autenticado (vindo do token, imutável), conferente
  declarado, separador, peso, volumes, data/hora e sessão;
- o mesmo rastro vai para o evento de auditoria;
- a listagem de pedidos exibe a coluna **Conferência** com quem liberou,
  o separador e o horário.

> A coluna `conference_user` vem do token e não pode ser falsificada pelo
> cliente; `conference_checked_by` é o conferente declarado na tela.

### 1.5 Painel administrativo global

- Visão de todas as empresas, módulos contratados, planos e assinaturas
- **Aba "Auditoria"**: histórico de ações por empresa (filtros por módulo,
  ação, usuário, sessão e período) e gestão de estações de trabalho

---

## 2. Fluxo de reautenticação no cliente

```
Requisição (POST/PUT/PATCH/DELETE protegido)
   │
   ├─ backend responde 403 { code: "REAUTH_REQUIRED", reauth: {…} }
   │     └─ src/api/client.ts detecta o código
   │          └─ ReauthProvider abre o modal (pede a senha)
   │               └─ POST /audit/reauth { password, intent, payload }
   │                    └─ 201 { grantId }
   │                         └─ repete a MESMA requisição com X-Reauth-Grant
   │                              └─ se o corpo mudou → 403 (concessão invalidada)
   │
   └─ qualquer falha → operação NÃO é executada
```

Arquivos: `src/api/client.ts`, `src/api/reauth.ts`,
`src/components/Reauth/ReauthProvider.tsx`, `src/components/Reauth/ReauthModal.tsx`.

---

## 3. Tecnologias

| Camada | Tecnologia |
| --- | --- |
| Interface | React 18 + TypeScript |
| Desktop | Electron + `electron-builder` (NSIS) |
| Atualização | `electron-updater` (`latest.yml`) |
| Estilo | Tailwind CSS |
| Estado | Contextos React (`AuthContext`, etc.) |
| Backend | Node.js + Express + PostgreSQL (`pg`) |
| Testes | `node --test` (backend), `react-scripts test` (frontend) |

---

## 4. Rodando o projeto

### 4.1 Pré-requisitos

- Node.js 22 LTS (versão usada no CI)
- npm (o projeto usa `package-lock.json`; o CI roda `npm ci`)
- PostgreSQL para o backend (variáveis em `konexus-back/.env` — ver
  `konexus-back/docs/ENVIRONMENT.md`)

### 4.2 Frontend

```bash
git clone <URL_DO_REPOSITORIO>
cd konexus
npm install

npm start              # apenas o React (http://localhost:3000)
npm run electron:serve # React + Electron (desenvolvimento)
```

### 4.3 Backend

```bash
cd konexus-back
npm install
node server/main.js    # porta padrão em .env (SERVER_PORT)
```

Migrações (apenas com autorização explícita):

```bash
node run_migration.js migrations/009_order_conference.sql
```

### 4.4 Testes

```bash
# frontend
npm run test:frontend          # 71 testes
npm test -- --watchAll=false

# backend
cd ../konexus-back
npm test                       # 110 testes
```

### 4.5 Auditorias automatizadas

```bash
cd konexus-back
SERVER_PORT=3051 node server/main.js &

# varredura de todas as rotas de leitura (procura HTTP 5xx)
BASE_URL=http://localhost:3051 node scripts/smoke-audit-get.mjs

# cobertura de senha de toda a matriz de operações protegidas
BASE_URL=http://localhost:3051 node scripts/audit-reauth-coverage.mjs
```

Resultado da última auditoria (ver `konexus-back/docs/AUDITORIA_GERAL_FLUXO.md`):
**97 operações na matriz, 76 exigem senha, 0 falhas 5xx, 0 alterações sem senha.**

---

## 5. Build e releases

### 5.1 Construção para produção

```bash
npm ci --legacy-peer-deps --no-audit --no-fund
CI=false npm run electron:build -- --win nsis --publish never
```

Artefatos em `dist/`: instalador NSIS (`Konexus-Setup-X.Y.Z.exe`), arquivo de
download diferencial (`.exe.blockmap`) e metadados de atualização (`latest.yml`).

### 5.2 Releases e atualização automática

O processo oficial é o workflow
[`.github/workflows/release.yml`](.github/workflows/release.yml). Ao publicar uma
release com tag `vX.Y.Z` correspondente ao `package.json`, o workflow:

1. faz checkout da tag exata;
2. valida versão, release, TypeScript e artefatos;
3. gera o instalador Windows com Electron Builder + NSIS;
4. **cria a release via API do GitHub** no push da tag;
5. publica `Konexus-Setup-X.Y.Z.exe`, `Konexus-Setup-X.Y.Z.exe.blockmap` e
   `latest.yml` na própria release.

O aplicativo instalado usa `electron-updater` para consultar o `latest.yml`,
validar o instalador Windows correto e baixar a nova versão em segundo plano.
O botão **Baixar atualização** da tela de login inicia o download diretamente
pelo atualizador.

Referências: [`docs/RELEASES.md`](docs/RELEASES.md),
[`docs/UPDATE_FLOW.md`](docs/UPDATE_FLOW.md),
[`docs/HISTORICO_VERSOES.md`](docs/HISTORICO_VERSOES.md).

> O instalador não é assinado digitalmente; o Windows pode exibir aviso do
> SmartScreen. O teste ponta a ponta de atualização precisa ser feito em uma
> instalação Windows real.

---

## 6. Estrutura do projeto

```
konexus/
├── public/                     # shell do Electron
├── src/
│   ├── api/                    # cliente HTTP, reautenticação, configuração da API
│   │   ├── client.ts           # cliente central (retry único com X-Reauth-Grant)
│   │   └── reauth.ts
│   ├── components/             # componentes reutilizáveis
│   │   ├── Reauth/             # modal e provider de confirmação de identidade
│   │   └── ui/                 # kit visual (DynamicTable, Button, Card, Input…)
│   ├── contexts/               # contextos React (autenticação, módulos…)
│   ├── pages/
│   │   ├── CRM/                # módulo CRM (extra)
│   │   ├── Financial/          # Financeiro
│   │   │   └── accounting/     # Contabilidade (extra, dentro do layout base)
│   │   ├── RH/                 # Recursos Humanos
│   │   ├── ServiceOrder/       # Ordens de serviço
│   │   ├── _shopping/          # Compras
│   │   ├── configurations/     # Configurações do sistema
│   │   ├── manager/            # Cadastros (produtos, clientes, fornecedores…)
│   │   ├── planos/             # Planos e assinaturas
│   │   ├── sales/              # Vendas (pedidos, conferência, separação)
│   │   ├── stock/              # Estoque (Kardex, inventário)
│   │   └── system-admin/       # Painel administrativo global (inclui Auditoria)
│   ├── routes/                 # Rotas da aplicação
│   ├── services/               # Serviços de API por domínio
│   ├── types/                  # Tipos TypeScript
│   └── utils/                  # Utilitários
├── docs/                       # Documentação técnica
├── electron/                   # Processo principal e atualização
├── scripts/                    # Scripts de build/auditoria
├── .github/workflows/          # CI e release
└── package.json
```

---

## 7. Documentação

| Documento | Onde | Conteúdo |
| --- | --- | --- |
| Módulos e comercial | [`docs/MODULOS_E_COMERCIAL.md`](docs/MODULOS_E_COMERCIAL.md) | Freemium x extras, permissões, Multiempresa |
| Módulo de contabilidade | [`docs/MODULO_CONTABILIDADE.md`](docs/MODULO_CONTABILIDADE.md) | Escopo, telas, seed, substituir o plano de contas |
| Releases | [`docs/RELEASES.md`](docs/RELEASES.md) | Versionamento e publicação |
| Fluxo de atualização | [`docs/UPDATE_FLOW.md`](docs/UPDATE_FLOW.md) | `electron-updater` ponta a ponta |
| Histórico de versões | [`docs/HISTORICO_VERSOES.md`](docs/HISTORICO_VERSOES.md) | Versão a versão |
| Auditoria do frontend | [`docs/FRONTEND_AUDITORIA.md`](docs/FRONTEND_AUDITORIA.md) | Revisão da interface |
| Auditoria geral do fluxo | `konexus-back/docs/AUDITORIA_GERAL_FLUXO.md` | Cobertura de senha, matriz, bugs corrigidos |
| Rastreabilidade | `konexus-back/docs/AUDITORIA_RASTREABILIDADE.md` | Política de reautenticação e trilha |
| Multiempresa | `konexus-back/docs/AUDITORIA_MULTIEMPRESA.md` | Isolamento por empresa |
| Segurança | `konexus-back/docs/AUDITORIA_SEGURANCA.md` | Vulnerabilidades e correções |
| Ambiente | `konexus-back/docs/ENVIRONMENT.md` | Variáveis de ambiente |

---

## 8. Licença

Informações sobre a licença do projeto.
