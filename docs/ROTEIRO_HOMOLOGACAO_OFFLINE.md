# Roteiro manual — aprovação e continuidade offline

Para estoque, ajustes, transferências e devoluções, use também o [roteiro específico](OFFLINE_ESTOQUE_DEVOLUCOES_2026-10-25.md#roteiro-manual), com migrations até 026 e SQLite v6.

Use frontend e backend da branch `feat/offline-sales-closure`, com migrations até 024. A release pública 1.4.3 ainda não contém essas alterações. O smoke CI usa uma URL de API local e não gera uma release para uso operacional.

## Pedido online e aprovação

1. Crie um pedido de venda pendente. Confirme que está na aba **Pendentes** e que a NF-e aguarda aprovação.
2. Com permissão `vendas.edit`, escolha **Aprovar pedido** e confirme a identidade. Deve haver confirmação de aprovação, sem pedir motivo de estorno.
3. Atualize a lista: o pedido deve estar em **Aprovados**. Consulte o resultado real da NF-e na área fiscal; aprovação de pedido não significa autorização fiscal.
4. Repita com perfil sem `vendas.edit`: a ação de aprovação não deve aparecer.

## Compra offline, reinício e reconexão

1. Online, selecione o CNPJ e abra `/offline/domains` → **Compras** → **Atualizar da central**.
2. Reserve um pedido pendente. Registre o número do pedido e o identificador da reserva.
3. Em outro computador, mesmo CNPJ, tente reservar o mesmo pedido: a central deve recusar.
4. Desconecte a rede do primeiro computador e enfileire **Aprovar**.
5. Feche e reabra o aplicativo ainda offline. A operação deve continuar na fila local, pendente de confirmação.
6. Reconecte, retome a sessão se solicitado e sincronize. Deve existir uma única aprovação, com operação local confirmada.
7. Sincronize novamente e reinicie: não deve surgir outra operação. Estoque e contas a pagar não devem ser gerados por essa aprovação.
8. Troque de CNPJ e confirme que a reserva/operação não aparece em outro escopo.

## Outros domínios já implementados

### CRM e treinamentos (branch com migration 025)

Após aplicar a migration 025 no ambiente de homologação, use as abas CRM e Treinamentos para reservar uma atividade ou inscrição, desligar a rede, enfileirar a operação e reiniciar. Reconecte e verifique a confirmação e o status na central. A conclusão da inscrição exige presença já persistida; cada reserva cobre uma operação. A nota deve ficar entre 0 e 100. Verifique a recusa de operação em outro CNPJ e por um perfil sem a permissão do setor.

Repita reserva → rede desligada → operação → reinício → reconexão para baixa a receber, baixa a pagar, fechamento de folha previamente aprovada e transições de período contábil. Verifique o status persistido na central e a confirmação da fila.

Registre para cada caso: versão/commit, CNPJ de teste, estação, alvo, UUID da operação, resultado esperado/obtido e captura de eventual erro. Não registre tokens ou senhas.

Este roteiro não cobre recebimento de compras, transferências, criação/edição de CRM e treinamentos, devoluções ou cadastros offline: esses fluxos continuam pendentes de implementação.
