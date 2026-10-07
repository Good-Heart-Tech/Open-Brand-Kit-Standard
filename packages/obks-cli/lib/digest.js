import fs from "node:fs";
import path from "node:path";
import { consumptionPaths, coveredElsewhere, effectiveMaturity, ensureDir, pathExists, readManifest, writeText } from "./fs-kit.js";
import { resolveVisibility } from "./publication.js";
import { loadTerms } from "./terms.js";

// About 5,000 tokens. Sections are ordered by how much they change what an agent
// writes (who we are, facts, word rules first), so a trim never drops the essentials.
const DEFAULT_MAX_BYTES = 20000;

function readHead(filePath, maxChars = 2000) {
  if (!pathExists(filePath)) return "";
  const raw = fs
    .readFileSync(filePath, "utf8")
    // Normalize Windows line endings first so the cut point is the same on every OS.
    .replace(/\r\n/g, "\n")
    // Generated tables are for people on GitHub; agents get the source data instead.
    .replace(/<!--\s*(?:obks|bkr):(palette|contrast|logos|previews|terms)\s*-->[\s\S]*?<!--\s*\/(?:obks|bkr):\1\s*-->\n?/g, "")
    .replace(/<!--[\s\S]*?-->\n?/g, "")
    // The file title repeats the section heading.
    .replace(/^# .*\n+/, "")
    .trim();
  return raw.length > maxChars ? `${raw.slice(0, maxChars)}\n…` : raw;
}

function bulletLinesFromMarkdown(md, maxItems = 10) {
  return md
    .split("\n")
    .filter((line) => /^[-*]/.test(line.trim()))
    .slice(0, maxItems)
    .join("\n");
}

function termLines(kitRoot) {
  const t = loadTerms(kitRoot);
  const list = t?.doc?.terms || [];
  return list
    .map((x) => {
      const avoid = (x.avoid || []).map((a) => `"${a}"`).join(", ");
      const head = x.use ? `Use "${x.use}"${avoid ? ` instead of ${avoid}` : ""}` : `Never use ${avoid}`;
      const extra = [x.topic && `topic: ${x.topic}`, x.caseSensitive && "exact capitalization", x.reason].filter(Boolean).join("; ");
      return `- ${head}${extra ? ` (${extra})` : ""}`;
    })
    .join("\n");
}

const SHARING_RULE = {
  private: "Private: do not send files from this kit outside the organization.",
  partner: "Partner: only paths in `publication.includedPaths` may go to partners. Build them with `obks publish`.",
  public: "Public: only paths in `publication.includedPaths` may be shared publicly. Build them with `obks publish`.",
};

export function buildDigest(kitRoot, options = {}) {
  const maxBytes = options.maxBytes || DEFAULT_MAX_BYTES;
  const manifest = readManifest(kitRoot);
  const visibility = resolveVisibility(manifest);
  const read = (rel, n) => readHead(path.join(kitRoot, rel), n);
  const org = manifest.organization || {};
  const hasBrief = pathExists(path.join(kitRoot, "tokens", "exports", "agent", "ui-brief.md"));

  let body = `# Agent context (generated)

> Regenerate with \`obks digest\`. Normative values live in \`tokens/*.obks.json\` and \`tokens/exports/\`.

## Brand

- **Id:** ${manifest.brand.id}
- **Name:** ${manifest.brand.displayName}
- **Maturity:** ${effectiveMaturity(manifest)}${manifest.brand.retired ? " (retired brand: do not use for new work)" : ""}
- **Role:** ${manifest.role}
`;
  if (org.type) body += `- **Organization type:** ${org.type}\n`;
  if (org.industry) body += `- **Industry:** ${org.industry}\n`;
  if (org.location) body += `- **Based in:** ${org.location}\n`;
  if (org.serviceArea) body += `- **Serves:** ${org.serviceArea}\n`;
  if (org.founded) body += `- **Founded:** ${org.founded}\n`;
  if (org.website) body += `- **Website:** ${org.website}\n`;
  if (manifest.hierarchy?.parent) {
    body += `- **Parent kit:** ${manifest.hierarchy.parent.repository} @ ${manifest.hierarchy.parent.ref}\n`;
  }
  body += `- **Sharing:** ${SHARING_RULE[visibility]}\n`;
  if (manifest.contacts?.security) body += `- **Report impersonation:** ${manifest.contacts.security}\n`;

  const elsewhere = coveredElsewhere(manifest);
  const elsewhereText = Object.entries(elsewhere).map(([name, see]) => `- **${name}:** ${see}`).join("\n");

  // Order matters: earlier sections survive the size cap.
  const sections = [
    ["Brand summary", read("BRAND.md", 4000)],
    ["Covered somewhere else (ask or follow the pointer, do not guess)", elsewhereText],
    ["Mission, vision, and values", read("identity/mission.md", 2000)],
    ["Approved facts and claims to never make", read("identity/facts.md", 3000)],
    ["Word rules (follow exactly)", termLines(kitRoot)],
    ["Claims, disclaimers, and approvals", read("copy/claims.md", 1800)],
    ["About", read("identity/about.md", 1500)],
    ["What we offer", read("identity/offerings.md", 1800)],
    ["Who we talk to", read("identity/audiences.md", 1500)],
    ["Voice and tone", read("voice/tone.md", 1500)],
    ["Sensitive topics", read("voice/topics.md", 1800)],
    ["Style rules", read("voice/style.md", 1200)],
    ["Vocabulary highlights", bulletLinesFromMarkdown(read("voice/vocabulary.md", 2500))],
    ["Approved messaging (excerpt)", read("copy/messaging.md", 1200)],
    ["Logo rules (excerpt)", read("visual/logo.md", 1200)],
  ].filter(([, text]) => text);
  for (const [title, text] of sections) {
    body += `\n## ${title}\n\n${text}\n`;
  }

  body += `
## Consumption

- CSS variables: \`${consumptionPaths(manifest).cssVariables}\`
${hasBrief ? "- UI brief (colors, type, approved contrast pairs): `tokens/exports/agent/ui-brief.md`\n" : ""}- Do not invent hex values or fonts outside exported tokens.
- Load full \`copy/legal.md\` before external publication.
`;

  if (Buffer.byteLength(body, "utf8") > maxBytes) {
    body = `${body.slice(0, maxBytes - 20)}\n\n… [truncated]\n`;
  }

  const digestPath = path.join(kitRoot, consumptionPaths(manifest).agentDigest);
  ensureDir(path.dirname(digestPath));
  writeText(digestPath, body);

  const has = (rel) => pathExists(path.join(kitRoot, rel));
  const agentsPath = path.join(kitRoot, "AGENTS.md");
  const agentsDoc = `# Agent instructions (OBKS)

This repository follows the **Open Brand Kit Standard (OBKS)** layout (\`obks/v1\`, spec ${manifest.specVersion}).
Generated by \`obks digest\`. Do not edit by hand.

## Load order

1. \`brandkit.yaml\`: sections, role, organization, parent kit, sharing rules
2. \`${consumptionPaths(manifest).agentDigest}\`: size-capped summary (generated)
3. For UI work: \`tokens/exports/agent/ui-brief.md\` and \`tokens/exports/css/variables.css\`
4. As needed: \`identity/\`, \`voice/\`, \`visual/logo.md\`, \`copy/\`

## Rules

- **Tokens win** over prose for hex, spacing, and type scales.
- **Product kits** inherit palette rules from \`hierarchy.parent\`; do not introduce a second primary.
- Only pair text and background colors listed in \`validation.contrastPairs\` unless you check contrast.
${has("identity/facts.md") ? "- **Facts:** only state numbers, dates, and claims listed in `identity/facts.md`. Never make a claim from its \"never claim\" list. If you need a fact that is not there, ask instead of guessing.\n" : "- **Facts:** do not invent numbers, dates, customers, or awards. Ask instead of guessing.\n"}${has("voice/terms.yaml") ? "- **Words:** follow `voice/terms.yaml` exactly. Check drafts with `obks check-copy <file>`.\n" : ""}${has("copy/claims.md") ? "- **Claims:** follow `copy/claims.md` for disclaimers and approvals before publishing.\n" : ""}${has("voice/topics.md") ? "- **Sensitive topics:** follow `voice/topics.md`; if a topic is marked no comment, do not write about it.\n" : ""}- **Sharing:** ${SHARING_RULE[visibility]}
- Never copy staff names, emails, or phone numbers into shared or public material.
- After editing tokens or the manifest, run \`obks export --all\`, then \`obks digest\`, then \`obks validate\`.

## Human docs

See \`README.md\` for the file index and \`tokens/exports/html/brand-at-a-glance.html\` for a visual summary.
`;

  writeText(agentsPath, agentsDoc);

  return { digestPath, agentsPath, bytes: Buffer.byteLength(body, "utf8") };
}
