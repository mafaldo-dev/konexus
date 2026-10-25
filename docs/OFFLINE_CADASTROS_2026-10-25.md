# Cadastros, CRM, treinamentos e administração offline

## Escopo entregue na branch

A tela `/offline/records` permite criar e editar, no cofre SQLite do desktop, os seguintes tipos fechados pelo servidor:

| Grupo | Tipos |
|---|---|
| Cadastros | cliente, fornecedor, produto |
| CRM | lead, oportunidade, atividade |
| Treinamentos | categoria, treinamento, turma, inscrição |
| Administração | cargo, colaborador (usuário e acessos) |

Cada operação é enfileirada com UUID idempotente, payload cifrado e tentativa de sincronização posterior. A criação e a edição usam versão otimista: uma cópia desatualizada retorna `OFFLINE_RECORD_CONFLICT` e não sobrescreve a central. Reutilizar a mesma chave com outro conteúdo retorna `OFFLINE_REQUEST_REUSED`; reutilizar um `localId` já confirmado retorna `OFFLINE_LOCAL_ID_REUSED`.

Referências a registros criados neste computador usam `local:<uuid>`. O servidor resolve a referência para o ID central somente dentro da transação, depois que a criação anterior foi confirmada. Uma dependência ainda não sincronizada retorna `OFFLINE_LOCAL_REFERENCE_PENDING` e a fila continua tentando, sem gravar operação parcial.

## Banco e transação

- Migration `027_offline_records.sql` cria `offline_record_operations` com unicidade por `(company_id, client_request_id)` e por `(company_id, local_id)`.
- O registro de destino, a resolução de referências locais, a auditoria e o recibo idempotente são gravados na mesma transação PostgreSQL.
- A falha em qualquer etapa reverte o registro, o recibo e a auditoria; o teste HTTP cobre rollback de cliente com endereço inválido.
- O catálogo de tipos e campos é fechado no servidor. O cliente não envia nome de tabela, coluna ou SQL.
- A lista administrativa devolve as permissões efetivas e os CNPJs atuais do colaborador para que a edição offline não apague acessos por desconhecimento.

## Permissões e contexto

- A execução exige estação registrada e revalida módulo, assinatura, permissão e vínculo de CNPJ no momento da sincronização.
- Cadastros usam `gestao/create` ou `gestao/edit`; CRM usa `crm.create`/`crm.edit` e assinatura `crm`; treinamentos usam `rh.manage_training`; administração exige `isCompanyAdmin`.
- Clientes, fornecedores, produtos, CRM, treinamentos e inscrições exigem CNPJ explícito. A inscrição valida que o CNPJ da operação corresponde ao vínculo empregatício.
- A lista de CRM e inscrições é filtrada pelo CNPJ ativo; o catálogo e as opções nunca devolvem SQL, caminho de arquivo ou credenciais.
- A auditoria registra usuário, sessão, estação, CNPJ, módulo, entidade, ação e campos alterados.

## Endpoints

- `GET /offline-records/catalog`
- `GET /offline-records/options`
- `GET /offline-records/:type`
- `POST /offline-records/:type/create`
- `POST /offline-records/:type/update` (quando o tipo aceita edição)

Os tipos e operações são enumerados pelo catálogo do servidor; não existe rota genérica para tabelas arbitrárias.

## SQLite v7

O schema v7 adiciona `offline_records` e `offline_record_outbox`. Rascunhos, fila, resultados de ACK e metadados são cifrados com a chave do cofre; não há fallback em texto aberto. A migração v6 → v7 preserva rascunhos, reservas, pedidos e filas de domínio existentes. O renderer recebe somente dados decifrados pela ponte IPC, nunca a chave, o SQL ou o caminho do banco.

O estado local distingue `draft`, `queued`, `synced` e `conflict`. Conflitos não são reenviados automaticamente; o usuário pode atualizar a cópia central, descartar o rascunho e refazer a edição. Operações bloqueadas por `AUTH`, `ACCESS` ou `DEVICE` podem ser retomadas após login/dispositivo.

## Testes efetivamente executados

- Backend: **212/212**, zero falhas e zero skips.
- Frontend: **178/178**.
- Electron: **59/59**.
- TypeScript, build Vite e auditoria de dependências de produção: aprovados; o build continua informando bundle grande.
- HTTP/PostgreSQL: permissão, estação registrada, CNPJ explícito, replay idempotente, conflito de versão, reutilização de `localId`, referência local pendente, criação de cliente/fornecedor/produto, linhas de `product_stock`, cargo e colaborador administrativo com permissões/CNPJs, e rollback transacional.
- SQLite: schema v7, cifragem em repouso, fila/claim/ACK/rejeição/retry, conflito, estatísticas e remoção da senha inicial do colaborador após o ACK.
- Frontend: catálogo/opções, cópia central sem sobrescrever rascunho, fila idempotente, ACK exato, conflito e referência local pendente.

A migration 027 foi aplicada em `konexus_multi_test`, `konexus_schema_template`, `konexus_audit_test` e `konexus_e2e`. **Ela não foi aplicada no Neon.**

## Limitações e trabalho restante

- Não há exclusão offline de cadastros; descartar remove apenas o rascunho local.
- Conversão de lead, edição de atividade CRM, certificados de treinamento, recebimento de compras, criação/edição de devoluções e fluxos fiscais reais continuam fora desta fatia.
- A criação de colaborador mantém a senha inicial apenas no payload cifrado até o ACK; depois da confirmação, ela é removida do registro e da operação local. A senha não é exibida novamente e deve ser tratada como provisória.
- A administração offline não altera a conta administrativa do sistema protegida pelas regras existentes.
- O aplicativo instalado no Windows com schema v7 e esta tela ainda não foi homologado manualmente; não há resultado Windows registrado.
- A migration 027 precisa de novo backup, restauração/preflight e autorização explícita antes do Neon.
- Merge, deploy, release e movimentação de tags continuam pendentes de confirmação. A release pública 1.4.3 não contém esta fatia.
- Rotação da senha do Neon e do `JWT_SECRET` permanece adiada e é gate de go-live.
