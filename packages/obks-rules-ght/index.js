/**
 * Optional rule pack: Good Heart Tech / Honey House conventions on top of core OBKS.
 * Any rule pack exports validate({ kitRoot, manifest, tokens }) and returns { errors, warnings }.
 * `tokens` is { base, themes, files } from the CLI (null when the tokens profile is off).
 */
export function validate({ manifest, tokens }) {
  const errors = [];
  const warnings = [];

  if (manifest.role === "product" && !manifest.hierarchy?.parent) {
    errors.push("GHT rule: product kits must declare hierarchy.parent");
  }

  const base = tokens?.base || [];
  const primary = base.find((t) => t.path === "palette.primary" || t.path === "color.primary");
  if (primary && !primary.token.description) {
    warnings.push("GHT rule: primary color should include a description");
  }
  for (const t of base) {
    if (t.token.inheritsFrom && manifest.role !== "product") {
      warnings.push(`GHT rule: token ${t.path} uses inheritsFrom but kit role is not product`);
    }
    if (t.token.type === "color" && !t.token.description) {
      warnings.push(`GHT rule: color ${t.path} should say what it is for (description)`);
    }
  }

  // contacts.security is optional. Only catch template placeholders left on a live kit.
  const security = manifest.contacts?.security;
  if (security && /example\.(org|com|net)(\/|$)/i.test(security) && (manifest.brand.maturity ? manifest.brand.maturity !== "basic" : manifest.brand.status === "active")) {
    errors.push("GHT rule: contacts.security is still a placeholder (example.org) on a finished (standard or advanced) kit");
  }

  if (manifest.validation?.minContrastRatio !== undefined && manifest.validation.minContrastRatio < 4.5) {
    warnings.push("GHT rule: minContrastRatio below 4.5 does not meet WCAG 2.2 AA for normal text");
  }

  return { errors, warnings };
}
