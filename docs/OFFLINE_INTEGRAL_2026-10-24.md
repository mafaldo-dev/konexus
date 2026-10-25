# Offline integral em computadores isolados

> Estado mais recente: [continuidade de 25/10/2026](CONTINUIDADE_2026-10-25.md), incluindo aplicação da migration 024 no Neon e correção de aprovação/NF-e online. As referências abaixo a 024 pendente registram a etapa anterior.

## Decisões confirmadas pelo usuário

1. Os computadores podem perder também o acesso entre si; não se pode depender de servidor LAN.
2. Operações concorrentes devem respeitar **reservas/cotas por dispositivo**, em vez de confirmar tudo sem disponibilidade conhecida.
3. Os registros locais devem chegar ao banco original após a reconexão, sem duplicidade ou sobrescrita silenciosa.

## Estado real desta branch

**O ERP integral offline ainda não está implementado.** O desktop já cobre rascunhos e pedidos de venda com reserva de estoque por estação. Nesta branch, também mantém cópia local cifrada dos alvos elegíveis, reservas e fila de operações finais de títulos a receber, contas a pagar, competências de folha, períodos contábeis e, agora, aprovação de pedidos de compra. Essas operações offline são restritas a baixar, fechar, reabrir, bloquear ou aprovar alvos que já existem na central; não criam títulos, não calculam folha, não geram lançamentos contábeis, não movimentam banco, não recebem estoque e não geram conta a pagar. Ainda não há réplica geral, criação offline, recebimento de compras, fiscal ou CRM; documentos fiscais e os demais setores continuam sem reserva por dispositivo. Não publicar esta branch como "offline completo".

## Atualização em andamento — fechamento do offline de vendas

Trabalho na branch `feat/offline-sales-closure`, ainda **não publicado**. Ele fecha três lacunas do fluxo de vendas já entregue:

- **Numeração única**: a migration aditiva `021_order_number_uniqueness.sql` cria índices únicos por organização/CNPJ para `Orders.orderNumber`. Online e offline compartilham a série `P-`; as duas gravações usam o mesmo advisory lock por CNPJ e a violação do índice vira HTTP 409, inclusive se um cliente tentar gravar diretamente no banco. A migration foi aplicada no Neon em 25/10/2026 após backup custom, restauração validada e preflight; a branch continua sem merge/deploy.
- **Administração de reservas**: a área `/offline` agora expõe, para quem tem `vendas.edit`, todas as reservas do CNPJ (`GET /orders/reservations/all`) com usuário, estação, estado, quantidade, validade e pedido. A reconciliação (`POST /orders/reservations/:id/reconcile`) exige motivo e reautenticação. O item também aparece em Vendas → Reservas offline para Administrador/Gestor/Gerente.
- **NF-e de pedido offline**: pedido offline nasce com `nfe_status=aguardando_aprovacao` e **não** agenda emissão na criação. A transição para `approved` em `PUT /orders/:id/status` reivindica a emissão uma única vez e agenda a NF-e. Pedido online mantém o comportamento anterior; a definição fiscal para pedido online pendente continua pendente.

Validação executada nesta etapa: backend **205/205**, frontend **169/169**, `tsc --noEmit`, build Vite e Electron **54/54** aprovados; integração SQLite/API/PostgreSQL de reservas de estoque **11/11**, de reservas de domínio **11/11**, de aprovação offline de compra **1/1** e HTTP autenticado de operações offline **1/1**. As migrations 021, 022 e 023 foram aplicadas no Neon em 25/10/2026; a 024 está aplicada somente nos bancos locais de teste/restauração e ainda depende de nova rodada de backup/preflight antes do Neon. A branch não foi mergeada nem publicada.

Entregue nesta etapa:
- **SQLite real no processo principal do Electron** (`node:sqlite` do Electron 45), com WAL, `synchronous=FULL`, foreign keys, transações `BEGIN IMMEDIATE`, verificação de integridade na abertura e schema versionado (`user_version=3`).
- **Criptografia de conteúdo**: rascunhos, reservas e operações da fila são cifrados com AES-256-GCM, com AAD vinculando escopo, revisão/operação e identificadores. A chave de 32 bytes é protegida pelo cofre do sistema (`safeStorage`) e gravada apenas cifrada. Linux com backend `basic_text` é recusado; não há fallback em texto aberto.
- **Reserva de estoque por estação**: criada online com reautenticação, vinculada a organização, CNPJ, usuário, estação registrada e itens. A central incrementa `product_stock.reserved`; a venda online e as saídas passam a usar `stock - reserved`. A reserva expirada não devolve estoque automaticamente.
- **Pedido offline**: a estação grava a reserva e a operação em SQLite antes de enfileirar o pedido. Na reconexão, o servidor valida o token de posse, escopo, estação e itens, consome a reserva uma única vez e baixa o estoque físico na mesma transação. O servidor atribui número `P-<n>` (mínimo 100) e força `pending`; número e status enviados pelo cliente são ignorados.
- **Fila transacional (outbox)**: documento e operação são gravados na mesma transação. A operação tem estado `pending`/`leased`/`blocked`, lease de 60 s, tentativas com backoff, mesmo UUID após reinício e confirmação somente quando o servidor devolve exatamente o pedido, o número e a reserva esperados. O schema v4 aplica o mesmo padrão às operações finais de financeiro, folha e contábil.
- **Concorrência local**: revisão esperada impede sobrescrita entre janelas; edições pendentes são coalescidas sem apagar uma operação em trânsito; uma gravação já enfileirada não cria revisão nova depois que o pedido entrou na fila imutável.
- **Migração do IndexedDB**: rascunhos antigos são importados preservando `draftId`/`revisionId`, com conferência de leitura e marcador idempotente. Os originais cifrados no IndexedDB não são apagados.
- **Migração SQLite v1/v2 → v3**: a abertura executa apenas tabelas novas (`offline_domain_snapshots`, `offline_domain_reservations`, `offline_domain_outbox`) e índices; rascunhos, reservas de estoque, pedidos e recibos existentes não são reescritos. Banco de versão futura falha fechado sem alteração.
- **Backup local**: `VACUUM INTO` gera cópia consistente do SQLite v3, acompanhada da chave cifrada e de manifesto com SHA-256. O backup só é recuperável no mesmo contexto de usuário/máquina do cofre; não é um backup portátil entre computadores.
- Rascunhos/pedidos separados por usuário/organização/CNPJ, revisão imutável no PostgreSQL e rejeição de proprietário diferente.
- Área `/offline` recupera o rascunho SQLite quando a API está inacessível, inclusive após reiniciar o aplicativo. Não concede permissões online a partir do cache. A mesma área lista reservas ativas e permite recuperar reservas órfãs da estação com reautenticação.
- Pedidos novos admitem `clientRequestId`, bloqueio transacional e hash do conteúdo. Reenvio não duplica pedido, estoque, recebível ou agendamento fiscal. Conteúdo diferente com a mesma chave é recusado.
- Migrations aditivas `019_offline_sales_drafts.sql` e `020_stock_reservations.sql` aplicadas no Neon de produção em 24/10/2026, após backup custom, restauração validada em banco temporário local e preflight das duas migrations sobre essa cópia. As migrations 015–018 já estavam aplicadas; as tabelas, colunas, índices e triggers de 019/020 foram conferidos no Neon após a aplicação.

O navegador continua usando IndexedDB cifrado e ainda depende de carregar os arquivos da aplicação; não foi entregue PWA/service worker. O cofre do sistema protege o usuário do SO, não substitui um protocolo de autenticação offline por usuário do ERP. **Reserva e pedido offline exigem Electron/SQLite e estação pareada**; no navegador restam rascunhos cifrados e pedido online. Também não há resolução visual completa de conflito bloqueado; o rascunho é preservado e a UI mostra o código, mas a decisão continua manual.

### Verificação executada em 24/10

- Backend: **205/205** testes aprovados, zero falhas e zero skips, incluindo PostgreSQL real, integração de reservas (concorrência, token, expiração, cancelamento, reconciliação, unicidade do número e NF-e após aprovação) e HTTP autenticado das operações offline de domínio.
- Frontend: **169/169** testes, TypeScript e build aprovados; `npm audit` sem alertas. Inclui testes de reservas/pedidos offline, da API/fila de domínio e da ponte renderer→IPC (load/save, ACK exato, ACK divergente bloqueado e normalização de erro).
- Electron: **54/54** testes, incluindo SQLite real, transação atômica, conflito entre conexões, lease/expição, reenvio do mesmo UUID, migrações v1→v4, v2→v4 e v3→v4 idempotentes, disco cheio com preservação do rascunho anterior, dois dispositivos isolados, backup restaurável/adulteração detectada, encerramento abrupto após COMMIT, cofre indisponível falhando fechado, reserva cifrada, token de posse, cancelamento forçado, snapshots/reservas/outbox de domínio e criação/reabertura do cofre com chave protegida.
- Integração SQLite → API local → PostgreSQL (rascunhos): **10/10** verificações. Inclui queda de rede real (porta fechada), reinício, perda de confirmação, backup antigo reenviado sem duplicar revisão, conflito de conteúdo, isolamento por CNPJ e ausência de texto aberto no arquivo SQLite.
- Integração SQLite → API local → PostgreSQL (reservas/pedidos): **11/11** verificações. Inclui estação pareada e reautenticação reais, reserva online, gravação cifrada, fila offline imutável, número `P-` mínimo 100, status forçado `pending`, consumo exato, ACK exato, perda de ACK após reinício, reenvio idempotente sem baixar estoque duas vezes, rejeição de conteúdo divergente com o mesmo UUID e ausência do token de posse em texto aberto nos arquivos SQLite. Perfil sintético `qa.*`; nenhum banco de produção foi usado.
- Navegador (fallback IndexedDB): **6/6** verificações aprovadas — queda da API, recuperação após reinício, conflito entre janelas sem sobrescrita, resposta HTTP 200 com confirmação inválida rejeitada, reconexão com revisão persistida e ausência de formulário em texto aberto no IndexedDB. A confirmação inválida é uma injeção de falha do teste, não um mock do produto.
- Aplicativo Electron local: login e sete rotas principais abriram sem erro de página. Em Linux sem cofre, o pedido SQLite foi recusado com mensagem explícita e o aplicativo permaneceu utilizável (sem fallback inseguro).
- Criptografia Windows anterior: **aprovada** em [run 40098318327](https://github.com/mafaldo-dev/konexus/actions/runs/40098318327), commit `330a6c5` (somente `safeStorage`, antes do SQLite).
- **SQLite no Windows instalado (histórico, somente rascunhos): aprovado** em [run 40101652759](https://github.com/mafaldo-dev/konexus/actions/runs/40101652759), commit `af7773c`.
- **Execução Windows (histórico, somente rascunhos): aprovada** em [run 40102304004](https://github.com/mafaldo-dev/konexus/actions/runs/40102304004), commit `baacbca`. Revalidou instalação NSIS, SQLite persistente após reinício, backup, cofre, identidade, desinstalação, **131 testes frontend**, **37 Electron** e audit zero.
- **Windows no commit atual: aprovado** em [run 40109176563](https://github.com/mafaldo-dev/konexus/actions/runs/40109176563), commit `0cfd06d`. Revalidou instalação NSIS, login renderizado, identidade persistente, cofre, SQLite real, rascunho persistente após reinício, backup cifrado, desinstalação, **146 testes frontend**, **46 Electron**, audit zero e build. O smoke Windows não cria reserva/pedido offline porque não sobe API/PostgreSQL no runner; o fluxo de reserva foi homologado no Linux contra PostgreSQL local. **Esta execução é anterior ao schema v4, às operações de domínio e à aprovação de compras; a nova fatia ainda não foi reexecutada no Windows.**

As mudanças desta etapa foram integradas em `main`. As migrations 019/020 foram aplicadas ao Neon em 24/10/2026 após backup completo e restauração validada; o backend 1.4.3 está publicado no commit `fa1678ee45216f4e4532f6e03ed5644c638ac3a7` com `/health/release` em `ready:true`. A release 1.4.3 do frontend foi publicada em 24/10/2026 às 16:15:13 UTC no commit `29c8bc34fab50795ded6df4511686eca03231cda` ([workflow 40110305595](https://github.com/mafaldo-dev/konexus/actions/runs/40110305595)); o autoUpdater foi verificado por `scripts/audit-update-flow.mjs --tag v1.4.3`.


### Operação e recuperação do SQLite

- Banco: `%APPDATA%/Konexus/offline/konexus.sqlite` no Windows (o caminho exato vem de `userData` do Electron), com WAL e permissões restritas. A chave fica em `key.v1.enc`, cifrada pelo cofre do sistema. O schema v4 guarda rascunhos, reservas de estoque, outbox de pedidos, snapshots de alvos, reservas de domínio, outbox de operações finais e aprovação de pedidos de compra.
- Backup: botão **Criar backup local protegido** na área `/offline`; gera `offline/backups/<data>-<uuid>/` com `konexus.sqlite`, `key.v1.enc` e `manifest.json` (SHA-256). A cópia é consistente, mas continua dependente do cofre do mesmo usuário/máquina.
- Se a chave sumir, o aplicativo **não cria outra** silenciosamente sobre um banco existente: ele falha e preserva os arquivos para recuperação.
- Se o cofre estiver indisponível (por exemplo, Linux sem keyring), o SQLite não abre e o app não grava rascunho/reserva em texto aberto. O restante do sistema online continua funcionando.
- Antes de restaurar um backup, feche o aplicativo; restaure banco e chave no mesmo diretório; abra o app e confira a contagem de pendências. Um backup antigo não deve ser usado como verdade absoluta: o servidor idempotente devolve a mesma confirmação e não duplica a revisão/pedido, mas reservas e operações criadas depois do backup podem ter sido perdidas no intervalo.
- O módulo `node:sqlite` ainda é marcado como experimental no Electron 45/Node 24. A versão do Electron está fixada; qualquer atualização precisa reexecutar os testes de SQLite, migração, backup e Windows antes de publicar.

### Reservas e pedidos offline de vendas

O fluxo entregue é deliberadamente restrito a vendas com estoque:

1. **Estação registrada**: o administrador cadastra a estação em `Configurações > Estações` e gera um código de pareamento exibido uma única vez. O código é gravado no computador (localStorage) e enviado em `X-Station-Token` também no Electron. A estação identifica o ambiente; ela **não é prova de identidade**. Depois do pareamento é necessário sair e entrar novamente para a sessão carregar `stationId`/`stationName`.
2. **Reserva online**: com a estação registrada, o formulário pede reautenticação e chama `POST /orders/reservations` com os itens e o TTL. A central valida empresa/CNPJ/usuário/estação, incrementa `product_stock.reserved` e devolve um token de posse. O token só é gravado no SQLite cifrado; não é exibido na listagem nem reutilizado como senha.
3. **Pedido offline**: o formulário enfileira um pedido com UUID de operação, itens exatos e a reserva. A fila é imutável: o status local fica `queued`, não há aprovação local e o número provisório é ignorado. Uma reserva só pode ser usada por um pedido local por vez.
4. **Sincronização**: `POST /orders/offline-create` valida o token, o escopo, a estação registrada e a correspondência exata dos itens; verifica `stock - reserved`; consome a reserva e baixa o estoque físico na mesma transação; grava a chave idempotente do pedido. O número é atribuído sob lock consultivo como `P-<n>` (mínimo 100) e o status é forçado a `pending`.
5. **ACK exato**: a fila local só é confirmada se a resposta trouxer o mesmo pedido, o mesmo número e a mesma reserva. Reenvio com o mesmo UUID e o mesmo conteúdo devolve o pedido original sem duplicar estoque; conteúdo divergente com o mesmo UUID é recusado. Resposta perdida deixa a operação em lease até o vencimento e o reenvio é idempotente.
6. **Expiração e liberação**: reserva vencida **não** devolve estoque automaticamente. O consumo tardio é permitido e marcado como `consumed_after_expiry`. A liberação exige cancelamento/reconciliação explícita com reautenticação; cancelar uma reserva com pedido pendente usa `force` somente depois que a central confirma a liberação, removendo o journal local que não pode mais ser consumido.
7. **Recuperação de órfã**: se a resposta de criação se perder ou o cofre local não salvar o token, a reserva fica retida na central. A área `/offline` lista as reservas ativas da estação e permite cancelá-las com reautenticação. Não há liberação automática por tempo.

O que a reserva **não** vincula: preço unitário, desconto, total, cliente, vendedor, frete ou condição de pagamento. Esses campos continuam vindo do cliente e o servidor não recalcula o total a partir de uma tabela de preços. A reserva garante exclusividade de estoque/escopo/estação, não a exatidão comercial do pedido.

## Operações offline de financeiro, folha, contábil e compras

Trabalho na branch `feat/offline-sales-closure`, ainda **não publicado**. As migrations 022 e 023 completam a fatia financeiro/folha/contábil; a 024 adiciona a primeira fatia de compras. As 022 e 023 foram aplicadas no Neon em 25/10/2026 e a 024 está aplicada apenas em bancos locais:

- `022_domain_reservations.sql`: reserva central exclusiva de um alvo, vinculada a organização, CNPJ, domínio, estação e usuário. O índice único parcial sobre o alvo ativo impede que duas estações reservem o mesmo título, competência ou período.
- `023_offline_domain_operations.sql`: recibo idempotente da operação final, com `request_id`, hash do conteúdo, resultado JSON e vínculo com a reserva. A gravação ocorre na mesma transação do consumo da reserva e da alteração do alvo.
- `024_purchase_order_offline_approval.sql`: amplia os checks de domínio/ação para `purchase_order`/`approve`; não cria pedidos, estoque, conta a pagar ou documento fiscal.

Alvos elegíveis:

- **Financeiro a receber**: `order_payments` com status `pending`, `overdue` ou `due_today`.
- **Financeiro a pagar**: `payment_account` com status `pending` ou `overdue`.
- **Folha**: `payroll_competencies` com status `open`, `calculated` ou `approved`.
- **Contábil**: `accounting_periods` com status `open` ou `closed`.
- **Compras**: `ordersrequest` com status `pending`, somente para aprovação.

Cada reserva tem UUID, token de posse devolvido uma única vez, hash SHA-256 do token, usuário, estação registrada, CNPJ, validade (5 minutos a 7 dias), correlação e estados `active`/`consumed`/`cancelled`. A criação usa lock consultivo transacional. Expiração **não** libera o alvo automaticamente: o consumo tardio é permitido e marcado, e a liberação exige cancelamento do dono ou reconciliação administrativa com motivo e reautenticação.

### Endpoints de reserva

Todos exigem sessão, empresa, módulo, permissão, CNPJ e, para criação/cancelamento, estação registrada. Criação, cancelamento e reconciliação exigem `X-Reauth-Grant`.

| Domínio | Criar/listar da estação | Listar organização | Cancelar | Reconciliar |
|---|---|---|---|---|
| A receber | `POST/GET /offline-reservations/financial-receivables` | `GET .../all` | `POST .../:id/cancel` | `POST .../:id/reconcile` |
| A pagar | `POST/GET /offline-reservations/financial-payables` | `GET .../all` | `POST .../:id/cancel` | `POST .../:id/reconcile` |
| Folha | `POST/GET /offline-reservations/payroll-competencies` | `GET .../all` | `POST .../:id/cancel` | `POST .../:id/reconcile` |
| Contábil | `POST/GET /offline-reservations/accounting-periods` | `GET .../all` | `POST .../:id/cancel` | `POST .../:id/reconcile` |
| Compras | `POST/GET /offline-reservations/purchase-orders` | `GET .../all` | `POST .../:id/cancel` | `POST .../:id/reconcile` |

Permissões: `finance.approve` para reservar título a receber, `finance.edit` para conta a pagar e reconciliação financeira, `rh.approve_payroll` para folha, `contabil.manage_periods` para período contábil e `compras.edit` para pedido de compra. O contábil também exige o módulo extra `contabil` ativo.

### Operações finais idempotentes

| Operação | Endpoint | Permissão |
|---|---|---|
| Baixar título a receber | `POST /offline-domain-operations/financial-receivables/:id/settle` | `finance.approve` |
| Baixar conta a pagar | `POST /offline-domain-operations/financial-payables/:id/settle` | `finance.edit` |
| Fechar competência de folha | `POST /offline-domain-operations/payroll-competencies/:id/close` | `rh.approve_payroll` |
| Fechar período contábil | `POST /offline-domain-operations/accounting-periods/:id/close` | `contabil.manage_periods` |
| Reabrir período contábil | `POST /offline-domain-operations/accounting-periods/:id/reopen` | `contabil.manage_periods` |
| Bloquear período contábil | `POST /offline-domain-operations/accounting-periods/:id/lock` | `contabil.manage_periods` |
| Aprovar pedido de compra | `POST /offline-domain-operations/purchase-orders/:id/approve` | `compras.edit` |

Toda operação exige estação registrada, CNPJ explícito, `clientRequestId` UUID, `reservationId` e `reservationToken`. O servidor revalida módulo, permissão, CNPJ, estação, alvo, status e token; consome a reserva e grava o recibo na **mesma transação** da alteração. Um reenvio com a mesma chave devolve o resultado anterior (`200` e `replayed: true`); conteúdo diferente com a mesma chave retorna `409 OFFLINE_OPERATION_CONFLICT`. A baixa a receber preserva `transactionId` como `transaction_id` e as observações. Sem os campos de reserva, o comportamento online anterior permanece.

### Réplica local e fila no desktop

O schema SQLite v4 do Electron mantém três tabelas cifradas, sem fallback em texto aberto:

- `offline_domain_snapshots`: cópia local dos alvos elegíveis, separada por organização/CNPJ/usuário/domínio.
- `offline_domain_reservations`: reserva e token de posse, com estado efetivo e expiração.
- `offline_domain_outbox`: operação final imutável, com `clientRequestId`, payload, lease de 60 s, tentativas com backoff e estados `pending`/`leased`/`blocked`/`confirmed`.

A página `/offline/domains`, acessível por `Configurações` e pela área `/offline`, executa o fluxo:

1. Online, atualiza o snapshot a partir de `payments/all?limit=200`, `payment/accounts?limit=200`, `rh/payroll/competencies`, `accounting/periods` e `purchase/all?limit=200`, filtrando status elegíveis e o CNPJ ativo.
2. Ao escolher um alvo, cria a reserva na central com reautenticação. O token só é gravado no SQLite cifrado.
3. A operação é enfileirada no mesmo ato local; a fila é imutável e uma reserva só pode originar uma operação.
4. Na reconexão, a fila é retomada com o mesmo UUID. O ACK só confirma se domínio, ação, alvo, reserva e status coincidirem exatamente; caso contrário a operação fica bloqueada.
5. `401`/`403` de sessão, acesso ou estação bloqueiam a fila até nova autenticação; falhas transitórias voltam para `pending`; `409` e ACK divergente exigem decisão humana.
6. Cancelar uma reserva exige confirmação da central e só então remove a operação local pendente. Reserva já consumida não é apagada localmente sem reconciliação.

A seção administrativa em `/offline` continua listando reservas ativas do CNPJ para reconciliação; ela não cria reservas.

Validação executada: backend **205/205**, frontend **169/169**, Electron **54/54**, `tsc --noEmit` e build Vite aprovados. A integração real PostgreSQL cobre reservas de domínio **11/11**, aprovação offline de compra **1/1** e o HTTP autenticado das operações offline **1/1**, incluindo `401`, CNPJ obrigatório, estação, permissão, CNPJ divergente, criação `201`, replay `200`, conflito `409`, recibo único, consumo da reserva, baixa a pagar, fechamento de folha, fechamento/reabertura/bloqueio contábil, aprovação de compra e bloqueio por assinatura. As migrations 021, 022 e 023 foram aplicadas no Neon em 25/10/2026 após backup e restauração validados; a 024 está aplicada somente em `konexus_multi_test`, `konexus_e2e` e na restauração local. A branch não foi mergeada nem publicada.

## Aprovação offline de pedido de compra — primeira fatia de compras

A primeira fatia dos setores restantes é deliberadamente restrita à **aprovação de um pedido de compra já existente**:

- Domínio `purchase_order`, ação `approve`.
- Alvo elegível: `ordersrequest` com `orderstatus = 'pending'`, no CNPJ ativo.
- Permissão `compras.edit`, módulo `compras`, estação registrada e CNPJ explícito.
- A migration aditiva `024_purchase_order_offline_approval.sql` amplia os checks de domínio/ação no PostgreSQL. Ela foi aplicada e exercitada nos bancos locais e na restauração do Neon; **ainda não foi aplicada no Neon**.
- Endpoints: `POST/GET /offline-reservations/purchase-orders`, `GET /offline-reservations/purchase-orders/all`, `POST /offline-reservations/purchase-orders/:id/cancel`, `POST /offline-reservations/purchase-orders/:id/reconcile` e `POST /offline-domain-operations/purchase-orders/:id/approve`.
- A operação consome a reserva e altera `orderstatus` para `approved` na mesma transação, com recibo idempotente. As observações são opcionais e preservam o texto anterior quando não enviadas.
- A operação **não** recebe estoque, não cria conta a pagar, não movimenta banco e não emite documento fiscal. Recebimento físico, entrada fiscal, atualização de custo e geração financeira continuam pendentes.
- O schema SQLite v4 do Electron reconstrói as três tabelas de domínio para aceitar `purchase_order`/`approve`, preservando snapshots, reservas, tokens e outbox da versão v3. A migração v3→v4 é transacional e restaura `foreign_keys` mesmo em falha.
- A UI `/offline/domains` ganhou a aba **Compras**, com atualização de snapshot, reserva com reautenticação, enfileiramento, sincronização, ACK exato e reconciliação administrativa.

Testes executados nesta fatia: integração PostgreSQL de compra **1/1** (reserva exclusiva, alvo não pendente, isolamento por CNPJ, aprovação, replay, conflito de conteúdo, recibo único e consumo), Electron **30/30** no arquivo de SQLite (incluindo v3→v4 e compra), frontend **17/17** no arquivo de domínio, backend total **205/205**, frontend total **169/169** e Electron total **54/54**. O teste HTTP genérico de operações offline continua **1/1**; a rota de compra está coberta pela matriz de operações protegidas e pelo boot do roteador.

## Limitações conhecidas desta etapa

- A página operacional `/offline/domains` exige o módulo e a permissão de visualização de cada domínio; a seção administrativa em `/offline` agora aceita `vendas.edit`, `finance.edit`, `rh.approve_payroll`, `contabil.manage_periods` ou `compras.edit`, conforme o grupo. Não há filtros avançados nem ações em lote.
- Uma resposta perdida na criação da reserva, ou falha ao gravar no cofre depois da criação, pode deixar o alvo ou o estoque retido até a recuperação explícita de órfã.
- O pedido offline não recalcula preço/total no servidor; a reserva não é prova de exatidão comercial.
- As migrations 021, 022 e 023 foram aplicadas no Neon em 25/10/2026 após backup custom e restauração validada; a proteção contra duplicidade concorrente e as tabelas de reserva/recibo estão ativas. A migration 024, de compras, ainda não foi aplicada no Neon.
- A emissão assíncrona de NF-e para pedido **online** pendente continua agendada na criação. A correção desta etapa cobre apenas o pedido offline, que nasce `aguardando_aprovacao`; a definição fiscal do fluxo online pendente continua pendente.
- A emissão de NF-e continua sem homologação com credenciais reais da PlugNotas; o teste usa um serviço simulado.
- A réplica local e a outbox cobrem apenas **operações finais** de títulos, folha, contábil e aprovação de compra sobre alvos já existentes. Não há criação de títulos, cálculo de folha, lançamentos contábeis, movimentação bancária, recebimento de compra, entrada de estoque, geração de conta a pagar, edição offline nem sincronização bidirecional geral; documentos fiscais e o restante da matriz continuam pendentes. As migrations 022 e 023 estão no Neon; a 024 ainda não.
- O navegador não cria reserva nem executa operações offline de domínio; continua em rascunho IndexedDB e pedido online. A réplica e a outbox de domínio existem apenas no Electron com cofre disponível.
- O snapshot local usa as listagens existentes, com limite de 200 quando a API oferece paginação; não é uma réplica completa e pode ficar desatualizado enquanto o dispositivo está isolado.
- O servidor revalida o status do alvo no envio. Se ele foi alterado por outro usuário, a operação falha e a reserva permanece para reconciliação; não há aplicação cega do conteúdo local.
- Não houve pentest externo nem validação exaustiva de superfície de ataque. Segurança absoluta não pode ser garantida.
- O smoke Windows valida instalação, cofre, SQLite, rascunho e backup; ele não executa reserva/pedido offline nem operações de domínio contra API/PostgreSQL. Esses fluxos foram homologados no Linux. A execução Windows do schema v4, das operações de domínio e da aprovação de compras ainda é desejável.
- Uma resposta perdida na criação da reserva, ou falha ao salvar o token no cofre, pode deixar o alvo retido até cancelamento/reconciliação explícita. Não há liberação automática por expiração.
- O backup SQLite não é portátil entre computadores: a chave protegida pelo cofre do sistema é necessária. Perda da chave implica perda dos dados locais.

## Arquitetura necessária para todos os setores

Cada dispositivo precisa de quatro componentes, além da UI:

1. **Motor de domínio local**: executa validações e transações de cada módulo, com as mesmas regras do servidor. Não basta devolver uma resposta HTTP falsa de sucesso quando a API falha.
2. **Banco local durável**: réplica limitada à organização/CNPJs e permissões do usuário, com chaves globais para novos registros, backups e evolução de schema. Credenciais Neon nunca são distribuídas ao cliente.
3. **Autorização offline assinada**: emitida online para dispositivo e usuário específicos, permissões e validade explícitas; revogação remota não pode ser imediata enquanto o aparelho está isolado. Login offline, bloqueio local, troca de usuário e recuperação de chaves precisam ser homologados.
4. **Diário transacional e sincronizador bidirecional**: a alteração de negócio e seu evento são gravados atomicamente; o servidor valida assinatura, escopo, revisão e reserva, executa o comando idempotente e devolve confirmação. A réplica só marca como sincronizado após essa confirmação. Não usar cópia bruta de tabelas para contornar regras do servidor.

### Reservas por dispositivo

- Estoque: reservar quantidades por produto/CNPJ/dispositivo **no banco central**, descontando-as da disponibilidade dos demais dispositivos e da venda online. Entregue para vendas; os demais setores continuam pendentes.
- Financeiro: exclusividade central e réplica/outbox para baixa de títulos a receber e contas a pagar entregues; o consumo ocorre na baixa/pagamento. Ainda faltam criação de títulos, limites de caixa e saldo bancário externo; não presumir saldo de banco atualizado.
- Folha/contábil: exclusividade central, réplica e outbox para fechamento de competência e fechamento/reabertura/bloqueio de período entregues; o fechamento consome a reserva. Ainda faltam cálculo completo de folha, lançamentos contábeis offline e eSocial; demais dispositivos não podem fechar o mesmo período.
- Cadastros/CRM/RH: IDs globais e controle de versão. Edições concorrentes com conteúdo incompatível vão para resolução explícita; não aplicar "último a gravar vence" a dados sensíveis.
- **Expiração não devolve automaticamente a cota ao estoque central**: a máquina pode ter consumido a cota antes de ficar isolada. A devolução exige reconciliação ou procedimento administrativo que trate essa incerteza.
- Perda/roubo/restauração de backup do dispositivo não pode reapresentar cotas consumidas. O servidor precisa manter consumo monotônico, IDs de operação e trilha auditável.

## Matriz de execução e reconexão

| Setor | Operação local prevista | Reconexão e restrição |
|---|---|---|
| Cadastros | Criar/editar produtos, clientes e fornecedores | Validar unicidade, versão e referências; conflitos preservam ambas as versões |
| Vendas | Cotar e vender dentro de estoque reservado | Consumir reserva exatamente uma vez; fora da cota, pendente |
| Compras | Solicitações, pedidos e recebimentos | Vincular documentos, fornecedores e efeitos de estoque sem duplicação |
| Estoque | Movimentar saldos alocados ao dispositivo | Não usar estoque de outra máquina nem liberar cota incerta |
| Financeiro | Registrar títulos/caixa autorizado | Liquidação exclusiva; transação bancária real aguarda instituição |
| Devoluções | Preparar e executar movimentação autorizada | Respeitar quantidade original, cota e crédito explícito |
| RH/treinamentos | Cadastros, inscrições, presença e conclusão | Revalidar vínculo, capacidade e revisões concorrentes |
| Folha | Calcular com tabelas e remunerações locais vigentes | Fechamento exclusivo por competência; eSocial somente conectado |
| CRM | Leads, oportunidades, atividades | Conversão idempotente, conflitos de etapa/proprietário explícitos |
| Contábil | Lançamentos balanceados em período delegado | Não reabrir/fechar período simultaneamente; estorno preserva histórico |
| Auditoria | Diário local append-only encadeado | Servidor valida eventos; cliente comprometido não é prova suficiente de legitimidade |
| Fiscal | Preparar documento e acompanhar pendência | NF-e autorizada somente por resposta real; contingência exige modalidade fiscal válida |
| Administração | Consultar configuração previamente autorizada | Mudança de privilégios globais, contratação e revogação exigem coordenação online |

Esta matriz é um **contrato de implementação pendente**, não uma lista de funcionalidades offline já entregues. **Vendas** está entregue somente no fluxo de reserva de estoque/pedido offline descrito acima. **Financeiro** e **Folha/Contábil** têm reserva central e consumo transacional nas operações finais, mas ainda não têm réplica local, fila offline nem UI de criação; as demais linhas continuam pendentes.

## Critérios de aceite antes de produção

- Dois dispositivos isolados executam operações concorrentes sobre o mesmo produto/título/competência sem ultrapassar a reserva.
- Reinício forçado durante gravação, falta de energia, disco cheio e falha no cofre não produzem sucesso falso nem perda silenciosa.
- Queda após COMMIT no servidor e antes da resposta não duplica os efeitos no reenvio.
- Mesma operação enviada por usuário/CNPJ/dispositivo diferente é recusada.
- Relógio atrasado, snapshot antigo, backup restaurado e reconexão fora de ordem não renovam cotas ou permissões.
- Conflitos aparecem na UI com ambas as versões e resolução auditada.
- Testar cada linha da matriz com instalação Windows real, banco local real e serviço central separado; conferir saldos e documentos após a reconexão.

## Folha padrão concluída na mesma etapa

Modelo opcional `clt_monthly_2026`, com INSS progressivo, IRRF mensal/redução de 2026 e FGTS patronal de 8% separado do líquido. Aplicável somente ao enquadramento explicitamente confirmado na UI: salário-base integral, vínculo único, sem dependentes, eventos, pensão, afastamentos ou outros pagamentos no mês; pagamento no próprio mês da competência. Não substitui apuração de férias, 13º, rescisão, categorias especiais, encargos patronais completos ou transmissão eSocial.

Fontes oficiais consultadas em 23/10/2026:
- INSS: https://www.gov.br/inss/pt-br/direitos-e-deveres/inscricao-e-contribuicao/tabela-de-contribuicao-mensal — Portaria Interministerial MPS/MF 13/2026.
- IRRF: https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2026 — Leis 15.191/2025 e 15.270/2025.
- FGTS: https://www.planalto.gov.br/ccivil_03/leis/l8036consol.htm — art. 15.

A memória persistida registra versão, bases, faixas, deduções, redutor, data do pagamento, fontes e FGTS. O cálculo gerencial anterior permanece selecionável.

## Rotação Neon

**Adiada por decisão do responsável até o go-live.** O sistema ainda não entrou em operação e não há dados reais em produção; a credencial exposta não deve ser usada para novos ambientes. Antes de liberar o sistema para operação real, executar o cutover com credencial substituta, atualizar o Render, validar conexões e escrita e só então revogar a senha antiga. O `JWT_SECRET` também deve ser rotacionado nesse momento, invalidando sessões antigas. Nenhuma rotação foi declarada executada.
