# Estoque, transferências e devoluções offline

## Implementado na branch

- Aba **Estoque** em `/offline/domains`: preparar online uma entrada, saída, ajuste por variação ou transferência operacional de saldo entre CNPJs; executar/enfileirar depois sem rede.
- A reserva vincula produto, quantidade inteira, direção, ação, usuário, estação e CNPJ. Transferências também vinculam o destino.
- Saídas, ajustes negativos e transferências incrementam `product_stock.reserved`; vendas e outras movimentações continuam usando somente saldo livre.
- Transferências gravam saída e entrada, os dois saldos, auditoria e recibo na mesma transação. O acesso ao CNPJ de destino é revalidado na sincronização.
- Aba **Devoluções**: aprovação de devolução existente e registro de sua saída física. Na fase de saída, todas as quantidades da devolução são reservadas online. Os itens são revalidados na sincronização.
- Transições online de devoluções reservadas são bloqueadas até sincronização ou reconciliação. Cancelar/reconciliar a reserva devolve a quota na mesma transação.
- Exclusão de estoque com quota ativa é recusada no banco. O saldo não pode ficar abaixo de uma quantidade reservada positiva.
- O ACK local agora exige o status final correspondente à ação, além de domínio, alvo e reserva.

## Limites do fluxo

Cada alvo aceita uma reserva ativa e cada reserva cobre **uma operação**. Quantidade e destino são definidos na preparação online; não podem ser ampliados no computador isolado. Nova operação sobre o mesmo alvo exige consumir/cancelar a anterior e preparar outra reserva online.

As transferências são registros operacionais de estoque, sem emissão fiscal automática. Não representam homologação tributária de transferências entre CNPJs. Devoluções nesta etapa não criam crédito ao fornecedor, movimentação bancária ou documento fiscal. Criação/edição da própria devolução ainda é online.

## Segurança e persistência

- Estoque exige `estoque.move`; devoluções offline exigem `compras.edit` e `estoque.move`.
- Preparação, cancelamento e reconciliação exigem reautenticação; consumo exige token da reserva, usuário/dispositivo e CNPJ explícito.
- Expiração não libera quantidade automaticamente.
- Migration `026_offline_inventory.sql` adiciona alocações às reservas, os novos domínios/ações, projeções de alvos, proteção de exclusão e cobertura do saldo reservado.
- Migration aplicada em `konexus_multi_test` e na restauração local `konexus_pre024_restore_20261025`. **025 e 026 continuam pendentes no Neon.**
- SQLite **v6** adiciona `offline_domain_allocations`, com detalhes das quotas cifrados e associados ao escopo. As tabelas de domínio v3/v4/v5 são reconstruídas transacionalmente para ampliar os checks. Rascunhos e filas anteriores são preservados.

## Testes executados

- Backend completo: **211/211**, zero falhas e zero skips.
- Frontend: **173/173**; Electron: **56/56**.
- TypeScript e build Vite aprovados; permanece o aviso de bundle grande.
- PostgreSQL: vendas não reservam unidades já alocadas à transferência; duas pernas da transferência e recibo são atômicos; falha forçada do recibo reverte movimentos/saldos/quota; replay não duplica movimentos; revogação do acesso ao destino impede sincronização; ação divergente da reserva é recusada.
- Entradas, saídas, ajustes positivos/negativos e cancelamento de quota testados.
- Aprovação/saída de devolução, replay, estoque final, ausência de crédito financeiro automático e bloqueio de operação online sobre devolução reservada testados.
- Depois da adição dos triggers/checks, integração de domínio/estoque/vendas repetida: **15/15**; exclusão de estoque reservado e redução abaixo da quota recusadas.
- SQLite: quota cifrada persiste após reinício; ação diferente da reservada e ACK com status incorreto são recusados. Migrações/quotas: **2/2** na última execução direcionada.
- Nenhuma transmissão fiscal, bancária ou release foi executada. Homologação manual Windows permanece com o responsável; não há resultado registrado para o aplicativo instalado com schema v6.

## Roteiro manual

1. Em homologação com migrations até 026, selecione um produto disponível em dois CNPJs aos quais seu usuário tenha acesso operacional.
2. Na aba Estoque, reserve uma transferência de quantidade menor que o saldo livre.
3. Em outra estação, tente reservar para venda quantidade maior que o saldo restante: deve falhar.
4. Desligue a rede da primeira estação, enfileire a transferência com motivo e reinicie o aplicativo.
5. Reconecte e sincronize. Confira uma saída na origem, uma entrada no destino e uma única operação confirmada. Repita a sincronização: saldos não mudam novamente.
6. Repita para entrada, saída e ajustes; cancele uma reserva e confira a devolução do saldo reservado.
7. Na aba Devoluções, reserve e aprove uma devolução pendente. Após sincronizar, atualize e reserve a saída física. Repita desligamento/reinício/sincronização; confira uma única baixa e nenhum crédito financeiro automático.

## Ainda não concluído

Cadastros e administração offline, criação/edição de CRM e treinamentos, criação/edição de devoluções, recebimento de compras e crédito financeiro de devoluções continuam pendentes. Este documento não declara o ERP integral offline concluído. Merge/deploy/release continuam dependentes de confirmação.
