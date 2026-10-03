// `obks publish`: copies only the shareable files into a bundle folder.
import fs from "node:fs";
import path from "node:path";
import { ensureDir, pathExists, sha256, writeText } from "./fs-kit.js";
import { collectPublication } from "./publication.js";
import { validateKit } from "./validate.js";
import { writeZip } from "./zip.js";

const MARKER = ".obks-bundle";
const OLD_MARKER = ".bkr-bundle";

const VERSION_OK = /^[0-9A-Za-z][0-9A-Za-z.+-]*$/;
const DATE_OK = /^\d{4}-\d{2}-\d{2}$/;

// zip: also build a download-ready zip (plus a "-latest" copy and SHA256SUMS.txt) next to the bundle folder.
// version: kit version for the file name (defaults to brand.version in brandkit.yaml, or none).
// date: YYYY-MM-DD for the file name (defaults to today, UTC).
export async function publishKit(kitRoot, { dryRun = false, out, zip = false, version, date } = {}) {
  const result = await validateKit(kitRoot);
  if (!result.manifest) {
    return { ok: false, errors: result.errors, warnings: [], files: [] };
  }
  const manifest = result.manifest;
  const pub = collectPublication(kitRoot, manifest);

  if (pub.visibility === "private") {
    return {
      ok: false,
      errors: ["This kit is private (publication.visibility). Set it to partner or public and list publication.includedPaths to share files."],
      warnings: [],
      files: [],
    };
  }
  if (!result.ok) {
    return { ok: false, errors: ["Fix validation errors before publishing.", ...result.errors], warnings: result.warnings, files: [] };
  }

  const outDir = path.resolve(out || path.join(kitRoot, "dist", "brand-bundle"));
  const meta = {
    version: String(version || manifest.brand.version || "").replace(/^v(?=\d)/i, "") || undefined,
    date: date || new Date().toISOString().slice(0, 10),
  };
  if (meta.version !== undefined && !VERSION_OK.test(String(meta.version))) {
    return { ok: false, errors: [`Invalid version "${meta.version}". Use letters, numbers, dots, dashes, for example 1.2.0`], warnings: [], files: [] };
  }
  if (!DATE_OK.test(meta.date)) {
    return { ok: false, errors: [`Invalid date "${meta.date}". Use YYYY-MM-DD`], warnings: [], files: [] };
  }
  const summary = { ok: true, errors: [], warnings: pub.warnings, files: pub.files, outDir, visibility: pub.visibility, dryRun };
  if (zip) summary.zipName = zipBaseName(manifest, meta) + ".zip";
  if (dryRun) return summary;

  // Only clear a folder that is empty or that obks created before.
  if (pathExists(outDir) && fs.readdirSync(outDir).length > 0) {
    if (!pathExists(path.join(outDir, MARKER)) && !pathExists(path.join(outDir, OLD_MARKER))) {
      return { ...summary, ok: false, errors: [`${outDir} is not empty and was not created by obks publish; choose another --out`] };
    }
    fs.rmSync(outDir, { recursive: true, force: true });
  }
  ensureDir(outDir);

  for (const rel of pub.files) {
    const dest = path.join(outDir, rel);
    ensureDir(path.dirname(dest));
    fs.copyFileSync(path.join(kitRoot, rel), dest);
  }

  writeText(path.join(outDir, MARKER), "Created by obks publish. Safe to delete and rebuild.\n");
  const readme = bundleReadme(manifest, pub, meta);
  writeText(path.join(outDir, "BUNDLE.md"), readme);

  if (zip) {
    const base = zipBaseName(manifest, meta);
    const zipDir = path.dirname(outDir);
    const entries = [{ name: `${base}/README.md`, data: Buffer.from(readme) }];
    for (const rel of pub.files) {
      entries.push({ name: `${base}/${rel}`, data: fs.readFileSync(path.join(kitRoot, rel)) });
    }
    const zipPath = path.join(zipDir, `${base}.zip`);
    const latestPath = path.join(zipDir, `${manifest.brand.id}-brand-kit-latest.zip`);
    writeZip(zipPath, entries);
    fs.copyFileSync(zipPath, latestPath);
    const sums = [zipPath, latestPath]
      .map((f) => `${sha256(fs.readFileSync(f))}  ${path.basename(f)}`)
      .join("\n");
    writeText(path.join(zipDir, "SHA256SUMS.txt"), sums + "\n");
    summary.zipPath = zipPath;
    summary.latestPath = latestPath;
  }
  return summary;
}

// good-heart-tech-brand-kit-v1.2.0-2026-10-03
function zipBaseName(manifest, meta) {
  return [manifest.brand.id, "brand-kit", meta.version ? `v${meta.version}` : null, meta.date].filter(Boolean).join("-");
}

function bundleReadme(manifest, pub, meta = {}) {
  const audience = pub.visibility === "public" ? "the public (for example a press kit)" : "approved partners";
  return `# ${manifest.brand.displayName} brand files

These files are shared with ${audience}. They were exported from the
${manifest.brand.displayName} brand kit with \`obks publish\`.
${meta.version ? `\nVersion: ${meta.version}\n` : ""}${meta.date ? `Date: ${meta.date}\n` : ""}
## What is inside

- \`assets/\` has the logos. Use the SVG files for websites and print, and the PNG files for documents and slides.
- \`tokens/\` has the colors and fonts as files for websites and apps.
- Open \`tokens/exports/html/brand-at-a-glance.html\` in your browser to see the colors and logos on one page (if it is included below).
- If a file here is older than the date above, ask for the newest version.

## Use

- Use the logos and colors only to refer to ${manifest.brand.displayName}.
- Do not change, recolor, or stretch the logos.${pub.files.includes("visual/logo.md") ? " See `visual/logo.md`." : ""}
- Do not imply endorsement or partnership without written approval.
- The name and logo are trademarks of ${manifest.brand.displayName}.

${manifest.contacts?.security ? `## Report impersonation

If you see a website, email, or social account pretending to be ${manifest.brand.displayName},
report it: ${manifest.contacts.security}
` : ""}
## Files

${pub.files.map((f) => `- \`${f}\``).join("\n")}
`;
}
