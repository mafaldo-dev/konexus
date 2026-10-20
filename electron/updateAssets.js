'use strict';

/**
 * Seleção e validação do instalador usado pelo fluxo de atualização.
 *
 * Este módulo é intencionalmente puro (sem Electron, sem rede) para que a
 * mesma regra possa ser usada pelo processo principal e pelos testes/auditoria
 * do release publicado.
 *
 * Regras importantes:
 * - o destino do download nunca é `html_url` (página da release);
 * - somente um `.exe` NSIS com o nome exato gerado pelo electron-builder é
 *   aceito;
 * - `latest.yml`, `.blockmap`, arquivos compactados e fontes são rejeitados;
 * - o GitHub Release é a única origem aceita para o adaptador de auditoria;
 * - o `UpdateInfo` do electron-updater precisa conter sha512 e tamanho.
 */

const DEFAULT_ARTIFACT_NAME_TEMPLATE = 'Konexus-Setup-${version}.${ext}';
const DEFAULT_PRODUCT_NAME = 'Konexus';
const DEFAULT_OWNER = 'mafaldo-dev';
const DEFAULT_REPO = 'konexus';

class UpdateAssetError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'UpdateAssetError';
    this.code = code;
  }
}

function cleanVersion(value, label = 'versão') {
  const raw = String(value == null ? '' : value).trim();
  const version = raw.replace(/^[vV]/, '');

  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    throw new UpdateAssetError(
      'INVALID_VERSION',
      `${label} inválida: "${raw}". Use o formato X.Y.Z.`
    );
  }

  return version;
}

function expandArtifactName(template, options = {}) {
  const version = cleanVersion(options.version, 'Versão do artefato');
  const ext = String(options.ext || 'exe').replace(/^\./, '');
  const values = {
    version,
    ext,
    arch: options.arch || process.arch,
    productName: options.productName || DEFAULT_PRODUCT_NAME,
    os: options.os || process.platform,
    channel: options.channel || 'latest',
  };

  const expanded = String(template).replace(/\$\{([A-Za-z0-9_]+)\}/g, (match, key) => {
    if (Object.prototype.hasOwnProperty.call(values, key)) {
      return String(values[key]);
    }
    return match;
  });

  if (/\$\{/.test(expanded)) {
    throw new UpdateAssetError(
      'INVALID_ARTIFACT_TEMPLATE',
      `O template do instalador contém um placeholder desconhecido: ${template}`
    );
  }

  return expanded;
}

function assertSafeAssetName(name) {
  if (typeof name !== 'string') {
    throw new UpdateAssetError('INVALID_ASSET_NAME', 'O asset não possui um nome válido.');
  }

  const trimmed = name.trim();
  if (!trimmed) {
    throw new UpdateAssetError('INVALID_ASSET_NAME', 'O asset está sem nome.');
  }
  if (trimmed.length > 255) {
    throw new UpdateAssetError('INVALID_ASSET_NAME', 'O nome do asset é longo demais.');
  }
  if (/[\/\\\0\r\n]/.test(trimmed) || trimmed === '.' || trimmed === '..') {
    throw new UpdateAssetError(
      'INVALID_ASSET_NAME',
      `Nome de asset inseguro: "${trimmed}". O nome deve ser apenas um arquivo.`
    );
  }

  return trimmed;
}

function getSafeAssetName(value) {
  const raw = String(value == null ? '' : value).trim();
  if (!raw) {
    throw new UpdateAssetError('INVALID_ASSET_NAME', 'O asset está sem nome/URL.');
  }

  const withoutQuery = raw.split(/[?#]/, 1)[0].replace(/\\/g, '/');
  const lastSegment = withoutQuery.slice(withoutQuery.lastIndexOf('/') + 1);

  let decoded;
  try {
    decoded = decodeURIComponent(lastSegment);
  } catch (error) {
    throw new UpdateAssetError(
      'INVALID_ASSET_NAME',
      `Não foi possível decodificar o nome do asset: "${raw}".`
    );
  }

  return assertSafeAssetName(decoded);
}

function isForbiddenUpdateFile(name) {
  const lower = name.toLowerCase();

  return (
    lower.endsWith('.blockmap') ||
    lower.endsWith('.yml') ||
    lower.endsWith('.yaml') ||
    lower.endsWith('.json') ||
    lower.endsWith('.zip') ||
    lower.endsWith('.7z') ||
    lower.endsWith('.tar') ||
    lower.endsWith('.gz') ||
    lower.endsWith('.dmg') ||
    lower.endsWith('.pkg') ||
    lower.endsWith('.appimage') ||
    lower.endsWith('.deb') ||
    lower.endsWith('.rpm') ||
    lower.endsWith('.nupkg') ||
    lower.endsWith('.msi') ||
    lower === 'latest.yml' ||
    lower === 'latest.yaml'
  );
}

function isWindowsInstallerName(name) {
  const lower = name.toLowerCase();
  return lower.endsWith('.exe') && !isForbiddenUpdateFile(name);
}

function expectedInstallerName(options = {}) {
  const name = expandArtifactName(
    options.artifactNameTemplate || DEFAULT_ARTIFACT_NAME_TEMPLATE,
    options
  );

  assertSafeAssetName(name);
  if (!isWindowsInstallerName(name)) {
    throw new UpdateAssetError(
      'INVALID_ARTIFACT_TEMPLATE',
      `O nome esperado do instalador não é um .exe válido: "${name}".`
    );
  }

  return name;
}

function assertGitHubReleaseDownloadUrl(url, expectedName, options = {}) {
  let parsed;

  try {
    parsed = new URL(url);
  } catch (error) {
    throw new UpdateAssetError(
      'INVALID_ASSET_URL',
      `URL de download inválida para ${expectedName}: "${url}".`
    );
  }

  if (parsed.protocol !== 'https:') {
    throw new UpdateAssetError(
      'INVALID_ASSET_URL',
      `A URL do instalador precisa usar HTTPS: "${url}".`
    );
  }

  if (parsed.hostname !== 'github.com') {
    throw new UpdateAssetError(
      'INVALID_ASSET_URL',
      `A URL do instalador não aponta para o GitHub: "${url}".`
    );
  }

  const parts = parsed.pathname.split('/').filter(Boolean);
  const owner = options.owner || DEFAULT_OWNER;
  const repo = options.repo || DEFAULT_REPO;
  const tagName = options.tagName;

  if (parts.length < 6 || parts[0] !== owner || parts[1] !== repo) {
    throw new UpdateAssetError(
      'INVALID_ASSET_URL',
      `A URL do instalador não pertence a ${owner}/${repo}: "${url}".`
    );
  }

  if (parts[2] !== 'releases' || parts[3] !== 'download') {
    throw new UpdateAssetError(
      'INVALID_ASSET_URL',
      `A URL não é um asset de release do GitHub: "${url}".`
    );
  }

  if (tagName) {
    let urlTag;
    try {
      urlTag = decodeURIComponent(parts[4]);
    } catch (error) {
      throw new UpdateAssetError(
        'INVALID_ASSET_URL',
        `A tag na URL do asset não pôde ser decodificada: "${url}".`
      );
    }

    if (urlTag !== tagName) {
      throw new UpdateAssetError(
        'INVALID_ASSET_URL',
        `A URL do asset não pertence à tag ${tagName}: "${url}".`
      );
    }
  }

  const urlName = getSafeAssetName(parts[5]);
  if (urlName !== expectedName) {
    throw new UpdateAssetError(
      'ASSET_NAME_MISMATCH',
      `O nome do asset na URL (${urlName}) não corresponde ao esperado (${expectedName}).`
    );
  }

  return parsed;
}

function selectExactCandidate(candidates, expectedName, sourceLabel) {
  if (candidates.length === 0) {
    throw new UpdateAssetError(
      'NO_WINDOWS_INSTALLER',
      `${sourceLabel} não contém um instalador Windows (.exe). Instalador esperado: ${expectedName}.`
    );
  }

  const exact = candidates.filter((candidate) => candidate.name === expectedName);

  if (exact.length === 1) {
    return exact[0];
  }

  const names = candidates.map((candidate) => candidate.name).join(', ');
  throw new UpdateAssetError(
    'UNEXPECTED_INSTALLER',
    `${sourceLabel} não contém o instalador esperado ${expectedName}. ` +
      `Assets .exe encontrados: ${names}. A atualização foi cancelada para não baixar o arquivo errado.`
  );
}

function selectWindowsInstallerFromRelease(release, options = {}) {
  if (!release || typeof release !== 'object') {
    throw new UpdateAssetError('INVALID_RELEASE', 'Resposta de release inválida.');
  }
  if (release.draft) {
    throw new UpdateAssetError(
      'RELEASE_DRAFT',
      'A release está como rascunho e não pode ser usada para atualização.'
    );
  }
  if (release.prerelease && !options.allowPrerelease) {
    throw new UpdateAssetError(
      'RELEASE_PRERELEASE',
      'A release é um pré-lançamento e a política atual aceita apenas releases estáveis.'
    );
  }

  const tagName = typeof release.tag_name === 'string' ? release.tag_name.trim() : '';
  if (!tagName) {
    throw new UpdateAssetError('INVALID_RELEASE', 'A release não possui tag_name.');
  }

  const tagVersion = cleanVersion(tagName, 'Tag da release');
  const version = cleanVersion(options.version || tagVersion, 'Versão da release');

  if (version !== tagVersion) {
    throw new UpdateAssetError(
      'VERSION_MISMATCH',
      `A versão informada (${version}) não corresponde à tag da release (${tagName}).`
    );
  }

  const expectedName = expectedInstallerName({
    ...options,
    version,
  });

  const assets = Array.isArray(release.assets) ? release.assets : [];
  const candidates = [];

  for (const asset of assets) {
    if (!asset || typeof asset !== 'object') continue;

    let name;
    try {
      name = getSafeAssetName(asset.name || asset.browser_download_url);
    } catch (error) {
      continue;
    }

    if (!isWindowsInstallerName(name)) continue;

    candidates.push({ asset, name });
  }

  const selected = selectExactCandidate(
    candidates,
    expectedName,
    `A release ${tagName}`
  );
  const asset = selected.asset;
  const downloadUrl = asset.browser_download_url;

  if (typeof downloadUrl !== 'string' || !downloadUrl.trim()) {
    throw new UpdateAssetError(
      'MISSING_DOWNLOAD_URL',
      `O asset ${selected.name} não possui browser_download_url. ` +
        'A página html_url da release não é usada como download.'
    );
  }

  assertGitHubReleaseDownloadUrl(downloadUrl, selected.name, {
    owner: options.owner || DEFAULT_OWNER,
    repo: options.repo || DEFAULT_REPO,
    tagName,
  });

  if (String(asset.content_type || '').toLowerCase().startsWith('text/html')) {
    throw new UpdateAssetError(
      'INVALID_ASSET_CONTENT_TYPE',
      `O asset ${selected.name} foi publicado como HTML, não como instalador.`
    );
  }

  const size = Number(asset.size);
  if (!Number.isSafeInteger(size) || size <= 0) {
    throw new UpdateAssetError(
      'INVALID_ASSET_SIZE',
      `O asset ${selected.name} não possui um tamanho válido.`
    );
  }

  return {
    name: selected.name,
    url: downloadUrl,
    size,
    contentType: asset.content_type || null,
    version,
    tagName,
    source: 'github-release',
  };
}

function getUpdateInfoFiles(info) {
  if (Array.isArray(info.files) && info.files.length > 0) {
    return info.files;
  }

  if (typeof info.path === 'string' && info.path.trim()) {
    return [
      {
        url: info.path,
        sha512: info.sha512,
        size: info.size,
      },
    ];
  }

  return [];
}

function selectWindowsInstallerFromUpdateInfo(info, options = {}) {
  if (!info || typeof info !== 'object') {
    throw new UpdateAssetError('INVALID_UPDATE_INFO', 'Informação de atualização inválida.');
  }

  const version = cleanVersion(options.version || info.version, 'Versão da atualização');
  const expectedName = expectedInstallerName({
    ...options,
    version,
  });

  const files = getUpdateInfoFiles(info);
  if (files.length === 0) {
    throw new UpdateAssetError(
      'NO_FILES',
      `A atualização ${version} não declarou arquivos no latest.yml.`
    );
  }

  const candidates = [];

  for (const file of files) {
    if (!file || typeof file !== 'object') continue;

    let name;
    try {
      name = getSafeAssetName(file.url);
    } catch (error) {
      continue;
    }

    if (!isWindowsInstallerName(name)) continue;
    candidates.push({ file, name });
  }

  const selected = selectExactCandidate(
    candidates,
    expectedName,
    `A atualização ${version}`
  );
  const file = selected.file;
  const rawUrl = String(file.url == null ? '' : file.url).trim();

  // O GitHub provider do electron-updater recebe um nome relativo vindo do
  // latest.yml e o resolve contra a URL oficial da release. URLs absolutas
  // enviadas pelo feed não são aceitas pelo fluxo do Konexus.
  if (/^[a-z][a-z0-9+.-]*:/i.test(rawUrl) || rawUrl.startsWith('//')) {
    throw new UpdateAssetError(
      'INVALID_ASSET_URL',
      `O latest.yml contém uma URL absoluta para o instalador (${rawUrl}). ` +
        'Use apenas o nome do asset publicado na release.'
    );
  }

  const sha512 = typeof file.sha512 === 'string' ? file.sha512.trim() : '';
  if (!sha512 || !/^[A-Za-z0-9+/]+={0,2}$/.test(sha512)) {
    throw new UpdateAssetError(
      'MISSING_CHECKSUM',
      `O instalador ${selected.name} não possui sha512 válido no latest.yml.`
    );
  }

  const size = Number(file.size);
  if (!Number.isSafeInteger(size) || size <= 0) {
    throw new UpdateAssetError(
      'INVALID_ASSET_SIZE',
      `O instalador ${selected.name} não possui tamanho válido no latest.yml.`
    );
  }

  return {
    name: selected.name,
    url: rawUrl,
    size,
    sha512,
    version,
    source: 'electron-updater',
  };
}

function toRendererAsset(asset) {
  if (!asset || typeof asset !== 'object' || !asset.name) return undefined;

  return {
    name: asset.name,
    size: asset.size,
    version: asset.version,
  };
}

module.exports = {
  DEFAULT_ARTIFACT_NAME_TEMPLATE,
  DEFAULT_OWNER,
  DEFAULT_PRODUCT_NAME,
  DEFAULT_REPO,
  UpdateAssetError,
  expandArtifactName,
  expectedInstallerName,
  isForbiddenUpdateFile,
  isWindowsInstallerName,
  selectWindowsInstallerFromRelease,
  selectWindowsInstallerFromUpdateInfo,
  toRendererAsset,
};
