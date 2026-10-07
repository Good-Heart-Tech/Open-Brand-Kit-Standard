import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import {
  CURRENT_SPEC_VERSION,
  OLD_CONTRACT,
  SUPPORTED_SPEC,
  coveredElsewhere,
  effectiveMaturity,
  listFiles,
  pathExists,
  readJson,
  readManifest,
  schemaPath,
} from "./fs-kit.js";
import { checkTokenValue, evaluateContrast, loadTokens, toPosix } from "./tokens.js";
import { computeSourceHash, readStoredHash } from "./export.js";
import { collectPublication } from "./publication.js";
import { checkMarkdownBlocks, evaluateAvoid } from "./visuals.js";
import { previewStatus } from "./preview.js";
import { checkTerms, findAvoided, formatHit, loadTerms } from "./terms.js";

const PROFILE_PATHS = {
  identity: ["identity/about.md", "identity/naming.md"],
  voice: ["voice/tone.md", "voice/vocabulary.md"],
  visual: ["visual/palette.md", "visual/logo.md", "visual/accessibility.md"],
  copy: ["copy/messaging.md", "copy/legal.md"],
  // tokens/colors.obks.json (or colors.bkr.json before the rename) is checked separately.
  tokens: [],
  security: ["security/brand-protection.md"],
};

// Marker left in templates for sections a person still needs to write.
const TODO_MARKER = "TODO(obks)";
const TODO_LINE = /^\s*>?\s*TODO\((?:obks|bkr)\):/m;

// Words that look like token names in prose but are manifest or token field names.
const FIELD_WORDS = new Set([
  "value", "type", "description", "usage", "contexts", "avoid", "aliases", "inheritsFrom",
  "extensions", "meta", "tokens", "brandId", "layer",
]);

function manifestKeys(obj, out = new Set()) {
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    for (const [k, v] of Object.entries(obj)) {
      out.add(k);
      manifestKeys(v, out);
    }
  }
  return out;
}

export function createValidator() {
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  return {
    validateManifest: ajv.compile(readJson(schemaPath("brandkit.schema.json"))),
    validateTokenDoc: ajv.compile(readJson(schemaPath("obks-token.schema.json"))),
    validateTermsDoc: ajv.compile(readJson(schemaPath("obks-terms.schema.json"))),
  };
}

// options: { strict, parent } where parent is a local path to the parent kit.
export async function validateKit(kitRoot, options = {}) {
  const strict = Boolean(options.strict);
  const errors = [];
  const warnings = [];
  const notes = [];

  if (!pathExists(path.join(kitRoot, "README.md"))) notes.push("No README.md yet: add one so people know what this folder is");
  if (!pathExists(path.join(kitRoot, "AGENTS.md"))) notes.push("No AGENTS.md yet: run `obks digest` to create the instructions AI tools read first");

  let manifest;
  try {
    manifest = readManifest(kitRoot);
  } catch (e) {
    errors.push(e.message);
    return { ok: false, errors, warnings, notes, manifest: null };
  }

  const { validateManifest, validateTokenDoc, validateTermsDoc } = createValidator();
  if (!validateManifest(manifest)) {
    for (const err of validateManifest.errors || []) {
      errors.push(`brandkit.yaml: ${err.instancePath || "/"} ${err.message}`);
    }
    // Later checks assume a well-formed manifest.
    if (!manifest?.brand?.id) {
      return { ok: false, errors, warnings, notes, manifest };
    }
  }

  if (!SUPPORTED_SPEC.test(String(manifest.specVersion))) {
    errors.push(`specVersion ${manifest.specVersion} is not supported by this CLI (supports 0.1.x, 0.2.x, and 1.x)`);
  } else if (String(manifest.specVersion).startsWith("0.1.")) {
    warnings.push(`specVersion ${manifest.specVersion} is out of date; run \`obks upgrade\` to move to ${CURRENT_SPEC_VERSION}`);
  }

  const maturity = effectiveMaturity(manifest);
  if (manifest.brand.status && !manifest.brand.maturity) {
    notes.push("brand.status is now brand.maturity (basic, standard, or advanced): run `obks upgrade` to convert it");
  }

  // --- Required files: only for sections the kit turned on, and not for sections covered elsewhere
  const elsewhere = coveredElsewhere(manifest);
  for (const [name, see] of Object.entries(elsewhere)) notes.push(`${name} is covered elsewhere (${see}); its files are not required`);
  const profiles = { ...(manifest.profiles || {}) };
  for (const name of Object.keys(elsewhere)) profiles[name] = false;
  for (const [profile, enabled] of Object.entries(profiles)) {
    if (!enabled) continue;
    for (const rel of PROFILE_PATHS[profile] || []) {
      if (!pathExists(path.join(kitRoot, rel))) errors.push(`Section ${profile} is turned on but ${rel} is missing. Add it, or turn the section off in brandkit.yaml (profiles.${profile}: false), or point to where it lives (sections.${profile}.see).`);
    }
  }
  if (!profiles.security && !elsewhere.security) {
    notes.push("Tip: a short security/brand-protection.md helps stop people impersonating your brand (profiles.security: true)");
  }

  if (profiles.visual) {
    const logos = listFiles(path.join(kitRoot, "assets", "logo"));
    if (!pathExists(path.join(kitRoot, "assets", "logo"))) errors.push("Profile visual: missing assets/logo/");
    else if (logos.length === 0) errors.push("Profile visual: assets/logo/ is empty");
  }
  errors.push(...checkSvgs(kitRoot));

  // --- Tokens
  let tokens = null;
  if (profiles.tokens) {
    tokens = loadTokens(kitRoot);
    if (tokens.files.length === 0) errors.push("No tokens/*.obks.json files found");
    else if (!["tokens/colors.obks.json", "tokens/colors.bkr.json"].some((f) => pathExists(path.join(kitRoot, f)))) {
      errors.push("Profile tokens: missing tokens/colors.obks.json");
    }
    if (tokens.files.some((f) => f.rel.endsWith(".bkr.json")) || manifest.schema === OLD_CONTRACT) {
      warnings.push("This kit uses pre-rename BKR names (.bkr.json files or ght.brandkit/v1): run `obks upgrade` to switch to OBKS names");
    }
    checkTokenFiles(tokens, manifest, validateTokenDoc, errors, warnings);

    for (const row of evaluateContrast(manifest, tokens)) {
      const label = `contrast (${row.theme}): ${row.foreground} on ${row.background}`;
      if (row.error) errors.push(`${label}: ${row.error}`);
      else if (!row.pass) errors.push(`${label} is ${row.ratio.toFixed(2)}:1, needs ${row.min}:1`);
    }
    if (!(manifest.validation?.contrastPairs || []).length) {
      notes.push("Tip: list your text and background pairs in validation.contrastPairs so readability is checked");
    }

    warnings.push(...checkNarrativeRefs(kitRoot, tokens, manifestKeys(manifest)));

    // People cannot see a color from a hex code; READMEs must show the palette.
    if (tokens.files.every((f) => f.doc)) {
      const md = checkMarkdownBlocks(kitRoot, manifest, tokens);
      if (profiles.visual && !md.readmeVisual && readStoredHash(kitRoot)) {
        warnings.push(
          "README.md does not show the colors: add ![Colors](tokens/exports/svg/palette.svg) or a <!-- obks:palette --> block"
        );
      }
      for (const rel of md.stale) {
        warnings.push(`${rel}: an obks: markdown block is out of date: run \`obks export --all\``);
      }
      for (const r of evaluateAvoid(manifest, tokens)) {
        if (r.error) errors.push(`validation.avoidPairs: ${r.foreground} on ${r.background}: ${r.error}`);
      }
      if (previewStatus(kitRoot, manifest, tokens) === "stale") {
        warnings.push("tokens/exports/png/ screenshots are older than the brand: run `obks preview`");
      }
    }

    const stored = readStoredHash(kitRoot);
    if (!stored) {
      notes.push("No generated files yet (tokens/exports/): run `obks export --all` if you want CSS, Tailwind, and the brand page");
    } else if (tokens.files.every((f) => f.doc) && stored !== computeSourceHash(kitRoot)) {
      warnings.push("tokens/exports/ is out of date with tokens/ or brandkit.yaml: run `obks export --all`");
    }
  }

  // --- Organization context and word rules
  const terms = loadTerms(kitRoot);
  const termCheck = checkTerms(terms, validateTermsDoc);
  errors.push(...termCheck.errors);
  warnings.push(...termCheck.warnings);
  if (terms?.doc?.terms && !termCheck.errors.length) {
    // The kit's own approved wording should follow its own word rules.
    for (const f of listFiles(path.join(kitRoot, "copy"))) {
      const rel = toPosix(path.relative(kitRoot, f));
      if (!rel.endsWith(".md") || /^copy\/(legal|claims)\.md$/.test(rel)) continue;
      for (const h of findAvoided(fs.readFileSync(f, "utf8"), rel, terms.doc.terms)) warnings.push(`check-copy: ${formatHit(rel, h)}`);
    }
  }
  warnings.push(...checkFacts(kitRoot));

  // --- Sharing / publication
  const pub = collectPublication(kitRoot, manifest);
  errors.push(...pub.errors);
  warnings.push(...pub.warnings);

  // --- Parent kit
  const parentDir = options.parent
    ? path.resolve(options.parent)
    : manifest.hierarchy?.parent?.path
      ? path.resolve(kitRoot, manifest.hierarchy.parent.path)
      : null;
  if (manifest.role === "product" || manifest.hierarchy?.parent) {
    // A manifest path is a convenience for local sibling checkouts; CI may not have it.
    if (parentDir && !options.parent && !pathExists(path.join(parentDir, "brandkit.yaml"))) {
      notes.push(`parent tokens not checked: hierarchy.parent.path (${manifest.hierarchy.parent.path}) has no brandkit.yaml here`);
    } else if (parentDir) {
      checkParent(kitRoot, manifest, tokens || loadTokens(kitRoot), parentDir, errors, warnings);
    } else {
      notes.push("parent tokens not checked: pass --parent <path-to-parent-kit> or set hierarchy.parent.path");
    }
  }

  // --- Unfinished template sections
  const digestRel = toPosix(path.normalize(manifest.consumption?.agentDigest || ""));
  const todos = listFiles(kitRoot)
    .map((f) => [f, toPosix(path.relative(kitRoot, f))])
    .filter(([f, rel]) => f.endsWith(".md") && rel !== digestRel && rel !== "AGENTS.md")
    .filter(([f]) => TODO_LINE.test(fs.readFileSync(f, "utf8")))
    .map(([, rel]) => rel);
  if (todos.length) {
    const msg = `${todos.length} file(s) still have ${TODO_MARKER} sections to fill in: ${todos.join(", ")}`;
    // A basic kit is allowed to be unfinished. Claiming standard or advanced asks for it to be filled in.
    if (maturity === "basic") notes.push(`${msg} (fine for a basic kit)`);
    else warnings.push(`${msg} (this kit says it is ${maturity})`);
  }

  // --- Rule pack
  if (manifest.validation?.rulesPack) {
    try {
      const pack = await loadRulesPack(manifest.validation.rulesPack, kitRoot);
      const packResult = await pack.validate({ kitRoot, manifest, tokens });
      errors.push(...(packResult.errors || []));
      warnings.push(...(packResult.warnings || []));
    } catch (e) {
      warnings.push(`rulesPack ${manifest.validation.rulesPack}: ${e.message}`);
    }
  }

  const ok = errors.length === 0 && (!strict || warnings.length === 0);
  return { ok, errors, warnings, notes, manifest, maturity };
}

function checkTokenFiles(tokens, manifest, validateTokenDoc, errors, warnings) {
  for (const f of tokens.files) {
    if (!f.doc) {
      errors.push(`${f.rel}: invalid JSON (${f.error})`);
      continue;
    }
    if (!validateTokenDoc(f.doc)) {
      for (const err of validateTokenDoc.errors || []) {
        errors.push(`${f.rel}: ${err.instancePath || "/"} ${err.message}`);
      }
    }
    if (f.doc.meta?.brandId && f.doc.meta.brandId !== manifest.brand.id) {
      warnings.push(`${f.rel}: meta.brandId does not match manifest brand.id`);
    }
  }

  const seen = new Map();
  for (const t of tokens.base) {
    const msg = checkTokenValue(t.token);
    if (msg) errors.push(`${t.rel}: ${t.path}: ${msg}`);
    if (seen.has(t.path)) errors.push(`${t.rel}: ${t.path} is also defined in ${seen.get(t.path)}`);
    seen.set(t.path, t.rel);
  }

  const baseMap = new Map(tokens.base.map((t) => [t.path, t.token]));
  for (const [theme, entries] of Object.entries(tokens.themes)) {
    for (const t of entries) {
      const msg = checkTokenValue(t.token);
      if (msg) errors.push(`${t.rel}: ${t.path}: ${msg}`);
      const base = baseMap.get(t.path);
      if (!base) errors.push(`${t.rel}: theme ${theme} overrides ${t.path}, which is not a base token`);
      else if (base.type !== t.token.type) errors.push(`${t.rel}: ${t.path} type ${t.token.type} does not match base type ${base.type}`);
    }
  }
}

// Unsafe SVGs are an XSS risk wherever logos get embedded or shared.
function checkSvgs(kitRoot) {
  const errors = [];
  for (const f of listFiles(path.join(kitRoot, "assets"))) {
    if (!f.toLowerCase().endsWith(".svg")) continue;
    const text = fs.readFileSync(f, "utf8");
    const rel = toPosix(path.relative(kitRoot, f));
    if (/<script/i.test(text)) errors.push(`${rel}: SVG contains <script>; remove it`);
    if (/\son[a-z]+\s*=/i.test(text)) errors.push(`${rel}: SVG contains an event handler (on...=); remove it`);
    if (/<foreignObject/i.test(text)) errors.push(`${rel}: SVG contains <foreignObject>; remove it`);
    if (/<!ENTITY/i.test(text)) errors.push(`${rel}: SVG declares XML entities; remove them`);
    if (/(href|src)\s*=\s*["']\s*(https?:|javascript:|data:text\/html)/i.test(text)) {
      errors.push(`${rel}: SVG loads an external or script URL; embed assets instead`);
    }
  }
  return errors;
}

// Finds `backticked` token names in visual/*.md that no longer exist in tokens/.
// Ignore a word with: <!-- obks-ignore-refs: word other --> (old bkr-ignore-refs also works)
function checkNarrativeRefs(kitRoot, tokens, reserved) {
  const warnings = [];
  const known = new Set();
  const groups = new Set([...tokens.base, ...Object.values(tokens.themes).flat()].map((t) => t.group));
  for (const t of [...tokens.base, ...Object.values(tokens.themes).flat()]) {
    known.add(t.name);
    known.add(t.group);
    known.add(t.path);
  }
  for (const theme of Object.keys(tokens.themes)) known.add(theme);

  for (const f of listFiles(path.join(kitRoot, "visual"))) {
    if (!f.endsWith(".md")) continue;
    const text = fs.readFileSync(f, "utf8");
    const ignored = new Set(
      [...text.matchAll(/<!--\s*(?:obks|bkr)-ignore-refs:([^>]*)-->/g)].flatMap((m) => m[1].trim().split(/\s+/))
    );
    const rel = toPosix(path.relative(kitRoot, f));
    for (const m of text.matchAll(/`([^`\s]+)`/g)) {
      const word = m[1];
      if (!/^[A-Za-z][A-Za-z0-9-]*(\.[A-Za-z][A-Za-z0-9-]*)?$/.test(word)) continue;
      if (/\.(svg|png|jpe?g|ico|webp|md|json|css|cjs|html|ya?ml)$/i.test(word)) continue;
      if (known.has(word) || ignored.has(word)) continue;
      const [first, second] = word.split(".");
      // Dotted words are only token paths when they start with a token group.
      if (second !== undefined && !groups.has(first)) continue;
      if (second === undefined && (FIELD_WORDS.has(word) || reserved.has(word))) continue;
      warnings.push(`${rel}: mentions \`${word}\`, which is not a token in tokens/ (fix the text or add <!-- obks-ignore-refs: ${word} -->)`);
    }
  }
  return warnings;
}

function checkParent(kitRoot, manifest, tokens, parentDir, errors, warnings) {
  let parentManifest;
  try {
    parentManifest = readManifest(parentDir);
  } catch (e) {
    errors.push(`parent kit: ${e.message}`);
    return;
  }
  const expected = manifest.hierarchy?.parent?.brandId;
  if (expected && parentManifest.brand?.id !== expected) {
    errors.push(`parent kit at ${parentDir} is ${parentManifest.brand?.id}, but hierarchy.parent.brandId is ${expected}`);
  }
  if (parentManifest.role === "product") {
    warnings.push("parent kit is itself a product kit; parents are usually organization kits");
  }

  const parentTokens = new Map(loadTokens(parentDir).base.map((t) => [t.path, t.token]));
  for (const t of tokens.base) {
    const from = t.token.inheritsFrom;
    if (from) {
      const p = parentTokens.get(from);
      if (!p) {
        errors.push(`${t.rel}: ${t.path} inheritsFrom ${from}, which the parent kit does not define`);
      } else if (p.type !== t.token.type) {
        errors.push(`${t.rel}: ${t.path} type ${t.token.type} does not match parent ${from} (${p.type})`);
      } else if (JSON.stringify(normalize(p.value)) !== JSON.stringify(normalize(t.token.value))) {
        errors.push(`${t.rel}: ${t.path} is ${JSON.stringify(t.token.value)} but parent ${from} is ${JSON.stringify(p.value)}`);
      }
    } else if (parentTokens.has(t.path)) {
      errors.push(`${t.rel}: ${t.path} redefines a parent token; add "inheritsFrom": "${t.path}" or use a new name`);
    }
  }
}

// identity/facts.md must say when it was last reviewed, so stale numbers do not spread.
const FACTS_MAX_AGE_DAYS = 365;
function checkFacts(kitRoot) {
  const p = path.join(kitRoot, "identity", "facts.md");
  if (!pathExists(p)) return [];
  const m = fs.readFileSync(p, "utf8").match(/Last reviewed:?\*{0,2}:?\s*(\d{4}-\d{2}-\d{2})/i);
  if (!m) return ["identity/facts.md: add a line like \"Last reviewed: 2026-10-01\" so people know how current the facts are"];
  const age = (Date.now() - Date.parse(`${m[1]}T00:00:00Z`)) / 86400000;
  if (Number.isNaN(age)) return [`identity/facts.md: \"${m[1]}\" is not a valid date`];
  if (age > FACTS_MAX_AGE_DAYS) return [`identity/facts.md: facts were last reviewed ${m[1]}, over a year ago; check them and update the date`];
  return [];
}

const normalize = (v) => (typeof v === "string" ? v.toLowerCase() : v);

// Rule packs: a package name (resolved from the kit first, then from this CLI) or a
// local path like ./rules/index.js. A pack exports validate({ kitRoot, manifest, tokens }).
async function loadRulesPack(name, kitRoot) {
  if (name.startsWith(".") || path.isAbsolute(name)) {
    return import(pathToFileURL(path.resolve(kitRoot, name)).href);
  }
  try {
    const fromKit = createRequire(path.join(kitRoot, "package.json")).resolve(name);
    return import(pathToFileURL(fromKit).href);
  } catch {
    return import(name);
  }
}
