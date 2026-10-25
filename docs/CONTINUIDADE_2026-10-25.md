# Continuidade da homologação — 25/10/2026

> Etapa mais recente: [estoque, transferências e devoluções offline](OFFLINE_ESTOQUE_DEVOLUCOES_2026-10-25.md), SQLite v6 e migration 026 validada localmente.

> Etapa posterior: [operações offline de CRM e treinamentos](OFFLINE_CRM_TREINAMENTOS_2026-10-25.md), com SQLite v5 e migration 025 ainda local.

Atualização posterior ao `RELATORIO_PENDENCIAS_2026-10-25.md`.

## Migration 024 no Neon — concluída

- Autorização: solicitação para terminar os próximos passos.
- Backup custom privado: `/home/dev/backups/konexus/dumps/neon-pre-024-20261025.dump`.
- SHA-256: `7820d6e324a9117a73cb18185d8a0da560ebb71a2fc58f511b0a2300bc7fb3aa`.
- Restauração com `pg_restore --exit-on-error` em `konexus_pre024_restore_20261025`.
- Migration aplicada primeiro na restauração; checks conferidos antes da aplicação remota.
- Aplicação remota com TLS `verify-full`, `ON_ERROR_STOP=1`, `lock_timeout=15s`, `statement_timeout=120s` e transação da migration.
- Pós-check: 9 organizações, 9 CNPJs, 10 pedidos de venda, 5 pedidos de compra, zero reservas e zero recibos de domínio, sem alteração das contagens.
- Os cinco checks de domínio/ação aceitam `purchase_order`/`approve`.
- Evidências privadas: `pre024.log`, `restored024.log`, `post024.log` em `/home/dev/backups/konexus/`.
- Health após aplicação: versão `1.4.3`, `ready:true`, commit `fa1678ee45216f4e4532f6e03ed5644c638ac3a7`.

## Aprovação e NF-e — implementadas na branch

- Pedido online pendente também grava `aguardando_aprovacao` e não agenda emissão na criação.
- A aprovação reivindica o processamento uma única vez; o claim verifica o status aprovado.
- Emissão fiscal direta recusa pedidos pendentes, cancelados e estornados antes de consultar itens ou transmitir.
- Replay da criação retorna o estado fiscal persistido, em vez de inventar um estado de processamento.
- Lista de vendas ganhou a aba Pendentes e a ação Aprovar pedido, visível com `vendas.edit`, usando a rota existente com reautenticação/auditoria.
- Integração PostgreSQL verificou ausência de agendamento enquanto pendente e agendamento único após aprovação, tanto online como offline. O emissor externo é um test double: nenhuma NF-e real foi transmitida.

## Windows — instalado aprovado; API sob teste manual do responsável

- Workflow agora dispara na branch `feat/offline-sales-closure`.
- Aplicativo instalado: verifica schema v4 e persistência após reinício das filas dos cinco domínios via IPC. Reservas desse smoke são fixtures locais, não reservas emitidas pela central.
- Job `installed-app` aprovado no [run 40219972965](https://github.com/mafaldo-dev/konexus/actions/runs/40219972965), frontend `384241a`: NSIS, login renderizado, SQLite v4, filas dos cinco domínios após reinício, backup, desinstalação e suites automatizadas.
- O run completo ficou vermelho porque o segundo job não conseguiu acessar o backend privado, antes de executar os testes PostgreSQL. O responsável optou por testar a aplicação manualmente; esse job foi retirado e nenhum segredo entre repositórios é necessário.
- Teste HTTP passou a integrar SQLite real, reinício, aprovação via HTTP/PostgreSQL, replay e ACK local confirmado. Foi executado com sucesso no Linux; não constitui aprovação desse fluxo no Windows.
- Roteiro manual: `ROTEIRO_HOMOLOGACAO_OFFLINE.md`.
- Não há publicação de instalador/release nesse workflow.

## Verificações locais executadas

- Backend completo: 209 testes, 209 aprovados, zero skips.
- Frontend: 169 testes aprovados.
- Electron: 54 testes aprovados.
- Integração de reservas/vendas após ajuste de replay: 12 testes aprovados.
- TypeScript e build Vite aprovados; permanece o aviso de bundle grande.

## Pendências que não estão concluídas

- Teste manual Windows com API/PostgreSQL pelo responsável; ainda sem resultado registrado.
- Offline integral dos demais setores: estoque interno/transferências/ajustes, CRM, treinamentos, devoluções, cadastros e administração ainda exigem implementação e homologação próprias. Aprovação de compra não equivale a recebimento/estoque/financeiro offline.
- Integrações fiscais, bancárias e eSocial reais dependem de certificados, credenciais e ambientes de homologação; testes locais não comprovam conformidade legal completa.
- Rotação de Neon/JWT permanece adiada pela decisão anterior do responsável.
- Merge, deploy e release continuam pendentes de confirmação específica; tags preservadas.
