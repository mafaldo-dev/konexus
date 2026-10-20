# Histórico de versões do Konexus

Este documento guarda o histórico técnico do produto (usado por
desenvolvimento e auditoria) e explica como ele virou o histórico de
novidades exibido ao cliente em **Últimas Atualizações**.

## Fontes de dados

| Fonte | Onde | Uso |
| --- | --- | --- |
| Curadoria de novidades | `konexus/src/data/productUpdates.ts` | Fonte exibida ao cliente final (módulo, versão, título, descrição, data, visibilidade). |
| Histórico técnico | este arquivo + `git log` do repositório | Auditoria de desenvolvimento; não é exibido ao cliente. |
| Versão do aplicativo | `konexus/src/version.ts` (gerada por `scripts/generate-version.js`) | Versão exibida no rodapé do menu. |

Antes desta curadoria, a seção “Últimas Atualizações” mostrava um array
estático dentro de `konexus/src/components/AdminScreen/index.tsx` com conteúdo
de desenvolvimento e de política comercial (por exemplo: “Permissões
granulares por módulo/ação com validação no backend”, “Franquia de 5 contas
ativas por empresa”, “Testes automatizados de autorização, isolamento,
limites e concorrência”). Esse texto foi removido da interface e preservado
abaixo.

## Histórico técnico original (preservado)

```text
v1.2.1 — 20/10/2026
- Gestão completa de colaboradores com cargos personalizados por empresa
- Permissões granulares por módulo/ação com validação no backend
- CRM, Financeiro e NF-e como módulos extras independentes e pagos
- Franquia de 5 contas ativas por empresa (1 admin + 4 colaboradores)
- Franquia de 3 redefinições de senha gratuitas por empresa/mês
- Contas adicionais e redefinições extras custam R$ 5,00 e R$ 3,50 com autorização do suporte
- Remoção lógica de colaborador com revogação imediata de sessão
- Auditoria sem senhas, tokens ou credenciais
- Testes automatizados de autorização, isolamento, limites e concorrência

v1.1.9 — 05/12/2025
- Nova Dashboard principal
- Botões de navegação rapida na Dashboard
- Adição de relatorios personalizados ao sistema
- Exportar xls de relatorios diretamente para o excel
- Ajustes na interface do modulo financeiro

v1.1.8 — 27/11/2025
- Correção de bugs
- Melhoria na performace da aplicação
- Update no módulo financeiro
```

Observação: as datas acima eram as exibidas na interface e **não** coincidiam
com o histórico real de `src/version.ts`. A curadoria nova usa a data real de
cada versão (commit em que `src/version.ts` recebeu o número).

## Política editorial

Cada registro publicado em `src/data/productUpdates.ts` responde a quatro
perguntas:

1. **O que mudou?** — uma funcionalidade concreta, perceptível pelo usuário.
2. **Em qual módulo?** — uma chave real de módulo (`gestao`, `vendas`,
   `compras`, `estoque`, `rh`, `finance`, `crm`, `nfe`).
3. **Em qual versão?** — a versão em que a mudança foi disponibilizada.
4. **Qual o benefício?** — dito em linguagem simples, sem jargão.

Proibido no histórico do cliente: “refatorado controller”, “corrigido
middleware”, “atualizado endpoint”, “ajustado schema”, “criado hook”,
“corrigido componente React”, “alterado serviço de autenticação”, “corrigido
pipeline de CI/CD”, “atualizada dependência”, “corrigida tipagem TypeScript”.

Essas informações continuam existindo no histórico de commits, nas tags e
neste documento.

## Versões e o que foi publicado

| Versão | Data real | Novidade publicada | Módulo |
| --- | --- | --- | --- |
| 1.2.11 | 20/10/2026 | Atualização do aplicativo com o instalador correto | Gestão |
| 1.2.3 | 20/10/2026 | Atualização automática do aplicativo | Gestão |
| 1.2.1 | 20/10/2026 | Nova tela de colaboradores | Gestão |
| 1.2.1 | 20/10/2026 | Mais segurança no acesso das contas | Gestão |
| 1.2.1 | 20/10/2026 | Tela de planos e módulos | Gestão |
| 1.2.0 | 19/10/2026 | Mais de uma empresa no mesmo sistema | Gestão |
| 1.1.10 | 15/12/2025 | Novo módulo de CRM | CRM (extra) |
| 1.1.9 | 10/12/2025 | Orçamentos de compra mais simples | Compras |
| 1.1.9 | 10/12/2025 | Configuração da emissão de notas fiscais | NF-e (extra) |
| 1.1.8 | 01/12/2025 | Contas a pagar e a receber | Financeiro |
| 1.1.5 | 19/11/2025 | Chat interno da empresa | Gestão |
| 1.1.5 | 19/11/2025 | Cadastro de colaboradores corrigido | RH |
| 1.0.8 | 25/10/2025 | Cadastro de produtos mais rápido | Gestão |
| 1.0.7 | 23/10/2025 | Ordens de serviço | Gestão |
| 1.0.7 | 23/10/2025 | Etiquetas de pedido de venda | Vendas |
| 1.0.6 | 20/10/2025 | Conferência de estoque em PDF | Estoque |
| 1.0.6 | 20/10/2025 | Dados vindos do servidor da empresa | Gestão |
| 1.0.4 | 27/07/2025 | Pedidos de venda passam pelo Financeiro | Vendas |
| 1.0.4 | 27/07/2025 | Organização das telas do Financeiro | Financeiro |

### Versões sem novidade publicada

As versões abaixo não têm efeito funcional comprovado o suficiente para uma
descrição honesta, ou o efeito é interno. Conforme a política editorial, elas
**não** aparecem para o cliente (o histórico técnico permanece no Git):

| Versão | Data | Motivo |
| --- | --- | --- |
| 1.0.5 | 07/10/2025 | Ajustes pontuais de impressão de pedido e inventário. |
| 1.0.9 | 09/11/2025 | Correções de renderização do módulo de ordens de serviço. |
| 1.1.0 | 15/11/2025 | Ajustes de configuração do aplicativo desktop. |
| 1.1.1 | 16/11/2025 | Correção de conexão com a API. |
| 1.1.4 | 16/11/2025 | Correções internas. |
| 1.1.6 | 21/11/2025 | Estabilização da conexão do chat interno. |
| 1.1.7 | 21/11/2025 | Ajustes de conexão do chat. |
| 1.2.2 | 20/10/2026 | Ajustes finais de release. |
| 1.2.4 | 20/10/2026 | Geração automática do instalador no CI (interno). |
| 1.2.5 a 1.2.10 | 20/10/2026 | Correções do pipeline de build (interno). |

## Como publicar uma novidade nova

1. Confirmar no histórico real (`git log`, tag da versão) qual funcionalidade
   entrou e em qual versão.
2. Adicionar uma entrada em `konexus/src/data/productUpdates.ts` com módulo,
   versão, título, descrição, data e `evidence` (origem da evidência).
3. Módulo extra → `visibility: "contract"`; módulo do freemium →
   `visibility: "standard"`.
4. Rodar os testes: `CI=true npm run test:frontend`.

Os testes de `src/data/productUpdates.test.ts` impedem a publicação de
textos com vocabulário técnico, versões inválidas, datas no futuro, registros
duplicados ou módulos inexistentes.
