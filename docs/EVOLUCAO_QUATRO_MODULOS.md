# Plano persistente — CRM, Financeiro, Contabilidade e RH

**Atualização posterior:** usuário autorizou publicação da versão entregue e produção
(backend + migrações 011/012). Migrações aplicadas com backup; backend enviado.
Ver `docs/PUBLICACAO_1.4.0.md`. A publicação não marca os recursos pendentes como concluídos.

Início: 21/10/2026. Retomar deste arquivo e dos testes; não repetir a auditoria anterior.
Escopo total **não concluído**. Alterações anteriores de rastreabilidade estão no working tree
dos dois repositórios e serão preservadas. Nenhum banco de produção acessado.

## Evidências iniciais

- Frontend: React 19/TS, `src/routes/AppRoutes.tsx`, `services`, cliente HTTP central.
- Backend: Express 5, controllers/services/repositories, SQL `pg`, migrações 001–011.
- Segurança: authMiddleware, companyContext, requirePermission, checkSubscription,
  protectedOperations, auditService.record(event, client), UUID/sid/reauth existentes.
- Comercial: Financeiro/RH freemium; CRM e contabil são extras independentes.
- Visual: Dashboard/sidebar/header, UI em `components/dashboard/components/ui`,
  DynamicTable em `utils/Table`; azul/slate, cards brancos, bordas arredondadas, lucide.
- CRM `pages/CRM/index.tsx`: mocks explícitos e TODOs de persistência; taxa de conversão
  usa denominador inadequado. Não há router/repositório/tabela CRM.
- Financeiro: `order_payments` (recebíveis), `payment_account` (obrigações, não conta
  bancária). `findByCustomer` acessa `rows[0]` em objeto já desestruturado. Baixa repete
  atualização de data sem verificar estado anterior. Serviços delegam quase tudo ao SQL.
- Contabilidade: migração 008, plano/períodos/partidas/mapeamentos/imobilizado/conciliação,
  testes de serviço existentes. Isso não comprova todos os relatórios/fechamentos reais.
- RH: Contributor e company_roles representam LOGIN/PERMISSÕES, não vínculo trabalhista.
  `/rh/employee` redireciona à administração de usuários; Cargos e Salários é parcial.
- GitHub: SSH leitura funciona nos dois remotes; `gh` não instalado. Workflow Windows
  existente publica release antes de validar build. Não publicar release incompleta.

## Matriz de lacunas (estado inicial; aceite exigido antes de fechar item)

Legenda: P=parcial; D=existente com defeitos; N=não implementada;
E=dependência externa; R=validação regulatória; I=implementada, sem teste completo atual.
Prioridade P0=integridade, P1=operação central, P2=evolução.

| ID / requisito | Estado | Prioridade | Dependência/risco | Aceite |
|---|---|---|---|---|
| CRM 5.1 painel | D | P1 | dados demonstrativos | agregados SQL por empresa/período |
| CRM 5.2 leads | N | P1 | deduplicação/privacidade | CRUD+qualificação/conversão atômicos, histórico |
| CRM 5.3 funil | D | P1 | etapas/concorrência | movimento persistido, versão concorrente e motivo de perda |
| CRM 5.4 agenda | N | P1 | responsáveis | tarefas persistidas e calendário, sem envio fictício |
| CRM 5.5 cliente 360 | P | P1 | permissões cruzadas | cliente existente, vendas e financeiro autorizados |
| CRM 5.6 propostas | N | P1 | fluxo de Vendas ainda requer auditoria | revisões/PDF/pedido sem bypass crédito/estoque |
| CRM 5.7 metas/previsões | N | P2 | oportunidades reais | previsto separado do realizado |
| CRM 5.8 automação | N/E | P2 | eventos/idempotência/provedores | sem loops, integração externa opcional |
| CRM 5.9 relatórios | D | P2 | persistência | métricas reproduzíveis no banco |
| FIN 6.1 painel | P | P1 | estados misturados | saldos/previsto/realizado separados |
| FIN 6.2 pagar | P | P1 | pagamento parcial/estorno ausentes | saldo, liquidação, aprovações, sem duplicidade |
| FIN 6.3 receber | D | P0 | consulta cliente/baixa repetida | consulta funcional e transições atômicas |
| FIN 6.4 tesouraria | N | P1 | payment_account NÃO é conta bancária | ledger e transferência balanceada |
| FIN 6.5 OFX | N/E | P2 | formatos bancários | hash/FITID/conta, conciliação auditada |
| FIN 6.6 caixa | P | P1 | liquidações ausentes | sem dupla contagem |
| FIN 6.7 orçamento | N | P2 | categorias/centros | revisão/aprovação e realizado SQL |
| FIN 6.8 crédito | P | P0 | status direto de Vendas | bloquear bypass no backend e testar concorrência |
| FIN 6.9 cobrança | N/E | P2 | notificações/provedores | histórico interno, consentimento externo |
| FIN 6.10 relatórios | P | P2 | datas/competência/saldos | comparação SQL e filtros |
| CON 7.1 plano | I | P1 | hierarquia | validar empresa, ciclo e conta movimentada |
| CON 7.2 escrituração | I | P0 | saldo/transação | partidas balanceadas, sem edição após postar |
| CON 7.3 integração | P | P1 | origem idempotente | reconhecimento/liquidação/estorno separados |
| CON 7.4 livros | I/R | P1 | lançamentos/validação contábil | demonstrativos reconciliados, sem promessa oficial |
| CON 7.5 fechamento | I | P0 | concorrência | lançamento não atravessa fechamento |
| CON 7.6 imobilizado | P/R | P1 | critérios/vigência | residual e idempotência concorrente |
| CON 7.7 SPED/ECD/ECF | N/R/E | P2 | leiautes/PVA/certificação | validadores oficiais, nenhuma transmissão real |
| RH 8.1 painel | D | P1 | login confundido com empregado | indicadores de empregados reais |
| RH 8.2 cadastro | N | P1 | privacidade | matrícula por empresa sem login obrigatório |
| RH 8.3 organização | P | P1 | cargos de acesso não são cargos trabalhistas | departamentos/gestores/histórico |
| RH 8.4 contratos | N/R | P1 | história salarial restrita | versões, vigência, permissões específicas |
| RH 8.5 jornada | N/R | P2 | presença ERP não é ponto legal | registros/aprovações, sem alegar REP |
| RH 8.6 férias | N/R | P1 | direito adquirido/convenções | períodos e cálculos validados |
| RH 8.7 folha | N/R | P2 | tabelas oficiais por vigência | simulação, aprovação e validação especialista |
| RH 8.8 benefícios | N/R | P2 | contratos/folha | vigência e descontos testados |
| RH 8.9 recrutamento | N | P2 | dados candidatos/retenção | pipeline e conversão autorizada |
| RH 8.10 desenvolvimento | N | P2 | pessoal/visibilidade | metas/avaliações/treinamentos persistidos |
| RH 8.11 admissão/saída | N/R | P1 | gestão de acesso | checklist sem apagar histórico, revogação explícita |
| RH 8.12 eSocial/FGTS | N/R/E | P2 | schemas/vigência/credenciais | homologação e recibos reais antes de declarar pronto |
| RH 8.13 relatórios | D | P2 | cadastro separado | agregação SQL e acesso salarial restrito |

## Mapa de integrações e decisões

CRM lead → oportunidade → proposta → serviço de Vendas (não SQL direto em Orders).
Vendas → order_payments existente → liquidações financeiras → accounting_origin_events.
RH → folha aprovada → obrigação financeira com chave de origem → lançamento mapeado.
Todos → audit_events com empresa/sid/estação/correlação; evento e alteração no mesmo client.
Não criar títulos/lançamentos antes do evento de negócio. RH não herda automaticamente
permissão salarial de isCompanyAdmin; definir autorização explícita antes de armazenar salário.

## Execução por entregas

- [x] Inspecionar arquitetura/estado Git/fontes oficiais e registrar lacunas.
- [x] M1: base compartilhada de validação monetária, CRM persistente, regressões financeiras (backend validado; interface sem E2E visual).
- [ ] M2: leads/agenda/360/propostas e integração segura CRM→Vendas.
- [ ] M3: tesouraria/baixas parciais/estornos/orçamento/cobranças, crédito sem bypass.
- [ ] M4: completar atomicidade contábil, períodos, integração e relatórios.
- [ ] M5: RH operacional separado de login, contratos/férias/jornada e dados restritos.
- [ ] M6: recursos regulados com fontes versionadas e validação especializada.
- [ ] M7: E2E visual e integração cruzada, builds e atualização documentação.
- [ ] Publicar os dois repositórios e release Windows **após conclusão/validação**.

Publicação autorizada pelo usuário. Migrações e deploy de produção não autorizados.
Antes de publicar no main do backend, confirmar eventual auto-deploy e compatibilidade
das migrações pendentes. Antes do autoUpdater, backend compatível deve estar disponível.
Artefatos obrigatórios: .exe + .exe.blockmap + latest.yml, mesmo release/tag/versão/SHA-512.
Não mudar versão, publicar tag ou promover draft enquanto os critérios faltarem.

## Pesquisa consultada em 21/10/2026

- Dynamics Sales: https://learn.microsoft.com/en-us/dynamics365/sales/ — ciclos lead/oportunidade/proposta, metas e atividades.
- Odoo Accounting 19: https://www.odoo.com/documentation/19.0/applications/finance/accounting.html — partidas dobradas, competência/caixa, integração.
- Odoo Employees/Payroll 19: https://www.odoo.com/documentation/19.0/applications/hr/employees.html e https://www.odoo.com/documentation/19.0/applications/hr/payroll.html — empregado/contrato/jornada/localização.
- eSocial: https://www.gov.br/esocial/pt-br/documentacao-tecnica — portal informa S-1.3/NT 07/2026 rev.20/10/2026, XSDs com vigências futuras 26/10,23/11,14/12/2026 e18/01/2027. Não confundir publicação com vigência. Nenhum cálculo/transmissor implementado a partir disso.
- SPED: https://www.gov.br/sped/pt-br — portal consultado; leiautes específicos ECD/ECF ainda precisam ser estudados.
- FGTS Digital: https://www.gov.br/trabalho-e-emprego/pt-br/servicos/empregador/fgtsdigital — portal informa Manual1.70 em12/06/2026; não equivale a validação de integração.
- NetSuite: https://www.netsuite.com/portal/products/erp/financial-management/finance-accounting.shtml retornou HTTP 403; conteúdo não foi validado nesta execução.

## Registro de evidências desta execução

Atualizar aqui após cada tranche: arquivos/migrações, comandos/resultados, bloqueios,
estado exato das funcionalidades. Resultados da auditoria anterior não contam como teste novo.

### M1 — implementação entregue no working tree

Relatório detalhado: `docs/ENTREGA_MODULOS_M1.md`.

- Migração 012: crm_stages, crm_leads, crm_opportunities, crm_activities, FKs compostas
  por empresa, índices, versões otimistas e chaves de idempotência. Sem duplicar clientes.
- CRM: removidos negócios demonstrativos e salvamentos apenas locais. API real + Kanban,
  qualificação/conversão lead→oportunidade, atividades internas, histórico e arquivamento.
- Financeiro: corrigida consulta de cliente, baixa repetida/concorrente e escopo do UPDATE;
  decimais canônicos positivos em contas a pagar. Não é uma implementação de tesouraria.
- Contabilidade: datas civis de competência/vencimento preservadas sem recuo por UTC.
- RH: diagnóstico/arquitetura planejada; cadastro trabalhista separado ainda NÃO implementado.
- Release: workflow mantém draft até upload/validação SHA-512 e só então promove latest;
  inclui auditoria de download público. Alteração local, ainda sem execução no GitHub.
- Backend: 131 testes aprovados (incluindo PostgreSQL/HTTP real), zero pulados.
- Frontend: 75 testes aprovados; Electron/workflow: 24 aprovados; TypeScript aprovado.
- Build frontend aprovado com warnings legados; pacote Electron Linux aprovado com
  `--publish never`. Validação visual/Windows ainda pendente.
- Nenhum commit/push/tag/release/deploy desta tranche; publicação solicitada continua
  pendente da conclusão. Os remotes foram apenas consultados com git ls-remote.

### Próxima tarefa concreta (M2)

1. Validar a tela CRM real em browser/Electron contra schema descartável; confirmar modal,
   DnD/teclado, filtros, erros e recarga. Base de teste: crmPersistence.test.js.
2. Completar edição/deduplicação/mesclagem de leads; configuração/ordenação de etapas;
   agenda dia/semana/mês, responsáveis e filtros por período.
3. Implementar cliente360 com autorização separada para dados financeiros.
4. Auditar serviço de Vendas (crédito/status/estoque) ANTES da conversão proposta→pedido.
5. Criar propostas versionadas e integração idempotente, sem inserir Orders fora do serviço.
6. Só depois seguir M3–M7 e finalizar release. Não considerar CRM completo com base apenas
   nesta tranche, nem publicar frontend que exige migrations ainda não homologadas.
