# Publicação 1.4.0 — execução de 21/10/2026

## Autorização
Após solicitar a publicação, o usuário autorizou explicitamente produção: atualizar
backend e aplicar somente as migrações aditivas 011/012 antes do autoUpdater.
Essa autorização posterior substitui a restrição de produção registrada nos relatórios
históricos. O escopo funcional incompleto continua identificado no plano dos módulos.

## Executado antes da tag
- Testes: backend 131, frontend 75, Electron/workflow 24 aprovados.
- TypeScript e build frontend aprovados; permanecem warnings legados.
- Backup completo do banco, formato pg_dump custom, arquivo local 0600; verificado
  com pg_restore --list. Nenhum dado do backup é enviado ao GitHub.
- Migrações 011 e 012 aplicadas em produção com sucesso, transacionais e aditivas.
- Backend enviado ao main: `a57b9b08d91cce66f64d4198ecadcaa9885413e4`.
- Implantação confirmada: `/health/release` respondeu HTTP 200, versão 1.4.0,
  ready=true e commit correspondente. `/login/session`, `/devices` e `/crm/dashboard`
  responderam 401 sem credenciais; preflight CORS do Electron respondeu 204/origem null.
- Frontend preparado como 1.4.0, com lockfile/versão/notas alinhados.

## Cadeia de publicação
Tag v1.4.0 → runner Windows → testes/NSIS → verificação local de SHA-512 e arquivos
→ upload em draft → download e comparação dos bytes → backend 1.4.0 pronto no
commit esperado → promoção para latest → auditoria do download público.

Referências: [notas da versão](releases/1.4.0.md) e
[contrato de compatibilidade](releases/1.4.0.backend.json).

## Resultados remotos
Concluído em 21/10/2026.

- Tag `v1.4.0` enviada e apontando para o commit `6997796` do frontend.
- GitHub Actions `39644220208` concluído com **success**:
  https://github.com/mafaldo-dev/konexus/actions/runs/39644220208
- Release pública, sem rascunho e sem pré-lançamento:
  https://github.com/mafaldo-dev/konexus/releases/tag/v1.4.0
- `latest` público do repositório aponta para `v1.4.0` (antes era `v1.3.3`).

### Assets publicados

| Arquivo | Tamanho |
|---|---|
| Konexus-Setup-1.4.0.exe | 214.916.292 bytes |
| Konexus-Setup-1.4.0.exe.blockmap | 224.638 bytes |
| latest.yml | 343 bytes |

### Verificação do download público
`node scripts/audit-update-flow.mjs --tag v1.4.0` executado após a publicação:
`latest.yml` com versão/path/url/tamanho/sha512 consistentes; SHA-512
`pLW3+43oknLYFIuVh50iVhrHBI5NmwnxY1aNkcbtTqmq+XrGHCEX90pN+BX1E0z6ZpHt7CT1SzYuURbPgjJajg==`;
o caminho de runtime do `electron-updater` (UpdateInfo) seleciona o mesmo instalador
e o mesmo tamanho. O `latest.yml` publicado declara `version: 1.4.0`.

### Etapas do workflow executadas com sucesso
Validação da tag, checkout exato, conferência do commit, versão × package.json,
`npm ci`, testes do atualizador, auditoria do fluxo de atualização, testes de frontend,
TypeScript, geração do instalador NSIS, validação de artefatos, upload dos três assets
em rascunho, download e comparação de bytes/SHA-512, conferência do backend compatível
(versão 1.4.0, `ready=true`, commit `a57b9b0`) e promoção para `latest`.

### Estado do autoUpdater
O aplicativo instalado passa a detectar a 1.4.0 pelo `latest.yml` do repositório
`mafaldo-dev/konexus`. A atualização baixada é conferida pelo SHA-512 publicado.

### Pendente de validação humana
O instalador é **não assinado** e o Windows pode exibir aviso do SmartScreen. A instalação
real em uma estação Windows e a atualização automática in-place ainda precisam ser
conferidas por uma pessoa. O build do `.exe` foi produzido no runner oficial do
GitHub (windows-latest), não no ambiente Linux local.
