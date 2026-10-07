import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Spec versions this CLI understands. 0.1 and 0.2 kits still validate but get an upgrade hint.
export const CURRENT_SPEC_VERSION = "1.0.0";
export const SUPPORTED_SPEC = /^(0\.[12]|1\.\d+)\.\d+$/;

// Public schema URLs, served by the free jsDelivr CDN straight from this repo's main
// branch (no hosting to set up). Only editors use them; obks validate uses the bundled copies.
export const SCHEMA_BASE = "https://cdn.jsdelivr.net/gh/Good-Heart-Tech/Open-Brand-Kit-Standard@main/packages/obks-schema/schemas";
export const MANIFEST_SCHEMA_URL = `${SCHEMA_BASE}/brandkit.schema.json`;
export const TOKEN_SCHEMA_URL = `${SCHEMA_BASE}/obks-token.schema.json`;
export const LEGACY_TOKEN_SCHEMA_URL = "https://goodheart.tech/schemas/bkr-token/v1";
// Earlier schema homes that `obks upgrade` rewrites to SCHEMA_BASE.
export const OLD_SCHEMA_BASES = [
  "https://good-heart-tech.github.io/Brand-Kit-Standard/schemas/v1",
  "https://cdn.jsdelivr.net/gh/Good-Heart-Tech/Brand-Kit-Standard@main/packages/bkr-schema/schemas",
];
// Contract ids: kits write CONTRACT; the old id is still accepted.
export const CONTRACT = "obks/v1";
export const OLD_CONTRACT = "ght.brandkit/v1";
// Token files: *.obks.json (current) or *.bkr.json (before the rename).
export const TOKEN_FILE = /\.(obks|bkr)\.json$/;

// Default locations of generated files, so a manifest does not have to list them.
export function consumptionPaths(manifest) {
  return {
    cssVariables: manifest.consumption?.cssVariables || "tokens/exports/css/variables.css",
    agentDigest: manifest.consumption?.agentDigest || "digest/AGENT_CONTEXT.md",
    tailwindTheme: manifest.consumption?.tailwindTheme || "tokens/exports/tailwind/theme.cjs",
  };
}

// How complete the kit says it is: basic, standard, or advanced. brand.status (before 1.0)
// is still read: "active" counted as a finished kit, so it maps to standard.
export const MATURITIES = ["basic", "standard", "advanced"];
export function effectiveMaturity(manifest) {
  if (manifest.brand?.maturity) return manifest.brand.maturity;
  if (manifest.brand?.status === "active") return "standard";
  return "basic";
}

// Sections (profiles) the kit says are covered somewhere else, with a pointer to where.
export function coveredElsewhere(manifest) {
  const out = {};
  for (const [name, v] of Object.entries(manifest.sections || {})) {
    if (v && typeof v.see === "string" && v.see.trim()) out[name] = v.see.trim();
  }
  return out;
}

export function resolveKitPath(inputPath) {
  return path.resolve(process.cwd(), inputPath || ".");
}

export function readManifest(kitRoot) {
  const yamlPath = path.join(kitRoot, "brandkit.yaml");
  if (!fs.existsSync(yamlPath)) {
    throw new Error(`Missing brandkit.yaml at ${yamlPath}`);
  }
  const raw = fs.readFileSync(yamlPath, "utf8");
  return YAML.parse(raw);
}

// The first-line comment lets VS Code (YAML extension) autocomplete and check the manifest.
export function writeManifest(kitRoot, manifest) {
  const yamlPath = path.join(kitRoot, "brandkit.yaml");
  const doc = YAML.stringify(manifest, { lineWidth: 0 });
  fs.writeFileSync(yamlPath, `# yaml-language-server: $schema=${MANIFEST_SCHEMA_URL}\n${doc}`, "utf8");
}

export function pathExists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

export function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export function writeText(filePath, text) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, text, "utf8");
}

export function listTokenFiles(kitRoot) {
  const tokensDir = path.join(kitRoot, "tokens");
  if (!pathExists(tokensDir)) return [];
  const out = [];
  walk(tokensDir, (fp) => {
    if (TOKEN_FILE.test(fp) && !fp.includes(`${path.sep}exports${path.sep}`)) {
      out.push(fp);
    }
  });
  return out.sort();
}

// Lists every file under dir (recursively), sorted, skipping dotfiles.
export function listFiles(dir) {
  if (!pathExists(dir)) return [];
  const out = [];
  walk(dir, (fp) => {
    if (!path.basename(fp).startsWith(".")) out.push(fp);
  });
  return out.sort();
}

const SKIP_DIRS = new Set(["node_modules", "dist"]);

function walk(dir, onFile) {
  for (const name of fs.readdirSync(dir).sort()) {
    const fp = path.join(dir, name);
    const st = fs.statSync(fp);
    if (st.isDirectory()) {
      if (!name.startsWith(".") && !SKIP_DIRS.has(name)) walk(fp, onFile);
    } else onFile(fp);
  }
}

export function schemaPath(name) {
  // Resolve through the package so this works in the monorepo and when installed from npm.
  const key = { "brandkit.schema.json": "brandkit", "obks-terms.schema.json": "terms" }[name] || "token";
  return require.resolve(`@goodheart/obks-schema/${key}`);
}

export function templatesDir() {
  return path.join(__dirname, "..", "templates");
}

export function sha256(s) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

// Copies a template folder, filling {{placeholders}}. Files named "gitignore" become
// ".gitignore" (npm strips real .gitignore files from published packages).
export function copyTemplateTree(srcDir, destDir, vars, { overwrite = true } = {}) {
  const written = [];
  for (const name of fs.readdirSync(srcDir).sort()) {
    const src = path.join(srcDir, name);
    const destName = name === "gitignore" ? ".gitignore" : name;
    const dest = path.join(destDir, destName);
    const st = fs.statSync(src);
    if (st.isDirectory()) {
      ensureDir(dest);
      written.push(...copyTemplateTree(src, dest, vars, { overwrite }));
    } else {
      if (!overwrite && pathExists(dest)) continue;
      writeText(dest, fillTemplate(fs.readFileSync(src, "utf8"), vars));
      written.push(dest);
    }
  }
  return written;
}

export function fillTemplate(text, vars) {
  let out = text;
  for (const [key, val] of Object.entries(vars)) {
    out = out.replaceAll(`{{${key}}}`, val ?? "");
  }
  return out;
}
