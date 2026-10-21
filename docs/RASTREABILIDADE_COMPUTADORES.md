# Computadores e sessões — arquitetura e operação

## Identidade Electron

`electron/installation.js` publica um UUID v4 aleatório em
`app.getPath('userData')/installation.json`. A publicação é exclusiva e usa arquivo
temporário completo; leituras posteriores reutilizam o UUID. Arquivo corrompido
não é silenciosamente substituído. Não contém senha, token, hostname, MAC ou serial.

A unidade de identificação é o **perfil userData da instalação**, não hardware:
contas distintas do Windows podem ter UUIDs distintos no mesmo computador físico.
Copiar o perfil copia a identidade; perder/remover o perfil gera uma nova identidade.
Atualizar somente o executável mantém userData. Reinstalação e atualização reais
precisam de validação Windows. O UUID não autentica ninguém.

`preload.js` expõe apenas canais permitidos em `window.ipcRenderer`. `get_installation`
retorna UUID, plataforma, arquitetura, versão Electron e versão do aplicativo,
coletados pelo main. O main valida emissor/frame. Renderer sem Node, isolado e com
sandbox/webSecurity habilitados. Listeners não recebem o objeto privilegiado do Electron.
Relatórios blob e links HTTPS abrem em janela sem preload/Node.

## Associação e compatibilidade

Login valida senha normalmente, cria `user_sessions` e emite JWT com `sid`.
O frontend Electron chama `POST /devices/register` com esse token antes de liberar
a interface no login normal. O servidor confirma sid, usuário e empresa; ignora
qualquer companyId do corpo. Registro e evento são transacionais.

- `device_installations`: UUID global e primeira observação técnica.
- `work_stations`: associação empresa–UUID (índice único composto), nome, setor,
  estado e metadados declarados. Metadados de uma empresa não sobrescrevem outra.
- `user_sessions`: empresa, usuário, estação, snapshot do nome, início,
  comunicação, atividade de negócio observada, expiração e encerramento observado.
- `audit_events`: mecanismo existente, com correlação, sessão e estação.

Não há duplicação por login repetido. A mesma instalação pode ter associações
independentes em empresas diferentes. Alterar nome preserva snapshots anteriores.
Metadados e UUID são declarações do cliente: adulterá-los não concede acesso.

Pareamento legado permanece para navegador. Electron deixa de enviar o código
legado e passa a usar UUID. **Sessões antigas já vinculadas por pareamento precisam
de logout e novo login** para adotar a nova identificação; não se reescreve histórico.
Browser não gera fingerprint nem UUID fictício. Login global não associa empresa.

## Sessões, presença e tempo

- JWT e sessão persistida são verificados em cada requisição HTTP autenticada.
- Logout/revogação tornam o sid inutilizável. Falha de banco retorna indisponibilidade,
  não permite seguir com uma sessão não registrada.
- `expires_at` é definido no login segundo `JWT_EXPIRES_IN`. Heartbeat não o altera.
- `last_seen_at` é comunicação técnica, não movimento de mouse/teclado.
- `last_activity_at` é atualizado por eventos de negócio bem-sucedidos do mecanismo
  de auditoria; não representa toda interação/leitura e não inclui reautenticação.
- `ended_at` é fim observado (logout ou revogação). Expiração não inventa logout.
- Expiração é calculada nas consultas; tentativa com JWT expirado registra observação
  `session_expired` quando o banco está disponível. Não existe job de expiração global.
- Presença recente exige sessão não encerrada, ainda válida e comunicação nos últimos
  3 minutos. Sem comunicação recente: sem presença confirmada, não logout presumido.

Heartbeat: padrão 60 segundos, mínimo 30, configurável no build por
`REACT_APP_HEARTBEAT_MS`. Há uma chamada por vez por provider e timer cancelado ao
sair; falhas de rede são tentadas no próximo intervalo. Escritas SQL são limitadas
a uma a cada 30 segundos por sessão. Abas/janelas independentes ainda podem fazer
requisições, mas a atualização condicional reduz escritas redundantes.

Timestamps são TIMESTAMPTZ, serializados com instante UTC. A tela usa pt-BR, segundos
e fuso do ambiente, explicitamente identificado. Valores relativos são calculados
ao renderizar, não persistidos. Preferência de fuso por empresa ainda não foi adicionada.

## APIs e permissões

| API | Autorização / efeito |
|---|---|
| GET /login/session | Confirma sessão e retorna identidade/permissões atuais |
| POST /devices/register | Própria sessão de empresa; UUID/metadados limitados |
| POST /devices/heartbeat | Própria sessão válida; sem renovação |
| GET /devices?page=1 | audit:manage_stations; até 50 por página |
| GET /devices/:id/sessions?page=1 | Mesma permissão, sempre empresa do token |
| PATCH /devices/:id | Nome/setor/active; permissão + reautenticação exata |
| POST /devices/:id/revoke | Revoga sessões da associação; permissão + reautenticação |
| GET /audit/events | Histórico existente, audit:view e escopo de empresa |

Painel em Configurações → Estações (`/config/stations` conforme router): lista
computadores, última utilização, versão, usuário, inatividade, sessões e histórico
separado entre segurança e negócio. Permite renomear, setor, ativar/desativar e revogar.
Desativação revoga sessões abertas na mesma transação; reativação não restaura tokens.
Não há API para apagar histórico. Paginação fixa de 50; filtros avançados por data,
usuário e estado no novo painel ainda são pendentes (o painel de auditoria existente
mantém seus filtros).

## Auditoria e reautenticação

Eventos adicionais: `session_started`, `session_ended`, `session_expired`,
`installation_associated`, `update_device`, `session_revoked`,
`revoke_device_sessions`, `app_version_observed`. Mantidos login/logout,
reauth válida/inválida e eventos da matriz de operações existente.

Mudança de versão observada não prova instalação bem-sucedida pelo updater:
apenas informa versão anterior/atual declaradas em uma associação autenticada.
Download/erro/reinício continuam em electron-log; não foi implementada uma fila
persistente para enviá-los ao servidor depois do login.

Concessões: uso único, curta duração, sid/empresa/usuário/operação/recurso e HMAC do
conteúdo completo. Trocar valores sensíveis também invalida a concessão. Segredos
não são registrados; HMAC usa JWT_SECRET compartilhado entre réplicas e separação
de domínio. Concessões antigas (hash anterior) são invalidadas durante atualização;
basta reconfirmar a senha. Limite de tentativas consulta os eventos reais de senha
inválida, não grants que nunca foram emitidos. Falha nessa consulta bloqueia emissão.

Correlação acompanha 403 inicial → tentativas de senha → repetição. O token enviado
ao endpoint de reautenticação é o da requisição original, inclusive no workspace
global, e nunca é incluído no corpo da intenção. Concessão não concede permissão.

Cadastro/edição/revogação de computadores e início/fim de sessão possuem auditoria
na mesma transação/instrução SQL. **A atomicidade ainda não cobre todos os módulos**:
o hook legado `finish` continua best-effort para diversas alterações de negócio.
O trigger append-only protege APIs/usuários sem privilégios administrativos; DBA
pode alterá-lo. Não se afirma imutabilidade absoluta.

## Migração, histórico e retenção

Migração `../konexus-back/migrations/011_device_sessions.sql` é aditiva, transacional
e idempotente. Depende da estrutura 007; preservar também 010. Validada em schema
temporário PostgreSQL 18. Nenhuma migração executada no banco configurado no `.env`.

Antes de ativar esse backend em ambiente autorizado, aplicar a migração e validar
esquema/índices. Sem ela o login falha fechado. Não executar scripts de seed/smoke
contra produção. CORS do Electron `file://` usa origem literal `null`: quando
`CORS_ORIGINS` está configurado explicitamente, incluir `null` em homologação para
o desktop. Isso não identifica o aplicativo; APIs continuam exigindo Bearer JWT.
Não desativar validação TLS para compensar CORS.

Não migramos nem apagamos eventos antigos. IDs/datas/snapshots originais permanecem.
Expiração/atividade/instalação ausentes ficam desconhecidas, sem preenchimento
retroativo. Fontes legadas incluem audit_events, eventos de colaboradores/módulos,
históricos contábeis, console e electron-log; sua qualidade em produção não foi medida.

Retenção-alvo existente: 5 anos para audit_events; confirmar requisito empresarial.
Não há limpeza automática nesta entrega. Arquivamento deve ser autorizado, preservar
procedência/IDs/datas e validado fora das APIs normais. Dimensionar crescimento,
backup e acesso do usuário SQL antes de produção.

## Como proteger uma nova operação

1. Registrar rota no router real e usar autenticação/empresa/permissão explícitas.
2. Adicionar à `protectedOperations.js`, com ação, entidade, reauth e vínculo de conteúdo.
3. Executar mutação e `auditService.record(event, client)` no MESMO client/transação.
   Usar `transactionalAudit: true` apenas quando isso realmente estiver implementado.
4. Construir mudanças por lista permitida; mascarar dados pessoais e omitir segredos.
5. Não usar `recordSafe` para auditoria obrigatória de alteração confirmada.
6. Testar empresa adversária, senha inválida, reuso, mudança de conteúdo, rollback,
   concorrência e falha de auditoria. Atualizar inventário com `node scripts/audit-inventory.mjs`.
7. Não considerar cobertura estática da matriz como teste E2E do novo módulo.

## Reprodução dos testes isolados

Os testes de integração exigem `TEST_DATABASE_URL` apontando **somente** para
localhost/127.0.0.1 e banco `konexus_audit_test`; criam e removem schema próprio.
Sem essa variável, o teste PostgreSQL é explicitamente pulado, não aprovado.

```sh
# Backend; DATABASE_URL deliberadamente inacessível impede acesso ao .env real.
TEST_DATABASE_URL=postgres://dev@127.0.0.1:55439/konexus_audit_test \
DATABASE_URL=postgres://invalid:invalid@127.0.0.1:1/isolated_test \
JWT_SECRET=isolated-test-secret NODE_ENV=test npm test

# Frontend/Electron (em konexus)
CI=true npm run test:frontend
npm run test:electron
npx tsc --noEmit
```

Fixture de integração contém o esquema mínimo necessário, não cópia integral do ERP.
O teste HTTP global valida autenticação/reautenticação com handler final de teste;
não cria empresa real. Nenhum provedor fiscal/financeiro é chamado.
