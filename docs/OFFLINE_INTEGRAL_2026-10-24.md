# Offline integral em computadores isolados

## Decisões confirmadas pelo usuário

1. Os computadores podem perder também o acesso entre si; não se pode depender de servidor LAN.
2. Operações concorrentes devem respeitar **reservas/cotas por dispositivo**, em vez de confirmar tudo sem disponibilidade conhecida.
3. Os registros locais devem chegar ao banco original após a reconexão, sem duplicidade ou sobrescrita silenciosa.

## Estado real desta branch

**O ERP integral offline ainda não está implementado.** O desktop já cobre rascunhos de vendas e pedidos de venda com reserva de estoque por estação. Não há réplica local de estoque para os demais setores, financeiro, compras, folha, contábil, fiscal ou CRM, nem reserva por dispositivo para títulos, competências ou documentos fiscais. Não publicar esta branch como "offline completo".

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
- Migrations aditivas `019_offline_sales_drafts.sql` e `020_stock_reservations.sql` aplicadas **apenas em PostgreSQL local de testes** nesta etapa. As migrations 015–018 estão no Neon de produção; 019 e 020 não estão.

O navegador continua usando IndexedDB cifrado e ainda depende de carregar os arquivos da aplicação; não foi entregue PWA/service worker. O cofre do sistema protege o usuário do SO, não substitui um protocolo de autenticação offline por usuário do ERP. **Reserva e pedido offline exigem Electron/SQLite e estação pareada**; no navegador restam rascunhos cifrados e pedido online. Também não há resolução visual completa de conflito bloqueado; o rascunho é preservado e a UI mostra o código, mas a decisão continua manual.

### Verificação executada em 24/10

- Backend: **188/188** testes aprovados, zero falhas e zero skips, incluindo PostgreSQL real e a integração de reservas (concorrência, token, expiração, cancelamento e reconciliação).
- Frontend: **146/146** testes, TypeScript e build aprovados; `npm audit` sem alertas. Inclui 14 testes de reservas/pedidos offline e a ponte renderer→IPC (load/save, ACK exato, ACK divergente bloqueado e normalização de erro).
- Electron: **46/46** testes, sendo **22 de SQLite real**, incluindo transação atômica, conflito entre conexões, lease/expição, reenvio do mesmo UUID, migração v1→v2 idempotente, disco cheio com preservação do rascunho anterior, dois dispositivos isolados, backup restaurável/adulteração detectada, encerramento abrupto após COMMIT, cofre indisponível falhando fechado, reserva cifrada, token de posse, cancelamento forçado e criação/reabertura do cofre com chave protegida.
- Integração SQLite → API local → PostgreSQL (rascunhos): **10/10** verificações. Inclui queda de rede real (porta fechada), reinício, perda de confirmação, backup antigo reenviado sem duplicar revisão, conflito de conteúdo, isolamento por CNPJ e ausência de texto aberto no arquivo SQLite.
- Integração SQLite → API local → PostgreSQL (reservas/pedidos): **11/11** verificações. Inclui estação pareada e reautenticação reais, reserva online, gravação cifrada, fila offline imutável, número `P-` mínimo 100, status forçado `pending`, consumo exato, ACK exato, perda de ACK após reinício, reenvio idempotente sem baixar estoque duas vezes, rejeição de conteúdo divergente com o mesmo UUID e ausência do token de posse em texto aberto nos arquivos SQLite. Perfil sintético `qa.*`; nenhum banco de produção foi usado.
- Navegador (fallback IndexedDB): **6/6** verificações aprovadas — queda da API, recuperação após reinício, conflito entre janelas sem sobrescrita, resposta HTTP 200 com confirmação inválida rejeitada, reconexão com revisão persistida e ausência de formulário em texto aberto no IndexedDB. A confirmação inválida é uma injeção de falha do teste, não um mock do produto.
- Aplicativo Electron local: login e sete rotas principais abriram sem erro de página. Em Linux sem cofre, o pedido SQLite foi recusado com mensagem explícita e o aplicativo permaneceu utilizável (sem fallback inseguro).
- Criptografia Windows anterior: **aprovada** em [run 40098318327](https://github.com/mafaldo-dev/konexus/actions/runs/40098318327), commit `330a6c5` (somente `safeStorage`, antes do SQLite).
- **SQLite no Windows instalado (histórico, somente rascunhos): aprovado** em [run 40101652759](https://github.com/mafaldo-dev/konexus/actions/runs/40101652759), commit `af7773c`.
- **Execução Windows (histórico, somente rascunhos): aprovada** em [run 40102304004](https://github.com/mafaldo-dev/konexus/actions/runs/40102304004), commit `baacbca`. Revalidou instalação NSIS, SQLite persistente após reinício, backup, cofre, identidade, desinstalação, **131 testes frontend**, **37 Electron** e audit zero.
- **Windows para o commit atual com reservas: pendente.** As execuções acima precedem a reserva por estação e não validam este código. Não declarar o instalador atual aprovado antes do resultado do workflow `windows-validation.yml`.

As mudanças desta etapa ficam em `feat/offline-isolated`, separadas de `main` e do Neon de produção. Nenhuma migration 019/020 foi aplicada ao banco de produção e nenhuma nova release foi publicada.


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

## Limitações conhecidas desta etapa

- Não há UI administrativa dedicada para `GET /orders/reservations/all` e `POST /orders/reservations/:id/reconcile`; a recuperação exposta é a da própria estação. A reconciliação administrativa existe na API e exige permissão de edição em vendas.
- Uma resposta perdida na criação da reserva, ou falha ao gravar no cofre depois da criação, pode deixar estoque retido até a recuperação explícita de órfã.
- O pedido offline não recalcula preço/total no servidor; a reserva não é prova de exatidão comercial.
- `Orders.orderNumber` não tem constraint única. A numeração offline é serializada no servidor, mas um cliente online malicioso ainda poderia enviar um `P-<n>` e colidir.
- A emissão assíncrona de NF-e continua agendada na criação do pedido, inclusive para pedido offline forçado a `pending`. Alterar isso exige definição de produto/fiscal; não foi homologado com credenciais reais.
- Reservas por dispositivo para títulos financeiros, competências de folha/contábil e documentos fiscais não existem. O restante da matriz continua pendente.
- O navegador não cria reserva nem opera pedido offline; continua em rascunho IndexedDB e pedido online.
- Não houve pentest externo nem validação exaustiva de superfície de ataque. Segurança absoluta não pode ser garantida.
- O instalador Windows do commit atual ainda não foi validado; a evidência Windows existente é anterior às reservas.

## Arquitetura necessária para todos os setores

Cada dispositivo precisa de quatro componentes, além da UI:

1. **Motor de domínio local**: executa validações e transações de cada módulo, com as mesmas regras do servidor. Não basta devolver uma resposta HTTP falsa de sucesso quando a API falha.
2. **Banco local durável**: réplica limitada à organização/CNPJs e permissões do usuário, com chaves globais para novos registros, backups e evolução de schema. Credenciais Neon nunca são distribuídas ao cliente.
3. **Autorização offline assinada**: emitida online para dispositivo e usuário específicos, permissões e validade explícitas; revogação remota não pode ser imediata enquanto o aparelho está isolado. Login offline, bloqueio local, troca de usuário e recuperação de chaves precisam ser homologados.
4. **Diário transacional e sincronizador bidirecional**: a alteração de negócio e seu evento são gravados atomicamente; o servidor valida assinatura, escopo, revisão e reserva, executa o comando idempotente e devolve confirmação. A réplica só marca como sincronizado após essa confirmação. Não usar cópia bruta de tabelas para contornar regras do servidor.

### Reservas por dispositivo

- Estoque: reservar quantidades por produto/CNPJ/dispositivo **no banco central**, descontando-as da disponibilidade dos demais dispositivos e da venda online. Entregue para vendas; os demais setores continuam pendentes.
- Financeiro: conceder exclusividade sobre títulos e limites de caixa. Não permitir duas máquinas liquidarem o mesmo título, nem presumir saldo de banco externo atualizado.
- Folha/contábil: autoridade exclusiva sobre competência/período para aprovação e fechamento. Demais dispositivos podem preparar registros para revisão sem fechar o mesmo período.
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

Esta matriz é um **contrato de implementação pendente**, não uma lista de funcionalidades offline já entregues. A linha **Vendas** está entregue somente no fluxo de reserva de estoque/pedido offline descrito acima; as demais linhas continuam pendentes.

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

Continua bloqueada por falta de acesso à gestão de secrets do Render/Neon. A conexão SQL local permite trabalhar no banco, mas não atualizar a configuração da API em produção. Não alterar a senha isoladamente: primeiro preparar a credencial substituta e atualizar o deploy, validar conexões novas e só então revogar a antiga. Nenhuma rotação foi declarada executada.
