# Changelog

## 0.6.2 (2026-10)

### Added

- **Downloads without GitHub.** Each GitHub release now gets `obks-starter-kits-v<version>.zip` and `SHA256SUMS.txt` attached automatically (new `assets` job in `release.yml`, built by `scripts/build-release-zips.js`). The job fails if the release tag does not match the version in `package.json`.
- **`obks publish --zip`** builds `<brand-id>-brand-kit-v<version>-<YYYY-MM-DD>.zip`, a `<brand-id>-brand-kit-latest.zip` copy, and `SHA256SUMS.txt` in `dist/`. Options: `--kit-version`, `--date`. The zip holds only the files `publication` allows and a plain-language `README.md`. Private kits are still refused.
- Optional `brand.version` in `brandkit.yaml`, used for the zip file name.
- OBKS GitHub Action inputs `bundle` and `bundle-version` to save the zip as a workflow artifact.
- `docs/download-a-brand-kit.md`, a plain-language download guide.

## 0.6.1 (2026-10)

### Fixed

- `obks upgrade` also rewrites local CLI paths (`packages/bkr-cli/bin/bkr.js`), `Brand-Kit-Standard` link labels and folder names, and any remaining plain `bkr` mentions in a kit's own files.

## 0.6.0 (2026-10)

### Changed (renamed)

- **The project is now the Open Brand Kit Standard (OBKS).** One name everywhere: the repository (`Good-Heart-Tech/Open-Brand-Kit-Standard`), the `obks` command (`bkr` still works as an alias), packages `@goodheart/obks-cli`, `obks-schema`, and `obks-rules-ght`, contract id `obks/v1`, token files `*.obks.json`, and markers `TODO(obks)` and `<!-- obks:... -->`.
- Everything from before the rename keeps working: `ght.brandkit/v1`, `*.bkr.json`, and `bkr:` markers are still read. `obks upgrade` converts a kit, including its action reference and links.
- The README states the project's goals and how it helps.
- Entries below this one use the old BKR names as they were at the time.

## 0.5.0 (2026-10)

### Added

- **Who you are:** optional `organization` section in `brandkit.yaml` (type, industry, location, service area, founded, website) and optional files `identity/mission.md`, `identity/offerings.md` (including what you do not offer), `identity/audiences.md`, and `identity/facts.md` (approved facts with sources, a never-claim list, and a review date).
- **How you talk about things:** `voice/terms.yaml` (words to use and avoid, with topic and reason), `voice/topics.md` (sensitive topics, positions, approvers), `voice/style.md` (style checklist), and `copy/claims.md` (disclaimers, legally restricted words, approvers for regulated industries).
- **`bkr check-copy <file...>`** flags avoided words in any draft, with the replacement and reason. It skips code, URLs, and HTML tags, and never blocks.
- `<!-- bkr:terms -->` renders the word rules as a table on GitHub.
- `bkr init --org-type --industry`.

### Changed

- The agent digest leads with organization details, mission, approved facts and never-claim list, and the full word rules; the default size cap is 20 KB. `AGENTS.md` tells agents to state only listed facts and ask instead of guessing.
- `bkr validate` checks `voice/terms.yaml`, warns when the kit's own copy uses an avoided word, and warns when facts were not reviewed in the last year.
- Sharing guardrails flag `identity/facts.md`, `copy/claims.md`, and `voice/topics.md`.
- Templates include every new file with prompts for all organization types; the intake worksheet asks for them.

## 0.4.3 (2026-10)

### Changed

- **Works for any organization.** Templates, docs, and tool messages no longer assume a nonprofit. Prompts give examples for companies, government agencies, nonprofits, and solo businesses; the start guide, intake worksheet, Canva guide, and brand protection guide are written for all of them.
- **More examples:** `business-sample` (a retail and wholesale company with a public press kit), `government-sample` (a county with accessibility as a legal requirement and a protected seal), and `solo-sample` (a one-person studio with optional layers off). Acme Labs is now a software company. The README shows company, government, and solo examples side by side.
- Sharing guardrails also flag pricing, payment terms, and bank details.
- Spec: restricted marks (seals, certification marks) live outside `assets/logo/` so they never appear in generated pages or bundles.

### Fixed

- Preview screenshots never fake bold or italic (`font-synthesis: none`), the dark panel uses a reversed logo when one exists, and the caption only says "light and dark" when the kit has a dark theme.

## 0.4.2 (2026-10)

### Changed

- **No GitHub Pages needed.** Schema links now point at jsDelivr, a free CDN that serves files straight from this repo (`https://cdn.jsdelivr.net/gh/Good-Heart-Tech/Brand-Kit-Standard@main/packages/bkr-schema/schemas/`). The Pages workflow is removed. Validation never fetched schemas (it uses the bundled copies); the links only power editor autocomplete. `bkr upgrade` rewrites old links.

## 0.4.1 (2026-10)

### Fixed

- The `bkr preview` sample page never draws text on a color it cannot be read on. It prefers theme-aware tokens (such as `app.*`, `ui.*`, `colorway.*`) and falls back to the most readable brand color, so dark-mode headings and dark cards stay legible.

## 0.4.0 (2026-10)

### Added

- **`bkr preview`**: screenshots a generated sample page (light and dark side by side) and a type specimen with a local Chrome or Edge, using the real web fonts. The PNGs render on GitHub. `<!-- bkr:previews -->` shows them in markdown.
- **Logos on light and dark**: `bkr:logos` shows each logo on the lightest and darkest brand colors, so reversed and white logos are visible.
- **Do and Don't**: `validation.avoidPairs` (with a `reason`) adds a do-and-don't image and an Avoid table to the contrast block.
- Optional `preview` roles in `brandkit.yaml` to choose which colors the sample page uses.
- `bkr upgrade` adds the README "brand in use" section.

### Changed

- `bkr validate` errors on avoid pairs that name unknown tokens and warns when screenshots are older than the brand.

## 0.3.0 (2026-10)

### Added

- **Colors you can see on GitHub.** `bkr export` writes `tokens/exports/svg/`: a palette swatch sheet (`palette.svg`, plus one per theme), a contrast sheet (`contrast.svg`), a small color chip per token, and an "Aa" sample per contrast pair. GitHub renders these inside markdown, unlike `.html` files.
- **Self-updating markdown blocks:** `<!-- bkr:palette -->`, `<!-- bkr:contrast -->`, and `<!-- bkr:logos -->` in any `.md` file are filled with chip tables, contrast samples, and logo images on every export.
- Templates and examples show the palette at the top of `README.md` and use the blocks in `visual/palette.md`, `visual/accessibility.md`, and `visual/logo.md`.

### Changed

- `bkr validate` warns when `README.md` does not show the palette image, and when a `bkr:` block is out of date. Kits upgrading from 0.2 need to add the README image (see spec section 7.1).
- The agent digest leaves out generated image blocks.

## 0.2.2 (2026-10)

### Fixed

- `bkr digest` normalizes Windows line endings before trimming excerpts, so a digest generated on Windows matches CI on Linux (the GitHub Action's "generated files are current" check failed for kits edited on Windows).

## 0.2.1 (2026-10)

### Changed

- **Contacts are optional and quiet.** A missing `contacts.security` no longer produces warnings or errors (it made strict CI fail for every kit). `contacts.security` may now be an `https://` URL (recommended: a website contact page or `security.txt`) or an email.
- `bkr init` no longer writes placeholder `example.org` contacts. Templates tell people to use the website contact page unless `--security-contact` is given.
- The brand-at-a-glance page embeds logos up to 200 KB and links larger ones, so pages stay small (one migrated kit went from 5.4 MB). Export format bumped, so run `bkr export --all` after upgrading.
- The `nonprofit-sample` example now uses a contact page URL and no email addresses.

## 0.2.0 (2026-10)

### Added

- **Sharing controls:** `publication.visibility` (`private` by default, `partner`, `public`) and `bkr publish [--dry-run]` to build a bundle of only the allowed files.
- **Impersonation guardrails:** warnings when shared paths include internal naming, email or signature templates, login or donation designs, design source files, fonts, staff emails, phone numbers, or fundraising wording.
- **`security` profile** with `security/brand-protection.md` (DMARC, look-alike domains, MFA, what to do if impersonated) and `contacts.security`.
- **Contrast checks:** `validation.contrastPairs`, checked in the base palette and every theme.
- **Token types:** `dimension`, `duration`, `fontFamily`, `fontWeight`, `number` are validated and exported. New layers: `spacing`, `motion`.
- **Themes:** `tokens/themes/<name>.bkr.json`; dark theme follows the system setting.
- **Exports:** Tailwind v4 `theme.css`, `brand-at-a-glance.html` (self-contained), `agent/ui-brief.md`.
- **Parent checks:** `hierarchy.parent.path` or `bkr validate --parent`.
- **Rule packs** from any npm package or a local path; packs receive parsed tokens.
- **`bkr upgrade`** for 0.1 kits (keeps manifest comments).
- **Safety checks:** unsafe SVG content is rejected.
- `TODO(bkr)` markers in templates; validation fails on unfinished sections for active kits.
- Hosted JSON Schemas (GitHub Pages), reusable GitHub Action (`action.yml`), npm release workflow.
- Examples: polished `starter-org`, fixed `starter-product-child`, new `nonprofit-sample` and `minimal`.
- Docs for nonprofit staff: start guide, intake worksheet, Canva guide, brand protection guide, exports guide.
- Test suite (`npm test`) using Node's built-in test runner.

### Changed (breaking for apps)

- CSS variable names are kebab-case (`--acmedocs-palette-product-accent`).
- Dark theme CSS ships inside `variables.css`; `dark-theme.css` is no longer written.
- DTCG color, dimension, and duration values use the 2025.10 object shapes.
- Schema URLs moved to `https://good-heart-tech.github.io/Brand-Kit-Standard/schemas/v1/`.
- `.bkr-export-hash` uses SHA-256 over the manifest, tokens, and logos; it is only written by `bkr export --all`.
- `bkr import legacy-ght-colors` uses the kit's own `brand.id` and output now validates.

### Deprecated

- `profiles.partnerPublic` (use `publication.visibility: partner`)
- `publication.allowExternalMirror` (use `publication.visibility: public`)

### Fixed

- `bkr validate` now really detects stale exports (0.1 only checked that the hash file existed).
- `minContrastRatio` is now enforced.
- Example narrative referenced tokens that did not exist.
- Example `swatches.html` pages were empty.

## 0.1.0

- Initial specification, CLI (`init`, `validate`, `export`, `digest`, `import`), schemas, and two examples.
