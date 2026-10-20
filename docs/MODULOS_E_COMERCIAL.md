# Módulos, freemium e contratações

Este documento descreve a classificação comercial dos módulos do Konexus ERP,
onde cada decisão é tomada e como o menu, as rotas e o backend ficam
coerentes entre si.

## Classificação atual

| Módulo | Chave | Situação | Contratação |
| --- | --- | --- | --- |
| Dashboard | `dashboard` | Freemium | — |
| Gestão | `gestao` | Freemium | — |
| Vendas | `vendas` | Freemium | — |
| Compras | `compras` | Freemium | — |
| Estoque | `estoque` | Freemium | — |
| RH | `rh` | Freemium | — |
| Financeiro | `finance` | **Freemium** | — |
| CRM | `crm` | Extra | Independente, registrada pelo suporte |
| Contábil | `contabil` | Extra (associado ao Financeiro) | Independente, registrada pelo suporte |
| NF-e | `nfe` | Extra | Independente, registrada pelo suporte |

Regras:

1. O Financeiro faz parte do freemium. As funcionalidades financeiras básicas,
   a liberação de pedidos de venda e a verificação de crédito não dependem de
   contratação extra.
2. O CRM permanece fora do freemium.
3. O Contábil é um recurso extra **associado ao Financeiro**, mas contratado
   de forma independente. O acesso ao Financeiro básico não o libera.
4. A NF-e continua extra e independente.
5. Contratar NF-e não ativa CRM nem Contábil; contratar CRM não ativa NF-e.
6. Disponibilidade comercial **não** concede acesso irrestrito: as permissões
   individuais (cargo + exceções) continuam valendo, e o administrador da
   empresa não acessa extras não contratados.
7. Não há cobrança automática. As contratações são registradas pelo suporte.

## Classificação anterior (e o que estava errado)

| Módulo | Antes | Problema |
| --- | --- | --- |
| Financeiro | Extra (`is_paid = true`) | Dependia de contratação extra para usar o módulo; sumia do freemium e as rotas de pagamento respondiam `403 SUBSCRIPTION_REQUIRED`. |
| CRM | Padrão (`is_paid = false`) | Fica disponível para toda empresa, aparecia no menu de empresas sem contratação. |
| Contábil | Inexistente no catálogo | Não era possível registrar a contratação (restrição `CHECK` do banco). |
| NF-e | Extra | Correto. |

A causa era a divergência entre três fontes: a coluna `modules.is_paid` do
banco, o catálogo do backend e o menu do frontend. A classificação agora
existe em **um único lugar** no código e o banco é apenas mantido alinhado.

## Onde cada decisão é tomada

| Decisão | Onde | Observação |
| --- | --- | --- |
| Classificação padrão/extra | `konexus-back/src/domain/security/moduleCatalog.js` | **Fonte de verdade.** `STANDARD_MODULE_KEYS` e `EXTRA_MODULE_KEYS`. |
| Módulos disponíveis para a empresa | `konexus-back/src/domain/repositories/authRepository.js` (`findAccessibleModules`) | Usa as listas do catálogo como parâmetros; a flag `is_paid` do banco não decide o acesso. |
| Permissões por módulo/ação | `konexus-back/src/domain/security/moduleCatalog.js` (`MODULE_CATALOG`) | Exposta ao frontend em `GET /collaborators/permissions/catalog`. |
| Bloqueio de extras nas rotas | `konexus-back/src/http/middleware/subscription.js` (`checkSubscription`) | Só para `crm`, `contabil` e `nfe`. |
| Permissão individual | `konexus-back/src/http/middleware/authorization.js` | `requirePermission` / `requireAnyPermission`. |
| Contratação por empresa | `company_extra_modules` | Uma linha por empresa e módulo; ausência = não contratado. |
| Menu lateral | `konexus/src/utils/moduleMapping.ts` + `AuthContext.filterMenu` | Filtra por módulo disponível **e** permissão individual. |
| Rotas internas | `konexus/src/utils/moduleMapping.ts` (`canAccessRoute`) | Mesmo critério do menu; esconder o item não é segurança. |
| Estado comercial exibido ao cliente | `konexus/src/pages/planos/index.tsx` | Consome `getCommercialOverview` do backend. |
| Contratação pelo suporte | `konexus/src/pages/system-admin/ExtraModulesTab.tsx` | Oferece apenas CRM, Contábil e NF-e. |

## Regra de acesso aplicada

```
acesso = módulo disponível para a empresa  AND  (admin da empresa  OR  permissão individual)
```

- **Módulo disponível**: padrão (sempre) ou extra com contratação ativa.
- **Permissão individual**: ação específica dentro do módulo (ex.: `finance:approve`).

O backend aplica a mesma regra com `checkModule` + `requirePermission`, e a
resposta do login carrega `modules` e `permissions` para o frontend.

## Preservação da liberação de pedidos e da verificação de crédito

O fluxo de pedidos de venda continua igual:

1. O pedido é criado em `/orders/create` (`vendas:create`).
2. A alteração de status acontece em `/orders/:id/status` (`vendas:edit`).
3. A análise de crédito aparece na tela de pedidos quando o módulo Financeiro
   está disponível (`hasModule("finance")`).
4. Um pedido com crédito **pendente** ou **reprovado** não pode ser editado
   nem liberado; a regra está em
   `konexus/src/pages/sales/orders/purchase-order/creditRules.ts`
   (`blocksOrderRelease`).
5. A aprovação/baixa de pagamento continua exigindo `finance:approve` em
   `PUT /payments/:orderId/status` e `PUT /payments/:id/mark-payd`.

O que mudou: o Financeiro passou a estar disponível no freemium, então essas
rotas deixaram de exigir contratação extra (`checkSubscription("finance")`).
Nenhum limite, cálculo ou aprovação foi alterado — apenas a exigência
comercial do acesso.

## Migração de dados

`konexus-back/migrations/006_module_classification_freemium.sql`:

- `modules.is_paid`: `finance` → `false`, `crm` → `true`;
- criação do módulo `contabil` (`is_paid = true`);
- Constraint de `company_extra_modules` ampliada para
  `('crm', 'contabil', 'nfe', 'finance')` — antes era `('finance', 'nfe')`, o
  que impedia registrar CRM e Contábil;
- contratos antigos de Financeiro encerrados com nota e registrados em
  `company_module_events` (histórico preservado, nada apagado);
- plano gratuito legado alinhado ao conjunto padrão.

Aplicação (backup recomendado):

```bash
cd konexus-back
node run_migration.js migrations/006_module_classification_freemium.sql
```

**Status:** aplicada em 20/10/2026 no banco de produção (Neon), após validação
em transação com `ROLLBACK` (9 statements, 0 falhas) e conferência do estado
resultante:

```
modules: compras=false, contabil=true, crm=true, dashboard=false, estoque=false,
         finance=false, gestao=false, nfe=true, rh=false, vendas=false
constraint: CHECK (module_key IN ('crm','contabil','nfe','finance'))
contratos antigos de Financeiro: 4 encerrados (com nota e evento de histórico)
```

A migração é idempotente: pode ser reexecutada sem efeito colateral.

## Testes relacionados

- `konexus-back/tests/unit/moduleClassification.test.js` — classificação e migração.
- `konexus-back/tests/unit/accessibleModules.test.js` — disponibilidade e rotas.
- `konexus-back/tests/unit/subscriptionPolicy.test.js` — independência das contratações.
- `konexus/src/utils/moduleMapping.test.ts` — menu, submenus e rotas.
- `konexus/src/pages/sales/orders/purchase-order/creditRules.test.ts` — crédito.
- `konexus-back/e2e/freemium_multitenant.js` — ponta a ponta (exige banco e API).
