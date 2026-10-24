# Homologação e segurança — 23/10/2026

## Resultado e alcance

As verificações abaixo foram executadas em Linux, Node 24.14 e PostgreSQL local descartável, com dados de teste identificados como QA. Nenhuma credencial de produção foi usada para login/smokes. O Neon foi acessado para inspeção de schema, backup e aplicação das migrations autorizadas.

**Os cenários executados passaram. Isso não constitui homologação de todas as combinações possíveis nem garantia contra todo tipo de ataque.** A navegação de uma tela não equivale à aprovação de todas as ações dela. Os alertas de dependências remanescentes e as limitações abaixo impedem declarar o sistema integralmente livre de vulnerabilidades.

## Verificações executadas

| Verificação | Resultado |
|---|---|
| TypeScript `npx tsc --noEmit` | Aprovado, zero erros |
| Backend, incluindo integrações PostgreSQL habilitadas | 175 aprovados, zero falhas/skips |
| Frontend Jest | 15 suítes, 126 testes aprovados |
| Electron unitário | 24 testes aprovados |
| HTTP autenticado + asserts SQL | 95 verificações aprovadas |
| Chromium: login + navegação das rotas estáticas | 52 verificações aprovadas, zero erros fatais/HTTP 5xx observados |
| Chromium: cadastro de fornecedor, cliente e produto | 3 criações aprovadas, HTTP 201 após confirmação de senha |
| Electron 45.0.0 Linux headless | 7 verificações aprovadas: login e seis telas |
| Build React | Aprovado; permanecem avisos ESLint e de tamanho do bundle |
| `git diff --check` | Aprovado |

Resultados desta rodada substituem a contagem histórica de smokes de 22/10. Os scripts antigos em `/tmp/opencode` não sobreviveram à reinicialização do ambiente. Foram criados scripts versionados para reprodução.

### Fluxos HTTP/SQL

- Autenticação real, token inválido rejeitado e seleção de dois CNPJs.
- Criação/edição de fornecedor, cliente e produto; entrada em estoque independente por CNPJ.
- Venda com baixa de estoque, expedição, entrega e baixa do recebível.
- Pedido de compra, alteração para recebido, devolução parcial: rascunho → envio → aprovação → recebimento físico → crédito explícito ao fornecedor.
- Conta bancária, crédito, estorno e conferência do saldo; fluxo de caixa e consolidado.
- Ordem de serviço, itens persistidos, movimentação e conclusão. Produto inexistente causa rollback sem cabeçalho órfão; quantidade negativa é recusada.
- Treinamento, categoria, sessão, inscrição vinculada ao empregador, presença, conclusão e certificado. Conclusão sem presença recusada.
- Folha gerencial: remuneração com fonte, rubrica com vigência, evento, cálculo, aprovação, fechamento e integração idempotente ao financeiro. O cenário usa salário 3.000 e adicional gerencial 200, sem inferir tributos.
- CRM: etapa, lead qualificado, conversão em oportunidade, atividade, conclusão e histórico.
- Contábil: contas analíticas, período, lançamento balanceado, contabilização, relatórios e estorno. Edição de lançamento contabilizado recusada.
- Acesso cruzado a pedido, conta bancária, folha e lançamento entre CNPJs não retorna os registros da matriz. Integrações adicionais cobrem adulteração de IDs, permissões e separação entre organizações.
- Auditoria persistida; configuração fiscal legível e emissão sem PlugNotas configurado recusada. Nenhuma autorização fiscal foi simulada.

## Cenários A–E

| Cenário | Classificação | Evidência |
|---|---|---|
| A — Contas bancárias | Aprovado | Criação, movimentação, estorno, saldo e isolamento |
| B — Fluxo de caixa | Aprovado | Consulta e consolidado HTTP; integração PostgreSQL de realizado/previsão |
| C — Devoluções | Aprovado | Ciclo HTTP completo, baixa física SQL e crédito explícito; criação via UI não automatizada |
| D — Treinamentos | Aprovado | Inscrição, presença, conclusão e certificado com vínculo |
| E — Folha gerencial | Aprovado | Cálculo e integração financeira idempotente |
| E — Folha legal completa | Bloqueado | Sem validação normativa de INSS, IRRF, FGTS, holerite ou eSocial |

## Correções desta revisão

- Ordem de serviço: uso correto do ID retornado pelo INSERT; cabeçalho, itens, estoque e leitura final na mesma transação. Validação de quantidades e pertencimento do produto à organização.
- Mensagens: rotas `recent`/`unread` antes do parâmetro genérico; normalização do envelope HTTP no frontend e identificação do remetente/destinatário; exclusão usa identidade do token.
- PlugNotas: callbacks mantêm a instância do controller, eliminando erro 500 por perda de `this`.
- Reautenticação: corpo vazio usa a mesma normalização no emissor e consumidor da concessão. Testado uso único e rejeição de conteúdo alterado, outra sessão/empresa e expiração.
- TLS PostgreSQL remoto valida certificado e hostname. Parâmetros da URL não desabilitam essa verificação. Conexão verificada com o Neon.
- CSP da API restringe scripts, framing, formulários e documentos enviados; `nosniff` e HSTS de produção preservados.
- Limitador de login compartilha contador entre falhas simultâneas e retorna `Retry-After`. Continua sendo in-memory, portanto não oferece limitação distribuída entre réplicas.
- Endpoint de prontidão exige também as novas tabelas.

## Dependências e segurança residual

| Auditoria npm | Antes | Depois |
|---|---|---|
| Backend | 11 (1 crítica, 7 altas, 3 moderadas) | **0** |
| Frontend, incluindo ferramentas | 94 (8 críticas, 58 altas, 17 moderadas, 11 baixas) | **51** (0 críticas, 14 altas, 28 moderadas, 9 baixas) |

Atualizações incluem Sharp 0.35.5, Electron 45.0.0, electron-builder 26.15.3, jsPDF 4.2.1, html2pdf.js 0.14.0, SheetJS 0.20.3 da distribuição oficial, PostCSS e dependências compatíveis. Backend requer Node >=22, alinhado ao Dockerfile.

Os 51 alertas restantes concentram-se na cadeia legada de `react-scripts`/webpack-dev-server, SVG/CSS, serialização e ambiente Jest. **Não foram considerados resolvidos nem descartados como falsos positivos.** `npm audit fix --force` propõe `react-scripts@0.0.0`, que não é uma correção funcional aceitável. A migração desse toolchain exige trabalho e regressão próprios. Não publicar o servidor de desenvolvimento na internet; o artefato de produção é o build estático/Electron.

A revisão cobriu controles de sessão, permissões, reautenticação, isolamento, transações e dependências. Não foi um pentest externo completo: DDoS distribuído, infraestrutura/cloud, redes, engenharia social, todos os payloads XSS/SQLi/SSRF e comprometimento de fornecedores não foram exaustivamente testados. Não há garantia absoluta de segurança.

Credenciais do Neon já apareceram em saída de terminal no histórico anterior: recomenda-se sua rotação no provedor e atualização do segredo no deploy. Elas não estão neste relatório nem nos commits.

## Neon: execução e recuperação

- Destino inspecionado: banco `neondb` no projeto Neon já configurado no backend.
- Aplicadas **015, 016, 017 e 018**, aditivas, em transação única com advisory lock, `lock_timeout=10s` e `statement_timeout=120s`.
- Backup anterior em formato custom, arquivo com modo 0600: `/tmp/opencode/neon-before-operations-20261023.dump` (485.931 bytes).
- Restauração desse backup executada com `pg_restore --exit-on-error` em `neon_restore_check`, exclusivamente local, aprovada.
- Consultadas as novas tabelas após COMMIT. Nenhum dado QA foi semeado no Neon.
- Backup contém dados reais e **não é versionado**. Cópia privada preservada em `/home/dev/.local/share/opencode/backups/neon-before-operations-20261023.dump` (diretório 0700/arquivo 0600); manter também uma cópia no armazenamento privado operacional antes de remover esta máquina.
- Script versionado no backend: `scripts/apply-operations-migrations.mjs`; sem `--apply`, somente inspeciona. Não reexecutar restauração em produção sem plano operacional, pois reverter banco após novas escritas exige preservar esses dados.

## Reprodução

Backend, com bancos locais já migrados:

```sh
DATABASE_URL=postgres://postgres@127.0.0.1:55440/konexus_e2e \
TEST_DATABASE_URL=postgres://postgres@127.0.0.1:55440/konexus_audit_test \
MULTI_CNPJ_TEST_DATABASE_URL=postgres://postgres@127.0.0.1:55440/konexus_multi_test \
NEW_FEATURES_TEST_DATABASE_URL=postgres://postgres@127.0.0.1:55440/konexus_e2e npm test

# Backend local em :3010, banco descartável konexus_e2e com migrations 001–018.
HOMOLOGATION_DATABASE_URL=postgres://postgres@127.0.0.1:55440/konexus_e2e node scripts/homologation.mjs
```

O script HTTP cria uma organização QA isolada a cada execução, conserva os registros para inspeção e gera contexto privado em `/tmp/opencode/homologation-context.json`. Nunca apontá-lo para produção.

Frontend local em `http://localhost:3000` com `REACT_APP_API_URL=http://localhost:3010`:

```sh
npx tsc --noEmit
CI=true npm run test:frontend
npm run test:electron
npm run build
# Instalar Playwright e Chromium em ambiente de testes.
PLAYWRIGHT_MODULE=/tmp/opencode/browser/node_modules/playwright/index.mjs node scripts/homologation-ui.mjs
PLAYWRIGHT_MODULE=/tmp/opencode/browser/node_modules/playwright/index.mjs node scripts/homologation-forms.mjs
PLAYWRIGHT_MODULE=/tmp/opencode/browser/node_modules/playwright/index.mjs node scripts/homologation-electron.mjs
```

## Limitações de entrega

- **Windows/instalador: Não executado.** Electron exercitado em Linux, `isPackaged=false`, headless e `--no-sandbox` apenas no harness. Testar instalação, inicialização, persistência após reinício, update assinado e desinstalação em Windows antes de publicar instalador.
- **NF-e real: Bloqueado** sem certificado/configuração de homologação fiscal. Não houve emissão/transmissão.
- **Folha legal: Bloqueado**, conforme acima.
- Escritas pela UI foram exercitadas nos três cadastros principais. Os demais ciclos foram cobertos por HTTP/SQL e navegação, não por todas as combinações de cliques/formulários.
- Exportações PDF/XLSX após atualização das bibliotecas: compilação aprovada; conferência visual de todos os documentos não executada.
- Admin global, integrações externas e sessões reais de usuários de produção: não homologados ponta a ponta nesta rodada.
- A tag `v1.4.2` deve permanecer em `22fde71dd438bd940ec9b8168e5c1ab0f2f12a80`. Nenhuma nova release/instalador integra esta entrega.
- Implementação frontend: `89ec982`; backend: `a3da4a2`. Ambos enviados com sucesso para `origin/main`, sem force-push.
- Após o envio, `GET https://backend-oi68.onrender.com/health/release` retornou `ready:true`, versão `1.4.2`, commit `fc45cba581329df05cec93bb7e9ff526a602e087` (anterior). **O deploy da implementação nova ainda não foi confirmado**, e não houve smoke autenticado em produção. Push não prova por si só que um deploy automático terminou.

## Atualização de 24/10: Vite, SQLite e Windows

Esta seção corrige o estado acima, que é histórico:

- O frontend foi migrado de `react-scripts` para Vite 8/Jest 30. O `npm audit` do frontend e do backend chegou a **zero alertas**; a linha anterior sobre 51 alertas não representa o estado atual.
- O Windows instalado foi validado no run [40098318327](https://github.com/mafaldo-dev/konexus/actions/runs/40098318327): instalação NSIS, inicialização do executável, criptografia/recuperação pelo cofre, identidade persistente e desinstalação. A linha "Windows/instalador: Não executado" acima está superada.
- A branch `feat/offline-isolated` adiciona SQLite no processo principal do Electron para rascunhos de vendas, com criptografia AES-256-GCM, outbox transacional, leases, migração do IndexedDB, backup com manifesto e testes de falha. O detalhe e as limitações estão em `docs/OFFLINE_INTEGRAL_2026-10-24.md`.
- O SQLite cobre **apenas rascunhos de vendas**. Não há banco local de estoque, financeiro, folha, contábil, fiscal, compras ou CRM; não há reservas por dispositivo; não há login/permissões offline assinados. A arquitetura para os demais setores continua pendente.
- A migration 019 e o código desta branch não foram aplicados ao Neon nem publicados em release. A tag `v1.4.2` permanece em `22fde71dd438bd940ec9b8168e5c1ab0f2f12a80`.
- A rotação das credenciais Neon continua bloqueada pela falta de acesso coordenado aos secrets do Render/Neon. Nenhuma senha foi alterada isoladamente.
