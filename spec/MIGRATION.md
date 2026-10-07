# Migration guide

## Moving to 1.0

Run `obks upgrade .` in your kit. It changes:

| Before | After |
|--------|-------|
| `specVersion: 0.2.0` | `specVersion: 1.0.0` |
| `brand.status: draft` | `brand.maturity: basic` |
| `brand.status: active` | `brand.maturity: standard` |
| `brand.status: deprecated` | `brand.maturity: standard` and `brand.retired: true` |

Nothing else is required. Kits written for 0.1 and 0.2 keep working without
upgrading: `brand.status` is still read (`active` counts as `standard`), and a
note suggests running `obks upgrade`.

What is different in 1.0:

- Unfinished `TODO(obks)` sections are never errors. At `standard` or `advanced` they are a suggestion; at `basic` a note.
- `profiles`, `consumption`, and `brand.status` are optional. Only the sections a kit turns on have required files.
- A section covered by another tool can say so with `sections.<name>.see`.
- The GitHub Action no longer fails on suggestions by default. Set `strict: "true"` to restore that.
- Pin the Action with `@v1` to receive every 1.x fix automatically.
- `obks init` makes a small starter kit. Use `--full` for the old full template.

## Renamed: BKR is now the Open Brand Kit Standard (OBKS)

The project was renamed in version 0.6. Everything old keeps working, and one
command converts a kit:

```bash
obks upgrade .
obks preview .   # refresh screenshots, if the kit has them
obks validate --strict
```

| Before | After |
|--------|-------|
| `bkr` command | `obks` (`bkr` still works as an alias) |
| `ght.brandkit/v1` contract id | `obks/v1` |
| `tokens/*.bkr.json` | `tokens/*.obks.json` |
| `TODO(bkr)`, `<!-- bkr:palette -->` | `TODO(obks)`, `<!-- obks:palette -->` |
| `@goodheart/bkr-cli`, `bkr-schema`, `bkr-rules-ght` | `@goodheart/obks-cli`, `obks-schema`, `obks-rules-ght` |
| `Good-Heart-Tech/Brand-Kit-Standard@v...` action | `Good-Heart-Tech/Open-Brand-Kit-Standard@v1` |

`obks upgrade` renames the token files and updates the kit's own markdown, YAML,
and JSON (markers, commands, links, the action reference). Generated files are
rebuilt. CSS variable names do not change.

## Other upgrade paths

Two paths:

- **A. Upgrade an OBKS 0.1 kit to 0.2** (kits created with `obks init` before October 2026)
- **B. Move a legacy (pre-OBKS) kit into OBKS**, such as a Good Heart Tech style folder with `BRAND.md` and `tokens/colors.json`

Commands below use `obks`. Until the CLI is on npm, replace `obks` with
`node <path-to>/Open-Brand-Kit-Standard/packages/obks-cli/bin/obks.js`.

## A. Upgrade 0.1 to 0.2

### 1. Run the upgrade

```bash
cd my-brand-kit
obks upgrade .
```

`obks upgrade` keeps comments in `brandkit.yaml` and:

- sets `specVersion: 0.2.0`
- converts `profiles.partnerPublic` / `publication.allowExternalMirror` into `publication.visibility`
- turns on the `security` profile and adds `security/brand-protection.md`
- points token `$schema` URLs at the hosted schemas
- adds `dist/` to `.gitignore`
- regenerates `tokens/exports/`, the digest, and `AGENTS.md`

It prints a "still to do by hand" list. Work through it:

### 2. Finish by hand

- [ ] Optional: set `contacts.security` to your website contact page or security.txt URL
- [ ] Add `validation.contrastPairs` for every text and background combination you use
- [ ] Decide `publication.visibility` (default `private`) and, if sharing, list `includedPaths`
- [ ] Delete `examples/swatches.html` (replaced by `tokens/exports/html/brand-at-a-glance.html`)
- [ ] Delete `profiles/partner-public/` if it exists
- [ ] Optional: add `tokens/typography.obks.json` and `tokens/themes/dark.obks.json`
- [ ] Product kits: set `hierarchy.parent.path` or run `obks validate --parent <path>`

### 3. Update apps that use the CSS variables (breaking)

CSS variable names are now kebab-case. `obks upgrade` prints the exact renames,
for example:

```
--acmedocs-palette-productAccent  ->  --acmedocs-palette-product-accent
```

Single-word names (`primary`, `ink`) do not change. Also:

- `css/dark-theme.css` is gone; dark values are now inside `variables.css`.
- DTCG color values are objects (`{ colorSpace, components, hex }`) instead of
  hex strings. Tools that read DTCG 2025.10 expect this.
- Tailwind v4 projects can import `tokens/exports/tailwind/theme.css`.

### 4. Validate and commit

```bash
obks export --all
obks digest
obks validate --strict
```

## B. Move a legacy kit into OBKS

### 1. Scaffold next to the old kit

```bash
obks init ../My-Kit --role organization --brand-id my-brand \
  --display-name "My Brand"
```

### 2. Import legacy colors

If the kit has `tokens/colors.json` in the Good Heart Tech shape
(`{ "colors": { "name": { "hex": "#...", "role": "..." } }, "doNotUse": [...] }`):

```bash
obks import legacy-ght-colors ../My-Kit ../Old-Kit/tokens/colors.json
```

Then rename tokens so the palette has at least `primary`, `onPrimary`, `ink`,
`body`, and `surface`, or update `validation.contrastPairs` and `visual/palette.md`
to match your names.

### 3. Move the narrative

| Legacy file | OBKS destination |
|-------------|-----------------|
| `BRAND.md` | `visual/palette.md`, `visual/logo.md`, `visual/typography.md` |
| `COPY.md` | `copy/messaging.md` (internal) and, if sharing, a separate `copy/press-kit.md` |
| `ACCESSIBILITY.md` | `visual/accessibility.md` |
| `LEGAL.md` | `copy/legal.md` |
| `VOICE.md` | `voice/tone.md`, `voice/vocabulary.md` |
| `logo/` | `assets/logo/` |
| Email signature templates | Keep out of the kit, or keep private (never in `includedPaths`) |

Replace every `> TODO(obks):` line as you go.

### 4. Export, validate, and add CI

```bash
cd ../My-Kit
obks export --all
obks digest
obks validate --strict
```

Add `.github/workflows/brand-kit.yml`:

```yaml
name: brand-kit
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: Good-Heart-Tech/Open-Brand-Kit-Standard@v0.6.2
```

## Product (child) kits

Use `--role product --parent-repo <url> --parent-brand-id <id>`. Mark every
color that comes from the parent with `inheritsFrom` and keep its value equal
to the parent. Add product-only colors under new names.

In CI, check out the parent too so inherited values are verified:

```yaml
      - uses: actions/checkout@v4
      - uses: actions/checkout@v4
        with:
          repository: Good-Heart-Tech/Good-Heart-Tech-Branding-Marketing
          path: .parent-kit
          token: ${{ secrets.PARENT_KIT_TOKEN }}   # only needed for private parents
      - uses: Good-Heart-Tech/Open-Brand-Kit-Standard@v0.6.2
        with:
          parent-path: .parent-kit
```
