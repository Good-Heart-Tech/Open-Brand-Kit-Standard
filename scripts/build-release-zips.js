// Builds the zips attached to each GitHub release, for people who do not use GitHub.
// Usage: node scripts/build-release-zips.js [--out dist/release]
// Output: obks-starter-kits-v<version>.zip and SHA256SUMS.txt
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sha256 } from "../packages/obks-cli/lib/fs-kit.js";
import { writeZip } from "../packages/obks-cli/lib/zip.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outFlag = process.argv.indexOf("--out");
const outDir = path.resolve(root, outFlag > -1 ? process.argv[outFlag + 1] : "dist/release");
const version = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")).version;
const base = `obks-starter-kits-v${version}`;

// What goes in the starter zip: [path in the repo, path inside the zip]
const INCLUDE = [
  ["examples/starter-basic", "basic-kit"],
  ["examples/minimal", "minimal-kit"],
  ["examples/starter-org", "starter-organization-kit"],
  ["examples/starter-product-child", "starter-product-kit"],
  ["INSTRUCTIONS-FOR-AI.md", "INSTRUCTIONS-FOR-AI.md"],
  ["docs/start-your-brand-kit.md", "docs/start-your-brand-kit.md"],
  ["docs/intake-worksheet.md", "docs/intake-worksheet.md"],
  ["docs/canva.md", "docs/canva.md"],
  ["LICENSE", "LICENSE"],
];

const README = `Open Brand Kit Standard: starter kits (version ${version})

You do not need a GitHub account to use these files.

1. Unzip this folder.
2. Open docs/start-your-brand-kit.md (any text editor works) and follow the steps.
3. Copy the kit folder that fits you, then replace the sample names, colors, and logos with yours:
   - basic-kit: a small starter with a one-page BRAND.md. Start here if unsure.
   - minimal-kit: three colors and a logo, filled in as an example.
   - starter-organization-kit: a complete kit for a company, nonprofit, school, or agency.
   - starter-product-kit: for a product or sub-brand that inherits its parent's colors.
4. docs/intake-worksheet.md lists what to gather before you start.
5. Prefer to have an AI do it? Give INSTRUCTIONS-FOR-AI.md to Claude, ChatGPT, or Cursor and say "help me build my brand kit".

You do not have to fill in everything. A small kit is a real kit. Write "Not decided" for anything you do not know yet.

Everything in these kits is fictional sample content. Replace it before sharing.
Project home: https://github.com/Good-Heart-Tech/Open-Brand-Kit-Standard
`;

function collect(srcRel, destRel) {
  const abs = path.join(root, srcRel);
  if (!fs.existsSync(abs)) throw new Error(`Missing ${srcRel}`);
  if (fs.statSync(abs).isFile()) return [{ name: `${base}/${destRel}`, data: fs.readFileSync(abs) }];
  const entries = [];
  const walk = (dir, rel) => {
    for (const name of fs.readdirSync(dir)) {
      if (name === "node_modules" || name === "dist" || name === ".DS_Store") continue;
      const full = path.join(dir, name);
      const next = `${rel}/${name}`;
      if (fs.statSync(full).isDirectory()) walk(full, next);
      else entries.push({ name: `${base}/${next}`, data: fs.readFileSync(full) });
    }
  };
  walk(abs, destRel);
  return entries;
}

const entries = [{ name: `${base}/README.txt`, data: Buffer.from(README) }];
for (const [src, dest] of INCLUDE) entries.push(...collect(src, dest));

const zipPath = path.join(outDir, `${base}.zip`);
writeZip(zipPath, entries);
fs.writeFileSync(path.join(outDir, "SHA256SUMS.txt"), `${sha256(fs.readFileSync(zipPath))}  ${path.basename(zipPath)}\n`);
console.log(`Built ${zipPath} (${entries.length} files)`);
