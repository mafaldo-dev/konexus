# Módulo de Contabilidade (frontend)

**Documentação completa (API, tabelas, regras, seed e limitações):**
[`konexus-back/docs/MODULO_CONTABILIDADE.md`](../konexus-back/docs/MODULO_CONTABILIDADE.md)

## Onde fica

`konexus/src/pages/Financial/accounting/` — telas do módulo.

| Tela | Rota | Permissão |
| --- | --- | --- |
| Painel contábil | `/financer/contabilidade/painel` | `contabil:reports` |
| Plano de contas | `/financer/contabilidade/plano-de-contas` | `contabil:manage_plan` |
| Lançamentos | `/financer/contabilidade/lancamentos` | `contabil:create` |
| Livro diário | `/financer/contabilidade/livro-diario` | `contabil:reports` |
| Livro razão | `/financer/contabilidade/livro-razao` | `contabil:reports` |
| Balancete | `/financer/contabilidade/balancete` | `contabil:reports` |
| Balanço patrimonial | `/financer/contabilidade/balanco-patrimonial` | `contabil:reports` |
| Demonstração do resultado | `/financer/contabilidade/demonstracao-resultado` | `contabil:reports` |
| Conciliação | `/financer/contabilidade/conciliacao` | `contabil:reconcile` |
| Exercícios e períodos | `/financer/contabilidade/exercicios` | `contabil:manage_periods` |
| Ativos imobilizados | `/financer/contabilidade/ativos` | `contabil:manage_assets` |
| Relatórios | `/financer/contabilidade/relatorios` | `contabil:reports` |
| Configurações | `/financer/contabilidade/configuracoes` | `contabil:settings` |

## Navegação

O grupo **Contabilidade** fica dentro de **Financeiro** no menu lateral
(terceiro nível, suportado por `MenuItem`). O grupo só aparece quando a
empresa tem o adicional contratado e o usuário tem a permissão — a mesma
regra aplicada pelo backend.

## Contratação

O módulo é um **extra do Financeiro**: a tela só aparece para empresas com a
contratação ativa (`company_extra_modules`, chave `contabil`). Não há cobrança
automática — a contratação é registrada pelo suporte.

## Reautenticação

As operações de escrita (criar/editar/contabilizar/estornar lançamentos, plano
de contas, períodos, mapeamentos, ativos, depreciação e conciliação) exigem
confirmação de identidade por senha. O fluxo é o mesmo do restante do ERP:

1. a API responde `403 REAUTH_REQUIRED`;
2. o `ReauthProvider` abre o modal **“Confirme sua identidade”**;
3. o backend valida a senha e devolve uma concessão de uso único;
4. a requisição é repetida com a concessão e só então a operação é executada.

## Arquivos

- `src/services/accountingService.ts` — chamadas da API do módulo.
- `src/pages/Financial/accounting/components.tsx` — componentes compartilhados
  (tabela, cartões, modais, badges, formatação de moeda e data).
- `src/pages/Financial/accounting/*.tsx` — telas.
- `src/pages/Financial/accounting/accountingAccess.test.ts` — regras de acesso.
