# Continuação das pendências — 23/10/2026

Este documento complementa `HOMOLOGACAO_SEGURANCA_2026-10-23.md`.

## Concluído nesta etapa

- Deploy backend confirmado: `/health/release` retornou `ready:true` e commit `b0e1824ff5350a2fbad37ee5daf52e4702d0b6ac`.
- Removido `react-scripts` e sua cadeia legada. Build migrado para Vite 8; testes existentes preservados em Jest 30, com Babel para TypeScript/React.
- Preservados `build/`, recursos relativos para Electron `file://`, porta 3000, React, Tailwind e configurações públicas `REACT_APP_*`. Somente as quatro variáveis públicas conhecidas são expostas ao renderer.
- PostCSS configurado explicitamente para executar Tailwind; parser de seletores atualizado e validado no build.
- `npm audit`: **zero vulnerabilidades reportadas no frontend**, incluindo desenvolvimento (antes: 51). Backend continuava zerado na rodada anterior. Esse resultado não equivale a ausência de toda vulnerabilidade possível.
- TypeScript/build aprovados; 15 suítes/126 testes frontend; 24 testes Electron; navegação 52/52, criação pela UI 3/3 e Electron Linux 7/7 reexecutados com Vite e aprovados.
- Scripts atualizados: `npm start`, `npm run build`, `npm run test:frontend` e `npm run typecheck`. O comando legado `eject` foi removido. Node 24 é usado na validação Windows.

## Windows

Criado `.github/workflows/windows-validation.yml`, sem publicação e sem secrets de produção. Gera NSIS, instala em diretório temporário, executa o aplicativo instalado, verifica login renderizado e identidade persistente após reinício, desinstala e verifica remoção. Evidências JSON e screenshots são anexadas ao run.

**Aprovado em Windows nativo:** [run 39976847348](https://github.com/mafaldo-dev/konexus/actions/runs/39976847348), commit `2539192`. Todas as etapas concluídas com `success`: instalação, execução empacotada, renderização da tela de login, reinício/persistência da identidade, desinstalação e verificação da remoção. Os testes frontend/Electron, audit e build também passaram nesse runner Windows. Evidência da API dos jobs em `docs/evidence/2026-10-23/windows-jobs.json`.

Não equivale a teste de atualização assinada, login autenticado no Windows ou integração fiscal. Não foi publicada nova release. O instalador é apenas de validação, sem assinatura de distribuição.

## Exportações

- Automatizado `scripts/homologation-exports.mjs`: login real local → inventário → download XLSX → leitura das células → download PDF → validação do arquivo. **2/2 aprovados**.
- PDF de uma página inspecionado visualmente, com produtos e saldos reais do ambiente QA, tabela legível e cabeçalho do emissor.
- Corrigido botão de PDF que estava permanentemente desabilitado; estado de geração impede duplicação e restaura estilos após sucesso/falha. DANFE continua vindo da integração fiscal, não é fabricado por esse gerador.
- Removido e-mail fictício de fallback dos documentos. XLSX no Electron usa ArrayBuffer em vez de depender de Buffer no renderer isolado.
- A validação é do inventário com a amostra QA, não de todas as variações/paginações de cada documento ou de todas as impressoras.

## Bloqueios externos ainda exigindo insumos

- NF-e real: acesso PlugNotas de homologação, certificado válido, identificação fiscal completa da empresa e cenário fiscal autorizado. Configurar por canal seguro, não colar certificados/senhas no chat. Nenhuma transmissão será considerada aprovada sem resposta real do ambiente fiscal.
- Folha legal: informar regime, competência, categorias/vínculos, convenção coletiva e regras aplicáveis; obter tabelas oficiais vigentes e aceite do responsável contábil. Não converter cálculo gerencial em holerite legal por presunção.
- Rotação de credencial Neon: requer atualização coordenada no provedor e no ambiente Render. Sem acesso ao gerenciamento de secrets do deploy, a rotação isolada pode interromper produção.
- Demais combinações de UI/documentos e impressão física permanecem limitadas aos cenários explicitamente executados.
