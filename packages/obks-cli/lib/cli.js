import fs from "node:fs";
import path from "node:path";
import { readManifest, resolveKitPath } from "./fs-kit.js";
import { loadTokens } from "./tokens.js";
import { takePreviews } from "./preview.js";
import { findAvoided, formatHit, loadTerms } from "./terms.js";
import { validateKit } from "./validate.js";
import { ALL_TARGETS, exportKit, importLegacyGhtColors } from "./export.js";
import { buildDigest } from "./digest.js";
import { initKit } from "./init.js";
import { publishKit } from "./publish.js";
import { upgradeKit } from "./upgrade.js";

const HELP = `obks: Open Brand Kit Standard CLI

Usage:
  obks init <dir> [--full] [--role organization|product] [--brand-id id] [--display-name name]
                 [--security-contact url-or-email] [--parent-repo url] [--parent-ref ref]
                 [--parent-brand-id id] [--parent-path ../org-kit]
                 [--org-type company|government|nonprofit|education|solo|other] [--industry text]
  obks validate [dir] [--strict] [--parent <path-to-parent-kit>]
  obks export [dir] [--all] [--dtcg] [--css] [--tailwind] [--html] [--agent]
  obks digest [dir] [--max-bytes N]
  obks publish [dir] [--dry-run] [--out <dir>] [--zip] [--kit-version <v>] [--date YYYY-MM-DD]
  obks preview [dir]            (screenshots to tokens/exports/png/, needs Chrome or Edge)
  obks check-copy <file...> [--kit dir] [--strict]   (flag avoided words from voice/terms.yaml)
  obks upgrade [dir]
  obks import legacy-ght-colors <dir> <path-to-colors.json>

obks init makes a small starter kit (colors, logo, one-page BRAND.md). Add --full for every optional file.
Nothing is required beyond what your kit turns on. A basic kit may be unfinished.

Typical loop after editing a kit:
  obks export --all && obks digest && obks validate
`;

function printResult(label, result) {
  for (const line of result.errors || []) console.error(`fix: ${line}`);
  for (const line of result.warnings || []) console.warn(`suggestion: ${line}`);
  for (const line of result.notes || []) console.log(`note: ${line}`);
  if (result.ok) {
    console.log(`${label}: OK${result.warnings?.length ? ` (${result.warnings.length} suggestion(s))` : ""}`);
  } else {
    console.error(`${label}: needs attention (${result.errors.length} to fix, ${result.warnings?.length || 0} suggestion(s))`);
  }
}

const dirArg = (args) => (args[1] && !args[1].startsWith("-") ? args[1] : ".");

export async function runCli(argv) {
  const args = argv.slice(2);
  const cmd = args[0];

  if (!cmd || cmd === "--help" || cmd === "-h") {
    console.log(HELP);
    return;
  }

  if (cmd === "init") {
    const dir = args[1];
    if (!dir || dir.startsWith("-")) throw new Error("init requires a target directory");
    const out = initKit(resolveKitPath(dir), {
      role: getFlag(args, "--role"),
      brandId: getFlag(args, "--brand-id"),
      displayName: getFlag(args, "--display-name"),
      securityContact: getFlag(args, "--security-contact"),
      parentRepository: getFlag(args, "--parent-repo"),
      parentRef: getFlag(args, "--parent-ref"),
      parentBrandId: getFlag(args, "--parent-brand-id"),
      parentPath: getFlag(args, "--parent-path"),
      orgType: getFlag(args, "--org-type"),
      industry: getFlag(args, "--industry"),
      size: args.includes("--full") || getFlag(args, "--role") === "product" ? "full" : "basic",
    });
    console.log(`Initialized OBKS kit at ${out}`);
    console.log("Next: open BRAND.md and tokens/colors.obks.json, fill in what you know, then run `obks export --all && obks digest && obks validate`.");
    return;
  }

  if (cmd === "validate") {
    const result = await validateKit(resolveKitPath(dirArg(args)), {
      strict: args.includes("--strict"),
      parent: getFlag(args, "--parent"),
    });
    printResult("validate", result);
    if (!result.ok) process.exitCode = 1;
    return;
  }

  if (cmd === "export") {
    const targets = ["all", ...ALL_TARGETS].filter((t) => args.includes(`--${t}`));
    if (targets.length === 0) targets.push("all");
    const { results, brandId, hashWritten } = exportKit(resolveKitPath(dirArg(args)), targets);
    console.log(`export: ${brandId} -> ${results.length} file(s)`);
    for (const r of results) console.log(`  ${r}`);
    if (!hashWritten) console.log("note: partial export; run `obks export --all` to refresh the stale-export hash");
    return;
  }

  if (cmd === "digest") {
    const maxBytes = Number(getFlag(args, "--max-bytes")) || undefined;
    const { digestPath, bytes } = buildDigest(resolveKitPath(dirArg(args)), { maxBytes });
    console.log(`digest: wrote ${digestPath} (${bytes} bytes)`);
    return;
  }

  if (cmd === "publish") {
    const dryRun = args.includes("--dry-run");
    const result = await publishKit(resolveKitPath(dirArg(args)), {
      dryRun,
      out: getFlag(args, "--out"),
      zip: args.includes("--zip"),
      version: getFlag(args, "--kit-version"),
      date: getFlag(args, "--date"),
    });
    if (result.ok) {
      console.log(`${dryRun ? "Would share" : "Shared"} ${result.files.length} file(s) (${result.visibility}):`);
      for (const f of result.files) console.log(`  ${f}`);
      if (result.zipName) console.log(`${dryRun ? "Would build" : "Built"} ${result.zipName}`);
      if (!dryRun) console.log(`Bundle written to ${result.outDir}`);
      if (result.zipPath) console.log(`Zip written to ${result.zipPath} (and ${path.basename(result.latestPath)})`);
    }
    printResult(dryRun ? "publish (dry run)" : "publish", result);
    if (!result.ok) process.exitCode = 1;
    return;
  }

  if (cmd === "check-copy") {
    // obks check-copy <file...> [--kit <dir>] [--strict]
    const kit = resolveKitPath(getFlag(args, "--kit") || ".");
    const files = [];
    for (let i = 1; i < args.length; i++) {
      if (args[i] === "--kit") i++; // skip the flag's value
      else if (!args[i].startsWith("--")) files.push(args[i]);
    }
    if (!files.length) throw new Error("usage: obks check-copy <file...> [--kit <kit-dir>] [--strict]");
    const terms = loadTerms(kit);
    if (!terms) throw new Error(`No voice/terms.yaml in ${kit}. Pass --kit <path-to-brand-kit>.`);
    if (terms.error) throw new Error(`voice/terms.yaml: ${terms.error}`);
    let total = 0;
    for (const f of files) {
      const hits = findAvoided(fs.readFileSync(path.resolve(f), "utf8"), f, terms.doc.terms || []);
      total += hits.length;
      for (const h of hits) console.log(formatHit(f, h));
    }
    console.log(`check-copy: ${total} word(s) to review in ${files.length} file(s)`);
    if (total && args.includes("--strict")) process.exitCode = 1;
    return;
  }

  if (cmd === "preview") {
    const kit = resolveKitPath(dirArg(args));
    exportKit(kit, ["all"]);
    const { browser, written } = takePreviews(kit, readManifest(kit), loadTokens(kit));
    exportKit(kit, ["docs"]); // fill <!-- obks:previews --> now that the PNGs exist
    console.log(`preview: ${written.length} screenshot(s) with ${browser}`);
    for (const w of written) console.log(`  ${w}`);
    return;
  }

  if (cmd === "upgrade") {
    const { changes, todo } = upgradeKit(resolveKitPath(dirArg(args)));
    console.log("upgrade: changes");
    for (const c of changes) console.log(`  - ${c}`);
    if (todo.length) {
      console.log("upgrade: still to do by hand");
      for (const t of todo) console.log(`  - ${t}`);
    }
    console.log("Then run `obks validate --strict`.");
    return;
  }

  if (cmd === "import") {
    const sub = args[1];
    if (sub === "legacy-ght-colors") {
      const dir = args[2];
      const jsonPath = args[3];
      if (!dir || !jsonPath) {
        throw new Error("usage: obks import legacy-ght-colors <kit-dir> <colors.json>");
      }
      const out = importLegacyGhtColors(resolveKitPath(dir), path.resolve(jsonPath));
      console.log(`import: wrote ${out}`);
      return;
    }
    throw new Error(`Unknown import target: ${sub || "(none)"}`);
  }

  throw new Error(`Unknown command: ${cmd}. Run obks --help.`);
}

function getFlag(args, name) {
  const i = args.indexOf(name);
  if (i === -1) return undefined;
  return args[i + 1];
}
