# Offline integral em computadores isolados

## Decisões confirmadas pelo usuário

1. Os computadores podem perder também o acesso entre si; não se pode depender de servidor LAN.
2. Operações concorrentes devem respeitar **reservas/cotas por dispositivo**, em vez de confirmar tudo sem disponibilidade conhecida.
3. Os registros locais devem chegar ao banco original após a reconexão, sem duplicidade ou sobrescrita silenciosa.

## Estado real desta branch

**O ERP integral offline ainda não está implementado.** Os componentes de rascunhos descritos abaixo são uma base parcial, não uma réplica operacional de todos os módulos. Não publicar esta branch como "offline completo".

Foi concluída a primeira integração:
- Armazenamento transacional de rascunhos de vendas no IndexedDB, com criptografia: AES-GCM no navegador e cofre do sistema operacional via Electron `safeStorage` no desktop. Linux com backend `basic_text` é recusado; não há fallback em texto aberto.
- Rascunhos separados por usuário/organização/CNPJ, versão local com detecção de escrita concorrente e revisão imutável no PostgreSQL.
- Área `/offline` recupera o rascunho já existente quando a API está inacessível, inclusive após recarregar a interface. Não concede permissões online a partir do cache.
- Sincronização revalida a sessão/permissões/CNPJ. A identidade esperada acompanha o envio, evitando que troca de perfil envie dados do usuário anterior como se fossem do próximo.
- Repetição da mesma revisão não cria outra versão; mesmo ID com conteúdo diferente retorna conflito. Reconexão confirmada somente após resposta do servidor.
- Pedidos novos admitem `clientRequestId`, bloqueio transacional e hash do conteúdo. Reenvio não duplica pedido, estoque, recebível ou agendamento fiscal. Conteúdo diferente com a mesma chave é recusado.
- Migration aditiva `019_offline_sales_drafts.sql` aplicada **apenas em PostgreSQL local de testes** nesta etapa.

O navegador ainda depende de carregar os arquivos da aplicação; não foi entregue PWA/service worker. Electron empacotado possui os arquivos locais. O cofre do sistema protege o usuário do SO, não substitui um protocolo de autenticação offline por usuário do ERP.

### Verificação executada em 24/10

- Backend: 178 testes aprovados, zero falhas e zero skips, incluindo PostgreSQL real.
- HTTP autenticado: 111 verificações aprovadas, incluindo deduplicação de pedidos, integridade de revisão, proprietário do rascunho, CNPJ e cálculo CLT persistente.
- Frontend: TypeScript/build aprovados, 126 testes frontend e 24 Electron aprovados; audit npm sem alertas.
- Browser: 6 verificações aprovadas — queda da API, recuperação após reinício, conflito entre janelas sem sobrescrita, resposta HTTP 200 com confirmação inválida rejeitada, reconexão com revisão persistida e ausência de formulário em texto aberto no objeto IndexedDB. A confirmação inválida é uma injeção de falha do teste, não um mock do produto.
- Criptografia Windows: teste estendido para validar encrypt/decrypt e recuperação após reinício. Resultado dessa extensão só pode ser aprovado após execução do novo workflow.

A primeira execução Windows (`40098122732`) encontrou regressão no contrato de chamada de `calculatePayroll`: foi enviado um segundo argumento `undefined` onde os testes esperavam a chamada original sem corpo. O contrato foi preservado e a suíte local completa foi reexecutada com 126/126 aprovados antes do novo envio. Essa execução Windows falha não foi classificada como aprovada.

As mudanças desta etapa ficam em `feat/offline-isolated`, separadas de `main` e do Neon de produção. Nenhuma migration 019 foi aplicada ao banco de produção e nenhuma nova release foi publicada.

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
