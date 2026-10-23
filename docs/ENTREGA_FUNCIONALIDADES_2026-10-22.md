# Entrega de funcionalidades pendentes — 22/10/2026

## Estado inicial preservado

- Repositório frontend: `/home/dev/projects/ERP/konexus`
  - branch: `main`
  - HEAD: `868bc495f1fb2f1fcb31c390f4932687063b1b4e`
  - tag `v1.4.2`: `22fde71dd438bd940ec9b8168e5c1ab0f2f12a80`
  - 69 entradas no working tree antes desta entrega, incluindo as correções
    de estabilidade da auditoria anterior.
- Repositório backend: `/home/dev/projects/ERP/konexus-back`
  - branch: `main`
  - HEAD: `fc45cba581329df05cec93bb7e9ff526a602e087`
  - working tree limpo antes desta entrega.
- Não houve `git reset`, `git clean`, commit, push, release, deploy ou
  movimentação da tag.
- A tag `v1.4.2` é a release publicada e não foi alterada.

## Inventário do backend existente

- Express 5, PostgreSQL via `pg`, sem ORM.
- Camadas: `src/http/routes`, `src/http/controllers`,
  `src/domain/services`, `src/domain/repositories`.
- Contrato de erro central em `src/http/middleware/error.js`.
- Autorização: `authMiddleware`, `companyContext`, `checkModule`,
  `requirePermission`, `requireAnyPermission`.
- Contexto multi-CNPJ: `requireLegalEntity` e migração `013_multi_cnpj.sql`.
- Auditoria: `AuditService.record` dentro da mesma transação.
- Testes: `node --test`, unitários e integrações opt-in com PostgreSQL local.

### Migrações existentes

`001` a `014`, incluindo:

- `001_initial_schema.sql`: empresas, usuários, produtos, pedidos,
  pagamentos, contas a pagar, Kardex, compras.
- `007_audit_reauth_stations.sql`: auditoria, reautenticação e estações.
- `008_accounting_module.sql`: módulo contábil.
- `013_multi_cnpj.sql`: empresas jurídicas, vínculos empregatícios, estoque
  por CNPJ, `legal_entity_id` e triggers de falha fechada.
- `014_explicit_legal_entity_access.sql`: concessão explícita de CNPJ.

### Endpoints reutilizáveis

- `GET/POST/PATCH /employment/links` e `GET /employment/contributors`.
- `GET /payments/*` e `/payment/accounts*` (Financeiro).
- `GET /purchase/all`, `GET /purchase/:orderNumber`, `PUT /purchase/:id`.
- `GET /kardex/product/:id`.
- `GET /audit/events`.
- `/accounting/*` para integração contábil por evento financeiro.

### Lacunas confirmadas

- Não existiam tabelas, serviços ou rotas de contas bancárias, movimentações
  bancárias, fluxo de caixa, devoluções de compra, treinamentos ou folha.
- As telas desses recursos eram apenas estados de indisponibilidade.
- Não havia smoke autenticado em navegador real nem instalação Windows.

## Dependências entre os recursos

1. Contas bancárias alimentam o fluxo de caixa realizado.
2. Contas a pagar, contas a receber e pagamentos alimentam o fluxo previsto.
3. Devoluções usam pedidos de compra, itens, fornecedor, estoque e Kardex.
4. O crédito financeiro de devoluções é um registro separado; não altera
   automaticamente títulos a pagar.
5. Treinamentos usam colaboradores e vínculos empregatícios existentes.
6. Folha usa vínculos empregatícios e o CNPJ empregador; a integração
   financeira gera uma conta a pagar por competência, de forma idempotente.
7. A integração contábil continua sendo uma ação explícita sobre os títulos
   financeiros, respeitando os mapeamentos existentes.

## Etapas

| Etapa | Status inicial |
| --- | --- |
| 1. Inventário e preservação | concluído |
| 2. Contas bancárias | pendente |
| 3. Fluxo de caixa | pendente |
| 4. Devoluções | pendente |
| 5. Treinamentos | pendente |
| 6. Folha | pendente |
| 7. Integração frontend | pendente |
| 8. Testes automatizados | pendente |
| 9. Smoke autenticado | pendente |
| 10. Electron/Windows | pendente |
| 11. Cenários A–E | pendente |
| 12. Relatório final | pendente |

Este documento é atualizado ao final de cada etapa com resultados reais.

---

# Fechamento da entrega — 22/10/2026

## 1. Escopo implementado

As cinco pendências foram implementadas sobre o projeto existente, sem trocar a
stack, sem restaurar mocks e sem criar dados fictícios nas telas.

### 1.1 Migrações aditivas

- `015_bank_accounts_cash_flow.sql`: contas bancárias, movimentações e
  categorias financeiras.
- `016_purchase_returns.sql`: devoluções, itens, eventos, crédito ao fornecedor
  e vínculo opcional com Kardex.
- `017_training.sql`: categorias, treinamentos, turmas, inscrições,
  presença/conclusão e certificados.
- `018_payroll.sql`: rubricas versionadas, remunerações por vínculo,
  competências, eventos e memória de cálculo.

As migrações foram aplicadas em bancos PostgreSQL temporários locais. Não houve
aplicação em produção.

### 1.2 Backend

Novos repositories, services, controllers e rotas:

- Contas bancárias e fluxo de caixa:
  - leitura de resumo, contas, extrato e categorias;
  - criação/edição de conta e movimentação idempotente;
  - estorno auditado com motivo;
  - fluxo de caixa com realizado em `bank_transactions`, previsto por títulos
    abertos e conciliação informativa de títulos baixados;
  - nenhum valor realizado é duplicado a partir de títulos baixados.
- Devoluções de compra:
  - somente pedidos `delivered`, `received` ou `completed`;
  - itens parciais com saldo devolvível descontando devoluções anteriores;
  - estados `draft`, `pending_approval`, `approved`, `rejected`, `received` e
    `cancelled`, com histórico de eventos;
  - estoque/Kardex alterado apenas em `receive`;
  - crédito ao fornecedor explícito em `financial-credit`, sem alterar
    automaticamente o título a pagar original;
  - NF-e de devolução registrada como pendência fiscal, sem emissão simulada.
- Treinamentos:
  - categorias, cursos, turmas, inscrições e presença;
  - inscrição obrigatoriamente vinculada a `employment_links`, preservando
    colaborador, empregador e CNPJ;
  - conclusão após presença e certificado com código verificável e retrato dos
    dados no momento da emissão;
  - nenhum certificado é emitido automaticamente.
- Folha:
  - rubricas versionadas com fonte/fundamento e vigência obrigatórios;
  - remuneração contratual por vínculo com vigência e fonte;
  - competências com eventos, cálculo, reabertura somente após cálculo,
    aprovação, fechamento e integração financeira idempotente;
  - o cálculo usa salário base e somente eventos lançados; não há INSS, IRRF,
    FGTS, provisões, holerite, guia ou transmissão ao eSocial automáticos;
  - `post-finance` cria no máximo um título pendente por competência fechada.

Todas as novas escritas foram incluídas em
`src/http/routes/protectedOperations.js`, com auditoria e reautenticação. A
matriz de testes de cobertura foi ampliada.

Permissões efetivas aplicadas no backend:

| Recurso | Permissões |
| --- | --- |
| Contas bancárias | `finance:view`, `finance:create`, `finance:edit` |
| Fluxo de caixa | `finance:view` |
| Devoluções | `compras:view`, `compras:create`, `compras:edit`; `estoque:move` no recebimento; `finance:create` no crédito |
| Treinamentos | `rh:view`, `rh:manage_training` |
| Folha | `rh:view_payroll`, `rh:process_payroll`, `rh:approve_payroll`; `finance:create` na integração |

### 1.3 Frontend

- `src/services/bankAccountService.ts`
- `src/services/cashFlowService.ts`
- `src/services/purchaseReturnService.ts`
- `src/services/trainingService.ts`
- `src/services/payrollService.ts`
- `src/components/ui/Modal.tsx`
- `src/components/ui/StatusBadge.tsx`
- `src/components/dashboard/components/tabs/BankTabs.tsx`
- `src/components/dashboard/components/tabs/FluxoCaixaTabs.tsx`
- `src/pages/_shopping/returns/index.tsx`
- `src/pages/RH/treinamentos/index.tsx`
- `src/pages/RH/folha/index.tsx`

As telas usam os serviços tipados, estados de carregamento/erro/vazio, filtros,
paginação/limites reais, feedback de sucesso, confirmação de reautenticação e
ações condicionadas às permissões. A aba de devoluções deixou de ser um botão
desabilitado. O acesso a `/rh/folha` exige `rh:view_payroll` e o acesso a
`/rh/treinamentos` exige `rh:view`.

## 2. Resultados reais de validação

### 2.1 TypeScript e testes

| Verificação | Comando | Resultado |
| --- | --- | --- |
| TypeScript | `npx tsc --noEmit` | 0 erro |
| Backend completo | `npm test` com as três URLs PostgreSQL de teste | 172 testes, 172 aprovados, 0 falhas, 0 skips, exit 0 |
| Frontend completo | `CI=true npm run test:frontend` | 15 suítes, 126 testes, 126 aprovados, exit 0 |
| Testes Electron | `npm run test:electron` | 24 testes, 24 aprovados, exit 0 |
| Build frontend | `npm run build` | exit 0; build gerado; avisos ESLint existentes no projeto, nenhum erro de compilação |
| Integração PostgreSQL das novas funções | `tests/integration/operationsFeatures.test.js` | aprovada |
| Regras unitárias novas | `tests/unit/newFeaturesRules.test.js` | aprovada |

Bancos usados localmente:

- `konexus_test` para as novas funcionalidades;
- `konexus_audit_test` para CRM, dispositivos e auditoria;
- `konexus_multi_test` para multi-CNPJ.

O teste de dispositivos foi ajustado para o schema real do Kardex
(`reference_type`/`reference_id`), necessário para a devolução. Isso corrigiu uma
falha de fixture que aparecia quando a suíte deixava de ser pulada.

### 2.2 Smoke HTTP autenticado

Executado contra o backend Express real com PostgreSQL temporário, usando um
usuário de teste local (`smoke.admin`), nunca credencial de produção.

- 19 verificações, 19 aprovadas, 0 falhas.
- Request sem token bloqueado com 401.
- Login de colaborador com 8 módulos retornou token, CNPJ ativo e perfil de
  administrador da empresa.
- Todos os endpoints de leitura dos cinco recursos retornaram 200 com envelope
  `{ success, data }`.
- Escritas reais com confirmação de identidade:
  - conta bancária criada, saldo atual persistido em `R$ 1.250,00`;
  - categoria de treinamento criada;
  - rubrica da folha criada com fonte e vigência;
  - resumo bancário releu o saldo persistido.
- Todos os 403 de reautenticação observados no fluxo eram a resposta esperada
  `REAUTH_REQUIRED`, seguida de concessão de uso único e repetição da operação.

### 2.3 Smoke autenticado em navegador

Executado com Playwright/Chromium real em `http://localhost:3000`, contra o
backend local em `http://localhost:3100`.

Resultado: 8 verificações, 8 aprovadas, 0 falhas; nenhum erro fatal de página.

- Login autenticado.
- Contas bancárias carregaram o saldo real persistido.
- Fluxo de caixa abriu com realizado.
- Devoluções reais carregaram e exibiram o estado vazio correto, sem mocks.
- Categoria de treinamento foi criada pela tela, passando pelo modal de
  reautenticação e concluindo a escrita.
- Folha abriu, exibiu a limitação legal e leu uma rubrica real do banco.
- Nenhuma falha HTTP inesperada nas APIs dos cinco recursos.

Artefatos locais: `/tmp/opencode/electronish-smoke-*.png` e
`/tmp/opencode/konexus-browser-smoke.log`.

### 2.4 Smoke Electron

Executado em Linux com Electron `39.2.6`, versão da aplicação `1.4.2`,
`isPackaged: false`. Resultado: 7 verificações, 7 aprovadas, 0 erros fatais.

- Janela Electron isolada, com `contextIsolation` e sem `require` no renderer.
- Login funcionou no Electron.
- Contas bancárias, fluxo de caixa, devoluções, treinamentos e folha abriram.
- A limitação legal da folha foi exibida.

Isso valida o shell Electron em desenvolvimento no Linux. **Não valida** o
instalador Windows, assinatura, SmartScreen, atualização automática nem
persistência em uma instalação Windows nativa.

## 3. Cenários A–E

Definição usada nesta entrega:

| Cenário | Funcionalidade | Classificação | Evidência e ressalva |
| --- | --- | --- | --- |
| A | Contas bancárias | **Aprovado** | Testes backend, smoke HTTP com criação e saldo persistido, navegador e Electron. |
| B | Fluxo de caixa | **Aprovado** | Testes backend, leitura autenticada, tela no navegador/Electron. Títulos baixados são conciliação informativa; não são somados como realizado. |
| C | Devoluções de compra | **Aprovado** | Integração PostgreSQL cobre criação, aprovação, recebimento, estoque 10→8, crédito e idempotência; leitura e tela carregadas no navegador/Electron. A criação pela interface não foi exercitada contra um pedido real no banco de smoke por não haver pedido elegível semeado; o fluxo de API e persistência foi exercitado nos testes. |
| D | Treinamentos | **Aprovado** | Regras unitárias, backend de categorias/turmas/inscrições/presença/certificado, criação de categoria pela interface com reautenticação, navegador e Electron. |
| E | Folha gerencial | **Aprovado no escopo gerencial** | Rubricas versionadas, remuneração, competência, cálculo 3300/50/3250, aprovação, fechamento, integração financeira idempotente e interface validada. **Folha legal completa não foi aprovada**: faltam fontes normativas, vigências, encargos e validação especializada. |

Status do recorte legal da folha: **Bloqueado**. Não há alíquota inventada,
holerite, guia ou eSocial simulado.

## 4. Limitações declaradas

1. **Windows/Electron instalado: Não executado.** Não havia host Windows
   disponível. O checklist abaixo é reproduzível, mas não foi executado nesta
   entrega.
2. **NF-e de devolução: Bloqueado.** A pendência fiscal é registrada, mas não há
   emissão, transmissão ou autorização fiscal nesta versão.
3. **Folha legal: Bloqueado.** O cálculo é gerencial. Não há INSS, IRRF, FGTS,
   provisões legais, holerite, guia ou eSocial.
4. **Produção: Não executado.** Nenhum banco, credencial, deploy, release,
   commit ou push de produção foi usado.
5. **Tag:** `v1.4.2` permanece em
   `22fde71dd438bd940ec9b8168e5c1ab0f2f12a80`; nenhuma release foi publicada.
6. O frontend mantém avisos ESLint e tamanho de bundle já existentes; o build
   terminou com sucesso e sem erro de TypeScript.

## 5. Checklist Windows/Electron (não executado)

Pré-requisitos:

- Windows 10/11 x64 em máquina virtual descartável.
- Backend de homologação com HTTPS, PostgreSQL migrado de `001` a `018` e
  usuário de teste com permissões mínimas.
- Instalador `Konexus-Setup-1.4.2.exe` construído em ambiente Windows ou por
  cross-build controlado; assinatura de código configurada quando disponível.
- Nunca usar credenciais, banco ou API de produção no teste.

Instalação:

1. Registrar o SHA-256 do instalador e verificar a origem.
2. Executar o instalador; validar SmartScreen/assinatura.
3. Confirmar atalhos e instalação em `%LOCALAPPDATA%\Programs\Konexus` (ou pasta
   escolhida).
4. Abrir o aplicativo e confirmar a versão `1.4.2`.

Execução:

1. Fazer login com o usuário de teste e selecionar o CNPJ de homologação.
2. Abrir Contas Bancárias, Fluxo de Caixa, Devoluções, Treinamentos e Folha.
3. Criar uma conta bancária, uma categoria de treinamento e uma rubrica.
4. Fechar e reabrir o aplicativo; confirmar que os dados persistem no backend e
   que a identidade local em `%APPDATA%\Konexus\installation.json` foi mantida.
5. Repetir a criação com a mesma chave de idempotência e confirmar ausência de
   duplicidade.
6. Validar mensagens de erro de rede, sessão expirada e reautenticação.

Desinstalação:

1. Configurações > Aplicativos > Konexus > Desinstalar.
2. Confirmar remoção do executável e dos atalhos.
3. Verificar se `%APPDATA%\Konexus` foi removido ou preservado, registrando a
   decisão.
4. Confirmar que os dados de negócio permanecem no backend e que a remoção do
   cliente não apaga registros por efeito colateral.

## 6. Conclusão

A entrega local está tecnicamente validada para os cinco fluxos, com backend,
migrações, permissões, auditoria, reautenticação, telas reais, testes
automatizados, smoke HTTP autenticado, navegador real e shell Electron Linux.
Não há autorização nem evidência para declarar homologação Windows, emissão
fiscal de devolução ou folha legal completa.
