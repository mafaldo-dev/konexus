# Offline integral em computadores isolados

## Decisões confirmadas pelo usuário

1. Os computadores podem perder também o acesso entre si; não se pode depender de servidor LAN.
2. Operações concorrentes devem respeitar **reservas/cotas por dispositivo**, em vez de confirmar tudo sem disponibilidade conhecida.
3. Os registros locais devem chegar ao banco original após a reconexão, sem duplicidade ou sobrescrita silenciosa.

## Estado real desta branch

**O ERP integral offline ainda não está implementado.** O SQLite local e a fila de sincronização já existem no aplicativo desktop, mas hoje cobrem **somente rascunhos de vendas**. Não há réplica local de estoque, financeiro, compras, folha, contábil, fiscal ou CRM, nem reservas por dispositivo. Não publicar esta branch como "offline completo".

Foi concluída a primeira integração:
- **SQLite real no processo principal do Electron** (`node:sqlite` do Electron 45), com WAL, `synchronous=FULL`, foreign keys, transações `BEGIN IMMEDIATE`, verificação de integridade na abertura e schema versionado (`user_version=1`).
- **Criptografia de conteúdo**: cada rascunho e cada operação da fila é cifrado com AES-256-GCM, com AAD vinculando escopo, revisão e `draftId`. A chave de 32 bytes é protegida pelo cofre do sistema (`safeStorage`) e gravada apenas cifrada. Linux com backend `basic_text` é recusado; não há fallback em texto aberto.
- **Fila transacional (outbox)**: documento e operação são gravados na mesma transação. A operação tem estado `pending`/`leased`/`blocked`, lease de 60 s, tentativas com backoff, mesmo UUID após reinício e confirmação somente quando o servidor devolve exatamente o `draftId` e a `revisionId` enviados.
- **Concorrência local**: revisão esperada impede sobrescrita entre janelas; edições pendentes são coalescidas sem apagar uma operação em trânsito; confirmação antiga não marca uma revisão nova como sincronizada.
- **Migração do IndexedDB**: rascunhos antigos são importados preservando `draftId`/`revisionId`, com conferência de leitura e marcador idempotente. Os originais cifrados no IndexedDB não são apagados.
- **Backup local**: `VACUUM INTO` gera cópia consistente, acompanhada da chave cifrada e de manifesto com SHA-256. O backup só é recuperável no mesmo contexto de usuário/máquina do cofre; não é um backup portátil entre computadores.
- Rascunhos separados por usuário/organização/CNPJ, revisão imutável no PostgreSQL e rejeição de proprietário diferente.
- Área `/offline` recupera o rascunho SQLite quando a API está inacessível, inclusive após reiniciar o aplicativo. Não concede permissões online a partir do cache.
- Pedidos novos admitem `clientRequestId`, bloqueio transacional e hash do conteúdo. Reenvio não duplica pedido, estoque, recebível ou agendamento fiscal. Conteúdo diferente com a mesma chave é recusado.
- Migration aditiva `019_offline_sales_drafts.sql` aplicada **apenas em PostgreSQL local de testes** nesta etapa.

O navegador continua usando IndexedDB cifrado e ainda depende de carregar os arquivos da aplicação; não foi entregue PWA/service worker. O cofre do sistema protege o usuário do SO, não substitui um protocolo de autenticação offline por usuário do ERP. O SQLite cobre apenas rascunhos: estoque, títulos, competências de folha e documentos fiscais continuam dependendo de validação online. Também não há resolução visual completa de conflito bloqueado; o rascunho é preservado e a UI mostra o código, mas a decisão continua manual.

### Verificação executada em 24/10

- Backend: **178/178** testes aprovados, zero falhas e zero skips, incluindo PostgreSQL real.
- Frontend: **131/131** testes, TypeScript e build aprovados; `npm audit` sem alertas. Inclui 5 testes da ponte renderer→IPC (load/save, ACK exato, ACK divergente bloqueado e normalização de erro).
- Electron: **37/37** testes, sendo **13 de SQLite real**, incluindo transação atômica, conflito entre conexões, lease/expição, reenvio do mesmo UUID, migração idempotente, disco cheio com preservação do rascunho anterior, dois dispositivos isolados, backup restaurável/adulteração detectada, encerramento abrupto após COMMIT, cofre indisponível falhando fechado e criação/reabertura do cofre com chave protegida.
- Integração SQLite → API local → PostgreSQL: **10/10** verificações. Inclui queda de rede real (porta fechada), reinício, perda de confirmação, backup antigo reenviado sem duplicar revisão, conflito de conteúdo, isolamento por CNPJ e ausência de texto aberto no arquivo SQLite. Perfil sintético `qa.*`; nenhum banco de produção foi usado.
- Navegador (fallback IndexedDB): **6/6** verificações aprovadas — queda da API, recuperação após reinício, conflito entre janelas sem sobrescrita, resposta HTTP 200 com confirmação inválida rejeitada, reconexão com revisão persistida e ausência de formulário em texto aberto no IndexedDB. A confirmação inválida é uma injeção de falha do teste, não um mock do produto.
- Aplicativo Electron local: login e sete rotas principais abriram sem erro de página. Em Linux sem cofre, o pedido SQLite foi recusado com mensagem explícita e o aplicativo permaneceu utilizável (sem fallback inseguro).
- HTTP autenticado anterior: **111** verificações aprovadas, incluindo deduplicação de pedidos, integridade de revisão, proprietário do rascunho, CNPJ e cálculo CLT persistente.
- Criptografia Windows anterior: **aprovada** em [run 40098318327](https://github.com/mafaldo-dev/konexus/actions/runs/40098318327), commit `330a6c5` (somente `safeStorage`, antes do SQLite).
- **SQLite no Windows instalado: aprovado** em [run 40101652759](https://github.com/mafaldo-dev/konexus/actions/runs/40101652759), commit `af7773c`. O smoke do executável NSIS criou o banco SQLite real, gravou rascunho, confirmou a fila pendente após reiniciar o aplicativo, leu o conteúdo cifrado, gerou backup com SHA-256 e confirmou que o arquivo de backup não contém o texto do rascunho; também revalidou cofre, identidade, desinstalação, 126 testes frontend e 36 Electron naquele commit. A execução final desta etapa, com o teste adicional da ponte e os ajustes de metadados, é registrada abaixo.
- A primeira execução Windows (`40098122732`) encontrou regressão no contrato de chamada de `calculatePayroll`: foi enviado um segundo argumento `undefined` onde os testes esperavam a chamada original sem corpo. O contrato foi preservado e a suíte local completa foi reexecutada antes do novo envio. Essa execução Windows falha não foi classificada como aprovada.

As mudanças desta etapa ficam em `feat/offline-isolated`, separadas de `main` e do Neon de produção. Nenhuma migration 019 foi aplicada ao banco de produção e nenhuma nova release foi publicada.


### Operação e recuperação do SQLite

- Banco: `%APPDATA%/Konexus/offline/konexus.sqlite` no Windows (o caminho exato vem de `userData` do Electron), com WAL e permissões restritas. A chave fica em `key.v1.enc`, cifrada pelo cofre do sistema.
- Backup: botão **Criar backup local protegido** na área `/offline`; gera `offline/backups/<data>-<uuid>/` com `konexus.sqlite`, `key.v1.enc` e `manifest.json` (SHA-256). A cópia é consistente, mas continua dependente do cofre do mesmo usuário/máquina.
- Se a chave sumir, o aplicativo **não cria outra** silenciosamente sobre um banco existente: ele falha e preserva os arquivos para recuperação.
- Se o cofre estiver indisponível (por exemplo, Linux sem keyring), o SQLite não abre e o app não grava rascunho em texto aberto. O restante do sistema online continua funcionando.
- Antes de restaurar um backup, feche o aplicativo; restaure banco e chave no mesmo diretório; abra o app e confira a contagem de pendências. Um backup antigo não deve ser usado como verdade absoluta: o servidor idempotente devolve a mesma confirmação e não duplica a revisão, mas operações posteriores podem ter sido perdidas no intervalo.

## Arquitetura necessária para todos os setores

Cada dispositivo precisa de quatro componentes, além da UI:

1. **Motor de domínio local**: executa validações e transações de cada módulo, com as mesmas regras do servidor. Não basta devolver uma resposta HTTP falsa de sucesso quando a API falha.
2. **Banco local durável**: réplica limitada à organização/CNPJs e permissões do usuário, com chaves globais para novos registros, backups e evolução de schema. Credenciais Neon nunca são distribuídas ao cliente.
3. **Autorização offline assinada**: emitida online para dispositivo e usuário específicos, permissões e validade explícitas; revogação remota não pode ser imediata enquanto o aparelho está isolado. Login offline, bloqueio local, troca de usuário e recuperação de chaves precisam ser homologados.
4. **Diário transacional e sincronizador bidirecional**: a alteração de negócio e seu evento são gravados atomicamente; o servidor valida assinatura, escopo, revisão e reserva, executa o comando idempotente e devolve confirmação. A réplica só marca como sincronizado após essa confirmação. Não usar cópia bruta de tabelas para contornar regras do servidor.

### Reservas por dispositivo

- Estoque: reservar quantidades por produto/CNPJ/dispositivo **no banco central**, descontando-as da disponibilidade dos demais dispositivos e da venda online.
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

Esta matriz é um **contrato de implementação pendente**, não uma lista de funcionalidades offline já entregues.

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
