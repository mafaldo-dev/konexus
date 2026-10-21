# Entrega incremental M1 — 21/10/2026

## Estado e escopo

Esta é a primeira tranche do plano [EVOLUCAO_QUATRO_MODULOS](EVOLUCAO_QUATRO_MODULOS.md),
não a conclusão dos quatro módulos. A matriz registra cada grupo 5.1–8.13, prioridade,
dependências, riscos e aceite. As alterações anteriores de rastreabilidade continuam
preservadas nos dois repositórios; seus resultados estão em relatório separado.

### Estado inicial

- CRM: oportunidades mock, edição/cadastro em memória, indicadores não confiáveis.
- Financeiro: títulos existentes; consulta cliente com erro, baixa repetível, sem tesouraria completa.
- Contabilidade: estrutura real de partidas/períodos/relatórios; data civil podia recuar um dia.
- RH: usuários confundidos com empregados; indicadores salariais placeholders, sem modelo trabalhista.

## Funcionalidades e classificação atual

| Funcionalidade | Classificação | Evidência / limite |
|---|---|---|
| CRM backend: leads, oportunidade, atividade | Funcional e testada | PostgreSQL real, autorização HTTP, rollback |
| Qualificação/conversão lead→oportunidade | Funcional e testada | mesma transação, histórico preservado, conversão única |
| Valores do pipeline/ponderado/conversão | Funcional e testada | NUMERIC SQL, ganhos/encerrados, zero sem registros |
| Isolamento CRM | Funcional e testada | FKs compostas, referências adversárias, companyId forjado ignorado |
| Idempotência e versão concorrente | Funcional e testada | retry retorna mesmo ID; payload diferente/versão antiga recusados |
| Kanban/UI/histórico/filtros/paginação | Implementada, mas não testada completamente | compilação/tipos; falta E2E visual |
| Configuração de etapas | Parcial | criação de etapas/outcome/probabilidade; falta editar/reordenar/arquivar |
| Agenda | Parcial | atividades internas com horário/fuso e conclusão; falta calendário |
| Lead completo/deduplicação/mesclagem | Parcial | campos básicos e qualificação; faltam regras avançadas |
| Cliente existente compartilhado | Funcional e testada no backend | oportunidade referencia Customers; não duplica cadastro |
| CRM→Vendas/propostas/360/metas/automação | Não implementada nesta tranche | próximo M2 |
| Consulta financeira por cliente | Funcional e testada | regression SQL real |
| Baixa total sem repetição | Funcional e testada | UPDATE condicional, concorrência real |
| Contas a pagar: validação decimal | Funcional e testada na função compartilhada | caminho completo do formulário não revalidado |
| Financeiro empresarial completo | Parcial | tesouraria/parciais/OFX/orçamento/cobrança pendentes |
| Datas civis contábeis | Funcional e testada | teste inclui virada do ano e dia inválido |
| Contabilidade empresarial completa | Parcial | não requalificada integralmente por esta correção |
| RH operacional separado do login | Não implementada | arquitetura/lacunas documentadas |
| ECD/ECF/eSocial/FGTS/folha legal | Dependente de validação regulatória e integração externa | portais consultados; sem geração/transmissão oficial |
| Workflow de release draft→assets→latest | Implementada, mas não testada completamente | teste local de ordem/condições; não executado no GitHub |

## Integrações, segurança e auditoria

CRM reutiliza Contributor apenas para responsável comercial (usuário), Customers para
cliente, empresa/sid/estação do middleware e AuditService central. Mutação e evento
na mesma transação. Dados pessoais de contato/notas não são copiados para audit changes;
campos alterados são identificados por nome e alterações de estado/valor/responsável
são registradas com antes/depois.

APIs `/crm/*` exigem autenticação, companyContext, módulo disponível, contratação CRM
ativa e permissão. Mutação exige reautenticação na matriz central. Arquivar exige
`crm:delete`, editar `crm:edit`, criar `crm:create`, configurar etapas `crm:configure`.
Histórico específico exige `crm:view`, é limitado ao tipo/registro/empresa e paginado.
Financeiro segue freemium; Contabilidade continua extra independente.

Dashboard é calculado sobre todos os registros não arquivados, não sobre os 50 cards
carregados. A previsão ponderada não é receita realizada. Valor em NUMERIC(14,2),
API decimal em string; validação compartilhada rejeita prefixos inválidos/NaN/negativos
e excesso de casas. Conversão para Number no frontend serve somente à exibição.

O plano de integrações futuras não foi executado automaticamente: nenhuma proposta
gera pedido, nenhuma folha gera obrigação e nenhum evento gera contabilidade sem
serviço, mapeamento, autorização e idempotência próprios.

## Alterações de banco e arquivos desta tranche

Migração aditiva **012_crm_pipeline.sql**. Depende do schema existente e da auditoria
007–011. Aplicada duas vezes em schema isolado, sem dados produtivos. Etapas padrão
não são negócios mock. Novas empresas podem cadastrar etapas pela API/tela.

Backend (`../konexus-back/`):
- Novos: `migrations/012_crm_pipeline.sql`, `src/shared/decimal.js`,
  `src/domain/repositories/crmRepository.js`, `src/domain/services/crmService.js`,
  `src/http/controllers/crmController.js`, `src/http/routes/crm.routes.js`,
  `tests/integration/crmPersistence.test.js`, `tests/unit/decimal.test.js`.
- Alterados: `src/http/routes/index.js`, `src/http/routes/protectedOperations.js`,
  `src/domain/security/moduleCatalog.js`, `src/domain/repositories/paymentRepository.js`,
  `src/domain/repositories/paymentAccountRepository.js`,
  `tests/unit/protectedOperations.test.js`, `tests/unit/paymentMultitenancy.test.js`, README.

Frontend:
- Novos: `src/pages/CRM/Workspace.tsx`, `src/services/crmService.ts`,
  `src/utils/calendarDate.ts`, `src/utils/calendarDate.test.ts`,
  `electron/releaseWorkflow.test.js`, este relatório e plano persistente.
- Alterados: `src/pages/CRM/index.tsx`, `src/pages/Financial/accounting/components.tsx`,
  `.github/workflows/release.yml`, `scripts/audit-update-flow.mjs`,
  `scripts/audit-inventory.mjs`, `docs/MATRIZ_ROTAS_2026.md`, README.

UI mantém Dashboard/sidebar/header e usa Button/Card/Modal/Field existentes, paleta
slate/azul, estados vazios/erro, scroll horizontal do Kanban, alternativa acessível por
select para mover cards. Não houve troca de tema/biblioteca ou tamanho da janela.

## Testes e validações executados

- Backend com banco local descartável: **131 passaram, zero falhas, zero pulados**.
- Frontend Jest: **75 passaram, 9 suítes**.
- Electron/atualizador/workflow: **24 passaram**.
- `npx tsc --noEmit`: passou.
- `node scripts/audit-update-flow.mjs --skip-network`: passou após corrigir a verificação
  antiga que não admitia o parâmetro event usado para validar o emissor IPC.
- `CI=false npm run build`: passou, com warnings legados. Não equivale a lint sem avisos.
- `npm run electron:build -- --linux --dir --publish never`: passou. Pacote em
  `/tmp/opencode/konexus-modulos-m1-build/linux-unpacked`; não é instalador Windows.
- `node scripts/audit-inventory.mjs`: inventário atualizado para **208 rotas literais**.

Teste CRM cobre criação/retry/conversão, lookup entre empresas, FK adversária, edição
concorrente, motivo de perda, agregados, atividade idempotente, filtro/página/arquivo,
rollback se a auditoria falha e HTTP autenticado com grants reais. Também valida que
senha correta não concede permissão a usuário de leitura ou contratação a outra empresa.
Financeiro testa duas baixas simultâneas: somente uma confirma.

Não foram executados E2E visual, teste de carga, banco produtivo, integrações externas,
build Windows ou GitHub Actions nesta tranche. O erro Wine do build anterior permanece
documentado no relatório anterior; não foi ocultado nem declarado resolvido.

## GitHub e release solicitados

SSH de leitura funciona para `mafaldo-dev/konexus` e `mafaldo-dev/konexus-back`.
Não houve push/tag/release: a publicação foi solicitada **após a conclusão** e o
escopo completo ainda não está concluído. Versão permanece 1.3.3.

O workflow foi preparado para criar draft, testar, gerar NSIS, verificar manifestos,
enviar .exe/.blockmap/latest.yml, baixar novamente e comparar SHA-512, só então publicar
como latest e auditar o download público. Isso descreve o código preparado, não uma
release existente. Nunca substituir assets de uma release já publicada.

Ainda precisa: concluir M2–M7, aprovar compatibilidade das migrações no backend,
verificar auto-deploy antes de push no main, preparar versão/notas, executar runner
Windows e confirmar os três links públicos antes de afirmar que autoUpdater recebe
a nova versão. Migração/deploy produtivos continuam sem autorização.

## Próximas etapas e limitações

Seguir as tarefas concretas M2 no plano, depois Financeiro/Contabilidade/RH.
RH necessita entidade trabalhista separada, autorização salarial/documental explícita,
contratos versionados e validação de legislação/convenções antes de folha/ponto/férias.
Referências oficiais consultadas não certificam regras nem integração. NetSuite retornou
403; sua documentação não foi presumida. Nenhum pagamento ou declaração real enviado.
