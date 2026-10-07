// `obks upgrade`: moves a 0.1 kit to the current spec without losing comments in brandkit.yaml.
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { createRequire } from "node:module";
import {
  CURRENT_SPEC_VERSION,
  LEGACY_TOKEN_SCHEMA_URL,
  OLD_SCHEMA_BASES,
  SCHEMA_BASE,
  MANIFEST_SCHEMA_URL,
  TOKEN_SCHEMA_URL,
  fillTemplate,
  pathExists,
  templatesDir,
  writeJson,
  writeText,
} from "./fs-kit.js";
import { kebab, loadTokens } from "./tokens.js";
import { resolveVisibility } from "./publication.js";
import { OLD_HASH_FILE, exportKit } from "./export.js";
import { buildDigest } from "./digest.js";

// The project was renamed from "Brand Kit Repository (BKR)" to "Open Brand Kit
// Standard (OBKS)". These text swaps update a kit's own files; generated output
// is rebuilt by export and digest at the end of the upgrade.
const CLI_VERSION = createRequire(import.meta.url)("../package.json").version;
const RENAMES = [
  [/<!--(\s*)\/?bkr:/g, (m) => m.replace("bkr:", "obks:")],
  [/bkr-ignore-refs/g, "obks-ignore-refs"],
  [/TODO\(bkr\)/g, "TODO(obks)"],
  [/\bbkr (export|digest|validate|preview|publish|upgrade|init|check-copy|import)\b/g, "obks $1"],
  [/`bkr`/g, "`obks`"],
  [/Brand Kit Repository \(BKR\)/g, "Open Brand Kit Standard (OBKS)"],
  [/Brand Kit Repository/g, "Open Brand Kit Standard"],
  [/\bBKR\b/g, "OBKS"],
  [/\.bkr\.json\b/g, ".obks.json"],
  [/ght\.brandkit\/v1/g, "obks/v1"],
  [/packages\/bkr-schema\/schemas\/bkr-/g, "packages/obks-schema/schemas/obks-"],
  [/packages\/bkr-schema/g, "packages/obks-schema"],
  [/@goodheart\/bkr-/g, "@goodheart/obks-"],
  [/Good-Heart-Tech\/(?:Open-)?Brand-Kit-Standard@v\d+\.\d+\.\d+/g, `Good-Heart-Tech/Open-Brand-Kit-Standard@v${CLI_VERSION}`],
  [/Good-Heart-Tech\/Brand-Kit-Standard/g, "Good-Heart-Tech/Open-Brand-Kit-Standard"],
  [/packages\/bkr-cli\/bin\/bkr\.js/g, "packages/obks-cli/bin/obks.js"],
  [/packages\/bkr-cli/g, "packages/obks-cli"],
  [/(<path-to>\/|\[)Brand-Kit-Standard\b/g, "$1Open-Brand-Kit-Standard"],
  // Plain mentions only: skip "bkr-token" and "bkr.json" style names, which the
  // schema-URL and token-file steps below still need to recognize.
  [/\bbkr\b(?![-.])/g, "obks"],
];
const RENAME_SKIP = /^(tokens\/exports\/|digest\/|AGENTS\.md$|node_modules\/|dist\/|\.git\/|history\/|reference\/)/;
const RENAME_TEXT = /\.(md|ya?ml|json|mdc|txt)$/i;

function renameToObks(kitRoot, changes, todo) {
  const edited = [];
  const walk = (dir) => {
    for (const name of fs.readdirSync(dir)) {
      const abs = path.join(dir, name);
      const rel = path.relative(kitRoot, abs).split(path.sep).join("/");
      if (RENAME_SKIP.test(rel) || RENAME_SKIP.test(`${rel}/`)) continue;
      if (fs.statSync(abs).isDirectory()) {
        if (name !== ".git" && name !== "node_modules") walk(abs);
        continue;
      }
      if (!RENAME_TEXT.test(name) || name === "package-lock.json") continue;
      const before = fs.readFileSync(abs, "utf8");
      let after = before;
      for (const [re, to] of RENAMES) after = after.replace(re, to);
      if (after !== before) {
        fs.writeFileSync(abs, after);
        edited.push(rel);
      }
    }
  };
  walk(kitRoot);
  if (edited.length) changes.push(`renamed BKR to OBKS in ${edited.length} file(s): ${edited.join(", ")}`);

  // Token files: *.bkr.json -> *.obks.json
  const tokensDir = path.join(kitRoot, "tokens");
  const moveTokens = (dir) => {
    if (!pathExists(dir)) return;
    for (const name of fs.readdirSync(dir)) {
      const abs = path.join(dir, name);
      if (name === "exports") continue;
      if (fs.statSync(abs).isDirectory()) moveTokens(abs);
      else if (name.endsWith(".bkr.json")) {
        fs.renameSync(abs, abs.replace(/\.bkr\.json$/, ".obks.json"));
        changes.push(`${path.relative(kitRoot, abs).split(path.sep).join("/")} -> ${name.replace(/\.bkr\.json$/, ".obks.json")}`);
      }
    }
  };
  moveTokens(tokensDir);

  // Hash and marker files from before the rename
  const oldHash = path.join(kitRoot, OLD_HASH_FILE);
  if (pathExists(oldHash)) fs.rmSync(oldHash);
  const oldPreview = path.join(kitRoot, "tokens", "exports", "png", ".bkr-preview-hash");
  if (pathExists(oldPreview)) {
    fs.renameSync(oldPreview, path.join(kitRoot, "tokens", "exports", "png", ".obks-preview-hash"));
    todo.push("screenshots were taken before the rename: run `obks preview` to refresh them");
  }
}


export function upgradeKit(kitRoot) {
  const yamlPath = path.join(kitRoot, "brandkit.yaml");
  if (!pathExists(yamlPath)) throw new Error(`Missing brandkit.yaml at ${yamlPath}`);
  const changes = [];
  const todo = [];
  renameToObks(kitRoot, changes, todo);
  const raw = fs.readFileSync(yamlPath, "utf8");
  const doc = YAML.parseDocument(raw);
  const manifest = doc.toJS();

  if (String(manifest.specVersion).startsWith("1.")) {
    changes.push(`already on spec ${manifest.specVersion}; refreshed exports and digest only`);
  } else {
    doc.set("specVersion", CURRENT_SPEC_VERSION);
    changes.push(`specVersion ${manifest.specVersion} -> ${CURRENT_SPEC_VERSION}`);
  }

  // brand.status (draft, active, deprecated) became brand.maturity (basic, standard, advanced) in 1.0
  const oldStatus = manifest.brand?.status;
  if (oldStatus) {
    if (!manifest.brand.maturity) {
      doc.setIn(["brand", "maturity"], oldStatus === "draft" ? "basic" : "standard");
    }
    if (oldStatus === "deprecated") doc.setIn(["brand", "retired"], true);
    doc.deleteIn(["brand", "status"]);
    changes.push(`brand.status ${oldStatus} -> brand.maturity ${manifest.brand.maturity || (oldStatus === "draft" ? "basic" : "standard")}${oldStatus === "deprecated" ? " and brand.retired: true" : ""}`);
  }

  // Sharing: replace partnerPublic / allowExternalMirror with publication.visibility
  const visibility = resolveVisibility(manifest);
  if (!manifest.publication?.visibility) {
    doc.setIn(["publication", "visibility"], visibility);
    changes.push(`publication.visibility set to ${visibility}`);
  }
  if (doc.hasIn(["publication", "allowExternalMirror"])) {
    doc.deleteIn(["publication", "allowExternalMirror"]);
    changes.push("removed deprecated publication.allowExternalMirror");
  }
  if (doc.hasIn(["profiles", "partnerPublic"])) {
    doc.deleteIn(["profiles", "partnerPublic"]);
    changes.push("removed deprecated profiles.partnerPublic");
    if (pathExists(path.join(kitRoot, "profiles", "partner-public"))) {
      todo.push("profiles/partner-public/ is no longer used; move any notes into brandkit.yaml publication.includedPaths, then delete the folder");
    }
  }

  // Security profile and brand-protection checklist (added in 0.2; later kits choose for themselves)
  if (String(manifest.specVersion).startsWith("0.1.")) {
    if (!manifest.profiles?.security) {
      doc.setIn(["profiles", "security"], true);
      changes.push("profiles.security enabled");
    }
    const protection = path.join(kitRoot, "security", "brand-protection.md");
    if (!pathExists(protection)) {
      const tpl = fs.readFileSync(path.join(templatesDir(), "organization", "security", "brand-protection.md"), "utf8");
      writeText(protection, fillTemplate(tpl, { displayName: manifest.brand.displayName, brandId: manifest.brand.id }));
      changes.push("added security/brand-protection.md checklist");
    }
  }
  if (!(manifest.validation?.contrastPairs || []).length) {
    todo.push("add validation.contrastPairs listing your text/background color pairs");
  }

  // Generated files that moved
  const oldSwatches = path.join(kitRoot, "examples", "swatches.html");
  if (pathExists(oldSwatches)) {
    todo.push("examples/swatches.html is replaced by tokens/exports/html/brand-at-a-glance.html; delete the old file");
  }

  // Human-visible colors (0.3): palette image in the README, generated blocks in visual/
  const readme = path.join(kitRoot, "README.md");
  if (pathExists(readme)) {
    const text = fs.readFileSync(readme, "utf8");
    if (!text.includes("tokens/exports/svg/palette.svg") && !/<!--\s*(?:obks|bkr):palette\s*-->/.test(text)) {
      const nl = text.indexOf("\n");
      const at = /^# /.test(text) && nl !== -1 ? nl + 1 : 0;
      writeText(readme, `${text.slice(0, at)}\n![Colors](tokens/exports/svg/palette.svg)\n\n${text.slice(at).replace(/^\n+/, "")}`);
      changes.push("README.md now shows the palette image");
    }
  }
  // Screenshots of the brand in use (0.4)
  if (pathExists(readme)) {
    const text = fs.readFileSync(readme, "utf8");
    if (!/<!--\s*(?:obks|bkr):previews\s*-->/.test(text)) {
      writeText(readme, `${text.replace(/\s*$/, "")}\n\n## The brand in use\n\n<!-- obks:previews -->\n`);
      changes.push("README.md: added an obks:previews block (run `obks preview` to fill it with screenshots)");
    }
  }
  for (const [rel, kind, heading] of [
    ["visual/palette.md", "palette", "All colors"],
    ["visual/accessibility.md", "contrast", "Checked text and background pairs"],
    ["visual/logo.md", "logos", "Logo files"],
  ]) {
    const p = path.join(kitRoot, rel);
    if (!pathExists(p)) continue;
    const text = fs.readFileSync(p, "utf8");
    if (new RegExp(`<!--\\s*(?:obks|bkr):${kind}\\s*-->`).test(text)) continue;
    writeText(p, `${text.replace(/\s*$/, "")}\n\n## ${heading}\n\n<!-- obks:${kind} -->\n`);
    changes.push(`${rel}: added a generated obks:${kind} block`);
  }

  // Organization context (0.5): suggest, do not add (new files would start with TODOs)
  const optional = ["identity/mission.md", "identity/offerings.md", "identity/audiences.md", "identity/facts.md", "voice/terms.yaml", "voice/topics.md", "voice/style.md", "copy/claims.md"].filter((f) => !pathExists(path.join(kitRoot, f)));
  if (optional.length) {
    todo.push(`optional context files you can add (copy them from a new "obks init" kit): ${optional.join(", ")}`);
  }

  // .gitignore for publish output
  const gi = path.join(kitRoot, ".gitignore");
  const giText = pathExists(gi) ? fs.readFileSync(gi, "utf8") : "";
  if (!/^dist\/?$/m.test(giText)) {
    writeText(gi, `${giText}${giText && !giText.endsWith("\n") ? "\n" : ""}dist/\n`);
    changes.push(".gitignore now ignores dist/ (obks publish output)");
  }

  // Manifest schema hint for editors
  let text = doc.toString({ lineWidth: 0 });
  if (!text.includes("yaml-language-server")) {
    text = `# yaml-language-server: $schema=${MANIFEST_SCHEMA_URL}\n${text}`;
  }
  for (const old of OLD_SCHEMA_BASES) {
    if (text.includes(old)) {
      text = text.replaceAll(old, SCHEMA_BASE);
      changes.push("brandkit.yaml: schema link now points at the jsDelivr copy");
    }
  }
  writeText(yamlPath, text);

  // Token $schema URLs
  const oldTokenUrls = [LEGACY_TOKEN_SCHEMA_URL, ...OLD_SCHEMA_BASES.map((b) => `${b}/bkr-token.schema.json`)];
  for (const f of loadTokens(kitRoot).files) {
    if (!f.doc) continue;
    if (!f.doc.$schema || oldTokenUrls.includes(f.doc.$schema)) {
      const { $schema: _old, ...rest } = f.doc;
      writeJson(f.file, { $schema: TOKEN_SCHEMA_URL, ...rest });
      changes.push(`${f.rel}: $schema -> ${TOKEN_SCHEMA_URL}`);
    }
  }

  // CSS variable names changed from camelCase to kebab-case
  // Only 0.1 kits used camelCase CSS variable names.
  const renamed = String(manifest.specVersion).startsWith("0.1.") ? cssRenames(kitRoot, manifest) : [];
  if (renamed.length) {
    todo.push(
      `CSS variable names changed. Update apps that use them:\n${renamed.map(([a, b]) => `      ${a} -> ${b}`).join("\n")}`
    );
  }
  if (pathExists(path.join(kitRoot, "tokens", "exports", "css", "dark-theme.css"))) {
    changes.push("dark theme now ships inside variables.css (dark-theme.css removed)");
  }

  exportKit(kitRoot, ["all"]);
  buildDigest(kitRoot);
  changes.push("regenerated tokens/exports/, digest, and AGENTS.md");

  return { changes, todo };
}

function cssRenames(kitRoot, manifest) {
  const prefix = manifest.consumption?.cssPrefix || manifest.brand.id.replace(/-/g, "");
  const out = [];
  for (const t of loadTokens(kitRoot).base) {
    const oldName = `--${prefix}-${t.group}-${t.name}`.replace(/_/g, "-");
    const newName = `--${prefix}-${kebab(t.group)}-${kebab(t.name)}`;
    if (oldName !== newName) out.push([oldName, newName]);
  }
  return out;
}
