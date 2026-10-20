# Fluxo de atualização e download do instalador

Este documento registra a auditoria do botão de atualização do Konexus, a
causa histórica do redirecionamento para o GitHub e o fluxo implementado a
partir da versão **1.2.12**.

## Resumo

- A versão publicada `v1.2.11` já usa o `electron-updater` e não contém mais o
  `window.open` que abria a página da release.
- A versão `1.2.12` adiciona um botão explícito **Baixar atualização**, valida
  o nome/tamanho/SHA-512 do instalador antes de iniciar o download e cobre o
  fluxo com testes.
- O download continua sendo feito pelo `electron-updater`. Não existe um
  segundo downloader manual em paralelo, portanto não há downloads duplicados.
- O renderer não recebe nem envia a URL do `.exe`. Ele chama um IPC sem
  parâmetros; o processo principal usa o `latest.yml` validado.
- A release `v1.2.12` ainda **não foi publicada**. A publicação exige
  autorização explícita e um build Windows no GitHub Actions.

## Causa histórica

No commit `4303165` (linha 1.2.1), o botão da tela de login executava:

```tsx
<button
  onClick={() => {
    window.open("https://github.com/mafaldo-dev/konexus/releases/latest", "_blank");
  }}
>
  Baixar Atualização
</button>
```

O endpoint de consulta era:

```text
https://api.github.com/repos/mafaldo-dev/konexus/releases/latest
```

A consulta usava `tag_name` para comparar versões. O botão, porém, não usava
`assets[].browser_download_url`: ele abria uma URL fixa da página HTML da
release. Portanto, a causa exata não era `html_url` retornado pela API, e sim
uma URL de página (`/releases/latest`) escrita diretamente no handler.

As tags `1.2.1`, `1.2.2` e `1.2.3` apontam para commits dessa linha e podem ter
sido distribuídas com esse comportamento. O commit `0e99559` substituiu o
`window.open` por `ipcRenderer.send("download_update")` e o processo principal
passou a chamar `autoUpdater.downloadUpdate()`. A release `v1.2.11` já contém
essa correção.

### `html_url` x `browser_download_url`

| Campo | Significado | Uso correto |
| --- | --- | --- |
| `html_url` | Página HTML da release | Nunca usar como destino de download |
| `assets[].browser_download_url` | URL oficial do arquivo anexado | Usar somente para o asset escolhido |
| `assets[].name` | Nome real do arquivo | Comparar com o nome esperado |
| `assets[].content_type` | Tipo declarado | Apoio; não substitui SHA-512/tamanho |
| `tag_name` | Tag da release | Comparar com a versão do app/asset |
| `latest.yml` | Manifesto do electron-updater | Fonte do nome, tamanho e SHA-512 |

O código atual não usa `html_url` em nenhum ponto do fluxo de atualização.

## Fluxo atual

1. **Inicialização:** o processo principal agenda a verificação após o
   `did-finish-load`, quando `app.isPackaged` é verdadeiro.
2. **Consulta:** `autoUpdater.checkForUpdates()` lê o `app-update.yml`
   empacotado, consulta a release estável do repositório
   `mafaldo-dev/konexus` e baixa o `latest.yml`.
3. **Comparação:** o `electron-updater` compara a versão do `latest.yml` com a
   versão instalada e emite `update-available` com `info.version` e
   `info.files`.
4. **Validação do asset:** `electron/updateAssets.js` seleciona exatamente
   `Konexus-Setup-<versão>.exe`, conforme `build.win.artifactName` do
   `package.json`. São rejeitados `latest.yml`, `.blockmap`, `.zip`, fontes,
   `.msi`, `.dmg`, `.AppImage` e qualquer `.exe` com nome/arquitetura diferente.
5. **Metadados:** o instalador precisa ter `sha512` válido e tamanho positivo
   no `latest.yml`. Se não tiver, a atualização é cancelada com erro controlado.
6. **Estado:** o processo principal guarda `available` com o nome/tamanho do
   arquivo e envia o estado ao renderer.
7. **Download automático:** após 1,5 s, o processo principal chama
   `autoUpdater.downloadUpdate()`. O atraso permite que a tela mostre o botão
   **Baixar atualização**; se o usuário clicar antes, o timer é cancelado e o
   download começa imediatamente.
8. **Download manual pelo botão:** o renderer envia
   `ipcRenderer.send("download_update")` **sem URL**. O handler
   `ipcMain.on("download_update", () => ...)` chama a mesma função
   `startUpdateDownload()`. Se já houver download em andamento, a chamada é
   ignorada.
9. **Progresso:** o `electron-updater` emite `download-progress`; a tela mostra
   porcentagem, velocidade e o nome do arquivo.
10. **Conclusão:** o `electron-updater` valida o SHA-512 do arquivo baixado e
    emite `update-downloaded`. A tela mostra **Reiniciar agora**.
11. **Instalação:** o reinício/instalação só ocorre por ação do usuário ou pela
    política existente `autoInstallOnAppQuit`.

O download nunca abre o navegador, nunca usa `shell.openExternal` e nunca
navega para `github.com/.../releases/latest`.

## Seleção do instalador

A seleção tem duas entradas:

- **Runtime:** `selectWindowsInstallerFromUpdateInfo(info)` usa o
  `UpdateInfo.files` produzido pelo `latest.yml`. É a fonte usada pelo botão.
- **Auditoria:** `selectWindowsInstallerFromRelease(release)` usa
  `assets[].browser_download_url` da API do GitHub. Serve para conferir a
  release publicada, não para o download em produção.

Regras comuns:

- somente `.exe`;
- nome exato `Konexus-Setup-<versão>.exe`;
- rejeição de `latest.yml`, `.blockmap`, `.zip`, `.7z`, `.msi`, `.dmg`,
  `.AppImage`, `.deb`, `.rpm` e arquivos de código-fonte;
- versão da release igual à versão do nome do instalador e do `latest.yml`;
- rejeição de releases em rascunho ou pré-lançamento;
- URL de auditoria obrigatoriamente `https://github.com/mafaldo-dev/konexus/...`;
- o `UpdateInfo` não aceita URL absoluta no lugar do nome do asset;
- o SHA-512 e o tamanho são obrigatórios no runtime.

## Segurança do IPC

O handler de download é deliberadamente sem parâmetros:

```js
ipcMain.on("download_update", () => {
  startUpdateDownload("manual");
});
```

O renderer não pode escolher uma URL, tag ou nome de arquivo. A seleção usa a
configuração confiável do `package.json`/`app-update.yml` e o `latest.yml`
assinado pelo fluxo de release. O estado enviado ao renderer contém apenas
`name`, `size` e `version`; não contém `browser_download_url` nem `sha512`.

A aplicação ainda mantém a configuração legada de `nodeIntegration: true` e
`contextIsolation: false` no `BrowserWindow`. Isso não foi alterado nesta
correção e continua sendo uma dívida de segurança separada do fluxo de
atualização. O novo IPC não amplia esse privilégio: ele não aceita dados do
renderer e só atua sobre o estado interno do updater.

## Testes executados

```bash
npm run test:update                 # 21 testes de seleção/segurança
CI=true npm run test:frontend       # 9 testes de estados da tela
npx tsc --noEmit                    # tipos
CI=false npm run build              # build de produção
node scripts/audit-update-flow.mjs  # auditoria estática + release real
```

Resultados em 20/10/2026:

- `test:update`: 21/21 aprovados;
- `test:frontend`: 9/9 aprovados;
- `tsc --noEmit`: aprovado;
- `npm run build`: aprovado, com os avisos legados de ESLint;
- auditoria da release `v1.2.11`: asset selecionado
  `Konexus-Setup-1.2.11.exe` (214.732.379 bytes), `browser_download_url`
  oficial, `latest.yml` com versão/path/tamanho/SHA-512 consistentes;
- download integral do asset publicado em `/tmp/opencode/konexus-v1.2.11.exe`:
  - tamanho: `214732379` bytes (igual ao `latest.yml`);
  - SHA-512 base64:
    `cebOdIzdt1c3l0S8DzSWK81cp6eiWbPeGVWAklmorwmWomJ9CKuDoF2820TFa7H0FyrmhOsg1Fbo0YjTKSfYpw==`
    (igual ao `latest.yml`);
  - cabeçalho PE: `4d5a` (`MZ`), classificado como instalador NSIS
    self-extracting para Windows.

O script de auditoria valida o manifesto e o asset publicado. A integridade
dos bytes no download real é validada pelo `electron-updater`; o download
integral acima foi uma verificação adicional da release publicada.

## Estado da validação (20/10/2026)

| Etapa | Resultado |
| --- | --- |
| Implementação no código | concluída na versão `1.2.12` |
| Testes de asset/segurança | 21/21 |
| Testes de estados da tela | 9/9 |
| `tsc --noEmit` | aprovado |
| Build CRA de produção | aprovado (avisos legados de ESLint) |
| Pacote Linux `dir` | aprovado; `app.asar` contém `electron/updateAssets.js` e `app-update.yml` correto |
| Pacote Windows `win-unpacked` | aprovado; `app.asar`/`app-update.yml` verificados |
| Instalador NSIS Windows local | **não concluído neste WSL**: o Wine disponível não carrega `kernel32.dll` para gerar o uninstaller; o build oficial é o `windows-latest` do workflow |
| Release `v1.2.12` publicada | **não**; aguarda autorização |
| Atualização ponta a ponta em Windows | **não executada**; precisa de uma instalação Windows anterior e de uma release publicada |

O instalador `v1.2.11` já publicado foi baixado integralmente e validado
conforme a seção de testes. O `1.2.12` foi empacotado localmente até
`win-unpacked`; a geração do instalador NSIS local exige o runner Windows do
GitHub Actions.

## Limitações e pendências

- **Teste ponta a ponta em Windows:** não executado neste ambiente Linux/WSL.
  É necessário instalar uma versão anterior, publicar uma release posterior e
  confirmar o download, o progresso e o reinício.
- **Release 1.2.12:** o código está pronto, mas a release não foi publicada.
  Enquanto não houver uma release `v1.2.12` com os três assets, usuários da
  versão instalada `v1.2.11` não recebem esta melhoria.
- **Instalador sem assinatura digital:** o SmartScreen pode exibir aviso. A
  assinatura não foi alterada.
- **Versões antigas instaladas:** builds 1.2.1–1.2.3 podem continuar exibindo o
  botão antigo até atualizarem via `electron-updater` para uma versão corrigida.
- **Isolamento do renderer:** `nodeIntegration`/`contextIsolation` legados não
  foram modificados; a correção não usa essas configurações para aumentar o
  privilégio do download.

## Arquivos alterados

- `electron/updateAssets.js` — seleção/validação pura do instalador.
- `electron/updateAssets.test.js` — testes de assets, `html_url`,
  `browser_download_url`, SHA-512 e IPC.
- `electron/main.js` — validação antes do download, IPC sem URL, download
  automático/manual idempotente.
- `src/login/index.tsx` — botão **Baixar atualização**, estados e progresso.
- `src/login/updateFlow.ts` — estado/ações puros da tela.
- `src/login/updateFlow.test.ts` — testes dos estados e ações.
- `scripts/audit-update-flow.mjs` — auditoria estática e da release publicada.
- `.github/workflows/release.yml` — testes antes do build.
- `docs/RELEASES.md` e `docs/UPDATE_FLOW.md` — documentação.
- `package.json`, `package-lock.json`, `src/version.ts` — versão `1.2.12`.
