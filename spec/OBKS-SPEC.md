# Open Brand Kit Standard (OBKS) specification 0.2

**Contract id:** `obks/v1`
**Spec version:** 0.2.0
**Status:** draft (Good Heart Tech steward)
**Schemas:** [`brandkit.schema.json`](https://cdn.jsdelivr.net/gh/Good-Heart-Tech/Open-Brand-Kit-Standard@main/packages/obks-schema/schemas/brandkit.schema.json),
[`obks-token.schema.json`](https://cdn.jsdelivr.net/gh/Good-Heart-Tech/Open-Brand-Kit-Standard@main/packages/obks-schema/schemas/obks-token.schema.json)

The key words MUST, SHOULD, and MAY are used as in RFC 2119.

This standard was first called the "Brand Kit Repository (BKR)" with contract id
`ght.brandkit/v1`, `*.bkr.json` token files, `TODO(bkr)` and `<!-- bkr:... -->`
markers, and a `bkr` command. Tools MUST keep accepting those names; kits SHOULD
move to the OBKS names with `obks upgrade`.

## 1. Scope

A **Open Brand Kit Standard (OBKS)** is a Git repository (or a folder in one) that
holds everything needed to represent an organization or product brand in
software, documents, and AI-assisted work, without scattering the truth across
unrelated files.

OBKS is **not** a component library. It may reference UI frameworks, but its job
is **brand truth**: who we are, how we sound, what we may say, how marks and
colors behave, what may be shared, and machine-readable tokens.

## 2. Normative vs narrative

| Kind | Location | Authority |
|------|----------|-----------|
| Manifest | `brandkit.yaml` | Profiles, hierarchy, sharing, validation |
| Tokens | `tokens/**/*.obks.json` | Color, type, spacing, motion values |
| Themes | `tokens/themes/<name>.obks.json` | Overrides of base token values |
| Exports | `tokens/exports/**` | Generated only; never edited by hand |
| Narrative | `identity/`, `voice/`, `visual/`, `copy/`, `security/` | Usage, rationale, legal |

When narrative and tokens disagree, **tokens win** for implementable values.
Narrative MUST be updated to match after token changes. `obks validate` warns
when `visual/*.md` mentions a token name (in backticks) that does not exist.

## 3. Manifest (`brandkit.yaml`)

Required top-level keys:

- `schema`: MUST be `obks/v1`
- `specVersion`: the spec version the kit follows (`0.2.0`)
- `brand`: `id` (lowercase, hyphenated), `displayName`, `status` (`draft` | `active` | `deprecated`), optional `version` (used in the file name of `obks publish --zip`)
- `role`: `organization` | `product` | `campaign`
- `profiles`: enabled layers (section 4)
- `consumption`: `cssVariables`, `agentDigest`, optional `tailwindTheme`, optional `cssPrefix`

Optional:

- `organization`: `{ type, industry, location, serviceArea, founded, website }`, all
  optional. `type` is `company` | `government` | `nonprofit` | `education` | `solo` |
  `other`; `industry` is free text in your own words. Shown to agents in the
  digest; rule packs MAY use `type` and `industry` to apply sector rules.
- `hierarchy.parent`: `{ repository, ref, brandId, path? }` (section 5)
- `publication`: `{ visibility, includedPaths }` (section 11)
- `validation`: `{ rulesPack, minContrastRatio, contrastPairs, avoidPairs }` (section 9)
- `preview`: optional color roles for the generated sample page (section 7.2)
- `contacts`: `{ brand, legal, security }`. All optional. `brand` and `legal`
  are emails; `security` is an `https://` URL (preferred: a website contact page
  or `security.txt`) or an email. Anything here is copied into generated files,
  so kits SHOULD prefer URLs and leave out personal addresses.

Kits SHOULD start with this line so editors can autocomplete the manifest:

```yaml
# yaml-language-server: $schema=https://cdn.jsdelivr.net/gh/Good-Heart-Tech/Open-Brand-Kit-Standard@main/packages/obks-schema/schemas/brandkit.schema.json
```

## 4. Profiles (layers)

Profiles declare which files are **required** for validation.

| Profile | Required files | Purpose |
|---------|----------------|---------|
| `core` | `brandkit.yaml`, `README.md`, `AGENTS.md` | Always on |
| `identity` | `identity/about.md`, `identity/naming.md` | Positioning, naming |
| `voice` | `voice/tone.md`, `voice/vocabulary.md` | Tone, vocabulary |
| `visual` | `visual/palette.md`, `visual/logo.md`, `visual/accessibility.md`, at least one file in `assets/logo/` | Logo and color rules |
| `copy` | `copy/messaging.md`, `copy/legal.md` | Approved wording, legal |
| `tokens` | `tokens/colors.obks.json` | Machine-readable values |
| `security` | `security/brand-protection.md` | Impersonation and phishing defenses |

New kits enable all of these. `security` is new in 0.2; validation warns when it
is off. The 0.1 `partnerPublic` profile is deprecated (see section 11).

### Optional files (organization context)

These add context that people and AI tools need to write accurately. Each is
optional and is used whenever it exists; templates include all of them.

| File | Holds | Why it matters |
|------|-------|----------------|
| `identity/mission.md` | Mission, vision, values | Why the organization exists, in its own words |
| `identity/offerings.md` | Products, services, programs, and what you do **not** offer | Stops people and AI from promising things you do not do |
| `identity/audiences.md` | Each audience, what it cares about, how to sound to it | Better first drafts for each reader |
| `identity/facts.md` | Approved facts with sources, a **never claim** list, and a `Last reviewed: YYYY-MM-DD` line | The biggest defense against invented claims; validation warns when the review is over a year old |
| `voice/terms.yaml` | Words to use and avoid, with topic and reason (section 6.1) | Exact word rules for agents and `obks check-copy` |
| `voice/topics.md` | Sensitive topics: position, what to say and not say, approver, or no comment | Pricing, competitors, incidents, layoffs, politics, AI |
| `voice/style.md` | Short style checklist (capitalization, numbers, dates, person) | Consistent mechanics |
| `copy/claims.md` | Required disclaimers, legally restricted words, approvers | Regulated industries (health, finance, insurance, legal, government, fundraising) |

Brand word choices belong in `voice/terms.yaml`; legal and regulatory limits
belong in `copy/claims.md`. They have different owners.

Template sections that still need writing are marked with a line starting
`> TODO(obks):`. Validation warns about them, and fails when `brand.status` is
`active`.

## 5. Hierarchy

- **Organization** kits define the canonical palette and master marks.
- **Product** kits MUST set `hierarchy.parent`. They MAY add new tokens (for
  example `productAccent`). A token that shares a path with a parent token MUST
  declare `inheritsFrom` and MUST have the same type and value as the parent.
- **Campaign** kits are short-lived and MAY omit `assets/logo/` content if they
  only reuse parent marks (turn off the `visual` profile).

`hierarchy.parent.path` MAY point at a local checkout of the parent kit. When it
is set, or when `obks validate --parent <path>` is used, validation checks every
`inheritsFrom` value against the parent and checks that `brandId` matches.
Without a local parent, validation prints a note and skips the check. A
`hierarchy.parent.path` that does not exist (for example in CI, where only the
child is checked out) is also a note; a `--parent` path that does not exist is
an error.

## 6. Token files (`.obks.json`)

Each file is a JSON document with:

- `$schema`: the token schema URL
- `meta`: `{ brandId, layer }` where `layer` is `color` | `typography` | `spacing` | `motion` | `theme`
- `tokens`: map of group, then name, then token object
- `guidance` (optional): `{ doNotUse: string[] }`

Token object fields:

| Field | Required | Notes |
|-------|----------|-------|
| `value` | yes | Format depends on `type` (below) |
| `type` | yes | `color` \| `dimension` \| `fontFamily` \| `fontWeight` \| `duration` \| `number` \| `string` |
| `description` | recommended | What the token is for |
| `usage` | optional | `{ contexts: string[], avoid: string[] }` |
| `aliases` | optional | Alternate values documented but not exported |
| `inheritsFrom` | product kits | Parent token path `group.name` |

Value formats (checked by `obks validate`):

| Type | Format | Example |
|------|--------|---------|
| `color` | Hex `#RGB`, `#RRGGBB`, or `#RRGGBBAA` | `"#2563EB"` |
| `dimension` | Number with `px` or `rem` | `"16px"`, `"1.5rem"` |
| `duration` | Number with `ms` or `s` | `"200ms"` |
| `fontFamily` | Font name or list of names | `["Inter", "sans-serif"]` |
| `fontWeight` | Number 1 to 1000 | `700` |
| `number` | Number | `1.5` |
| `string` | Text (not exported to CSS or DTCG) | `"Title Case"` |

A token path (`group.name`) MUST be unique across all base token files.

### Themes

`tokens/themes/<name>.obks.json` overrides base token values for a theme (for
example `dark`). Every token in a theme file MUST exist in the base tokens with
the same type. A theme named `dark` follows the system dark-mode setting unless
the page sets `data-theme="light"`; any theme can be forced with
`data-theme="<name>"`.

### 6.1 Word rules (`voice/terms.yaml`)

```yaml
terms:
  - use: sign in
    avoid: [log in]
    topic: product and support
    reason: Matches the words in our app
  - avoid: [cheap]
    use: affordable
    topic: pricing
  - use: WOSP
    avoid: [Wosp, wosp]
    caseSensitive: true
  - avoid: [world-class, revolutionary]
    reason: Hype words people do not trust
```

Each entry needs `use`, `avoid`, or both. Matching is whole-word and ignores
case unless `caseSensitive` is true. Schema:
[`obks-terms.schema.json`](https://cdn.jsdelivr.net/gh/Good-Heart-Tech/Open-Brand-Kit-Standard@main/packages/obks-schema/schemas/obks-terms.schema.json).

`obks check-copy <file...> [--kit <dir>] [--strict]` checks any draft (markdown,
HTML, or text) and prints each avoided word with its line, column, replacement,
and reason. It skips code, URLs, and HTML tags. It never blocks: `--strict` only
sets a failing exit code for CI. A `<!-- obks:terms -->` block renders the rules
as a table (templates put it in `voice/vocabulary.md`).

## 7. Exports

`obks export --all` writes these files. They are **deterministic** (the same
input always gives byte-identical output) and MUST NOT be edited by hand.

| Target | Output | Notes |
|--------|--------|-------|
| `dtcg` | `tokens/exports/dtcg/<file>.tokens.json`, `dtcg/themes/<name>.tokens.json` | W3C Design Tokens 2025.10 value shapes (color objects with `colorSpace`, `components`, `hex`; dimension and duration objects) |
| `css` | `tokens/exports/css/variables.css` | `:root` variables plus theme blocks |
| `tailwind` | `tokens/exports/tailwind/theme.cjs` (v3), `theme.css` (v4 `@theme inline`) | v4 values point at the CSS variables, so themes switch automatically |
| `html` | `tokens/exports/html/brand-at-a-glance.html` | Page for non-technical staff; logos up to 200 KB are embedded, larger ones are linked |
| `agent` | `tokens/exports/agent/ui-brief.md` | Compact design brief for AI agents |
| `svg` | `tokens/exports/svg/palette.svg`, `palette-<theme>.svg`, `contrast.svg`, `chips/*.svg`, `pairs/*.svg` | Images that render inside markdown on GitHub (section 7.1) |
| `docs` | `<!-- obks:... -->` blocks in the kit's `.md` files | Tables of chips, hex values, and contrast samples (section 7.1) |

CSS variable names are `--<prefix>-<group>-<name>` in kebab-case. The prefix
defaults to `brand.id` without hyphens and MAY be set with `consumption.cssPrefix`.
Example: `palette.productAccent` in `acme-docs` becomes `--acmedocs-palette-product-accent`.

Tailwind mapping: colors go under `colors.<group>`; `fontFamily`, `fontWeight`
by name; dimension groups `fontSize`, `radius`, `spacing` map to their Tailwind
keys, and other dimension groups go under `spacing` as `<group>-<name>`;
`number` tokens in a `lineHeight` group map to `lineHeight`.

`tokens/exports/.obks-export-hash` stores a SHA-256 of everything exports are
built from (manifest, token files, logo files, export format version). It is
written only by a full export. `obks validate` warns when it does not match.

### 7.1 Human-visible colors

People cannot see a color by reading a hex code, and GitHub shows `.html` files
as source code, so the brand-at-a-glance page is not enough on its own. Every
kit with the `visual` profile MUST show its colors as images in `README.md`:

```markdown
![Colors](tokens/exports/svg/palette.svg)
```

(or a `<!-- obks:palette -->` block). `obks validate` warns when it is missing.

Any `.md` file in the kit MAY contain these blocks. `obks export` fills them with
current values, so the prose can never fall behind the tokens:

| Block | Fills in |
|-------|----------|
| `<!-- obks:palette -->` | The palette image, then a table: color chip, token, hex, theme values (with chips), CSS variable, use |
| `<!-- obks:contrast -->` | A table with an "Aa" sample image of each text and background pair, its ratio, the required ratio, and Pass or Fail |
| `<!-- obks:logos -->` | Every logo shown on the lightest and darkest brand colors side by side (markdown cannot set a background color, so reversed and white logos would otherwise be invisible). Logos over 200 KB are shown directly |
| `<!-- obks:previews -->` | The `obks preview` screenshots (section 7.2), or a note to run it |
| `<!-- obks:terms -->` | The word rules from `voice/terms.yaml` as a table (section 6.1) |

When `validation.avoidPairs` is set, the contrast block also shows a Do and
Don't image (`tokens/exports/svg/do-dont.svg`) and an Avoid table:

```yaml
validation:
  avoidPairs:
    - foreground: palette.accent
      background: palette.surface
      reason: The accent color is too light for text on the page
```

Every avoid pair needs a `reason`. Its tokens must exist; it does not have to
fail contrast (some combinations are off-brand rather than unreadable).

Write only the opening marker; export adds the content and the closing
`<!-- /obks:... -->` marker. Do not edit inside a block. Validation warns when a
block is out of date. Templates put `obks:palette` in `visual/palette.md`,
`obks:contrast` in `visual/accessibility.md`, and `obks:logos` in `visual/logo.md`.
Generated blocks are left out of the agent digest.

Hand-made palette art (for example a painted swatch sheet) is welcome in
`assets/` and may sit alongside the generated palette in the README; the
generated image remains the exact reference.

### 7.2 The brand in use (screenshots)

`obks export` writes two pages from the tokens:

- `tokens/exports/html/preview-ui.html`: a sample page (header, heading, body
  text, link, primary and secondary buttons, card) in light and, when a `dark`
  theme exists, dark side by side
- `tokens/exports/html/preview-type.html`: every font family, weight, and size

`obks preview` screenshots them with a locally installed Chrome, Edge, or
Chromium (or `OBKS_BROWSER`) into `tokens/exports/png/ui.png` and `type.png`.
Fonts load from Google Fonts during the screenshot, so the PNGs show the real
typefaces; GitHub shows PNGs in markdown. Kits SHOULD commit these screenshots
and show them in the README with `<!-- obks:previews -->`.

Which token plays which part is inferred from `validation.contrastPairs` uses
("body text", "headings", "links", "label on a button", "card") and common
names, and can be set explicitly:

```yaml
preview:
  surface: palette.paper
  text: palette.ink
  buttonBg: palette.honey
  buttonText: palette.ink
```

Screenshots are not rebuilt in CI. `tokens/exports/png/.obks-preview-hash`
records which pages they came from, and `obks validate` warns when the brand has
changed since (run `obks preview` again).

## 8. Agent contract

`AGENTS.md` at the kit root (generated by `obks digest`) describes load order:

1. `brandkit.yaml`
2. `digest/AGENT_CONTEXT.md` (generated, size-capped, default 20 KB)
3. For UI work: `tokens/exports/agent/ui-brief.md` and `tokens/exports/css/variables.css`
4. As needed: `identity/`, `voice/`, `visual/logo.md`, `copy/`

The digest puts what most changes an agent's output first, so a size trim never
drops it: organization details, mission, approved facts and never-claim list,
word rules (in full, from `voice/terms.yaml`), claims and disclaimers, then about,
offerings, audiences, tone, sensitive topics, style, messaging, and logo rules.
`AGENTS.md` tells agents to state only listed facts, follow the word rules, and
ask rather than guess.

The digest is a lossy summary for prompt budgets; the full repository remains
authoritative. Both files state the kit's sharing rule (section 11) and the
security contact.

## 9. Validation

`obks validate [dir] [--strict] [--parent <path>]`:

1. Parse the manifest against the JSON Schema; check `specVersion` is supported
2. Check required files for enabled profiles
3. Reject unsafe SVGs under `assets/` (scripts, event handlers, `foreignObject`, XML entities, external or script URLs)
4. Validate each token file against the token schema and the value formats in section 6
5. Check theme overrides, duplicate token paths, and `meta.brandId`
6. Check every `validation.contrastPairs` entry in the base palette and in every theme
7. Warn when narrative mentions tokens that do not exist
8. Warn when exports are stale (hash mismatch), when an `obks:` markdown block is
   out of date, or when `README.md` does not show the palette image
9. Check sharing rules and guardrails (section 11)
10. Check the parent kit when a local parent is available (section 5)
11. Warn about (or, for active kits, fail on) unfinished `TODO(obks)` sections
12. Validate `voice/terms.yaml` (schema, a word both used and avoided, more
    than 75 entries), and warn when the kit's own `copy/*.md` (except
    `legal.md` and `claims.md`) uses an avoided word
13. Warn when `identity/facts.md` has no `Last reviewed` date or it is over a
    year old
14. Run the optional `rulesPack`

Exit code `1` on errors. Warnings fail only with `--strict`. Notes never fail.

### Contrast pairs

```yaml
validation:
  minContrastRatio: 4.5          # default for every pair
  contrastPairs:
    - foreground: palette.body
      background: palette.surface
      use: body text
    - foreground: palette.ink
      background: palette.accent
      use: large headings
      min: 3                     # WCAG large text
```

### Rule packs

`validation.rulesPack` is an npm package name (resolved from the kit first,
then from the CLI) or a local path such as `./rules/index.js`. A rule pack
exports `validate({ kitRoot, manifest, tokens })`, which MAY be async and
returns `{ errors: string[], warnings: string[] }`. `tokens` is
`{ base, themes, files }` with flattened `{ group, name, path, token, rel }`
entries. `@goodheart/obks-rules-ght` is the Good Heart Tech pack.

## 10. Versioning

- The spec version is in this document's header.
- A kit's `specVersion` MUST be in the CLI's supported range (currently `0.1.x` and `0.2.x`).
- `0.1.x` kits still validate, with a warning to run `obks upgrade`.
- Breaking manifest changes will use a new contract id, `obks/v2`.
- The pre-rename contract id `ght.brandkit/v1` is accepted as an alias of `obks/v1`.

## 11. Sharing, security, and publication

### Visibility

```yaml
publication:
  visibility: private   # private | partner | public (default: private)
  includedPaths:        # used only when visibility is partner or public
    - assets/logo/
    - tokens/exports/css/variables.css
    - tokens/exports/html/brand-at-a-glance.html
    - visual/logo.md
```

- `private` (default): nothing in the kit is meant to leave the organization.
  `obks publish` refuses to run.
- `partner`: the listed paths may go to approved partners, sponsors, or vendors.
- `public`: the listed paths may be shared with anyone, for example as a press kit.

`obks publish [--dry-run] [--out <dir>]` copies only the listed paths into
`dist/brand-bundle/` with a `BUNDLE.md` covering usage, trademarks, and where to
report impersonation. It only deletes an output folder that it created.

Visibility controls what the kit **allows to be shared**. It does not change
who can see the Git repository. Client kits SHOULD live in private repositories
regardless of visibility.

Deprecated in 0.2: `profiles.partnerPublic` (now `visibility: partner`) and
`publication.allowExternalMirror` (now `visibility: public`). `obks upgrade`
converts them.

### Impersonation guardrails

Colors and a basic logo are already public on an organization's website, so
sharing them adds little risk. Some files do make phishing easier. When
visibility is `partner` or `public`, `obks validate` warns if `includedPaths`
contains:

- internal naming (`identity/naming.md`)
- email, newsletter, or signature templates, and `.eml` / `.msg` / `.oft` files
- HTML pages other than the generated brand-at-a-glance page
- login, donation, payment, checkout, or invoice designs
- design source files (`.ai`, `.psd`, `.fig`, `.sketch`, `.indd`, `.xd`)
- font files (license check)
- internal kit files (`security/`, `digest/`, `AGENTS.md`, `brandkit.yaml`)
- `identity/facts.md` (can hold internal numbers; share a press version), `copy/claims.md`, and `voice/topics.md`
- markdown with fundraising or payment wording
- email addresses (other than `contacts.security`) or phone numbers

It is an error to list a path that does not exist or is outside the kit.
`contacts.security` is optional. When set, it appears on the brand page, in the
digest, and in `obks publish` bundles; validation never requires it.

### Other rules

- Never commit licensed font binaries without documenting redistribution rights in `copy/legal.md`.
- `assets/logo/` holds marks that may appear in generated pages (the brand page,
  `obks:logos` blocks, previews). Restricted marks, such as an official seal,
  a certification mark, or an unreleased logo, go in their own folder (for
  example `assets/seal/`) with their rules in a file that is not shared.
- The `security` profile's `security/brand-protection.md` tracks the defenses
  that actually stop impersonation: DMARC at `p=reject`, look-alike domain
  monitoring, MFA, and a clear "we never ask for gift cards" message.
- Trademarks remain restricted regardless of the MIT license on the tooling.
