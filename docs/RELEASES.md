# Releases e atualização automática

Este documento descreve o processo oficial de release do Konexus ERP. O
workflow [`.github/workflows/release.yml`](../.github/workflows/release.yml)
é disparado quando uma release é **publicada** no GitHub e envia o instalador
Windows, o `latest.yml` e o `.blockmap` para a própria release.

## Regra de versão e tag

A tag da release **precisa** seguir o formato `vX.Y.Z` e ser exatamente igual
à versão declarada em `package.json`:

```text
tag:           v1.2.11
package.json:  1.2.11
```

O workflow falha antes do build se:

- a tag não começar com `v`;
- a tag não tiver três componentes numéricos;
- a tag não corresponder a `v$(package.json.version)`;
- o commit do checkout não for o commit da tag;
- a release estiver como rascunho.

Não reutilize nem mova uma tag já publicada. Para uma correção, incremente a
versão (por exemplo, `1.2.11` → `1.2.12`) e crie uma nova tag/release.

## Passo a passo

1. Atualize a versão e o arquivo exibido no aplicativo:

   ```bash
   npm version 1.2.12 --no-git-tag-version
   node scripts/generate-version.js
   ```

   O `prebuild` também regenera `src/version.ts` durante o build, mas manter o
   arquivo versionado sincronizado evita divergência no repositório.

2. Valide localmente o que for possível:

   ```bash
   npm ci --legacy-peer-deps --no-audit --no-fund
   npx tsc --noEmit
   CI=false npm run build
   ```

3. Commit e push na `main`:

   ```bash
   git add package.json package-lock.json src/version.ts
   git commit -m "chore: release 1.2.12"
   git push origin main
   ```

4. Crie e envie a tag:

   ```bash
   git tag v1.2.12
   git push origin v1.2.12
   ```

5. Publique a release no GitHub usando a tag `v1.2.12`. A publicação (não o
   simples push da tag) é o evento que dispara o workflow. Pode ser feito pela
   interface do GitHub ou pelo GitHub CLI:

   ```bash
   gh release create v1.2.12 --title "v1.2.12" --notes "Notas da versão"
   ```

6. Acompanhe o workflow **Release Windows installer** na aba Actions. Ele
   fará checkout da tag exata, instalará as dependências pelo lockfile, gerará
   o instalador NSIS e publicará os três assets na release.

## O que o workflow valida

- checkout da tag exata da release e confirmação do commit;
- `package.json` compatível com a tag;
- existência da release publicada;
- instalação com `npm ci` a partir do `package-lock.json`;
- `npx tsc --noEmit`;
- geração do instalador com Electron Builder + NSIS;
- presença do `.exe`, do `.exe.blockmap` e do `latest.yml`;
- SHA-512 e tamanho do `.exe` iguais aos declarados no `latest.yml`;
- `app-update.yml` empacotado com `provider: github`, `owner`, `repo` e
  `releaseType: release` corretos;
- ausência de arquivos `.env` no pacote;
- upload idempotente com `gh release upload --clobber` (substitui apenas assets
  com o mesmo nome, sem apagar outros assets da release);
- conferência do tamanho dos assets publicados e da versão do `latest.yml`
  baixado da release.

## Assets esperados

Para a versão `X.Y.Z`, a release deve conter exatamente estes assets de
atualização:

```text
Konexus-Setup-X.Y.Z.exe
Konexus-Setup-X.Y.Z.exe.blockmap
latest.yml
```

O nome do instalador é definido por `build.win.artifactName` em
`package.json`. O nome sem espaços é intencional: o `latest.yml` e o download
do `electron-updater` usam exatamente o mesmo nome.

O `latest.yml` contém a versão, o nome do arquivo, o tamanho e o SHA-512 do
instalador. Sem ele a atualização automática não funciona, mesmo que o `.exe`
esteja anexado à release.

## Como a atualização automática funciona

O processo principal (`electron/main.js`) configura:

```js
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;
```

Depois que a janela termina de carregar, o aplicativo empacotado verifica
atualizações. O `electron-updater`:

1. consulta a release mais recente do repositório configurado;
2. baixa o `latest.yml`;
3. compara a versão com a versão instalada;
4. baixa o `.exe` em segundo plano (e usa o `.blockmap` para download
   diferencial quando possível);
5. valida o SHA-512 e, ao final, permite reiniciar e instalar.

A tela de login mostra o progresso do download e o botão **Reiniciar agora**
quando o download termina. Se o usuário já tiver entrado no sistema, o
`electron-updater` mantém o download em segundo plano; a instalação ocorre no
fechamento do aplicativo (`autoInstallOnAppQuit`).

O arquivo `resources/app-update.yml` gerado dentro do instalador aponta para:

```yaml
owner: mafaldo-dev
repo: konexus
provider: github
releaseType: release
updaterCacheDirName: konexus-updater
```

## Teste manual em Windows

O teste ponta a ponta precisa ser feito em Windows com uma versão anterior já
instalada:

1. instale uma versão anterior (por exemplo, `1.2.2`);
2. publique uma release nova com os três assets;
3. abra o aplicativo e aguarde a verificação automática;
4. confirme a barra de progresso e o botão de reinício;
5. reinicie e confirme a nova versão em **Ajuda/Sobre** ou na tela de login;
6. consulte o log do `electron-log` em
   `%APPDATA%\konexus\logs\main.log` se houver erro.

Esse teste não é executado no ambiente Linux/WSL usado para desenvolver o
frontend. A validação feita no CI cobre a geração e a integridade dos
artefatos, mas não substitui a instalação real em Windows.

## Assinatura digital

O instalador atual **não é assinado digitalmente**. O Windows pode exibir
aviso do SmartScreen ou de editor desconhecido. Isso não impede a atualização
automática, mas é uma limitação de distribuição.

Para assinar no futuro, configure os secrets de assinatura do Electron Builder
(`CSC_LINK` e `CSC_KEY_PASSWORD`, ou as variáveis equivalentes para Windows) e
remova qualquer configuração que desabilite a descoberta do certificado. Não
comite certificados nem senhas no repositório.

## Diagnóstico

- **Workflow não iniciou:** confirme que a release foi **publicada** e que não
  é um rascunho. O evento é `release: published`, não o push da tag.
- **Falhou na validação de versão:** a tag não corresponde ao `package.json`.
  Crie uma nova versão; não mova a tag.
- **Falhou no `npm ci`:** o `package-lock.json` está dessincronizado. Rode
  `npm install --package-lock-only --legacy-peer-deps` e commite o lockfile.
- **Falhou no build do React:** o workflow usa `CI=false` porque o projeto tem
  avisos legados de ESLint. O TypeScript continua sendo validado com
  `npx tsc --noEmit`. Corrija os avisos quando possível.
- **Falhou na validação de artefatos:** veja a mensagem do
  `scripts/verify-release-artifacts.mjs`; normalmente é `latest.yml` ausente,
  SHA-512 divergente ou `app-update.yml` com configuração errada.
- **Release sem `latest.yml`:** o `electron-updater` não encontra a atualização.
  Rode novamente o workflow ou faça o upload manual dos três assets.
- **Erro 403 no upload:** confira `permissions: contents: write` no workflow e
  se o token usado pela release tem permissão de escrita.
- **Repositório privado:** o updater precisaria de autenticação; o fluxo atual
  pressupõe repositório público.

## Fallback manual

Se o workflow estiver indisponível, o instalador pode ser gerado em Windows e
enviado manualmente. O processo oficial continua sendo o GitHub Actions.

```powershell
npm ci --legacy-peer-deps --no-audit --no-fund
$env:CI = "false"
npm run electron:build -- --win nsis --publish never
node scripts/verify-release-artifacts.mjs --version v1.2.12 --dist dist
gh release upload v1.2.12 dist/latest.yml `
  "dist/Konexus-Setup-1.2.12.exe" `
  "dist/Konexus-Setup-1.2.12.exe.blockmap" --clobber
```

O script `BUILD_AND_RELEASE.bat` é legado e não deve ser usado para publicar.

## Histórico recente

- A release `1.2.3` foi publicada sem assets e não é uma fonte válida de
  atualização. Ela foi substituída pela `v1.2.11`, a primeira release gerada
  pelo workflow.
- As tags `v1.2.4` a `v1.2.10` foram usadas em testes do workflow e não possuem
  releases publicadas. Elas não são consideradas pelo `electron-updater`.
