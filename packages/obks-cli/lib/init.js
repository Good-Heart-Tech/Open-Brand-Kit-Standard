import fs from "node:fs";
import path from "node:path";
import {
  CONTRACT,
  CURRENT_SPEC_VERSION,
  copyTemplateTree,
  ensureDir,
  templatesDir,
  writeManifest,
} from "./fs-kit.js";
import { buildDigest } from "./digest.js";
import { exportKit } from "./export.js";

const GHT_PARENT_REPO = "https://github.com/Good-Heart-Tech/Good-Heart-Tech-Branding-Marketing";

export function initKit(targetDir, options = {}) {
  const role = options.role || "organization";
  // "basic" is a small starter (colors, logo, one-page BRAND.md). "full" has every optional file.
  const size = options.size || "full";
  if (!["basic", "full"].includes(size)) throw new Error(`--size must be basic or full (got ${size})`);
  if (size === "basic" && role === "product") throw new Error("A product kit needs --full (it inherits from a parent kit)");
  if (!["organization", "product"].includes(role)) {
    throw new Error(`--role must be organization or product (got ${role})`);
  }
  const brandId = options.brandId || "example-brand";
  const displayName = options.displayName || "Example Brand";

  if (fs.existsSync(targetDir) && fs.readdirSync(targetDir).length > 0) {
    throw new Error(`Target directory not empty: ${targetDir}`);
  }
  ensureDir(targetDir);

  const parent = {
    repository: options.parentRepository || GHT_PARENT_REPO,
    ref: options.parentRef || "main",
    brandId: options.parentBrandId || "good-heart-tech",
  };

  // Contacts are optional. Without one, templates point people to the website instead.
  const reportImpersonation = options.securityContact
    ? `report it here: ${options.securityContact}`
    : "tell us through the contact page on our website";
  copyTemplateTree(path.join(templatesDir(), size === "basic" ? "basic" : role), targetDir, {
    today: new Date().toISOString().slice(0, 10),
    brandId,
    reportImpersonation,
    displayName,
    parentRepository: parent.repository,
    parentRef: parent.ref,
    parentBrandId: parent.brandId,
  });

  if (size === "basic") return initBasic(targetDir, { brandId, displayName, options });

  const manifest = {
    schema: CONTRACT,
    specVersion: CURRENT_SPEC_VERSION,
    brand: { id: brandId, displayName, maturity: "basic" },
    role,
    profiles: {
      core: true,
      identity: true,
      voice: true,
      visual: true,
      copy: true,
      tokens: true,
      security: true,
    },
    consumption: {
      cssVariables: "tokens/exports/css/variables.css",
      agentDigest: "digest/AGENT_CONTEXT.md",
      tailwindTheme: "tokens/exports/tailwind/theme.cjs",
    },
    publication: {
      visibility: "private",
      includedPaths: [],
    },
    validation: {
      rulesPack: options.rulesPack || "@goodheart/obks-rules-ght",
      minContrastRatio: 4.5,
      contrastPairs: [
        { foreground: "palette.body", background: "palette.surface", use: "body text" },
        { foreground: "palette.ink", background: "palette.surface", use: "headings" },
        { foreground: "palette.onPrimary", background: "palette.primary", use: "button labels" },
        { foreground: "palette.link", background: "palette.surface", use: "links" },
      ],
      avoidPairs: [
        { foreground: "palette.accent", background: "palette.surface", reason: "Too light to read as text" },
        { foreground: "palette.surface", background: "palette.accent", reason: "White on accent is too faint for labels" },
      ],
    },
  };
  if (options.securityContact) {
    manifest.contacts = { security: options.securityContact };
  }
  if (options.orgType || options.industry) {
    manifest.organization = {};
    if (options.orgType) manifest.organization.type = options.orgType;
    if (options.industry) manifest.organization.industry = options.industry;
  }

  if (role === "product") {
    manifest.hierarchy = { parent };
    if (options.parentPath) manifest.hierarchy.parent.path = options.parentPath;
    manifest.validation.contrastPairs = [
      { foreground: "palette.ink", background: "palette.surface", use: "headings and body text" },
      { foreground: "palette.onPrimary", background: "palette.primary", use: "button labels" },
    ];
    manifest.validation.avoidPairs = [
      { foreground: "palette.productAccent", background: "palette.ink", reason: "Accent on near-black is hard to read" },
      { foreground: "palette.productAccent", background: "palette.primary", reason: "Never put the accent on the parent primary" },
    ];
  }

  writeManifest(targetDir, manifest);
  exportKit(targetDir, ["all"]);
  buildDigest(targetDir);

  return targetDir;
}

// A small starter: colors, logo, and a one-page BRAND.md. Nothing else is required.
function initBasic(targetDir, { brandId, displayName, options }) {
  const manifest = {
    schema: CONTRACT,
    specVersion: CURRENT_SPEC_VERSION,
    brand: { id: brandId, displayName, maturity: "basic" },
    role: "organization",
    profiles: { core: true, tokens: true },
    publication: { visibility: "private", includedPaths: [] },
    validation: {
      minContrastRatio: 4.5,
      contrastPairs: [
        { foreground: "palette.text", background: "palette.background", use: "all text" },
        { foreground: "palette.background", background: "palette.primary", use: "button labels" },
      ],
    },
  };
  if (options.securityContact) manifest.contacts = { security: options.securityContact };
  if (options.orgType || options.industry) {
    manifest.organization = {};
    if (options.orgType) manifest.organization.type = options.orgType;
    if (options.industry) manifest.organization.industry = options.industry;
  }
  writeManifest(targetDir, manifest);
  exportKit(targetDir, ["all"]);
  buildDigest(targetDir);
  return targetDir;
}
