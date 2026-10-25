# Roteiro manual — aprovação e continuidade offline

Para estoque, ajustes, transferências e devoluções, use também o [roteiro específico](OFFLINE_ESTOQUE_DEVOLUCOES_2026-10-25.md#roteiro-manual), com migrations até 026 e SQLite v6. Para cadastros, CRM, treinamentos e administração, use o [roteiro de cadastros](OFFLINE_CADASTROS_2026-10-25.md), com migration 027 e SQLite v7.

Use frontend e backend da branch `feat/offline-sales-closure`, com migrations até 027. A release pública 1.4.3 ainda não contém essas alterações. O smoke CI usa uma URL de API local e não gera uma release para uso operacional.

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

## Cadastros, CRM, treinamentos e administração (migration 027, SQLite v7)

1. Online, selecione o CNPJ e abra `/offline/records`. Confirme que o catálogo carrega e que os grupos aparecem conforme módulo/permissão.
2. Ainda online, abra **Cadastros** → **Clientes** → **Atualizar central**. Edite um cliente, salve e enfileire. Sincronize e confirme o status `Sincronizado` e a versão central.
3. Desconecte a rede. Crie um fornecedor e um produto que referencie o fornecedor criado offline. Feche e reabra o aplicativo; os rascunhos e a fila devem persistir.
4. Reconecte e sincronize. O fornecedor deve ser criado antes do produto, a referência `local:` deve virar ID central e o produto deve receber as linhas de `product_stock` do CNPJ ativo.
5. Edite o mesmo cliente em duas sessões/cópias: a segunda edição com versão antiga deve retornar conflito, sem sobrescrever a primeira. Reutilize a mesma chave de idempotência para confirmar que não há duplicata.
6. Repita uma criação com o mesmo `localId` e outra chave: a central deve recusar como identificador local reutilizado.
7. Em CRM, crie lead, oportunidade e atividade; a atividade exige oportunidade e CNPJ. Em treinamentos, crie categoria → treinamento → turma → inscrição, usando vínculo empregatício do CNPJ ativo. A inscrição deve recusar capacidade esgotada e duplicidade.
8. Com um administrador, edite um colaborador e confira que as permissões efetivas e os CNPJs atuais vêm preenchidos. Altere os CNPJs e sincronize; um perfil sem `isCompanyAdmin` deve receber `403`.
9. Tente operar sem estação registrada e sem permissão: a central deve recusar com `DEVICE_REGISTRATION_REQUIRED`/`403`. Tente uma inscrição com CNPJ diferente do vínculo: deve recusar.
10. Registre versão/commit, CNPJ, estação, UUID local, resultado esperado/obtido e captura de erro. Não registre senhas, tokens nem payloads com dados pessoais.

O fluxo não exclui cadastros na central: descartar remove apenas o rascunho local. Conflitos não são reenviados automaticamente.

## Outros domínios já implementados

### CRM e treinamentos (branch com migration 025)

Após aplicar a migration 025 no ambiente de homologação, use as abas CRM e Treinamentos para reservar uma atividade ou inscrição, desligar a rede, enfileirar a operação e reiniciar. Reconecte e verifique a confirmação e o status na central. A conclusão da inscrição exige presença já persistida; cada reserva cobre uma operação. A nota deve ficar entre 0 e 100. Verifique a recusa de operação em outro CNPJ e por um perfil sem a permissão do setor.

Repita reserva → rede desligada → operação → reinício → reconexão para baixa a receber, baixa a pagar, fechamento de folha previamente aprovada e transições de período contábil. Verifique o status persistido na central e a confirmação da fila.

Registre para cada caso: versão/commit, CNPJ de teste, estação, alvo, UUID da operação, resultado esperado/obtido e captura de eventual erro. Não registre tokens ou senhas.

Este roteiro não cobre recebimento de compras, criação/edição de devoluções, conversão de lead, edição de atividade CRM, certificados de treinamento, exclusão central de cadastros ou fluxos fiscais reais: esses fluxos continuam pendentes de implementação ou homologação.
