# Relatório de execução — Konexus, 21/10/2026

## 1. Resumo e critério de conclusão

Foram alterados diretamente `konexus` e `konexus-back`, preservando SQL direto,
repositórios/serviços e estruturas existentes. Entregues identificação de instalações,
associação multiempresa, sessões verificáveis, presença, painel e correções comprovadas.

**A missão integral ainda não está concluída.** Os fluxos novos têm evidências de
persistência/isolamento/rollback em PostgreSQL e HTTP reais, mas não foram exercitadas
todas as operações dos módulos nem a interface completa em Electron/Windows.
Não houve deploy, publicação, emissão fiscal, movimentação financeira real ou
migração no banco configurado no `.env`.

## 2. Módulos e fluxos examinados

Inventário estático: **193 rotas HTTP literais**, rotas React e 58 candidatos a
entidades SQL. Ver [matriz](MATRIZ_ROTAS_2026.md) e [diagnóstico](AUDITORIA_2026.md).
Os candidatos incluem aliases/CTEs; não são introspecção do banco produtivo.

| Área | Evidência obtida | Cobertura ainda ausente |
|---|---|---|
| Autenticação/sessões | Leitura, regressões e HTTP+PostgreSQL real | Matriz completa de reset, bloqueios e Socket.IO |
| Computadores | UUID/IPC unitário; SQL+HTTP real; painel compilado | E2E visual Windows, múltiplos perfis/atualização |
| Auditoria/reauth | Testes existentes e integração de concessão/correlação/rollback | Atomicidade de todas as mutações antigas |
| Empresas/cargos/módulos | Catálogo, rotas, autorização e testes existentes | Cadastro completo/regras comerciais E2E |
| Vendas | Serviços/estoque/conferência, testes existentes e falha de commit fiscal | Totais/descontos/crédito/status/cancelamento E2E |
| Compras | Rotas e serviço de criação/consulta | Recebimento/estoque/financeiro E2E |
| Estoque | Transação real, bloqueio concorrente, saldo e rollback | Todos os caminhos indiretos de ajuste/cancelamento |
| Financeiro | Testes existentes de isolamento/repositórios | Baixas/estornos/relatórios completos E2E |
| Contabilidade | Testes existentes, correção da transação de depreciação | Esquema real completo, relatórios e concorrência E2E |
| CRM | Inspeção da interface e dependência de clientes | Negócios/pipeline persistentes; não aprovado |
| NF-e | Inventário, contratos, agendamento após commit com mock | Homologação autorizada do provedor |
| UI | Rotas, cliente, permissões, build e testes existentes | Formulários/botões de todas as telas via navegador |

## 3–4. Problemas por gravidade e correções efetivas

| Gravidade | Problema comprovado | Resultado |
|---|---|---|
| Crítica | Renderer Electron com Node, sem isolamento/webSecurity e exceção TLS | Preload restrito, sandbox, TLS padrão, validação de emissores |
| Alta | JWT válido seguia após logout/revogação | Middleware verifica sessão persistida/empresa/usuário/estação |
| Alta | Falhas ao registrar sessão/logout eram ignoradas | Início/fim persistem com evento SQL atômico; erro não é sucesso |
| Alta | Ramo de administrador global ignorava guard central | Guard aplicado; FK de colaborador não confundida com admin global; teste HTTP |
| Alta | Reautenticação global usava token empresarial do storage | Token original encaminhado fora do corpo da intenção |
| Alta | Hash redigido não detectava troca de valores secretos | HMAC do conteúdo completo, sem persistir segredos |
| Alta | Limite de senha incorreta consultava grants inexistentes | Conta eventos reais de falha; indisponibilidade bloqueia emissão |
| Alta | Kardex ignorava client transacional; movimentação manual sem transação | Reutiliza client, FOR UPDATE, transação, quantidade positiva/preço válido |
| Alta | Emissão fiscal agendada antes de confirmar COMMIT | Agendamento após commit; rollback testado sem provedor |
| Alta | Estação por pareamento podia pertencer a outra empresa | Contexto pós-login restringido e estação vem da sessão autenticada |
| Média | 401 limpava storage mas mantinha contexto; resposta antiga encerrava sessão nova | Notificação central e comparação do token; regressões automatizadas |
| Média | Downloads Blob interpretados como texto | Leitura binária real; regressão automatizada |
| Média | Correlação se perdia na confirmação/repetição | Mesmo UUID propagado às tentativas e operação final |
| Média | Depreciação ignorava injeção transacional | Usa dependência existente; teste volta a ser isolado |
| Média | Desativação de estação revogava código no ramo invertido | Condição corrigida |
| Média | Listeners/pedidos de reauth concorrentes podiam ficar pendentes | Cancelamento da solicitação anterior/unmount e respostas obsoletas ignoradas |
| Média | Timer Electron continuava após fechar janela | Timer liberado no fechamento |

## 5. Arquivos criados e modificados

### Frontend/Electron — criados

- `docs/AUDITORIA_2026.md`, `docs/MATRIZ_ROTAS_2026.md`
- `docs/RASTREABILIDADE_COMPUTADORES.md`, `docs/RESULTADOS_AUDITORIA_2026.md`
- `electron/installation.js`, `electron/installation.test.js`, `electron/preload.js`
- `scripts/audit-inventory.mjs`
- `src/pages/configurations/stations/Computers.tsx`

### Frontend/Electron — modificados

- `README.md`, `package.json`, `electron/main.js`, `electron/updateAssets.test.js`
- `src/AuthContext.tsx`, `src/api/client.ts`, `src/api/client.reauth.test.ts`, `src/api/reauth.ts`
- `src/components/Reauth/ReauthProvider.tsx`, `src/global.d.ts`, `src/index.tsx`, `src/login/index.tsx`
- `src/pages/configurations/stations/index.tsx`, `src/pages/manager/Products/index.tsx`
- `src/services/auditService.ts`, `src/services/reauthService.ts`, `src/utils/screenOptions.tsx`

### Backend — criados (prefixo `../konexus-back/`)

- `migrations/011_device_sessions.sql`
- `src/domain/repositories/deviceRepository.js`
- `src/http/routes/device.routes.js`
- `tests/integration/devicePersistence.test.js`, `tests/unit/orderCommit.test.js`

### Backend — modificados (mesmo prefixo)

- `README.md`, `server/main.js`, `src/config/env.js`
- `src/domain/repositories/{audit,kardex,reauth,session}Repository.js`
- `src/domain/services/{accountingIntegration,audit,auth,kardex,order,reauth,station}Service.js`
- `src/http/controllers/authController.js`
- `src/http/middleware/{audit,auth,protectedOperationGuard}.js`
- `src/http/routes/{auth.routes,index,protectedOperations}.js`
- `tests/unit/{auditService,protectedOperations,protectedOperationsPolicy,reauthService}.test.js`

Artefatos gerados ficam em build/ e `/tmp/opencode`; não foram versionados/publicados.

## 6. Migração criada

`011_device_sessions.sql`: instalação global; associação única empresa–instalação
em work_stations; metadados/comunicação; expiração/atividade em user_sessions;
índices de paginação, sessão por estação e tentativas de reautenticação.
É aditiva e idempotente, sem preenchimento retroativo especulativo.
Aplicada/reaplicada em schema temporário PostgreSQL 18 para comprovação.

## 7–9. Identificação, associação e sessões

UUID criptográfico em userData; interface IPC restrita; metadados do main.
Login → JWT/sid persistidos → registro autenticado → associação da empresa do token
→ sessão vinculada → heartbeat. Mesmo UUID pode ter associações isoladas em várias
empresas. UUID não é credencial nem identidade de hardware.

Sessões: início, expiração, última comunicação, atividade de negócio observada,
encerramento e motivo. Expiração/ausência de comunicação não inventam logout.
Revogação e desativação bloqueiam chamadas HTTP subsequentes. Heartbeat não estende JWT.
Documentação operacional completa em [rastreabilidade](RASTREABILIDADE_COMPUTADORES.md).

## 10–11. Eventos e histórico antigo

Mantidos eventos de negócio/reauth existentes. Acrescentados início/fim/expiração
observada, associação, edição, revogação e mudança de versão observada.
Tentativas de login recusadas não recebem usuário/empresa sem identidade comprovada.

Nenhum histórico antigo foi apagado ou convertido. Preservados audit_events e estações
legadas, IDs, datas e snapshots. Campos ausentes continuam desconhecidos. Não foi
medida a completude dos dados históricos reais nem executado backfill em produção.

## 12–13. Tela administrativa, proteção e matriz

Seção **Computadores e sessões** incorporada em `/config/stations`, com permissão
`audit:manage_stations`; histórico exige também `audit:view`. Lista paginada,
detalhes, sessões, horários completos/inatividade, edição de nome/setor/estado e
revogação. Eventos separados visualmente entre segurança/acessos e negócio.

PATCH de computador e revogação exigem reautenticação e gravam auditoria na
transação. As duas rotas de presença/associação são isentas justificadas (sessão
própria), não operações administrativas. Teste de matriz agora inclui routers
de dispositivos e contabilidade e falha se montagem conhecida não for inventariada.

## 14. Testes executados

| Verificação | Resultado final |
|---|---|
| Backend `npm test` com TEST_DATABASE_URL isolado | **123 aprovados, 0 falhas, 0 pulados** |
| Frontend `CI=true npm run test:frontend` | **74 aprovados, 8 suítes** |
| Electron `npm run test:electron` | **23 aprovados** |
| TypeScript `npx tsc --noEmit` | Aprovado |
| `node --check` nos JS backend modificados | Aprovado |
| Inventário estático | 193 rotas; não é execução E2E |

Integração real comprova: associação idempotente; mesma instalação em duas empresas;
dois usuários/sessões na mesma instalação; identidade/empresa falsificadas recusadas;
heartbeat não renova prazo nem cria logout/atividade humana; expiração sem fim fictício;
renomeação preserva snapshot; falha ao inserir auditoria desfaz edição; append-only;
logout/revogação persistentes; duas saídas concorrentes não excedem saldo; erro não
grava movimento parcial; HTTP de login/registro/heartbeat; senha errada/correta;
reuso de grant rejeitado; correlação; token após logout recusado; guard global.

As primeiras execuções encontraram falha do teste de depreciação, coluna faltante
na fixture de estoque, expectativa de canal IPC desatualizada e seleção de rota
global isenta no teste. Essas causas foram corrigidas e os testes relevantes repetidos.

PostgreSQL de teste foi criado em `/tmp/opencode/konexus-audit-pg`, porta 55439,
isolado do cluster existente. Schemas de teste removidos pelo teardown; servidor
temporário encerrado (confirmado sem processo ativo).

## 15. Builds executados

- Frontend: `npm run build` **aprovado com warnings** de lint existentes, Browserslist
  desatualizado e bundle grande (~618 kB gzip principal). Não é lint sem avisos.
- Backend: não possui script de compilação; sintaxe, importação do router e testes
  executados. Servidor de produção não foi iniciado.
- Electron Linux: `npm run electron:build -- --linux --dir --publish never ...`
  **aprovado**, pacote em `/tmp/opencode/konexus-electron-build/linux-unpacked`.
- Electron Windows NSIS: **falhou** ao executar `rcedit-ia32.exe` pelo Wine,
  `c0000135`/exit 53. Não foi gerado instalador NSIS aprovado. Repetir em Windows
  ou ambiente Wine com dependências corretas; sem publicar.
- Não houve execução visual do aplicativo empacotado nem atualização real instalada.

## 16–17. Pendências e riscos conhecidos

1. **Alta:** auditoria transacional e before/after ainda não integrados a todas as
   mutações antigas. Hook `finish` permanece best-effort em muitos módulos.
2. **Alta:** validação E2E de totais/descontos/status/crédito, vínculos de cliente/endereço,
   recebimento de compras, pagamentos/estornos e caminhos indiretos de estoque.
   Não se declara isolamento integral dos 193 endpoints apenas com testes centrais.
3. **Alta:** Socket.IO verifica JWT inicialmente, mas não foi integrado à revogação
   contínua de sid; conexões já abertas exigem revisão específica.
4. **Alta:** CRM de negócios/pipeline permanece sem persistência comprovada.
5. **Alta:** a nova migração é pré-requisito do backend; ausência causa bloqueio de
   autenticação. Planejar homologação/ativação coordenadas, sem execução automática.
6. **Alta:** administrador global legado ainda admite senha armazenada em texto claro;
   conversão de credenciais reais requer procedimento próprio, não foi executada.
7. **Média:** novos filtros avançados do painel, preferência de fuso por empresa,
   atualização automática dos relativos na tela parada e fila de eventos do updater
   ainda pendentes. Históricos de sessão e eventos têm paginações paralelas.
8. **Média:** logs técnicos permanecem majoritariamente console/electron-log;
   padronização estruturada e correlação integral não concluídas.
9. **Média:** expiração registrada quando observada, sem job global. Logout offline
   não revoga imediatamente token remoto. Sem promessa de presença humana.
10. **Média:** CORS `null` deve ser autorizado explicitamente quando há lista customizada;
    conferir relatórios, certificados TLS e atalhos com isolamento Electron habilitado.
11. **Média:** identificação é declarativa por perfil, pode ser copiada/adulterada;
    desativar uma associação não substitui bloquear usuário ou políticas de acesso.
12. **Média:** desempenho em grande volume, retenção/arquivo, carga, planos EXPLAIN,
    e migração sobre o esquema real completo ainda não medidos.

## 18. Validações manuais necessárias

1. Em homologação autorizada, revisar/aplicar 011 e confirmar índices e compatibilidade
   com todas as migrações existentes; usar dados descartáveis.
2. Compilar NSIS no Windows, instalar e testar login, restauração, troca de usuário,
   F1/F4, Excel, DANFE, navegação e erros com CORS/TLS corretos.
3. Confirmar UUID entre reinícios e atualização real; testar reinstalação com e sem
   userData e múltiplos perfis Windows. Não usar serial/MAC para recuperar identidade.
4. Usar dois usuários e duas empresas: filtros, renomeação, revogação, desativação,
   tentativa de reutilizar token e identificação de sessão sem encerramento.
5. Interromper rede/fechar processo, verificar heartbeat, expiração e ausência de
   logout fictício; testar fusos e transição de horário.
6. Exercitar cada linha da matriz de negócio com mocks fiscais, verificando persistência
   após recarga, permissões, concorrência, rollback e histórico de alterações.
7. Concluir as pendências de atomicidade, CRM e Socket.IO antes de considerar cumprido
   o critério de auditoria completa. Aprovação de build não encerra esses itens.
