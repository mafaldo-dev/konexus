#!/usr/bin/env node
/**
 * Auditoria do fluxo de download de atualização do Konexus.
 *
 * Uso:
 *   node scripts/audit-update-flow.mjs
 *   node scripts/audit-update-flow.mjs --tag v1.2.11
 *   node scripts/audit-update-flow.mjs --skip-network
 *
 * A parte estática garante que o botão da tela de login não usa window.open,
 * html_url ou uma URL fixa de release. A parte de rede consulta a release
 * estável publicada e valida o asset escolhido contra o latest.yml.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import updateAssets from "../electron/updateAssets.js";

const {
  selectWindowsInstallerFromRelease,
  selectWindowsInstallerFromUpdateInfo,
} = updateAssets;

const ROOT = resolve(import.meta.dirname, "..");
const packageJson = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8"));
const OWNER = "mafaldo-dev";
const REPO = "konexus";
const PRODUCT_NAME = packageJson.productName || "Konexus";
const ARTIFACT_NAME_TEMPLATE =
  packageJson.build?.win?.artifactName || "Konexus-Setup-${version}.${ext}";

function fail(message) {
  console.error(`ERRO: ${message}`);
  process.exitCode = 1;
}

function parseArgs(argv) {
  const args = { tag: null, skipNetwork: false };

  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];

    if (item === "--help" || item === "-h") {
      console.log(
        "Uso: node scripts/audit-update-flow.mjs [--tag vX.Y.Z] [--skip-network]"
      );
      process.exit(0);
    }

    if (item === "--skip-network") {
      args.skipNetwork = true;
      continue;
    }

    if (item === "--tag") {
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("Informe a tag depois de --tag.");
      }
      args.tag = value;
      i += 1;
      continue;
    }

    if (item.startsWith("--tag=")) {
      args.tag = item.slice("--tag=".length);
      continue;
    }

    throw new Error(`Argumento desconhecido: ${item}`);
  }

  return args;
}

function staticChecks() {
  const loginSource = readFileSync(resolve(ROOT, "src/login/index.tsx"), "utf8");
  const mainSource = readFileSync(resolve(ROOT, "electron/main.js"), "utf8");

  const loginForbidden = [
    [/window\.open/, "window.open"],
    [/shell\.openExternal/, "shell.openExternal"],
    [/releases\/latest/, "URL fixa /releases/latest"],
    [/html_url/, "html_url"],
    [/browser_download_url/, "browser_download_url no renderer"],
  ];

  for (const [pattern, label] of loginForbidden) {
    if (pattern.test(loginSource)) {
      throw new Error(`src/login/index.tsx ainda contém ${label}.`);
    }
  }

  if (/shell\.openExternal|openExternal/.test(mainSource)) {
    throw new Error("electron/main.js contém abertura de URL externa no fluxo de update.");
  }
  if (/html_url/.test(mainSource)) {
    throw new Error("electron/main.js usa html_url; o download deve usar o asset/latest.yml.");
  }
  if (!/autoUpdater\.autoDownload\s*=\s*false/.test(mainSource)) {
    throw new Error("autoUpdater.autoDownload deve ser false para validar o asset antes do download.");
  }
  if (!/selectWindowsInstallerFromUpdateInfo/.test(mainSource)) {
    throw new Error("electron/main.js não valida o instalador com selectWindowsInstallerFromUpdateInfo.");
  }
  if (!/ipcMain\.on\(['"]download_update['"],\s*\(event\)\s*=>\s*\{\s*if \(!trustedSender\(event\)\) return;/.test(mainSource)) {
    throw new Error("O IPC download_update deve validar o emissor sem receber URL/payload do renderer.");
  }

  console.log("OK estático: login e processo principal não abrem a página HTML da release.");
}

function scalar(text, key) {
  const match = text.match(new RegExp(`^${key}:\\s*(.+?)\\s*$`, "m"));
  return match ? match[1].trim().replace(/^['"]|['"]$/g, "") : null;
}

function firstFileUrl(text) {
  const match = text.match(/^\s*-\s*url:\s*(.+?)\s*$/m);
  return match ? match[1].trim().replace(/^['"]|['"]$/g, "") : null;
}

function allSha512(text) {
  return [...text.matchAll(/^\s*sha512:\s*(.+?)\s*$/gm)].map((match) =>
    match[1].trim().replace(/^['"]|['"]$/g, "")
  );
}

function fileSize(text) {
  const match = text.match(/^\s*size:\s*(\d+)\s*$/m);
  return match ? Number(match[1]) : null;
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json, application/octet-stream",
      "User-Agent": "konexus-update-audit",
    },
    signal: AbortSignal.timeout(20000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ao buscar ${url}`);
  }

  return response.text();
}

async function networkChecks(tag) {
  const endpoint = tag
    ? `https://api.github.com/repos/${OWNER}/${REPO}/releases/tags/${encodeURIComponent(tag)}`
    : `https://api.github.com/repos/${OWNER}/${REPO}/releases/latest`;

  const release = JSON.parse(await fetchText(endpoint));

  if (release.draft) {
    throw new Error(`A release ${release.tag_name} está como rascunho.`);
  }
  if (release.prerelease) {
    throw new Error(`A release ${release.tag_name} é um pré-lançamento; a política aceita apenas estável.`);
  }

  const selected = selectWindowsInstallerFromRelease(release, {
    owner: OWNER,
    repo: REPO,
    version: release.tag_name,
    artifactNameTemplate: ARTIFACT_NAME_TEMPLATE,
    productName: PRODUCT_NAME,
    arch: "x64",
  });

  if (selected.url === release.html_url) {
    throw new Error("O asset selecionado é a página HTML da release.");
  }
  if (!selected.url.includes(`/${OWNER}/${REPO}/releases/download/`)) {
    throw new Error(`A URL selecionada não é um asset oficial de ${OWNER}/${REPO}: ${selected.url}`);
  }
  if (selected.name.endsWith(".blockmap") || selected.name === "latest.yml") {
    throw new Error(`Asset inválido selecionado como instalador: ${selected.name}`);
  }

  const latestAsset = (release.assets || []).find((asset) => asset.name === "latest.yml");
  if (!latestAsset) {
    throw new Error(`A release ${release.tag_name} não possui latest.yml.`);
  }

  const latest = await fetchText(latestAsset.browser_download_url);
  const latestVersion = scalar(latest, "version");
  const latestPath = scalar(latest, "path");
  const latestFileUrl = firstFileUrl(latest);
  const latestSize = fileSize(latest);
  const hashes = [...new Set(allSha512(latest))];

  if (latestVersion !== selected.version) {
    throw new Error(`latest.yml declara versão ${latestVersion}; asset selecionado: ${selected.version}.`);
  }
  if (latestPath !== selected.name || latestFileUrl !== selected.name) {
    throw new Error(
      `latest.yml aponta path=${latestPath}/files[0].url=${latestFileUrl}; asset selecionado: ${selected.name}.`
    );
  }
  if (latestSize !== selected.size) {
    throw new Error(`Tamanho divergente: latest.yml=${latestSize}, asset=${selected.size}.`);
  }
  if (hashes.length !== 1 || !hashes[0]) {
    throw new Error("latest.yml não possui um sha512 único para o instalador.");
  }

  // Valida também o caminho de runtime: o objeto equivalente ao UpdateInfo do
  // electron-updater precisa selecionar o mesmo asset do latest.yml.
  const runtimeSelected = selectWindowsInstallerFromUpdateInfo(
    {
      version: latestVersion,
      files: [
        {
          url: latestFileUrl,
          sha512: hashes[0],
          size: latestSize,
        },
      ],
    },
    {
      version: latestVersion,
      artifactNameTemplate: ARTIFACT_NAME_TEMPLATE,
      productName: PRODUCT_NAME,
      arch: "x64",
    }
  );

  if (runtimeSelected.name !== selected.name || runtimeSelected.size !== selected.size) {
    throw new Error(
      `O UpdateInfo selecionou ${runtimeSelected.name}/${runtimeSelected.size}; ` +
        `a release aponta ${selected.name}/${selected.size}.`
    );
  }

  console.log(`OK release: ${release.tag_name}`);
  console.log(`  html_url (ignorada): ${release.html_url}`);
  console.log(`  instalador:        ${selected.name} (${selected.size} bytes)`);
  console.log(`  browser_download_url: ${selected.url}`);
  console.log(`  latest.yml:        versão/path/url/tamanho/sha512 consistentes`);
  console.log(`  UpdateInfo runtime: ${runtimeSelected.name} (${runtimeSelected.size} bytes)`);
  console.log(`  sha512:            ${hashes[0].slice(0, 16)}...`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  staticChecks();

  if (args.skipNetwork) {
    console.log("Rede ignorada (--skip-network).");
    return;
  }

  await networkChecks(args.tag);
}

main().catch((error) => {
  fail(error && error.message ? error.message : String(error));
});
