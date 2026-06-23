#!/usr/bin/env node
/**
 * deploy.mjs — Bump de versión sincronizado + commit + push
 *
 * Uso: node scripts/deploy.mjs [patch|minor|major]
 *  o via npm: npm run deploy:patch / deploy:minor / deploy:major
 *
 * Archivos actualizados:
 *   - frontend/package.json
 *   - backend/package.json
 *   - frontend/.env
 *   - frontend/.env.production
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Colores ANSI ────────────────────────────────────────────────────────────
const c = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
  bold: "\x1b[1m",
};

function log(msg) {
  process.stdout.write(msg + "\n");
}

// ─── Rutas ───────────────────────────────────────────────────────────────────
const frontendRoot = resolve(__dirname, "..");
const workspaceRoot = resolve(frontendRoot, "..");

const PATHS = {
  frontendPkg: resolve(frontendRoot, "package.json"),
  backendPkg: resolve(workspaceRoot, "backend", "package.json"),
  envDev: resolve(frontendRoot, ".env"),
  envProd: resolve(frontendRoot, ".env.production"),
};

// ─── Semver bump ─────────────────────────────────────────────────────────────
function bumpVersion(current, type) {
  const parts = current.split(".").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Versión inválida: "${current}". Debe ser X.Y.Z`);
  }
  const [major, minor, patch] = parts;
  switch (type) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error(`Tipo de bump inválido: "${type}". Usa patch, minor o major`);
  }
}

// ─── JSON helpers ─────────────────────────────────────────────────────────────
function readJson(path) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

function writeJson(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

// ─── .env helper ─────────────────────────────────────────────────────────────
function updateEnvVersion(path, newVersion) {
  let content = readFileSync(path, "utf-8");
  if (/^VITE_APP_VERSION=.*/m.test(content)) {
    content = content.replace(/^VITE_APP_VERSION=.*/m, `VITE_APP_VERSION=${newVersion}`);
  } else {
    content += `\nVITE_APP_VERSION=${newVersion}\n`;
  }
  writeFileSync(path, content, "utf-8");
}

// ─── Git helper ───────────────────────────────────────────────────────────────
function git(cmd) {
  execSync(`git ${cmd}`, { cwd: workspaceRoot, stdio: "inherit" });
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const bumpType = process.argv[2];

if (!["patch", "minor", "major"].includes(bumpType)) {
  log(`${c.red}Error: especifica el tipo de bump.${c.reset}`);
  log(`  npm run deploy:patch`);
  log(`  npm run deploy:minor`);
  log(`  npm run deploy:major`);
  process.exit(1);
}

try {
  const frontendPkg = readJson(PATHS.frontendPkg);
  const currentVersion = frontendPkg.version;
  const newVersion = bumpVersion(currentVersion, bumpType);

  log(`\n${c.bold}${c.cyan}Presupuesto Encimeras — Deploy Script${c.reset}`);
  log(`${c.yellow}Bump ${bumpType}:${c.reset} ${currentVersion} → ${c.green}${c.bold}${newVersion}${c.reset}\n`);

  // 1. frontend/package.json
  frontendPkg.version = newVersion;
  writeJson(PATHS.frontendPkg, frontendPkg);
  log(`${c.green}✓${c.reset} frontend/package.json → ${newVersion}`);

  // 2. backend/package.json
  const backendPkg = readJson(PATHS.backendPkg);
  backendPkg.version = newVersion;
  writeJson(PATHS.backendPkg, backendPkg);
  log(`${c.green}✓${c.reset} backend/package.json  → ${newVersion}`);

  // 3. .env
  updateEnvVersion(PATHS.envDev, newVersion);
  log(`${c.green}✓${c.reset} frontend/.env         → ${newVersion}`);

  // 4. .env.production
  updateEnvVersion(PATHS.envProd, newVersion);
  log(`${c.green}✓${c.reset} frontend/.env.production → ${newVersion}`);

  // 5. git add
  log(`\n${c.cyan}Committing...${c.reset}`);
  git(`add frontend/package.json backend/package.json frontend/.env frontend/.env.production`);
  git(`commit -m "chore: bump version to ${newVersion}"`);
  log(`${c.green}✓${c.reset} Commit creado`);

  // 6. git push
  log(`${c.cyan}Pushing to origin/master...${c.reset}`);
  git(`push origin master`);
  log(`${c.green}✓${c.reset} Push completado\n`);

  log(`${c.bold}${c.green}Deploy preparado: v${newVersion}${c.reset}\n`);
} catch (err) {
  log(`\n${c.red}Error: ${err.message}${c.reset}`);
  process.exit(1);
}
