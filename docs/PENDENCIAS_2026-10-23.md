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

**Estado inicial: preparado, aguardando execução do GitHub Actions.** Não equivale a teste de atualização assinada, autenticação no Windows ou integração fiscal. Esses escopos não são simulados.

## Bloqueios externos ainda exigindo insumos

- NF-e real: acesso PlugNotas de homologação, certificado válido, identificação fiscal completa da empresa e cenário fiscal autorizado. Configurar por canal seguro, não colar certificados/senhas no chat. Nenhuma transmissão será considerada aprovada sem resposta real do ambiente fiscal.
- Folha legal: informar regime, competência, categorias/vínculos, convenção coletiva e regras aplicáveis; obter tabelas oficiais vigentes e aceite do responsável contábil. Não converter cálculo gerencial em holerite legal por presunção.
- Rotação de credencial Neon: requer atualização coordenada no provedor e no ambiente Render. Sem acesso ao gerenciamento de secrets do deploy, a rotação isolada pode interromper produção.
- Exportações e demais combinações de UI: permanecem limitadas ao escopo documentado no relatório anterior até serem exercitadas.
