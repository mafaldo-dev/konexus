# Konéxus - Sistema de Gestão Empresarial

Konéxus é um sistema de gestão empresarial (ERP) desktop, desenvolvido com React e Electron, projetado para otimizar e centralizar diversas operações de negócios. Ele oferece módulos para gerenciamento de vendas, estoque, RH, finanças e muito mais, com controle de acesso baseado em funções.

## Funcionalidades Principais

- **Autenticação de Usuários:** Sistema de login seguro com controle de acesso.
- **Painel Administrativo:** Visão geral e acesso rápido às principais funcionalidades do sistema.
- **Gestão de Vendas e Pedidos:**
  - Criação e acompanhamento de pedidos de venda.
  - Listagem detalhada de pedidos.
  - Geração de novas ordens de compra.
- **Gestão de Cadastros:**
  - Produtos
  - Clientes
  - Fornecedores
  - Categorias
  - Marcas
  - Unidades de Medida
- **Gestão de Estoque:**
  - Lançamento de notas de entrada (faturas).
  - Controle de movimentações de estoque.
- **Recursos Humanos (RH):**
  - Administração de funcionários.
  - Gestão de cargos e salários.
- **Relatórios:** Geração de relatórios e documentos (ex: DANFE).
- **Controle de Acesso:** Permissões baseadas em funções (Vendedor, Administrador, Conferente, Comprador, Financeiro).

## Tecnologias Utilizadas

- **Frontend:** React.js
- **Desktop Framework:** Electron
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS
- **Autenticação e Banco de Dados (provável):** Postgresql

## Como Rodar o Projeto

Para configurar e executar o Keppler em seu ambiente de desenvolvimento, siga os passos abaixo:

### Pré-requisitos

Certifique-se de ter as seguintes ferramentas instaladas:

- Node.js (versão 16 ou superior recomendada)
- npm ou Yarn

### Instalação

1. Clone o repositório:

   ```bash
   git clone <URL_DO_REPOSITORIO>
   cd konexus
   ```

2. Instale as dependências:

   ```bash
   npm install
   # ou yarn install
   ```

### Executando em Modo de Desenvolvimento

Para iniciar a aplicação React e o processo Electron em modo de desenvolvimento:

```bash
npm run electron:serve
# ou yarn electron:serve
```

Isso iniciará o servidor de desenvolvimento do React e, em seguida, o aplicativo Electron.

### Construindo para Produção

Para gerar uma versão de produção do aplicativo Electron:

```bash
npm ci --legacy-peer-deps --no-audit --no-fund
CI=false npm run electron:build -- --win nsis --publish never
```

Os artefatos são gerados em `dist/`: instalador NSIS
(`Konexus-Setup-X.Y.Z.exe`), arquivo de download diferencial
(`.exe.blockmap`) e metadados de atualização (`latest.yml`).

### Releases e atualização automática

O processo oficial de release é o workflow do GitHub Actions
[`.github/workflows/release.yml`](.github/workflows/release.yml). Ao publicar
uma release com tag `vX.Y.Z` correspondente ao `package.json`, o workflow:

1. faz checkout da tag exata;
2. valida versão, release, TypeScript e artefatos;
3. gera o instalador Windows com Electron Builder + NSIS;
4. publica `Konexus-Setup-X.Y.Z.exe`, `Konexus-Setup-X.Y.Z.exe.blockmap` e
   `latest.yml` na própria GitHub Release.

O aplicativo instalado usa `electron-updater` para consultar o `latest.yml`,
baixar a nova versão em segundo plano e instalar após o reinício. As instruções
completas, incluindo versionamento, diagnóstico e limitações de assinatura
digital, estão em [`docs/RELEASES.md`](docs/RELEASES.md).

> O instalador não é assinado digitalmente; o Windows pode exibir aviso do
> SmartScreen. O teste ponta a ponta de atualização precisa ser feito em uma
> instalação Windows real.

## Estrutura do Projeto

```
konexus/
├── public/                 # Arquivos públicos e script principal do Electron
├── src/
│   ├── assets/             # Imagens e outros recursos estáticos
│   ├── components/         # Componentes reutilizáveis da UI
│   ├── login/              # Módulo de autenticação
│   ├── pages/              # Páginas principais da aplicação, organizadas por módulo
│   │   ├── _shopping/      # Módulo de compras
│   │   ├── configurations/ # Configurações do sistema
│   │   ├── financial/      # Módulo financeiro
│   │   ├── manager/        # Gestão de cadastros (produtos, clientes, etc.)
│   │   ├── RH/             # Recursos Humanos
│   │   ├── sales/          # Módulo de vendas
│   │   └── stock/          # Módulo de estoque
│   ├── routes/             # Definição das rotas da aplicação
│   ├── service/            # Camada de serviço (APIs, interfaces)
│   ├── types/              # Definições de tipos TypeScript
│   └── utils/              # Funções utilitárias
├── .gitignore
├── package.json
├── postcss.config.mjs
├── README.md
├── tsconfig.json
└── ... (outros arquivos de configuração e módulos)
```

## Licença

Informações sobre a licença do projeto.
