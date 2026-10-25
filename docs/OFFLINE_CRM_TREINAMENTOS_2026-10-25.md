# CRM e treinamentos — operações finais offline

## Escopo entregue na branch

| Setor | Alvo existente | Operações offline |
|---|---|---|
| CRM | Atividade não concluída de oportunidade não arquivada | Concluir |
| Treinamentos | Inscrição de sessão/treinamento não cancelados | Registrar presença, ausência ou concluir inscrição com presença prévia; nota opcional 0–100 |

As abas CRM e Treinamentos estão em `/offline/domains`. A preparação continua online: atualizar alvos do CNPJ, reservar com reautenticação e salvar o token no cofre. Depois é possível enfileirar a operação sem rede, reiniciar e sincronizar com o mesmo UUID. Cada reserva permite uma operação: registrar presença e depois concluir exige sincronizar a presença e criar outra reserva.

Isto **não conclui CRM ou treinamentos integralmente offline**. Criação de leads, oportunidades, atividades, sessões e inscrições; edição/conversão de oportunidades e emissão de certificados ainda não estão disponíveis offline.

## Banco, transação e auditoria

- Migration `025_crm_training_offline.sql` amplia os checks de reserva/recibo e cria projeções de alvos por CNPJ.
- CRM usa o `legal_entity_id` da atividade; treinamento deriva o CNPJ do vínculo empregatício da inscrição.
- As projeções retornam somente ID, descrição, detalhe e status para o snapshot. A lista é limitada aos 200 alvos elegíveis mais recentes; não é uma réplica integral.
- Reserva consumida, mudança de estado, auditoria e recibo idempotente compartilham a mesma conexão/transação PostgreSQL.
- O CRM exige módulo e assinatura `crm` mais `crm.edit`; treinamentos exigem `rh.manage_training`. Estação registrada e CNPJ explícito continuam obrigatórios para operações finais.
- Cancelamento/reconciliação reutiliza as regras existentes: não há liberação automática por expiração.
- A migration foi aplicada em `konexus_multi_test` e na restauração local `konexus_pre024_restore_20261025`. **Não foi aplicada no Neon.**

## Endpoints

Para `crm-activities` e `training-enrollments`:

- `POST/GET /offline-reservations/{setor}`
- `GET /offline-reservations/{setor}/targets`
- `GET /offline-reservations/{setor}/all`
- `POST /offline-reservations/{setor}/:id/cancel`
- `POST /offline-reservations/{setor}/:id/reconcile`

Operações:

- `POST /offline-domain-operations/crm-activities/:id/complete`
- `POST /offline-domain-operations/training-enrollments/:id/attend`
- `POST /offline-domain-operations/training-enrollments/:id/absent`
- `POST /offline-domain-operations/training-enrollments/:id/complete`

## SQLite v5

Amplia domínios/ações e reconstrói as três tabelas de domínio em transação para bancos v3/v4. Dados cifrados de snapshots, reservas e operações são copiados; rascunhos e pedidos de venda permanecem nas tabelas existentes. A chave e o mecanismo de proteção do cofre são mantidos. O renderer não recebe SQL nem caminho de arquivo.

## Testes efetivamente executados

- Backend: **210/210**, zero skips.
- Frontend: **171/171**.
- Electron: **55/55**.
- TypeScript, build Vite e audit de dependências de produção nos dois repositórios: aprovados, zero vulnerabilidades reportadas. Build ainda informa bundle grande.
- PostgreSQL: isolamento por CNPJ, exclusividade entre estações, presença/ausência/conclusão, replay, conflito de nota e auditoria com CNPJ.
- Falha forçada ao gravar recibo CRM reverte conclusão, auditoria e consumo da reserva. Concluir inscrição sem presença também reverte o consumo.
- HTTP: recusa por falta de permissão/estação, assinatura CRM independente do contábil e consulta de alvos por CNPJ.
- SQLite: migração v4→v5 preserva os bytes cifrados da fila e sua integridade referencial; novas operações aceitam ACK e rejeitam nota fora do intervalo.
- Teste instalado Windows foi atualizado para schema v5 e sete domínios. **Sem resultado Windows registrado para esta versão**; teste manual da aplicação permanece com o responsável.

## Trabalho restante

Além dos fluxos de criação/edição listados acima, continuam pendentes: movimentos internos/transferências/ajustes de estoque offline, devoluções, recebimentos de compras, cadastros compartilhados, administração e fluxos fiscais reais. O ERP integral offline não está concluído. A migration 025 precisa de novo backup/preflight e autorização antes de produção; nenhum merge, deploy ou release faz parte desta etapa.
