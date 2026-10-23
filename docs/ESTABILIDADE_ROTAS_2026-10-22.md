# Estabilidade das rotas e contratos — 22/10/2026

## Objetivo

Eliminar os Error Boundaries causados por respostas da API consumidas com um
formato diferente do contrato real, padronizar os estados de tela e reorganizar
Financeiro, Contabilidade e RH sem alterar a identidade visual, o backend ou os
dados de produção.

## Causa raiz

O backend usa mais de um envelope de resposta (`{products}`, `{suppliers}`,
`{orders}`, `{data}`, `{success,data}`, `{Info,entity}`). Vários serviços
frontend tratavam o corpo como se já fosse o array/objeto final. Quando o
envelope era diferente, o consumidor chamava `.map`, `.filter` ou acessava uma
propriedade inexistente e o componente caía no Error Boundary global.

A correção não transforma contrato inválido em lista vazia. Uma resposta HTTP
2xx com formato inesperado agora retorna `INVALID_API_CONTRACT` (`status 502`),
preservando a causa na tela.

## Correções aplicadas

### Contratos centralizados

- `src/api/payload.ts`: `asList`, `asObject` e `pickData`, com validação
  explícita dos envelopes e preservação dos erros HTTP.
- Serviços normalizados: produtos, fornecedores, clientes, pedidos de venda,
  compras, contas a pagar, pagamentos, histórico do cliente, NF-e, Kardex,
  colaboradores, contabilidade, auditoria e vínculos de RH.
- `src/api/responseState.ts`: converte permissão, módulo não contratado e CNPJ
  ausente nos estados visuais correspondentes. O código do erro é considerado
  antes do status HTTP porque o backend responde `LEGAL_ENTITY_REQUIRED` com
  400, não 403.

### Estados de tela

- `src/components/ui/DataState.tsx`: carregando, vazio, erro de comunicação,
  acesso negado, módulo não contratado, empresa não selecionada,
  funcionalidade indisponível e falha inesperada.
- `DynamicTable` usa “Não há dados disponíveis.”, aceita erro, tentativa
  novamente e página fora do intervalo.
- Produtos, fornecedores, clientes, pedidos, orçamentos, compras, estoque,
  contabilidade, estações, RH, folha e treinamentos não mascaram falhas como
  banco vazio.

### Compras, estoque e orçamentos

- Falha ao carregar produtos/fornecedores de Compras é exibida com retry, em vez
  de ficar apenas no console.
- Cotações aceitam camelCase e snake_case sem quebrar a listagem.
- `/stock/alerts` exibe apenas alertas reais (`minimum_stock > 0` e
  `stock <= minimum_stock`), sem produtos fictícios.
- A rota antiga de Segurança e a tela antiga de Empresas/CNPJs foram removidas.
  `/config/security-area` e `/config/companies` redirecionam para
  `/config/legal-entities`.

### Financeiro, Contabilidade e RH

- Financeiro contém Dashboard Financeiro, NF-e, Contabilidade e o grupo
  Recursos Humanos.
- `contabil` continua sendo um extra independente. Sem contratação, a rota
  mostra “Módulo não contratado”; ela não vira lista vazia nem acesso negado
  genérico.
- O RH mantém rotas `/rh/*`, módulo `rh`, permissões próprias e tabelas
  próprias. Possuir acesso financeiro não concede RH.
- O diretório de RH passou a usar `/employment/contributors` (`rh:view`), em vez
  de `/employees/all` (exclusivo do administrador da empresa). Criação de
  contas de acesso continua restrita ao administrador.
- O formulário de novo colaborador usa cargo real (`roleId`) e não aceita mais
  um cargo apenas nominal que o backend ignorava.
- Cargos e setores usam o vínculo empregatício real. A tela não inventa salários;
  a API atual não fornece remuneração.
- Folha de Pagamento e Treinamentos exibem “Funcionalidade não disponível.”.
  Não há backend, tabela, endpoint, valores ou turmas simuladas.
- O Histórico de Ações tem paginação limitada à última página válida, evitando
  tabela vazia após exclusões ou mudança de filtro.
- O dashboard Financeiro não exibe mais contas bancárias, saldos, edições locais
  ou projeção de fluxo de caixa fictícios. Enquanto não há endpoint real, as
  abas mostram “Funcionalidade não disponível.”.
- O histórico do cliente é montado a partir de `orders` e `payments` reais da
  API; antes o código procurava um campo `combined` que o backend não envia.
- Baixas, cancelamentos, alterações de status, relatórios e devoluções só
  exibem sucesso após resposta válida da API. Falhas de comunicação não geram
  números fictícios de pedido nem relatórios zerados.
- Devoluções de compra exibem indisponibilidade explícita; a tela anterior
  simulava nota fiscal, fornecedor, itens e confirmação sem persistência.

## Validação executada

Ambiente Linux, banco PostgreSQL local temporário em `127.0.0.1:55439`. O banco
e o `.env` de produção não foram usados para os testes.

| Verificação | Resultado |
| --- | --- |
| `npx tsc --noEmit -p tsconfig.json` | 0 erros |
| `npm run test:frontend` | 14 suítes, 118 testes aprovados |
| `npm run test:electron` | 24 testes aprovados |
| Backend `npm test` | 166 testes aprovados, 0 falhas, 0 pulados |
| `npm run build` | build de produção concluído |
| Migrações 001–014 em banco local | aplicadas com sucesso |
| Multi-CNPJ e autorização por CNPJ | aprovados nos testes de integração locais |

O build mantém avisos de ESLint já existentes (dependências de hooks, imports
não usados e bundle grande); não há erro de compilação.

## Limitações

- Folha e Treinamentos não possuem implementação de backend; as telas apenas
  informam a indisponibilidade e não persistem dados.
- Contas bancárias, projeção de fluxo de caixa e devoluções de compra também não
  possuem endpoints/tabelas nesta versão. Essas abas agora informam a
  indisponibilidade em vez de usar mocks; uma implementação futura exige
  contrato e persistência no backend.
- Não foi executado smoke autenticado em navegador real nem instalação Windows
  do Electron neste ambiente.
- Não houve deploy, publicação de release, alteração de tag ou escrita no banco
  de produção.
- A tag `v1.4.2` já publicada não foi movida. As correções exigem uma nova
  versão quando forem publicadas.
- Relatórios administrativos com recursos especializados (histórico expansível
  e paginação server-side) continuam com tabelas próprias; as telas novas e as
  listas operacionais usam o componente global.
