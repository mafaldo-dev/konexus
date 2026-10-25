# Relatório de pendências — 25/10/2026

Este relatório consolida o estado real da branch `feat/offline-sales-closure` depois da aplicação das migrations 021, 022 e 023 no Neon e da implementação local da primeira fatia de compras (migration 024). Ele separa o que foi executado do que continua pendente. Não representa autorização para merge, deploy ou liberação comercial.

## 1. Estado executado nesta rodada

- Backup custom do Neon criado antes da aplicação, fora do repositório:
  - `/home/dev/backups/konexus/dumps/neon-pre-apply-021-023-20261025T173904Z.dump`
  - 622.023 bytes, modo 0600, SHA-256 `60ba4f8d6c1a5aa9caef24fc415d3180d03fb7a44df6da3fcd93369cd0f14950`.
- O backup foi restaurado em PostgreSQL local descartável (`konexus_neon_restore_20261025`) com `pg_restore --exit-on-error`. As contagens de negócio foram preservadas: 9 organizações, 9 CNPJs, 17 colaboradores, 10 pedidos.
- As migrations 021, 022 e 023 foram aplicadas primeiro nessa restauração e validaram:
  - índices únicos de numeração de pedido;
  - tabelas, índices, constraints, funções e triggers de reservas de domínio e recibos idempotentes;
  - ausência de duplicidade de números de pedido;
  - exercício transacional de trigger/constraint com rollback e zero linhas residuais.
- As mesmas migrations foram aplicadas no Neon com `psql`, `ON_ERROR_STOP=1`, TLS `verify-full` com raízes do sistema e transação por arquivo. O pós-check confirmou:
  - contagens de negócio inalteradas;
  - `uq_orders_company_entity_number` e `uq_orders_company_number_without_entity` ativos;
  - `domain_reservations`, `domain_reservation_targets` e `offline_domain_operations` criadas;
  - triggers de CNPJ/escopo e recibo único presentes;
  - zero reservas e zero operações semeadas em produção.
- O exercício de schema foi repetido no Neon dentro de transação e revertido: triggers de CNPJ, alvo ativo único, escopo de CNPJ e check de ação/domínio funcionaram; `reservas_apos_rollback=0` e `operacoes_apos_rollback=0`.
- `/health/release` permaneceu em `1.4.3`, `ready:true`, commit `fa1678ee45216f4e4532f6e03ed5644c638ac3a7`.
- Nenhum merge, deploy, release ou movimentação de tag foi executado. `v1.4.3` continua em `29c8bc34fab50795ded6df4511686eca03231cda`; `v1.4.2` continua em `22fde71dd438bd940ec9b8168e5c1ab0f2f12a80`.

## 2. O que já está entregue

- Vendas com reserva de estoque por estação, pedido offline idempotente, número `P-` atribuído pelo servidor, ACK exato e NF-e adiada até aprovação explícita.
- Financeiro a receber e a pagar, folha e contábil com reserva central exclusiva por alvo e operações finais offline idempotentes.
- SQLite v4 no Electron com snapshots, reservas e outbox de domínio cifrados, sem fallback em texto aberto, incluindo aprovação de compra.
- Área `/offline/domains` para atualizar snapshot, reservar, enfileirar, sincronizar, retomar e reconciliar, agora com a aba Compras.
- Migrations 019 a 023 aplicadas no Neon; 021 a 023 aplicadas nesta rodada. A migration 024 está aplicada somente em bancos locais/restauração.
- Backend **205/205**, frontend **169/169**, Electron **54/54**, integrações PostgreSQL de domínio **11/11**, compra **1/1** e HTTP **1/1**, reexecutados após a implementação da fatia de compras.

## 3. Pendências priorizadas

| Prioridade | Pendência | Estado / bloqueio |
|---|---|---|
| P0 | Rotação da senha do Neon e do `JWT_SECRET` | **Adiada por decisão do responsável.** Não executar agora; permanece gate de go-live. |
| P0 | Merge, deploy e release da branch | Não autorizados. As migrations 021–023 estão no Neon; a 024 ainda não. O código 021–024 não está publicado. Exige validação final e confirmação. |
| P0 | Windows E2E do schema v4 e das operações de domínio | Ainda não executado. O smoke Windows anterior cobria schema v2/rascunhos. |
| P1 | Offline dos demais setores | Em andamento. Primeira fatia implementada localmente: aprovação offline de pedido de compra (ver seção 4); falta aplicar a migration 024 no Neon e homologar no Windows. |
| P1 | Estoque offline por dispositivo | Pendente. Vendas já reserva estoque; movimentos internos, transferências e ajustes ainda não têm reserva/outbox. |
| P1 | CRM offline | Pendente. Leads, oportunidades e atividades continuam dependendo da central. |
| P1 | RH/treinamentos offline | Pendente. Inscrições, presença e conclusão não têm réplica/outbox. |
| P1 | Fiscal offline | Pendente e parcialmente bloqueado: NF-e autorizada só pode existir com resposta real; contingência exige modalidade válida. |
| P1 | Devoluções de compra offline | Pendente. O fluxo online existe, mas não há reserva/outbox por dispositivo. |
| P1 | Cadastros e administração offline | Pendente. Produtos, clientes, fornecedores, usuários e permissões exigem controle de versão/conflito explícito. |
| P1 | NF-e de pedido online pendente | Pendente. O fluxo offline nasce `aguardando_aprovacao`; o pedido online pendente ainda agenda emissão na criação. Falta a UI de aprovação pendente → aprovado. |
| P2 | Folha legal completa, eSocial e holerite | Fora do escopo atual. O modelo `clt_monthly_2026` é restrito e não substitui apuração legal completa. |
| P2 | Integrações bancárias e fiscais reais | Bloqueadas por credenciais, certificados e ambientes externos. Nenhuma transmissão real foi simulada como aprovada. |
| P2 | Reserva órfã / resposta perdida | Existe reconciliação manual; não há liberação automática por expiração. |
| P2 | Navegador sem Electron | Continua limitado a rascunhos IndexedDB e pedido online; não há PWA/service worker nem operações de domínio offline. |
| P3 | Pentest externo e validação exaustiva de ataque | Não executados. Segurança absoluta não pode ser garantida. |
| P3 | Backup SQLite portátil | O backup local depende do cofre da mesma máquina/usuário; não é portátil entre computadores. |

## 4. Primeiro passo executado: aprovação offline de pedido de compra

Escopo deliberadamente restrito, reutilizando o padrão de reserva + outbox + recibo idempotente:

- Domínio `purchase_order`, ação `approve`.
- Alvo elegível: `ordersrequest.orderstatus = 'pending'`, no CNPJ ativo.
- Permissão: `compras.edit`; módulo `compras`; estação registrada e CNPJ explícito.
- Endpoints implementados:
  - `POST/GET /offline-reservations/purchase-orders`
  - `GET /offline-reservations/purchase-orders/all`
  - `POST /offline-reservations/purchase-orders/:id/cancel`
  - `POST /offline-reservations/purchase-orders/:id/reconcile`
  - `POST /offline-domain-operations/purchase-orders/:id/approve`
- A operação consome a reserva e altera `orderstatus` para `approved` na mesma transação. Ela **não** recebe estoque, não cria conta a pagar, não emite documento fiscal e não altera valores.
- A migration aditiva `024_purchase_order_offline_approval.sql` amplia os checks de domínio/ação. Ela foi aplicada e exercitada nos bancos locais de teste e na restauração validada do Neon; **ainda não foi aplicada no Neon**.
- O Electron foi elevado ao schema v4 para aceitar o novo domínio/ação nas constraints SQLite, com migração v3 → v4 preservando rascunhos, reservas, tokens e outbox existentes. A migração restaura `foreign_keys` mesmo em falha.
- A UI `/offline/domains` ganhou a aba Compras e a seção administrativa de `/offline` passou a considerar `compras.edit`.

Esse passo não deve ser descrito como "compras offline completo". Recebimento físico, entrada fiscal, estoque, contas a pagar e criação offline de pedidos continuam pendentes.

### Testes executados nesta fatia

- Backend total: **205/205** (a nova integração de compra passou **1/1**).
- Frontend total: **169/169**; o arquivo de domínio passou **17/17**.
- Electron total: **54/54**; o arquivo de SQLite passou **30/30**, incluindo migração v3 → v4 e compra.
- `tsc --noEmit`, build Vite e `npm audit --omit=dev` (frontend e backend) sem vulnerabilidades.
- A migration 024 foi aplicada na restauração local do Neon e os checks de domínio/ação foram conferidos; não houve aplicação em produção.
- O teste HTTP autenticado de operações offline continua **1/1** e agora cobre a rota de compra: `403` sem permissão, `404` com CNPJ divergente, `201` na aprovação, `200` no replay, `409` no conflito e consumo da reserva. A matriz de operações protegidas também cobre a nova rota.
- Commits desta fatia: backend `31cd530`, frontend `a817629`, ambos na branch `feat/offline-sales-closure`; não mergeados nem publicados.

## 5. Critérios para a próxima liberação

1. Testes backend/frontend/Electron e integração PostgreSQL da nova fatia aprovados — **concluído nesta rodada**.
2. Migration 024 aplicada no Neon somente após novo backup, restauração e preflight; 021–023 já estão aplicadas — **pendente**.
3. Windows E2E do schema v4 e das operações de domínio aprovado — **pendente**.
4. Revisão de permissões, auditoria, idempotência e isolamento multi-CNPJ — **coberta por testes automatizados; revisão manual final pendente**.
5. Confirmação explícita para merge/deploy e, no go-live, rotação das credenciais — **pendente**.
