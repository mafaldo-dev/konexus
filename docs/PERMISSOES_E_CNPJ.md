# Permissões, administrador principal e CNPJs

Atualizado em **21/10/2026** após a auditoria de autorização da release 1.4.1.
Este documento descreve o comportamento **verificado nos testes locais**. Nenhum
deploy ou migração de produção foi executado nesta etapa.

## 1. Dois níveis de acesso

| Ator | Regra |
| --- | --- |
| Administrador principal da organização | Cargo de sistema (`company_roles.is_system_admin`). Acessa todas as ações dos módulos **contratados** sem precisar autoconceder permissões. Continua sujeito a contrato de módulo, limites comerciais, reautenticação, regras fiscais/financeiras, isolamento de organização e controles de suporte. |
| Colaborador | Recebe permissões por **módulo + ação**, exceções individuais sobre o cargo e uma lista explícita de CNPJs. O nome do cargo não concede acesso. |

O bypass do administrador existe apenas na checagem de permissão de cargo. Ele
não ignora `checkModule`, `checkSubscription`, vínculo de CNPJ, reautenticação
nem validações de negócio.

## 2. Onde a decisão acontece

- Catálogo central: `konexus-back/src/domain/security/moduleCatalog.js`.
- Permissões efetivas e cargo: `authMiddleware` recarrega colaborador, cargo,
  permissões, módulos e versão de sessão do banco em **toda requisição**.
- Autorização de ação: `requirePermission` / `requireAnyPermission` em
  `konexus-back/src/http/middleware/authorization.js`.
- Contexto de CNPJ: `konexus-back/src/http/middleware/legalEntity.js` valida a
  empresa contra a organização, o vínculo explícito, o status e a operação.
- Frontend: `AuthContext`, `moduleMapping.ts` e `PermissionCheck` usam os dados
  retornados pelo backend. Ocultar botão/menu é apenas experiência de uso; o
  backend continua sendo a autoridade.

## 3. Permissões de colaborador

A tela **Administração → Usuários e Permissões** permite:

- editar a matriz de módulos e ações gerada pelo catálogo do backend;
- criar cargos e usá-los como modelo para um novo cargo;
- definir permissões individuais que prevalecem sobre o cargo;
- escolher os CNPJs do colaborador na mesma operação de permissões;
- desabilitar módulos não contratados na matriz;
- consultar quem pode operar cada CNPJ.

Regras aplicadas no backend:

1. Permissão para módulo não contratado é recusada com
   `MODULE_NOT_CONTRACTED`.
2. Colaborador ativo não pode ficar sem nenhum CNPJ ativo quando a organização
   possui ao menos um. Para retirar todo o acesso, a conta deve ser desativada.
3. CNPJ de outra organização ou inativo é recusado, mesmo que o ID seja
   manipulado.
4. Novo colaborador recebe **somente o CNPJ principal**, até ajuste explícito.
5. Cargo existente não promove ninguém automaticamente; a criação de conta
   administrativa por esse fluxo é bloqueada.
6. Um colaborador não pode conceder permissões a si mesmo.
7. Outro administrador não altera, redefine senha, remove ou desativa uma conta
   administrativa. O titular pode atualizar apenas dados não privilegiados.
8. A organização não pode ficar sem administrador ativo. Remoções de contas
   administrativas por este fluxo são bloqueadas por padrão.
9. A capacidade contratada de CNPJs continua sendo alterada apenas pelo
   suporte/administrador global.

## 4. CNPJ explícito e migração 014

A release 1.4.1 permitia inferir o CNPJ principal quando o colaborador não
tinha nenhuma linha em `contributor_legal_entities`. Esse fallback foi removido
do login, do seletor, do contexto de requisição e dos fluxos de criação/edição.

A migração **`konexus-back/migrations/014_explicit_legal_entity_access.sql`**:

- é aditiva e idempotente;
- concede explicitamente o CNPJ principal a quem ainda não tem nenhum vínculo
  ativo;
- não altera cargo, permissões, senha, status ou vínculo empregatício;
- não exclui registros.

**Ordem obrigatória de implantação:** aplicar a 014 e conferir o backfill
**antes** de publicar o backend que não usa mais o fallback. Sem isso, usuários
legados sem vínculo explícito ficariam sem CNPJ operacional.

A 014 foi aplicada no Neon em **21/10/2026**, após backup completo validado por
restauração em banco temporário. O comando terminou com `INSERT 0 0`: os 16
contribuidores existentes já tinham vínculo ativo com o CNPJ principal. A
conferência pós-migração encontrou 9 organizações, 9 CNPJs principais ativos,
zero contribuidores sem vínculo ativo e 9 administradores ativos. Nenhuma
permissão de cargo, senha ou vínculo empregatício foi alterada.

## 5. Reautenticação e auditoria

- `PUT /collaborators/:id/permissions` grava permissões e CNPJs em uma única
  operação e exige confirmação de senha.
- Os endpoints legados de concessão/revogação por CNPJ
  (`/legal-entities/:id/access` e `/legal-entities/:id/access/:contributorId`)
  também exigem reautenticação.
- A auditoria registra ator, alvo, antes/depois de permissões e CNPJs, sessão,
  estação, data e resultado.
- A concessão de reautenticação é de uso único, vinculada à sessão, operação,
  recurso e hash do conteúdo.
- A matriz de reautenticação é coberta por
  `konexus-back/tests/unit/protectedOperationsPolicy.test.js`, inclusive as
  rotas de permissões e de vínculo de CNPJ.

## 6. Revogação em sessão ativa

O token não é a única fonte de verdade. A cada requisição o backend recarrega:

- existência e atividade do colaborador;
- versão de sessão (`sv`);
- atividade do cargo;
- permissões de cargo e exceções;
- módulos ativos da organização;
- vínculo e status do CNPJ.

Assim, uma revogação de permissão ou de CNPJ passa a valer na requisição
seguinte, sem esperar o token expirar. No frontend, a sessão é recarregada ao
receber um `403` de autorização, ao voltar o foco, ao mudar a visibilidade da
aba, por evento interno e em intervalo curto. A interface também exibe uma tela
de **Acesso negado** e remove CNPJs antigos do seletor quando a autorização é
negada.

## 7. Validação executada

Resultados reais desta etapa, em 21/10/2026:

| Suíte | Resultado |
| --- | --- |
| Backend (`TEST_DATABASE_URL=... npm test`) | 142 testes: 140 passaram, 2 ignorados (integrações que exigem banco multi-CNPJ) |
| Autorização/CNPJ (`permissionsAuthorization.test.js`) | 15/15 subtests (16 testes no relatório do Node, incluindo o contêiner) |
| Multi-CNPJ (`multiCnpj.test.js`) | 12/12 |
| Frontend (`CI=true react-scripts test --watchAll=false --runInBand`) | 78/78 |
| Electron/update (`npm run test:electron`) | 24/24 |
| TypeScript (`npx tsc --noEmit`) | sem erros |
| Build de produção (`npm run build`) | concluído; somente warnings ESLint preexistentes |

Comandos usados:

```bash
# backend
cd konexus-back
TEST_DATABASE_URL=postgresql://dev@127.0.0.1:55439/konexus_audit_test npm test
MULTI_CNPJ_TEST_DATABASE_URL=postgresql://dev@127.0.0.1:55439/konexus_multi_test \
  node --test tests/integration/multiCnpj.test.js
MULTI_CNPJ_TEST_DATABASE_URL=postgresql://dev@127.0.0.1:55439/konexus_multi_test \
  JWT_SECRET=test-secret-at-least-16-chars \
  node --test tests/integration/permissionsAuthorization.test.js

# frontend
CI=true npx react-scripts test --watchAll=false --runInBand
npx tsc --noEmit
npm run build
npm run test:electron
```

## 8. Limites desta entrega

- Nenhum commit, push, deploy ou migração de produção foi realizado.
- A validação é local/isolada, com PostgreSQL de teste. Não substitui o ensaio
  de migração em cópia da base de produção.
- A migração 014 precisa ser aplicada e auditada antes do deploy do backend sem
  fallback.
- O build mantém warnings ESLint preexistentes de outras telas; não houve
  declaração de build “sem warnings”.
