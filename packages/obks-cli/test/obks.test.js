// Run with: npm test (from the repo root) or node --test packages/obks-cli/test/
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initKit } from "../lib/init.js";
import { validateKit } from "../lib/validate.js";
import { exportKit } from "../lib/export.js";
import { buildDigest } from "../lib/digest.js";
import { publishKit } from "../lib/publish.js";
import { listZip } from "../lib/zip.js";
import { upgradeKit } from "../lib/upgrade.js";
import { checkTokenValue, contrastRatio, cssVarName, kebab, toDtcgValue } from "../lib/tokens.js";
import { readManifest, writeManifest } from "../lib/fs-kit.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

function tmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "obks-test-"));
}

function newKit(opts = {}) {
  const dir = path.join(tmp(), opts.dirName || "kit");
  initKit(dir, { brandId: "test-org", displayName: "Test Org", ...opts });
  return dir;
}

function editJson(file, fn) {
  const doc = JSON.parse(fs.readFileSync(file, "utf8"));
  fn(doc);
  fs.writeFileSync(file, JSON.stringify(doc, null, 2));
}

function editManifest(dir, fn) {
  const m = readManifest(dir);
  fn(m);
  writeManifest(dir, m);
}

const hasMsg = (list, re) => list.some((m) => re.test(m));

// --- Unit helpers -----------------------------------------------------------------

test("contrast ratio matches WCAG reference values", () => {
  assert.equal(Math.round(contrastRatio("#000000", "#FFFFFF")), 21);
  assert.equal(contrastRatio("#FFFFFF", "#FFFFFF"), 1);
  // #767676 is the classic lightest gray that passes 4.5:1 on white
  assert.ok(contrastRatio("#767676", "#FFFFFF") >= 4.5);
  assert.ok(contrastRatio("#777777", "#FFFFFF") < 4.5);
});

test("CSS variable names are kebab-case", () => {
  assert.equal(kebab("productAccent"), "product-accent");
  assert.equal(kebab("fontSize"), "font-size");
  assert.equal(cssVarName({ brand: { id: "acme-docs" }, consumption: {} }, "palette", "productAccent"), "--acmedocs-palette-product-accent");
});

test("DTCG values use the 2025.10 object shapes", () => {
  const c = toDtcgValue({ type: "color", value: "#FF0000" });
  assert.deepEqual(c, { colorSpace: "srgb", components: [1, 0, 0], hex: "#ff0000" });
  assert.deepEqual(toDtcgValue({ type: "dimension", value: "1.5rem" }), { value: 1.5, unit: "rem" });
  assert.deepEqual(toDtcgValue({ type: "duration", value: "200ms" }), { value: 200, unit: "ms" });
});

test("token value checks catch bad values", () => {
  assert.equal(checkTokenValue({ type: "color", value: "#2563EB" }), null);
  assert.match(checkTokenValue({ type: "color", value: "blue" }), /hex/);
  assert.match(checkTokenValue({ type: "dimension", value: "16" }), /px or rem/);
  assert.match(checkTokenValue({ type: "fontWeight", value: "bold" }), /number/);
});

// --- Kit lifecycle ------------------------------------------------------------------

test("a fresh kit validates, but strict mode flags unfinished TODO sections", async () => {
  const dir = newKit();
  const loose = await validateKit(dir);
  assert.deepEqual(loose.errors, []);
  assert.ok(loose.ok);
  assert.ok(hasMsg(loose.warnings, /TODO\(obks\)/));
  const strict = await validateKit(dir, { strict: true });
  assert.equal(strict.ok, false);
});

test("TODO sections are errors once a kit is marked active", async () => {
  const dir = newKit();
  editManifest(dir, (m) => (m.brand.status = "active"));
  exportKit(dir, ["all"]);
  const r = await validateKit(dir);
  assert.ok(hasMsg(r.errors, /TODO\(obks\)/));
});

test("export output is deterministic", () => {
  const dir = newKit();
  const css = path.join(dir, "tokens/exports/css/variables.css");
  const html = path.join(dir, "tokens/exports/html/brand-at-a-glance.html");
  const before = [fs.readFileSync(css, "utf8"), fs.readFileSync(html, "utf8")];
  exportKit(dir, ["all"]);
  assert.deepEqual([fs.readFileSync(css, "utf8"), fs.readFileSync(html, "utf8")], before);
});

test("stale exports are detected after a token change", async () => {
  const dir = newKit();
  editJson(path.join(dir, "tokens/colors.obks.json"), (d) => (d.tokens.palette.accent.value = "#00AAFF"));
  let r = await validateKit(dir);
  assert.ok(hasMsg(r.warnings, /out of date/));
  exportKit(dir, ["all"]);
  r = await validateKit(dir);
  assert.ok(!hasMsg(r.warnings, /out of date/));
});

test("a failing contrast pair is an error, in light and dark themes", async () => {
  const dir = newKit();
  editJson(path.join(dir, "tokens/colors.obks.json"), (d) => (d.tokens.palette.body.value = "#BBBBBB"));
  exportKit(dir, ["all"]);
  const r = await validateKit(dir);
  assert.ok(hasMsg(r.errors, /contrast \(base\): palette\.body on palette\.surface/));

  editJson(path.join(dir, "tokens/colors.obks.json"), (d) => (d.tokens.palette.body.value = "#334155"));
  editJson(path.join(dir, "tokens/themes/dark.obks.json"), (d) => (d.tokens.palette.body.value = "#334155"));
  exportKit(dir, ["all"]);
  const r2 = await validateKit(dir);
  assert.ok(hasMsg(r2.errors, /contrast \(dark\): palette\.body/));
});

test("theme files may only override existing base tokens", async () => {
  const dir = newKit();
  editJson(path.join(dir, "tokens/themes/dark.obks.json"), (d) => {
    d.tokens.palette.brandNew = { value: "#123456", type: "color" };
  });
  const r = await validateKit(dir);
  assert.ok(hasMsg(r.errors, /not a base token/));
});

test("prose that mentions a missing token is flagged", async () => {
  const dir = newKit();
  fs.appendFileSync(path.join(dir, "visual/palette.md"), "\n- Error banners: `danger`\n");
  const r = await validateKit(dir);
  assert.ok(hasMsg(r.warnings, /mentions `danger`/));
  fs.appendFileSync(path.join(dir, "visual/palette.md"), "\n<!-- obks-ignore-refs: danger -->\n");
  const r2 = await validateKit(dir);
  assert.ok(!hasMsg(r2.warnings, /mentions `danger`/));
});

test("unsafe SVG logos are rejected", async () => {
  const dir = newKit();
  fs.writeFileSync(path.join(dir, "assets/logo/bad.svg"), '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
  const r = await validateKit(dir);
  assert.ok(hasMsg(r.errors, /bad\.svg: SVG contains <script>/));
});

test("product kits are checked against a local parent kit", async () => {
  const root = tmp();
  const org = path.join(root, "org");
  initKit(org, { brandId: "test-org", displayName: "Test Org" });
  const child = path.join(root, "child");
  initKit(child, { role: "product", brandId: "test-child", displayName: "Child", parentBrandId: "test-org", parentPath: "../org" });

  let r = await validateKit(child);
  assert.deepEqual(r.errors, []);

  editJson(path.join(child, "tokens/colors.obks.json"), (d) => (d.tokens.palette.primary.value = "#FF0000"));
  r = await validateKit(child);
  assert.ok(hasMsg(r.errors, /palette\.primary is "#FF0000" but parent palette\.primary is "#2563EB"/));

  editJson(path.join(child, "tokens/colors.obks.json"), (d) => {
    d.tokens.palette.primary.value = "#2563EB";
    delete d.tokens.palette.ink.inheritsFrom;
  });
  r = await validateKit(child);
  assert.ok(hasMsg(r.errors, /palette\.ink redefines a parent token/));
});

test("a product kit without a parent path gets a note, not a failure", async () => {
  const child = path.join(tmp(), "child");
  initKit(child, { role: "product", brandId: "test-child", displayName: "Child" });
  const r = await validateKit(child);
  assert.deepEqual(r.errors, []);
  assert.ok(hasMsg(r.notes, /parent tokens not checked/));
});

test("a missing manifest parent path is a note, but a missing --parent is an error", async () => {
  const child = path.join(tmp(), "child");
  initKit(child, { role: "product", brandId: "test-child", displayName: "Child", parentPath: "../not-checked-out" });
  const r = await validateKit(child);
  assert.deepEqual(r.errors, []);
  assert.ok(hasMsg(r.notes, /not-checked-out/));
  const r2 = await validateKit(child, { parent: path.join(tmp(), "nope") });
  assert.ok(hasMsg(r2.errors, /parent kit/));
});

test("local rule packs are loaded from the kit", async () => {
  const dir = newKit();
  fs.writeFileSync(
    path.join(dir, "rules.js"),
    "export function validate({ manifest }) { return { errors: [`local rule saw ${manifest.brand.id}`], warnings: [] }; }\n"
  );
  editManifest(dir, (m) => (m.validation.rulesPack = "./rules.js"));
  exportKit(dir, ["all"]);
  const r = await validateKit(dir);
  assert.ok(hasMsg(r.errors, /local rule saw test-org/));
});

// --- Sharing --------------------------------------------------------------------------

test("private kits cannot be published", async () => {
  const dir = newKit();
  const r = await publishKit(dir, { dryRun: true });
  assert.equal(r.ok, false);
  assert.ok(hasMsg(r.errors, /private/));
});

test("sharing guardrails warn about risky files and staff contacts", async () => {
  const dir = newKit();
  fs.writeFileSync(path.join(dir, "copy/email-signature.html"), "<p>Jane Doe, jane@testorg.org, 208-555-0134</p>");
  fs.writeFileSync(path.join(dir, "copy/donate.md"), "Donate today with a gift card!");
  editManifest(dir, (m) => {
    m.publication = {
      visibility: "partner",
      includedPaths: ["assets/logo/", "identity/naming.md", "copy/email-signature.html", "copy/donate.md", "missing.md"],
    };
  });
  const r = await validateKit(dir);
  assert.ok(hasMsg(r.errors, /missing\.md does not exist/));
  assert.ok(hasMsg(r.warnings, /naming\.md: internal naming/));
  assert.ok(hasMsg(r.warnings, /email-signature\.html/));
  assert.ok(hasMsg(r.warnings, /jane@testorg\.org/));
  assert.ok(hasMsg(r.warnings, /phone number/));
  assert.ok(hasMsg(r.warnings, /donate\.md: contains payment, pricing, or fundraising/));
});

test("publish builds a bundle with only the listed files", async () => {
  const dir = newKit();
  editManifest(dir, (m) => {
    m.publication = { visibility: "public", includedPaths: ["assets/logo/", "tokens/exports/css/variables.css"] };
    m.contacts = { security: "https://testorg.example.org/contact" };
  });
  exportKit(dir, ["all"]);
  const r = await publishKit(dir);
  assert.ok(r.ok, r.errors.join("\n"));
  const out = path.join(dir, "dist/brand-bundle");
  assert.ok(fs.existsSync(path.join(out, "assets/logo/mark.svg")));
  assert.ok(fs.existsSync(path.join(out, "tokens/exports/css/variables.css")));
  assert.ok(!fs.existsSync(path.join(out, "identity")));
  assert.match(fs.readFileSync(path.join(out, "BUNDLE.md"), "utf8"), /testorg\.example\.org\/contact/);

  // Never wipes a folder it did not create
  const foreign = path.join(tmp(), "foreign");
  fs.mkdirSync(foreign);
  fs.writeFileSync(path.join(foreign, "keep.txt"), "important");
  const r2 = await publishKit(dir, { out: foreign });
  assert.equal(r2.ok, false);
  assert.ok(fs.existsSync(path.join(foreign, "keep.txt")));
});

test("publish --zip builds a dated, versioned zip with only shared files", async () => {
  const dir = newKit();
  editManifest(dir, (m) => {
    m.publication = { visibility: "public", includedPaths: ["assets/logo/"] };
    m.contacts = { security: "https://testorg.example.org/contact" };
  });
  exportKit(dir, ["all"]);
  const r = await publishKit(dir, { zip: true, version: "1.2.0", date: "2026-10-03" });
  assert.ok(r.ok, r.errors.join("\n"));
  const base = "test-org-brand-kit-v1.2.0-2026-10-03";
  assert.equal(r.zipName, `${base}.zip`);
  const zipPath = path.join(dir, "dist", `${base}.zip`);
  const names = listZip(zipPath).map((e) => e.name);
  assert.ok(names.includes(`${base}/README.md`));
  assert.ok(names.includes(`${base}/assets/logo/mark.svg`));
  assert.ok(!names.some((n) => n.includes("identity/") || n.includes(".obks-bundle")));
  assert.match(listZip(zipPath).find((e) => e.name.endsWith("README.md")).data.toString(), /Version: 1\.2\.0/);
  assert.ok(fs.existsSync(path.join(dir, "dist", "test-org-brand-kit-latest.zip")));
  const sums = fs.readFileSync(path.join(dir, "dist", "SHA256SUMS.txt"), "utf8");
  assert.match(sums, /test-org-brand-kit-v1\.2\.0-2026-10-03\.zip/);
  assert.match(sums, /test-org-brand-kit-latest\.zip/);
});

test("publish --zip uses brand.version, rejects bad input, and never zips private kits", async () => {
  const dir = newKit();
  const priv = await publishKit(dir, { zip: true });
  assert.equal(priv.ok, false);
  assert.ok(hasMsg(priv.errors, /private/));

  editManifest(dir, (m) => {
    m.brand.version = "2.0.0";
    m.publication = { visibility: "partner", includedPaths: ["assets/logo/"] };
  });
  exportKit(dir, ["all"]);
  const ok = await publishKit(dir, { zip: true, dryRun: true, date: "2026-01-02" });
  assert.equal(ok.zipName, "test-org-brand-kit-v2.0.0-2026-01-02.zip");
  assert.ok(!fs.existsSync(path.join(dir, "dist")), "dry run writes nothing");

  const badDate = await publishKit(dir, { zip: true, date: "Oct 3" });
  assert.equal(badDate.ok, false);
  const badVersion = await publishKit(dir, { zip: true, version: "../x" });
  assert.equal(badVersion.ok, false);
});

test("contacts are optional, and the security contact may be a URL or an email", async () => {
  const dir = newKit();
  assert.equal(readManifest(dir).contacts, undefined);
  let r = await validateKit(dir);
  assert.ok(!hasMsg(r.warnings, /contacts\.security/));

  editManifest(dir, (m) => (m.contacts = { security: "https://testorg.org/.well-known/security.txt" }));
  r = await validateKit(dir);
  assert.ok(!hasMsg(r.errors, /contacts/));

  editManifest(dir, (m) => (m.contacts = { security: "not a contact" }));
  r = await validateKit(dir);
  assert.ok(hasMsg(r.errors, /contacts\/security/));
});

test("large logos are linked from the brand page instead of embedded", () => {
  const dir = newKit();
  const big = `<svg xmlns="http://www.w3.org/2000/svg"><!-- ${"x".repeat(250 * 1024)} --></svg>`;
  fs.writeFileSync(path.join(dir, "assets/logo/big.svg"), big);
  exportKit(dir, ["all"]);
  const html = fs.readFileSync(path.join(dir, "tokens/exports/html/brand-at-a-glance.html"), "utf8");
  assert.match(html, /href="\.\.\/\.\.\/\.\.\/assets\/logo\/big\.svg"/);
  assert.match(html, /too large to embed/);
  assert.ok(html.length < 100 * 1024);
});

test("export writes GitHub-visible SVGs and fills markdown blocks", async () => {
  const dir = newKit();
  const svg = path.join(dir, "tokens/exports/svg");
  for (const f of ["palette.svg", "palette-dark.svg", "contrast.svg", "chips/palette-primary.svg", "chips/palette-primary-dark.svg", "pairs/palette-body-on-palette-surface.svg"]) {
    assert.ok(fs.existsSync(path.join(svg, f)), f);
  }
  assert.match(fs.readFileSync(path.join(svg, "palette.svg"), "utf8"), /#2563EB/);

  const palette = fs.readFileSync(path.join(dir, "visual/palette.md"), "utf8");
  assert.match(palette, /\.\.\/tokens\/exports\/svg\/chips\/palette-primary\.svg/);
  assert.match(palette, /`#2563EB`/);
  assert.match(fs.readFileSync(path.join(dir, "visual/accessibility.md"), "utf8"), /pairs\/palette-body-on-palette-surface\.svg/);

  // Blocks go stale when tokens change, and export fixes them.
  editJson(path.join(dir, "tokens/colors.obks.json"), (d) => (d.tokens.palette.accent.value = "#0EA5E9"));
  let r = await validateKit(dir);
  assert.ok(hasMsg(r.warnings, /visual\/palette\.md: an obks: markdown block/));
  exportKit(dir, ["all"]);
  r = await validateKit(dir);
  assert.ok(!hasMsg(r.warnings, /markdown block/));
  assert.match(fs.readFileSync(path.join(dir, "visual/palette.md"), "utf8"), /`#0EA5E9`/);
});

test("a README without a color visual is flagged", async () => {
  const dir = newKit();
  const readme = path.join(dir, "README.md");
  fs.writeFileSync(readme, fs.readFileSync(readme, "utf8").replace("![Colors](tokens/exports/svg/palette.svg)", ""));
  const r = await validateKit(dir);
  assert.ok(hasMsg(r.warnings, /README\.md does not show the colors/));
});

test("logos are shown on light and dark panels in markdown", () => {
  const dir = newKit();
  assert.ok(fs.existsSync(path.join(dir, "tokens/exports/svg/logos/mark-svg.svg")));
  const logo = fs.readFileSync(path.join(dir, "visual/logo.md"), "utf8");
  assert.match(logo, /svg\/logos\/mark-svg\.svg/);
  assert.match(fs.readFileSync(path.join(dir, "tokens/exports/svg/logos/mark-svg.svg"), "utf8"), /data:image\/svg\+xml;base64/);
});

test("avoid pairs produce a do and don't sheet and an Avoid table", async () => {
  const dir = newKit();
  assert.ok(fs.existsSync(path.join(dir, "tokens/exports/svg/do-dont.svg")));
  const a11y = fs.readFileSync(path.join(dir, "visual/accessibility.md"), "utf8");
  assert.match(a11y, /do-dont\.svg/);
  assert.match(a11y, /Too light to read as text/);
  editManifest(dir, (m) => m.validation.avoidPairs.push({ foreground: "palette.nope", background: "palette.surface", reason: "x" }));
  const r = await validateKit(dir);
  assert.ok(hasMsg(r.errors, /avoidPairs: palette\.nope/));
});

test("preview pages are generated and stale screenshots are flagged", async () => {
  const dir = newKit();
  const ui = fs.readFileSync(path.join(dir, "tokens/exports/html/preview-ui.html"), "utf8");
  assert.match(ui, /obks-shot" content="ui 1280 480"/); // light and dark side by side
  assert.ok(fs.existsSync(path.join(dir, "tokens/exports/html/preview-type.html")));
  assert.match(fs.readFileSync(path.join(dir, "README.md"), "utf8"), /Run `obks preview`/);

  fs.mkdirSync(path.join(dir, "tokens/exports/png"), { recursive: true });
  fs.writeFileSync(path.join(dir, "tokens/exports/png/.obks-preview-hash"), "sha256:old\n");
  const r = await validateKit(dir);
  assert.ok(hasMsg(r.warnings, /obks preview/));
});

test("preview roles prefer 'label on a button' pairs over CTA text pairs", async () => {
  const { resolveRoles } = await import("../lib/preview.js");
  const { loadTokens } = await import("../lib/tokens.js");
  const dir = newKit();
  editManifest(dir, (m) => {
    m.validation.contrastPairs.unshift({ foreground: "palette.primary", background: "palette.ink", use: "CTA text on dark" });
  });
  const roles = resolveRoles(readManifest(dir), loadTokens(dir));
  assert.equal(roles.buttonBg, "palette.primary");
  assert.equal(roles.buttonText, "palette.onPrimary");
});

// --- Organization context and word rules -----------------------------------------

test("check-copy flags avoided words but skips code, URLs, and correct spellings", async () => {
  const { findAvoided } = await import("../lib/terms.js");
  const terms = [
    { use: "sign in", avoid: ["log in"], reason: "Matches the app" },
    { use: "WOSP", avoid: ["Wosp", "wosp"], caseSensitive: true },
    { avoid: ["world-class"] },
  ];
  const text = "Please Log In today. Our world-class team.\n`log in` and https://x.example/log-in are fine.\nWOSP is right, Wosp is not.\n";
  const hits = findAvoided(text, "draft.md", terms);
  assert.deepEqual(
    hits.map((h) => [h.line, h.found]),
    [[1, "Log In"], [1, "world-class"], [3, "Wosp"]]
  );
});

test("terms.yaml is validated and the kit's own copy follows it", async () => {
  const dir = newKit();
  fs.writeFileSync(path.join(dir, "voice/terms.yaml"), "terms:\n  - use: sign in\n    avoid: [sign in]\n");
  let r = await validateKit(dir);
  assert.ok(hasMsg(r.errors, /both uses and avoids "sign in"/));

  fs.writeFileSync(path.join(dir, "voice/terms.yaml"), "terms:\n  - nope: true\n");
  r = await validateKit(dir);
  assert.ok(hasMsg(r.errors, /voice\/terms\.yaml/));

  fs.writeFileSync(path.join(dir, "voice/terms.yaml"), "terms:\n  - use: sign in\n    avoid: [log in]\n");
  fs.appendFileSync(path.join(dir, "copy/messaging.md"), "\nPlease log in to start.\n");
  r = await validateKit(dir);
  assert.ok(hasMsg(r.warnings, /check-copy: copy\/messaging\.md:\d+:\d+ +"log in"/));
});

test("the terms table is generated into vocabulary.md", () => {
  const dir = newKit();
  const vocab = fs.readFileSync(path.join(dir, "voice/vocabulary.md"), "utf8");
  assert.match(vocab, /\| \*\*sign in\*\* \| ~~log in~~/);
  assert.match(vocab, /Generated by obks export from voice\/terms\.yaml/);
});

test("facts need a recent review date", async () => {
  const dir = newKit();
  const facts = path.join(dir, "identity/facts.md");
  assert.match(fs.readFileSync(facts, "utf8"), /Last reviewed: \d{4}-\d{2}-\d{2}/);
  let r = await validateKit(dir);
  assert.ok(!hasMsg(r.warnings, /facts\.md: (add a line|facts were last reviewed)/));
  fs.writeFileSync(facts, fs.readFileSync(facts, "utf8").replace(/Last reviewed: \d{4}-\d{2}-\d{2}/, "Last reviewed: 2020-01-01"));
  r = await validateKit(dir);
  assert.ok(hasMsg(r.warnings, /last reviewed 2020-01-01, over a year ago/));
  fs.writeFileSync(facts, "# Approved facts\n\nNo date here.\n");
  r = await validateKit(dir);
  assert.ok(hasMsg(r.warnings, /add a line like "Last reviewed/));
});

test("digest leads with organization, facts, and word rules", () => {
  const dir = newKit({ orgType: "government", industry: "county services" });
  const digest = fs.readFileSync(path.join(dir, "digest/AGENT_CONTEXT.md"), "utf8");
  assert.match(digest, /\*\*Organization type:\*\* government/);
  assert.match(digest, /\*\*Industry:\*\* county services/);
  const order = ["## Mission", "## Approved facts", "## Word rules", "## Voice and tone"].map((h) => digest.indexOf(h));
  assert.ok(order.every((i) => i > 0));
  assert.deepEqual([...order].sort((a, b) => a - b), order);
  assert.match(digest, /Use "sign in" instead of "log in"/);
  assert.match(fs.readFileSync(path.join(dir, "AGENTS.md"), "utf8"), /only state numbers, dates, and claims listed in `identity\/facts\.md`/);
});

test("organization type is checked, and sharing facts or claims is flagged", async () => {
  const dir = newKit();
  editManifest(dir, (m) => {
    m.organization = { type: "corporation" };
  });
  let r = await validateKit(dir);
  assert.ok(hasMsg(r.errors, /organization\/type/));
  editManifest(dir, (m) => {
    m.organization = { type: "company" };
    m.publication = { visibility: "partner", includedPaths: ["identity/facts.md", "copy/claims.md", "identity/mission.md"] };
  });
  r = await validateKit(dir);
  assert.ok(hasMsg(r.warnings, /sharing identity\/facts\.md: approved facts/));
  assert.ok(hasMsg(r.warnings, /sharing copy\/claims\.md/));
  assert.ok(!hasMsg(r.warnings, /sharing identity\/mission\.md/));
});

// --- Upgrade --------------------------------------------------------------------------

test("upgrade moves a 0.1 kit to 0.2 and keeps manifest comments", async () => {
  const dir = newKit();
  const yamlPath = path.join(dir, "brandkit.yaml");
  let text = fs.readFileSync(yamlPath, "utf8");
  text = text
    .replace("specVersion: 0.2.0", "specVersion: 0.1.0")
    .replace("  security: true\n", "  partnerPublic: true\n")
    .replace(/publication:\n  visibility: private\n  includedPaths: \[\]\n/, "")
    .replace("schema: obks/v1", "# keep this comment\nschema: obks/v1");
  fs.writeFileSync(yamlPath, text);
  fs.rmSync(path.join(dir, "security"), { recursive: true });
  editJson(path.join(dir, "tokens/colors.obks.json"), (d) => (d.$schema = "https://goodheart.tech/schemas/bkr-token/v1"));

  const before = await validateKit(dir);
  assert.ok(hasMsg(before.warnings, /obks upgrade/));

  const { changes } = upgradeKit(dir);
  assert.ok(changes.length > 0);
  const m = readManifest(dir);
  assert.equal(m.specVersion, "0.2.0");
  assert.equal(m.publication.visibility, "partner");
  assert.equal(m.profiles.partnerPublic, undefined);
  assert.equal(m.profiles.security, true);
  assert.match(fs.readFileSync(yamlPath, "utf8"), /# keep this comment/);
  assert.ok(fs.existsSync(path.join(dir, "security/brand-protection.md")));
  assert.match(fs.readFileSync(path.join(dir, "tokens/colors.obks.json"), "utf8"), /cdn\.jsdelivr\.net\/gh\/Good-Heart-Tech\/Open-Brand-Kit-Standard@main/);
});

test("upgrade rewrites old GitHub Pages schema links to jsDelivr", () => {
  const dir = newKit();
  const old = "https://good-heart-tech.github.io/Brand-Kit-Standard/schemas/v1";
  const yamlPath = path.join(dir, "brandkit.yaml");
  fs.writeFileSync(yamlPath, fs.readFileSync(yamlPath, "utf8").replace(/\$schema=\S+/, `$schema=${old}/brandkit.schema.json`));
  editJson(path.join(dir, "tokens/colors.obks.json"), (d) => (d.$schema = `${old}/bkr-token.schema.json`));
  upgradeKit(dir);
  assert.doesNotMatch(fs.readFileSync(yamlPath, "utf8"), /github\.io/);
  assert.doesNotMatch(fs.readFileSync(path.join(dir, "tokens/colors.obks.json"), "utf8"), /github\.io/);
});

test("pre-rename BKR kits still validate, and upgrade converts them to OBKS names", async () => {
  const dir = newKit();
  const t = (p) => path.join(dir, p);
  fs.renameSync(t("tokens/colors.obks.json"), t("tokens/colors.bkr.json"));
  fs.renameSync(t("tokens/themes/dark.obks.json"), t("tokens/themes/dark.bkr.json"));
  fs.writeFileSync(t("brandkit.yaml"), fs.readFileSync(t("brandkit.yaml"), "utf8").replace("schema: obks/v1", "schema: ght.brandkit/v1"));
  fs.writeFileSync(t("visual/palette.md"), fs.readFileSync(t("visual/palette.md"), "utf8").replaceAll("obks:palette", "bkr:palette"));
  exportKit(dir, ["all"]);
  let r = await validateKit(dir);
  assert.deepEqual(r.errors, []);
  assert.ok(hasMsg(r.warnings, /pre-rename BKR names/));

  upgradeKit(dir);
  assert.ok(fs.existsSync(t("tokens/colors.obks.json")) && !fs.existsSync(t("tokens/colors.bkr.json")));
  assert.ok(fs.existsSync(t("tokens/themes/dark.obks.json")));
  assert.equal(readManifest(dir).schema, "obks/v1");
  assert.match(fs.readFileSync(t("visual/palette.md"), "utf8"), /<!-- obks:palette -->/);
  r = await validateKit(dir);
  assert.ok(!hasMsg(r.warnings, /pre-rename BKR names/));
});

// --- Examples in this repo -----------------------------------------------------------------

test("every example kit passes strict validation", async () => {
  const examples = path.join(repoRoot, "examples");
  for (const name of fs.readdirSync(examples)) {
    const dir = path.join(examples, name);
    if (!fs.existsSync(path.join(dir, "brandkit.yaml"))) continue;
    const r = await validateKit(dir, { strict: true });
    assert.ok(r.ok, `${name}:\n${[...r.errors, ...r.warnings].join("\n")}`);
  }
});

test("digest output is the same for CRLF and LF source files", () => {
  const dir = newKit();
  const about = path.join(dir, "identity/about.md");
  const lf = `${"Line of about text.\n".repeat(200)}`;
  fs.writeFileSync(about, lf);
  buildDigest(dir);
  const fromLf = fs.readFileSync(path.join(dir, "digest/AGENT_CONTEXT.md"), "utf8");
  fs.writeFileSync(about, lf.replace(/\n/g, "\r\n"));
  buildDigest(dir);
  assert.equal(fs.readFileSync(path.join(dir, "digest/AGENT_CONTEXT.md"), "utf8"), fromLf);
});

test("digest stays under its size cap", () => {
  const dir = newKit();
  const { bytes } = buildDigest(dir, { maxBytes: 1500 });
  assert.ok(bytes <= 1500);
});
