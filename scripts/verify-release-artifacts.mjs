#!/usr/bin/env node
/**
 * Valida os artefatos gerados pelo electron-builder antes de publicá-los.
 *
 * Uso:
 *   node scripts/verify-release-artifacts.mjs --version v1.2.11 --dist dist
 *
 * O script falha com exit code 1 se qualquer requisito não for atendido:
 * - latest.yml existe e a versão bate com package.json/tag;
 * - o instalador .exe e o .blockmap existem;
 * - o SHA-512 e o tamanho do .exe batem com latest.yml;
 * - o app-update.yml empacotado aponta para o repositório/release corretos;
 * - nenhum arquivo .env foi parar no pacote.
 *
 * Ao final grava dist/release-assets.json com os nomes exatos dos assets que
 * devem ser enviados para a GitHub Release.
 */
import { createHash } from "node:crypto";
import {
  createReadStream,
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, join, resolve } from "node:path";

function fail(message) {
  console.error(`ERRO: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const args = {};

  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];

    if (item === "--help" || item === "-h") {
      console.log(
        "Uso: node scripts/verify-release-artifacts.mjs --version vX.Y.Z [--dist dist]"
      );
      process.exit(0);
    }

    if (item === "--version" || item === "--dist") {
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) {
        fail(`Informe um valor para ${item}`);
      }
      args[item.slice(2)] = value;
      i += 1;
      continue;
    }

    if (item.startsWith("--version=")) {
      args.version = item.slice("--version=".length);
      continue;
    }

    if (item.startsWith("--dist=")) {
      args.dist = item.slice("--dist=".length);
      continue;
    }

    fail(`Argumento desconhecido: ${item}`);
  }

  return args;
}

function cleanScalar(value) {
  return String(value)
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .trim();
}

function readPackageVersion() {
  const packagePath = resolve(process.cwd(), "package.json");
  if (!existsSync(packagePath)) {
    fail(`package.json não encontrado em ${process.cwd()}`);
  }

  try {
    return JSON.parse(readFileSync(packagePath, "utf8")).version;
  } catch (error) {
    fail(`Não foi possível ler package.json: ${error.message}`);
  }
}

function requireReadableFile(filePath, label) {
  if (!existsSync(filePath)) {
    fail(`${label} não encontrado: ${filePath}`);
  }

  const info = statSync(filePath);
  if (!info.isFile() || info.size === 0) {
    fail(`${label} está vazio ou não é um arquivo: ${filePath}`);
  }

  return info;
}

async function sha512Base64(filePath) {
  return new Promise((resolveHash, rejectHash) => {
    const hash = createHash("sha512");
    const stream = createReadStream(filePath);

    stream.on("error", rejectHash);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolveHash(hash.digest("base64")));
  });
}

function parseAppUpdate(filePath) {
  const content = readFileSync(filePath, "utf8");
  const values = {};

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf(":");
    if (separator <= 0) continue;

    const key = trimmed.slice(0, separator).trim();
    const value = cleanScalar(trimmed.slice(separator + 1));
    values[key] = value;
  }

  return values;
}

function assertNoEnvFiles(directory, label) {
  if (!existsSync(directory)) return;

  const forbidden = readdirSync(directory).filter(
    (name) => name === ".env" || name.startsWith(".env.")
  );

  if (forbidden.length > 0) {
    fail(
      `${label} contém arquivo(s) de ambiente que não devem ser publicados: ${forbidden.join(
        ", "
      )}`
    );
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.version) {
    fail("Informe a versão/tag com --version (ex.: --version v1.2.11)");
  }

  const tag = args.version.trim();
  const version = tag.replace(/^v/, "");

  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    fail(`Versão inválida: "${tag}". Use vX.Y.Z (ex.: v1.2.11).`);
  }

  const packageVersion = readPackageVersion();
  if (packageVersion !== version) {
    fail(
      `package.json (${packageVersion}) não corresponde à versão validada (${version}).`
    );
  }

  const distDir = resolve(process.cwd(), args.dist || "dist");
  const metadataPath = join(distDir, "latest.yml");
  const metadataInfo = requireReadableFile(metadataPath, "latest.yml");
  const metadata = readFileSync(metadataPath, "utf8");

  const versionMatch = metadata.match(/^version:\s*(.+?)\s*$/m);
  if (!versionMatch) {
    fail("latest.yml não possui o campo version.");
  }

  const metadataVersion = cleanScalar(versionMatch[1]);
  if (metadataVersion !== version) {
    fail(
      `latest.yml declara versão ${metadataVersion}, mas a versão esperada é ${version}.`
    );
  }

  const pathMatch = metadata.match(/^path:\s*(.+?)\s*$/m);
  if (!pathMatch) {
    fail("latest.yml não possui o campo path.");
  }

  const installerName = cleanScalar(pathMatch[1]);
  if (!installerName.toLowerCase().endsWith(".exe")) {
    fail(`latest.yml aponta para um arquivo que não é .exe: ${installerName}`);
  }

  if (basename(installerName) !== installerName) {
    fail(`O nome do instalador em latest.yml não pode conter caminho: ${installerName}`);
  }

  const fileUrls = [...metadata.matchAll(/^\s*-\s*url:\s*(.+?)\s*$/gm)].map(
    (match) => cleanScalar(match[1])
  );

  if (fileUrls.length === 0) {
    fail("latest.yml não possui a lista files[].url.");
  }

  if (!fileUrls.includes(installerName)) {
    fail(
      `latest.yml aponta path=${installerName}, mas files[].url não contém esse nome (${fileUrls.join(
        ", "
      )}).`
    );
  }

  const installerPath = join(distDir, installerName);
  const installerInfo = requireReadableFile(installerPath, "Instalador Windows");

  if (installerInfo.size < 1024 * 1024) {
    fail(
      `Instalador suspeito: ${installerName} tem apenas ${installerInfo.size} bytes.`
    );
  }

  const blockmapPath = `${installerPath}.blockmap`;
  const blockmapInfo = requireReadableFile(blockmapPath, "Blockmap");

  const shaMatches = [
    ...metadata.matchAll(/^\s*sha512:\s*(.+?)\s*$/gm),
  ].map((match) => cleanScalar(match[1]));

  if (shaMatches.length === 0) {
    fail("latest.yml não possui sha512.");
  }

  const uniqueHashes = [...new Set(shaMatches)];
  if (uniqueHashes.length !== 1) {
    fail("latest.yml possui valores de sha512 divergentes.");
  }

  const computedSha = await sha512Base64(installerPath);
  if (computedSha !== uniqueHashes[0]) {
    fail(
      "O SHA-512 do instalador não corresponde ao sha512 declarado em latest.yml."
    );
  }

  const sizeMatches = [
    ...metadata.matchAll(/^\s+size:\s*(\d+)\s*$/gm),
  ].map((match) => Number(match[1]));

  if (sizeMatches.length === 0) {
    fail("latest.yml não possui o tamanho do instalador.");
  }

  if (!sizeMatches.includes(installerInfo.size)) {
    fail(
      `O tamanho do instalador (${installerInfo.size}) não corresponde ao latest.yml (${sizeMatches.join(
        ", "
      )}).`
    );
  }

  const unpackedDir = join(distDir, "win-unpacked");
  const appUpdatePath = join(unpackedDir, "resources", "app-update.yml");
  requireReadableFile(appUpdatePath, "app-update.yml empacotado");

  const appUpdate = parseAppUpdate(appUpdatePath);
  const expectedAppUpdate = {
    provider: "github",
    owner: "mafaldo-dev",
    repo: "konexus",
    releaseType: "release",
  };

  for (const [key, expectedValue] of Object.entries(expectedAppUpdate)) {
    if (appUpdate[key] !== expectedValue) {
      fail(
        `app-update.yml: ${key}="${appUpdate[key] || ""}", esperado "${expectedValue}".`
      );
    }
  }

  requireReadableFile(join(unpackedDir, "Konexus.exe"), "Executável Konexus.exe");
  requireReadableFile(
    join(unpackedDir, "resources", "app.asar"),
    "Pacote app.asar"
  );

  assertNoEnvFiles(distDir, "dist");
  assertNoEnvFiles(join(unpackedDir, "resources"), "win-unpacked/resources");

  const manifest = {
    version,
    tag: `v${version}`,
    files: ["latest.yml", installerName, `${installerName}.blockmap`],
  };

  writeFileSync(
    join(distDir, "release-assets.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8"
  );

  console.log("Artefatos validados com sucesso:");
  console.log(`  Versão:     ${version}`);
  console.log(`  Instalador: ${installerName} (${installerInfo.size} bytes)`);
  console.log(`  Blockmap:   ${basename(blockmapPath)} (${blockmapInfo.size} bytes)`);
  console.log(`  Metadados:  latest.yml (${metadataInfo.size} bytes)`);
  console.log("  SHA-512:    confere com latest.yml");
  console.log("  app-update: github/mafaldo-dev/konexus (release)");
  console.log(`  Manifest:   ${join(distDir, "release-assets.json")}`);
}

main().catch((error) => {
  fail(error && error.message ? error.message : String(error));
});
