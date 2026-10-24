# Offline integral em computadores isolados

## Decisões confirmadas pelo usuário

1. Os computadores podem perder também o acesso entre si; não se pode depender de servidor LAN.
2. Operações concorrentes devem respeitar **reservas/cotas por dispositivo**, em vez de confirmar tudo sem disponibilidade conhecida.
3. Os registros locais devem chegar ao banco original após a reconexão, sem duplicidade ou sobrescrita silenciosa.

## Estado real desta branch

**O ERP integral offline ainda não está implementado.** O desktop já cobre rascunhos de vendas e pedidos de venda com reserva de estoque por estação. Também existe reserva central por estação para títulos financeiros, competências de folha e períodos contábeis, com consumo transacional nas operações finais. Ainda não há réplica local nem fila offline para financeiro, compras, folha, contábil, fiscal ou CRM; documentos fiscais e os demais setores continuam sem reserva por dispositivo. Não publicar esta branch como "offline completo".

## Atualização em andamento — fechamento do offline de vendas

Trabalho na branch `feat/offline-sales-closure`, ainda **não publicado**. Ele fecha três lacunas do fluxo de vendas já entregue:

- **Numeração única**: a migration aditiva `021_order_number_uniqueness.sql` cria índices únicos por organização/CNPJ para `Orders.orderNumber`. Online e offline compartilham a série `P-`; as duas gravações usam o mesmo advisory lock por CNPJ e a violação do índice vira HTTP 409, inclusive se um cliente tentar gravar diretamente no banco. A migration foi aplicada e testada apenas nos bancos locais de teste; **ainda não foi aplicada no Neon**.
- **Administração de reservas**: a área `/offline` agora expõe, para quem tem `vendas.edit`, todas as reservas do CNPJ (`GET /orders/reservations/all`) com usuário, estação, estado, quantidade, validade e pedido. A reconciliação (`POST /orders/reservations/:id/reconcile`) exige motivo e reautenticação. O item também aparece em Vendas → Reservas offline para Administrador/Gestor/Gerente.
- **NF-e de pedido offline**: pedido offline nasce com `nfe_status=aguardando_aprovacao` e **não** agenda emissão na criação. A transição para `approved` em `PUT /orders/:id/status` reivindica a emissão uma única vez e agenda a NF-e. Pedido online mantém o comportamento anterior; a definição fiscal para pedido online pendente continua pendente.

Validação executada nesta etapa: backend **201/201**, frontend **152/152**, `tsc --noEmit`, build Vite e Electron **46/46** aprovados; integração SQLite/API/PostgreSQL de reservas de estoque **11/11** e de reservas de domínio **10/10**. A migration 021 ainda exige backup, restauração validada e preflight antes do Neon; a branch não foi mergeada nem publicada. A migration 022, que cria as reservas de domínio, também está apenas nos bancos locais de teste.

Entregue nesta etapa:
- **SQLite real no processo principal do Electron** (`node:sqlite` do Electron 45), com WAL, `synchronous=FULL`, foreign keys, transações `BEGIN IMMEDIATE`, verificação de integridade na abertura e schema versionado (`user_version=2`).
- **Criptografia de conteúdo**: rascunhos, reservas e operações da fila são cifrados com AES-256-GCM, com AAD vinculando escopo, revisão/operação e identificadores. A chave de 32 bytes é protegida pelo cofre do sistema (`safeStorage`) e gravada apenas cifrada. Linux com backend `basic_text` é recusado; não há fallback em texto aberto.
- **Reserva de estoque por estação**: criada online com reautenticação, vinculada a organização, CNPJ, usuário, estação registrada e itens. A central incrementa `product_stock.reserved`; a venda online e as saídas passam a usar `stock - reserved`. A reserva expirada não devolve estoque automaticamente.
- **Pedido offline**: a estação grava a reserva e a operação em SQLite antes de enfileirar o pedido. Na reconexão, o servidor valida o token de posse, escopo, estação e itens, consome a reserva uma única vez e baixa o estoque físico na mesma transação. O servidor atribui número `P-<n>` (mínimo 100) e força `pending`; número e status enviados pelo cliente são ignorados.
- **Fila transacional (outbox)**: documento e operação são gravados na mesma transação. A operação tem estado `pending`/`leased`/`blocked`, lease de 60 s, tentativas com backoff, mesmo UUID após reinício e confirmação somente quando o servidor devolve exatamente o pedido, o número e a reserva esperados.
- **Concorrência local**: revisão esperada impede sobrescrita entre janelas; edições pendentes são coalescidas sem apagar uma operação em trânsito; uma gravação já enfileirada não cria revisão nova depois que o pedido entrou na fila imutável.
- **Migração do IndexedDB**: rascunhos antigos são importados preservando `draftId`/`revisionId`, com conferência de leitura e marcador idempotente. Os originais cifrados no IndexedDB não são apagados.
- **Backup local**: `VACUUM INTO` gera cópia consistente do SQLite v2, acompanhada da chave cifrada e de manifesto com SHA-256. O backup só é recuperável no mesmo contexto de usuário/máquina do cofre; não é um backup portátil entre computadores.
- Rascunhos/pedidos separados por usuário/organização/CNPJ, revisão imutável no PostgreSQL e rejeição de proprietário diferente.
- Área `/offline` recupera o rascunho SQLite quando a API está inacessível, inclusive após reiniciar o aplicativo. Não concede permissões online a partir do cache. A mesma área lista reservas ativas e permite recuperar reservas órfãs da estação com reautenticação.
- Pedidos novos admitem `clientRequestId`, bloqueio transacional e hash do conteúdo. Reenvio não duplica pedido, estoque, recebível ou agendamento fiscal. Conteúdo diferente com a mesma chave é recusado.
- Migrations aditivas `019_offline_sales_drafts.sql` e `020_stock_reservations.sql` aplicadas no Neon de produção em 24/10/2026, após backup custom, restauração validada em banco temporário local e preflight das duas migrations sobre essa cópia. As migrations 015–018 já estavam aplicadas; as tabelas, colunas, índices e triggers de 019/020 foram conferidos no Neon após a aplicação.

O navegador continua usando IndexedDB cifrado e ainda depende de carregar os arquivos da aplicação; não foi entregue PWA/service worker. O cofre do sistema protege o usuário do SO, não substitui um protocolo de autenticação offline por usuário do ERP. **Reserva e pedido offline exigem Electron/SQLite e estação pareada**; no navegador restam rascunhos cifrados e pedido online. Também não há resolução visual completa de conflito bloqueado; o rascunho é preservado e a UI mostra o código, mas a decisão continua manual.

### Verificação executada em 24/10

- Backend: **190/190** testes aprovados, zero falhas e zero skips, incluindo PostgreSQL real e a integração de reservas (concorrência, token, expiração, cancelamento, reconciliação, unicidade do número e NF-e após aprovação).
- Frontend: **148/148** testes, TypeScript e build aprovados; `npm audit` sem alertas. Inclui 16 testes de reservas/pedidos offline e a ponte renderer→IPC (load/save, ACK exato, ACK divergente bloqueado e normalização de erro).
- Electron: **46/46** testes, sendo **22 de SQLite real**, incluindo transação atômica, conflito entre conexões, lease/expição, reenvio do mesmo UUID, migração v1→v2 idempotente, disco cheio com preservação do rascunho anterior, dois dispositivos isolados, backup restaurável/adulteração detectada, encerramento abrupto após COMMIT, cofre indisponível falhando fechado, reserva cifrada, token de posse, cancelamento forçado e criação/reabertura do cofre com chave protegida.
- Integração SQLite → API local → PostgreSQL (rascunhos): **10/10** verificações. Inclui queda de rede real (porta fechada), reinício, perda de confirmação, backup antigo reenviado sem duplicar revisão, conflito de conteúdo, isolamento por CNPJ e ausência de texto aberto no arquivo SQLite.
- Integração SQLite → API local → PostgreSQL (reservas/pedidos): **11/11** verificações. Inclui estação pareada e reautenticação reais, reserva online, gravação cifrada, fila offline imutável, número `P-` mínimo 100, status forçado `pending`, consumo exato, ACK exato, perda de ACK após reinício, reenvio idempotente sem baixar estoque duas vezes, rejeição de conteúdo divergente com o mesmo UUID e ausência do token de posse em texto aberto nos arquivos SQLite. Perfil sintético `qa.*`; nenhum banco de produção foi usado.
- Navegador (fallback IndexedDB): **6/6** verificações aprovadas — queda da API, recuperação após reinício, conflito entre janelas sem sobrescrita, resposta HTTP 200 com confirmação inválida rejeitada, reconexão com revisão persistida e ausência de formulário em texto aberto no IndexedDB. A confirmação inválida é uma injeção de falha do teste, não um mock do produto.
- Aplicativo Electron local: login e sete rotas principais abriram sem erro de página. Em Linux sem cofre, o pedido SQLite foi recusado com mensagem explícita e o aplicativo permaneceu utilizável (sem fallback inseguro).
- Criptografia Windows anterior: **aprovada** em [run 40098318327](https://github.com/mafaldo-dev/konexus/actions/runs/40098318327), commit `330a6c5` (somente `safeStorage`, antes do SQLite).
- **SQLite no Windows instalado (histórico, somente rascunhos): aprovado** em [run 40101652759](https://github.com/mafaldo-dev/konexus/actions/runs/40101652759), commit `af7773c`.
- **Execução Windows (histórico, somente rascunhos): aprovada** em [run 40102304004](https://github.com/mafaldo-dev/konexus/actions/runs/40102304004), commit `baacbca`. Revalidou instalação NSIS, SQLite persistente após reinício, backup, cofre, identidade, desinstalação, **131 testes frontend**, **37 Electron** e audit zero.
- **Windows no commit atual: aprovado** em [run 40109176563](https://github.com/mafaldo-dev/konexus/actions/runs/40109176563), commit `0cfd06d`. Revalidou instalação NSIS, login renderizado, identidade persistente, cofre, SQLite real, rascunho persistente após reinício, backup cifrado, desinstalação, **146 testes frontend**, **46 Electron**, audit zero e build. O smoke Windows não cria reserva/pedido offline porque não sobe API/PostgreSQL no runner; o fluxo de reserva foi homologado no Linux contra PostgreSQL local.

As mudanças desta etapa foram integradas em `main`. As migrations 019/020 foram aplicadas ao Neon em 24/10/2026 após backup completo e restauração validada; o backend 1.4.3 está publicado no commit `fa1678ee45216f4e4532f6e03ed5644c638ac3a7` com `/health/release` em `ready:true`. A release 1.4.3 do frontend foi publicada em 24/10/2026 às 16:15:13 UTC no commit `29c8bc34fab50795ded6df4511686eca03231cda` ([workflow 40110305595](https://github.com/mafaldo-dev/konexus/actions/runs/40110305595)); o autoUpdater foi verificado por `scripts/audit-update-flow.mjs --tag v1.4.3`.


### Operação e recuperação do SQLite

- Banco: `%APPDATA%/Konexus/offline/konexus.sqlite` no Windows (o caminho exato vem de `userData` do Electron), com WAL e permissões restritas. A chave fica em `key.v1.enc`, cifrada pelo cofre do sistema. O schema v2 guarda rascunhos, reservas cifradas e o outbox de pedidos.
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

## Atualização em andamento — reservas financeiras, de folha e contábeis

Trabalho na branch `feat/offline-sales-closure`, ainda **não publicado nem aplicado no Neon**. A migration aditiva `022_domain_reservations.sql` cria a reserva central de um alvo por estação, sempre no escopo `organização + CNPJ`:

- **Financeiro a receber**: `order_payments` com status `pending`, `overdue` ou `due_today`.
- **Financeiro a pagar**: `payment_account` com status `pending` ou `overdue`.
- **Folha**: `payroll_competencies` com status `open`, `calculated` ou `approved`.
- **Contábil**: `accounting_periods` com status `open` ou `closed`.

Cada reserva tem UUID, token de posse devolvido uma única vez, hash SHA-256 do token, usuário, estação registrada, CNPJ, validade (5 minutos a 7 dias), correlação e estados `active`/`consumed`/`cancelled`. A criação usa lock consultivo transacional e um índice único parcial sobre o alvo ativo; duas estações não conseguem reservar o mesmo título, competência ou período. Expiração **não** libera o alvo automaticamente: o consumo tardio é permitido e marcado, e a liberação exige cancelamento do dono ou reconciliação administrativa com motivo e reautenticação.

Endpoints entregues (todos exigem sessão, empresa, módulo, permissão, CNPJ e, para criação/cancelamento, estação registrada):

| Domínio | Criar/listar da estação | Listar organização | Cancelar | Reconciliar |
|---|---|---|---|---|
| A receber | `POST/GET /offline-reservations/financial-receivables` | `GET .../all` | `POST .../:id/cancel` | `POST .../:id/reconcile` |
| A pagar | `POST/GET /offline-reservations/financial-payables` | `GET .../all` | `POST .../:id/cancel` | `POST .../:id/reconcile` |
| Folha | `POST/GET /offline-reservations/payroll-competencies` | `GET .../all` | `POST .../:id/cancel` | `POST .../:id/reconcile` |
| Contábil | `POST/GET /offline-reservations/accounting-periods` | `GET .../all` | `POST .../:id/cancel` | `POST .../:id/reconcile` |

Permissões: `finance.approve` para reservar título a receber, `finance.edit` para conta a pagar e reconciliação financeira, `rh.approve_payroll` para folha e `contabil.manage_periods` para período contábil. Todas as mutações estão na matriz central de auditoria e exigem `X-Reauth-Grant`.

O consumo foi integrado às operações finais quando o cliente envia `reservationId` e `reservationToken` no corpo: `PUT /payments/:id/mark-payd`, `PUT /payment/accounts/:id` com `payment_status=paid`, `POST /rh/payroll/competencies/:id/close` e `POST /accounting/periods/:id/close|reopen|lock`. A reserva é validada e consumida na **mesma transação** da alteração; o consumo revalida o status do alvo e falha fechado se ele já foi pago, cancelado, encerrado ou bloqueado. Sem os campos de reserva, o comportamento online anterior permanece. A operação offline completa desses setores (réplica local, outbox e UI de criação) ainda não foi entregue.

A área `/offline` ganhou uma seção administrativa de reservas de domínio para quem tem `finance.edit`, `rh.approve_payroll` ou `contabil.manage_periods`. Ela lista apenas reservas ativas do CNPJ e permite reconciliação com motivo e reautenticação; não cria reservas. A criação será ligada aos fluxos offline de cada setor.

Validação executada: backend **201/201**, frontend **152/152**, Electron **46/46**, `tsc --noEmit` e build Vite aprovados; integração real PostgreSQL de reservas de domínio **10/10** (concorrência entre estações, escopo por CNPJ, token, alvo exato, expiração, cancelamento, reconciliação, consumo em pagamento/conta a pagar/fechamento de folha/fechamento contábil). A migration 022 foi aplicada e testada apenas em `konexus_multi_test` e `konexus_e2e`; **não foi aplicada no Neon**.

## Limitações conhecidas desta etapa

- A UI administrativa de reservas está dentro da área `/offline` e exige `vendas.edit`; não há página dedicada, filtros avançados nem ações em lote.
- Uma resposta perdida na criação da reserva, ou falha ao gravar no cofre depois da criação, pode deixar estoque retido até a recuperação explícita de órfã.
- O pedido offline não recalcula preço/total no servidor; a reserva não é prova de exatidão comercial.
- A migration `021_order_number_uniqueness.sql` foi aplicada e validada apenas nos bancos locais de teste. O Neon ainda não tem a constraint; até o backup, preflight e aplicação, a proteção contra duplicidade concorrente no banco de produção não está ativa.
- A emissão assíncrona de NF-e para pedido **online** pendente continua agendada na criação. A correção desta etapa cobre apenas o pedido offline, que nasce `aguardando_aprovacao`; a definição fiscal do fluxo online pendente continua pendente.
- A emissão de NF-e continua sem homologação com credenciais reais da PlugNotas; o teste usa um serviço simulado.
- A reserva central por dispositivo já existe para títulos financeiros, competências de folha e períodos contábeis, com consumo transacional nas operações finais. Ainda não existem réplica local, outbox, edição offline nem UI de criação para esses setores; documentos fiscais e o restante da matriz continuam pendentes. A migration 022 também não foi aplicada no Neon.
- O navegador não cria reserva nem opera pedido offline; continua em rascunho IndexedDB e pedido online.
- Não houve pentest externo nem validação exaustiva de superfície de ataque. Segurança absoluta não pode ser garantida.
- O smoke Windows valida instalação, cofre, SQLite, rascunho e backup; ele não executa o fluxo de reserva/pedido offline contra API/PostgreSQL. Esse fluxo foi homologado no Linux; uma execução Windows com backend local ainda é desejável.

## Arquitetura necessária para todos os setores

Cada dispositivo precisa de quatro componentes, além da UI:

1. **Motor de domínio local**: executa validações e transações de cada módulo, com as mesmas regras do servidor. Não basta devolver uma resposta HTTP falsa de sucesso quando a API falha.
2. **Banco local durável**: réplica limitada à organização/CNPJs e permissões do usuário, com chaves globais para novos registros, backups e evolução de schema. Credenciais Neon nunca são distribuídas ao cliente.
3. **Autorização offline assinada**: emitida online para dispositivo e usuário específicos, permissões e validade explícitas; revogação remota não pode ser imediata enquanto o aparelho está isolado. Login offline, bloqueio local, troca de usuário e recuperação de chaves precisam ser homologados.
4. **Diário transacional e sincronizador bidirecional**: a alteração de negócio e seu evento são gravados atomicamente; o servidor valida assinatura, escopo, revisão e reserva, executa o comando idempotente e devolve confirmação. A réplica só marca como sincronizado após essa confirmação. Não usar cópia bruta de tabelas para contornar regras do servidor.

### Reservas por dispositivo

- Estoque: reservar quantidades por produto/CNPJ/dispositivo **no banco central**, descontando-as da disponibilidade dos demais dispositivos e da venda online. Entregue para vendas; os demais setores continuam pendentes.
- Financeiro: exclusividade central sobre títulos entregue para contas a receber e a pagar; o consumo ocorre na baixa/pagamento. Ainda faltam réplica local, fila offline e limites de caixa; não presumir saldo de banco externo atualizado.
- Folha/contábil: exclusividade central sobre competência/período entregue; o fechamento consome a reserva. Ainda faltam réplica local e outbox para preparar registros offline; demais dispositivos não podem fechar o mesmo período.
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
