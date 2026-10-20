'use strict';

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const test = require('node:test');

const {
  DEFAULT_ARTIFACT_NAME_TEMPLATE,
  DEFAULT_PRODUCT_NAME,
  UpdateAssetError,
  expandArtifactName,
  expectedInstallerName,
  isForbiddenUpdateFile,
  isWindowsInstallerName,
  selectWindowsInstallerFromRelease,
  selectWindowsInstallerFromUpdateInfo,
  toRendererAsset,
} = require('./updateAssets');

const packageJson = require('../package.json');

const SHA512 = `${'a'.repeat(88)}==`;
const VERSION = '1.2.12';
const INSTALLER = `Konexus-Setup-${VERSION}.exe`;
const GITHUB_URL = `https://github.com/mafaldo-dev/konexus/releases/download/v${VERSION}/${INSTALLER}`;

function releaseFixture(overrides = {}) {
  return {
    tag_name: `v${VERSION}`,
    name: `Konexus ${VERSION}`,
    draft: false,
    prerelease: false,
    html_url: `https://github.com/mafaldo-dev/konexus/releases/tag/v${VERSION}`,
    assets: [
      {
        name: INSTALLER,
        size: 214732379,
        content_type: 'application/x-msdownload',
        browser_download_url: GITHUB_URL,
      },
      {
        name: `${INSTALLER}.blockmap`,
        size: 223642,
        content_type: 'application/octet-stream',
        browser_download_url: `${GITHUB_URL}.blockmap`,
      },
      {
        name: 'latest.yml',
        size: 346,
        content_type: 'application/octet-stream',
        browser_download_url: `https://github.com/mafaldo-dev/konexus/releases/download/v${VERSION}/latest.yml`,
      },
    ],
    ...overrides,
  };
}

function updateInfoFixture(overrides = {}) {
  return {
    version: VERSION,
    html_url: `https://github.com/mafaldo-dev/konexus/releases/tag/v${VERSION}`,
    files: [
      {
        url: INSTALLER,
        sha512: SHA512,
        size: 214732379,
      },
    ],
    ...overrides,
  };
}

function assertUpdateAssetError(fn, code) {
  assert.throws(fn, (error) => {
    assert.ok(error instanceof UpdateAssetError, `esperava UpdateAssetError, recebeu ${error}`);
    assert.equal(error.code, code);
    return true;
  });
}

test('o package.json e o fallback empacotado usam o mesmo nome de artefato', () => {
  assert.equal(packageJson.build.productName, DEFAULT_PRODUCT_NAME);
  assert.equal(packageJson.build.win.artifactName, DEFAULT_ARTIFACT_NAME_TEMPLATE);
});

test('expande o template real do electron-builder', () => {
  assert.equal(
    expandArtifactName('Konexus-Setup-${version}.${ext}', { version: VERSION }),
    INSTALLER
  );
  assert.equal(
    expectedInstallerName({ version: VERSION, artifactNameTemplate: '${productName}-Setup-${version}.${ext}', productName: 'Konexus' }),
    INSTALLER
  );
});

test('rejeita template de instalador com placeholder desconhecido', () => {
  assertUpdateAssetError(
    () => expandArtifactName('Konexus-${desconhecido}.exe', { version: VERSION }),
    'INVALID_ARTIFACT_TEMPLATE'
  );
});

test('diferencia html_url da release de browser_download_url do asset', () => {
  const release = releaseFixture();
  const selected = selectWindowsInstallerFromRelease(release, { version: VERSION });

  assert.equal(selected.name, INSTALLER);
  assert.equal(selected.url, GITHUB_URL);
  assert.equal(selected.size, 214732379);
  assert.equal(selected.version, VERSION);
  assert.equal(selected.source, 'github-release');
  assert.notEqual(selected.url, release.html_url);
  assert.match(selected.url, /\/releases\/download\//);
});

test('não seleciona latest.yml, blockmap, zip ou código-fonte como instalador', () => {
  assert.equal(isForbiddenUpdateFile('latest.yml'), true);
  assert.equal(isForbiddenUpdateFile('Konexus-Setup-1.2.12.exe.blockmap'), true);
  assert.equal(isForbiddenUpdateFile('source.zip'), true);
  assert.equal(isForbiddenUpdateFile('Konexus-Setup-1.2.12.exe'), false);
  assert.equal(isWindowsInstallerName('Konexus-Setup-1.2.12.exe'), true);
  assert.equal(isWindowsInstallerName('latest.yml'), false);
  assert.equal(isWindowsInstallerName('Konexus-Setup-1.2.12.exe.blockmap'), false);
});

test('release sem instalador gera erro controlado', () => {
  const release = releaseFixture({
    assets: [
      {
        name: 'latest.yml',
        size: 346,
        content_type: 'application/octet-stream',
        browser_download_url: `https://github.com/mafaldo-dev/konexus/releases/download/v${VERSION}/latest.yml`,
      },
      {
        name: `${INSTALLER}.blockmap`,
        size: 223642,
        content_type: 'application/octet-stream',
        browser_download_url: `${GITHUB_URL}.blockmap`,
      },
    ],
  });

  assertUpdateAssetError(
    () => selectWindowsInstallerFromRelease(release, { version: VERSION }),
    'NO_WINDOWS_INSTALLER'
  );
});

test('release com apenas html_url não é usada como download', () => {
  const release = releaseFixture({
    html_url: GITHUB_URL,
    assets: [],
  });

  assertUpdateAssetError(
    () => selectWindowsInstallerFromRelease(release, { version: VERSION }),
    'NO_WINDOWS_INSTALLER'
  );
});

test('não usa html_url quando browser_download_url está ausente', () => {
  assertUpdateAssetError(
    () =>
      selectWindowsInstallerFromRelease(
        releaseFixture({
          assets: [
            {
              name: INSTALLER,
              size: 214732379,
              content_type: 'application/x-msdownload',
            },
          ],
        }),
        { version: VERSION }
      ),
    'MISSING_DOWNLOAD_URL'
  );
});

test('não aceita URL de asset fora do GitHub ou de outro repositório', () => {
  assertUpdateAssetError(
    () =>
      selectWindowsInstallerFromRelease(
        releaseFixture({
          assets: [
            {
              name: INSTALLER,
              size: 123,
              content_type: 'application/x-msdownload',
              browser_download_url: `https://evil.example/${INSTALLER}`,
            },
          ],
        }),
        { version: VERSION }
      ),
    'INVALID_ASSET_URL'
  );

  assertUpdateAssetError(
    () =>
      selectWindowsInstallerFromRelease(
        releaseFixture({
          assets: [
            {
              name: INSTALLER,
              size: 123,
              content_type: 'application/x-msdownload',
              browser_download_url: `https://github.com/outro/repo/releases/download/v${VERSION}/${INSTALLER}`,
            },
          ],
        }),
        { version: VERSION }
      ),
    'INVALID_ASSET_URL'
  );
});

test('não aceita asset cujo nome na URL diverge do nome declarado', () => {
  assertUpdateAssetError(
    () =>
      selectWindowsInstallerFromRelease(
        releaseFixture({
          assets: [
            {
              name: INSTALLER,
              size: 123,
              content_type: 'application/x-msdownload',
              browser_download_url: `https://github.com/mafaldo-dev/konexus/releases/download/v${VERSION}/outro.exe`,
            },
          ],
        }),
        { version: VERSION }
      ),
    'ASSET_NAME_MISMATCH'
  );
});

test('não escolhe um instalador de arquitetura/variante diferente', () => {
  assertUpdateAssetError(
    () =>
      selectWindowsInstallerFromRelease(
        releaseFixture({
          assets: [
            {
              name: `Konexus-Setup-${VERSION}-arm64.exe`,
              size: 123,
              content_type: 'application/x-msdownload',
              browser_download_url: `https://github.com/mafaldo-dev/konexus/releases/download/v${VERSION}/Konexus-Setup-${VERSION}-arm64.exe`,
            },
          ],
        }),
        { version: VERSION }
      ),
    'UNEXPECTED_INSTALLER'
  );
});

test('seleciona arm64 quando o template inclui a arquitetura', () => {
  const arm64 = `Konexus-Setup-${VERSION}-arm64.exe`;
  const release = releaseFixture({
    assets: [
      {
        name: INSTALLER,
        size: 123,
        content_type: 'application/x-msdownload',
        browser_download_url: GITHUB_URL,
      },
      {
        name: arm64,
        size: 456,
        content_type: 'application/x-msdownload',
        browser_download_url: `https://github.com/mafaldo-dev/konexus/releases/download/v${VERSION}/${arm64}`,
      },
    ],
  });

  const selected = selectWindowsInstallerFromRelease(release, {
    version: VERSION,
    artifactNameTemplate: '${productName}-Setup-${version}-${arch}.${ext}',
    productName: 'Konexus',
    arch: 'arm64',
  });

  assert.equal(selected.name, arm64);
  assert.equal(selected.size, 456);
});

test('rejeita release draft, pré-release e versão divergente', () => {
  assertUpdateAssetError(
    () => selectWindowsInstallerFromRelease(releaseFixture({ draft: true }), { version: VERSION }),
    'RELEASE_DRAFT'
  );
  assertUpdateAssetError(
    () => selectWindowsInstallerFromRelease(releaseFixture({ prerelease: true }), { version: VERSION }),
    'RELEASE_PRERELEASE'
  );
  assertUpdateAssetError(
    () => selectWindowsInstallerFromRelease(releaseFixture(), { version: '1.2.11' }),
    'VERSION_MISMATCH'
  );
});

test('rejeita asset publicado com content-type HTML ou tamanho inválido', () => {
  assertUpdateAssetError(
    () =>
      selectWindowsInstallerFromRelease(
        releaseFixture({
          assets: [
            {
              name: INSTALLER,
              size: 123,
              content_type: 'text/html',
              browser_download_url: GITHUB_URL,
            },
          ],
        }),
        { version: VERSION }
      ),
    'INVALID_ASSET_CONTENT_TYPE'
  );

  assertUpdateAssetError(
    () =>
      selectWindowsInstallerFromRelease(
        releaseFixture({
          assets: [
            {
              name: INSTALLER,
              size: 0,
              content_type: 'application/x-msdownload',
              browser_download_url: GITHUB_URL,
            },
          ],
        }),
        { version: VERSION }
      ),
    'INVALID_ASSET_SIZE'
  );
});

test('seleciona o instalador a partir do UpdateInfo do electron-updater', () => {
  const selected = selectWindowsInstallerFromUpdateInfo(updateInfoFixture(), { version: VERSION });

  assert.equal(selected.name, INSTALLER);
  assert.equal(selected.url, INSTALLER);
  assert.equal(selected.size, 214732379);
  assert.equal(selected.sha512, SHA512);
  assert.equal(selected.version, VERSION);
  assert.equal(selected.source, 'electron-updater');
});

test('UpdateInfo ignora metadados e exige sha512/tamanho', () => {
  const info = updateInfoFixture({
    files: [
      { url: 'latest.yml', sha512: SHA512, size: 346 },
      { url: `${INSTALLER}.blockmap`, sha512: SHA512, size: 223642 },
      { url: INSTALLER, sha512: SHA512, size: 214732379 },
    ],
  });

  assert.equal(selectWindowsInstallerFromUpdateInfo(info, { version: VERSION }).name, INSTALLER);

  assertUpdateAssetError(
    () =>
      selectWindowsInstallerFromUpdateInfo(
        updateInfoFixture({ files: [{ url: INSTALLER, size: 214732379 }] }),
        { version: VERSION }
      ),
    'MISSING_CHECKSUM'
  );

  assertUpdateAssetError(
    () =>
      selectWindowsInstallerFromUpdateInfo(
        updateInfoFixture({ files: [{ url: INSTALLER, sha512: SHA512, size: 0 }] }),
        { version: VERSION }
      ),
    'INVALID_ASSET_SIZE'
  );
});

test('UpdateInfo aceita o fallback path/sha512/size de versões antigas do feed', () => {
  const info = {
    version: VERSION,
    path: INSTALLER,
    sha512: SHA512,
    size: 214732379,
  };

  const selected = selectWindowsInstallerFromUpdateInfo(info, { version: VERSION });
  assert.equal(selected.name, INSTALLER);
  assert.equal(selected.sha512, SHA512);
});

test('UpdateInfo rejeita URL absoluta e instalador inesperado', () => {
  assertUpdateAssetError(
    () =>
      selectWindowsInstallerFromUpdateInfo(
        updateInfoFixture({
          files: [{ url: GITHUB_URL, sha512: SHA512, size: 214732379 }],
        }),
        { version: VERSION }
      ),
    'INVALID_ASSET_URL'
  );

  assertUpdateAssetError(
    () =>
      selectWindowsInstallerFromUpdateInfo(
        updateInfoFixture({
          files: [
            {
              url: `Konexus-Setup-${VERSION}-arm64.exe`,
              sha512: SHA512,
              size: 214732379,
            },
          ],
        }),
        { version: VERSION }
      ),
    'UNEXPECTED_INSTALLER'
  );
});

test('toRendererAsset não expõe URL nem checksum ao renderer', () => {
  const selected = selectWindowsInstallerFromUpdateInfo(updateInfoFixture(), { version: VERSION });
  const rendererAsset = toRendererAsset(selected);

  assert.deepEqual(rendererAsset, {
    name: INSTALLER,
    size: 214732379,
    version: VERSION,
  });
  assert.equal('url' in rendererAsset, false);
  assert.equal('sha512' in rendererAsset, false);
});

test('o código do login não abre a página HTML da release nem usa html_url', () => {
  const loginSource = readFileSync(resolve(__dirname, '../src/login/index.tsx'), 'utf8');

  assert.equal(/window\.open/.test(loginSource), false);
  assert.equal(/shell\.openExternal/.test(loginSource), false);
  assert.equal(/releases\/latest/.test(loginSource), false);
  assert.equal(/html_url/.test(loginSource), false);
  assert.equal(/browser_download_url/.test(loginSource), false);
});

test('o processo principal só inicia o download pelo updater, sem URL do renderer', () => {
  const mainSource = readFileSync(resolve(__dirname, 'main.js'), 'utf8');

  assert.equal(/shell\.openExternal/.test(mainSource), false);
  assert.equal(/html_url/.test(mainSource), false);
  assert.match(mainSource, /autoUpdater\.autoDownload\s*=\s*false/);
  assert.match(mainSource, /autoUpdater\.autoInstallOnAppQuit\s*=\s*true/);
  assert.match(mainSource, /autoUpdater\.allowPrerelease\s*=\s*false/);
  assert.match(mainSource, /autoUpdater\s*\.checkForUpdates\(\)/);
  assert.match(mainSource, /selectWindowsInstallerFromUpdateInfo/);
  assert.match(mainSource, /ipcMain\.on\(['"]download_update['"],\s*\(\)\s*=>\s*\{/);
  assert.match(mainSource, /startUpdateDownload\(/);
  assert.match(mainSource, /if \(updateDownloadPromise\)/);
  assert.match(mainSource, /scheduleAutomaticDownload/);
  assert.match(mainSource, /startUpdateDownload\('automatic'\)/);
  assert.equal(
    (mainSource.match(/\.downloadUpdate\(\)/g) || []).length,
    1,
    'deve existir um único ponto de download no processo principal'
  );
});
