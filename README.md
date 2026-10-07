# Open Brand Kit Standard (OBKS)

**OBKS** is a free, open standard for brand kits that people, websites, and AI
assistants can all read, so nobody has to guess your colors, invent a second
logo, or write in the wrong voice. A small optional command line tool checks
kits and creates web files for you, but you never need it to start.

It works for any organization: companies and startups, government agencies,
nonprofits, schools, and one-person businesses. A kit can be a whole
organization, or a product, department, or sub-brand that inherits from one.

Steward: [Good Heart Tech](https://github.com/Good-Heart-Tech).
Spec: [`spec/OBKS-SPEC.md`](spec/OBKS-SPEC.md) (version 1.0, contract `obks/v1`).

## Get started in five minutes

**With an AI assistant (easiest).** Open Claude, ChatGPT, or Cursor and paste this:

> Read https://raw.githubusercontent.com/Good-Heart-Tech/Open-Brand-Kit-Standard/main/INSTRUCTIONS-FOR-AI.md and help me build my brand kit.

It asks a few questions, one at a time, and creates the files. Nothing to install.
Say "skip" to anything you do not know yet.

**By downloading.** Grab a starter kit zip from the
[latest release](https://github.com/Good-Heart-Tech/Open-Brand-Kit-Standard/releases/latest).
No GitHub account needed. Unzip it and open `README.txt`.

**From the command line (optional).** `npx @goodheart/obks-cli init ./my-brand`

## You can use just part of it

You do not have to fill in everything. A kit only needs what you want it to hold.

- **Start small.** Three colors and a logo is a real, valid kit (`maturity: basic`).
  Unfinished sections are a friendly note, never an error.
- **Say how complete it is.** `maturity` is `basic` (a start), `standard` (the
  everyday files are filled in), or `advanced` (also product kits, sharing, and word rules).
- **Skip what another tool already covers.** If your voice lives in a website style
  guide or your logo lives in Canva, point to it instead of copying it:

  ```yaml
  sections:
    voice:
      see: "https://example.org/our-style-guide"
  ```

## Goals

1. **One source of truth.** Colors, fonts, logos, voice, approved wording, and
   key facts live in one Git folder instead of scattered PDFs and drives.
2. **Readable by people.** Anyone can see the brand on GitHub: palettes, the
   brand in use, and do and don't examples, without installing anything.
3. **Readable by machines and AI.** Websites and apps import generated CSS and
   design tokens; AI tools get a digest with facts to state, claims to never
   make, and word rules to follow.
4. **Safe by default.** Text colors are checked for readability, and kits stay
   private unless you choose to share parts, with warnings before sharing
   anything that helps impersonators.
5. **Free and open.** Any organization can use it, change it, and build on it.

## How it helps

| Without a standard | With OBKS |
|--------------------|-----------|
| Each site and slide deck copies hex codes by hand, and they drift | Apps import one generated CSS file; CI flags anything stale |
| AI writes on-brand-looking text with invented facts | AI follows approved facts, a never-claim list, and word rules |
| Nobody checks if text is readable | Every text and background pair is checked in light and dark |
| Brand rules live in one designer's head | Rules, examples, and screenshots live in the kit, with history |

## For the people who own the brand

A brand kit is one folder with your logo, colors, fonts, how you sound, and
your approved wording. OBKS keeps it organized so that:

- your website, apps, email signatures, slides, and AI tools all use the **same** colors and words
- anyone browsing the kit on GitHub **sees** the palette, the brand in use, and do and don't examples
- colors are **checked for readability** automatically
- the kit stays **private** unless you choose to share parts of it, and it warns
  you before you share anything that would help scammers impersonate you

Start here: **[Start your brand kit](docs/start-your-brand-kit.md)**. Fill in
the [intake worksheet](docs/intake-worksheet.md), or see
[how to load a kit into Canva](docs/canva.md).

**Prefer a download?** Every release has a starter kit zip you can use without
a GitHub account: [latest release](https://github.com/Good-Heart-Tech/Open-Brand-Kit-Standard/releases/latest),
and a [plain-language guide](docs/download-a-brand-kit.md) to downloading kits and understanding the file names.

## See it

Every example below is fictional. Each one shows its palette, the brand in use
(light and dark), and its do and don't pairs right on GitHub.

| Company | Government | Solo business |
|---|---|---|
| ![Ridgeline Coffee Roasters](examples/business-sample/tokens/exports/png/ui.png) | ![Brightwater County](examples/government-sample/tokens/exports/png/ui.png) | ![Juniper Lane Studio](examples/solo-sample/tokens/exports/png/ui.png) |
| ![Ridgeline palette](examples/business-sample/tokens/exports/svg/palette.svg) | ![Brightwater palette](examples/government-sample/tokens/exports/svg/palette.svg) | ![Juniper Lane palette](examples/solo-sample/tokens/exports/svg/palette.svg) |

| Example | Type | What it shows |
|---------|------|---------------|
| [`examples/business-sample`](examples/business-sample/) | Company (retail and wholesale) | Public press kit, internal pricing kept private, dark theme |
| [`examples/government-sample`](examples/government-sample/) | Government agency | Accessibility as a legal requirement, plain language, protected seal kept out of the partner bundle |
| [`examples/solo-sample`](examples/solo-sample/) | One-person business | A lighter kit with optional layers turned off, shared with printers and clients |
| [`examples/nonprofit-sample`](examples/nonprofit-sample/) | Nonprofit | Plain-language voice, donation wording kept internal, public press kit |
| [`examples/starter-org`](examples/starter-org/) | Company (software) | Every feature: dark theme, typography, spacing, full logo set, partner sharing |
| [`examples/starter-product-child`](examples/starter-product-child/) | Product or sub-brand | A child kit that inherits its parent's colors, checked automatically |
| [`examples/minimal`](examples/minimal/) | Any | The smallest useful kit: three colors and a logo |

## For engineers

### Quick start

From a clone of this repo (Node 20+):

```bash
npm install
npm test
npm run obks -- init ../my-brand --brand-id my-brand --display-name "My Brand"   # add --full for every optional file
```

Once the packages are on npm:

```bash
npx @goodheart/obks-cli init ./my-brand --brand-id my-brand --display-name "My Brand"
```

### Commands

| Command | What it does |
|---------|--------------|
| `obks init <dir> [--full]` | Make a small starter kit (colors, logo, one-page `BRAND.md`). `--full` adds every optional file; product kits use `--full` |
| `obks validate [dir] [--strict] [--parent <dir>]` | Checks only what your kit turns on: schema, token formats, contrast, stale exports, sharing guardrails, parent tokens. Suggestions never fail unless `--strict` |
| `obks export [dir] --all` | DTCG, CSS, Tailwind v3/v4, brand-at-a-glance page, agent UI brief |
| `obks digest [dir]` | Regenerate `AGENTS.md` and `digest/AGENT_CONTEXT.md` |
| `obks publish [dir] [--dry-run] [--zip]` | Bundle only the files `publication` allows (refuses for private kits). `--zip` also builds `<id>-brand-kit-v<version>-<date>.zip`, a `-latest` copy, and `SHA256SUMS.txt` |
| `obks check-copy <file...> [--kit dir]` | Flag words a draft should avoid, using the kit's `voice/terms.yaml` |
| `obks preview [dir]` | Screenshot the brand in use and the type specimen to PNG (needs Chrome or Edge) |
| `obks upgrade [dir]` | Bring an older kit up to the current spec |
| `obks import legacy-ght-colors <dir> <colors.json>` | Convert a legacy GHT colors file |

After editing a kit: `obks export --all && obks digest && obks validate`.

### Kit layout

| Path | Role |
|------|------|
| `brandkit.yaml` | Manifest: role, profiles, parent, sharing, contrast pairs, contacts |
| `AGENTS.md`, `digest/` | Agent loading contract and summary (generated) |
| `identity/` | Who you are: about, naming, mission, offerings, audiences, approved facts |
| `voice/` | How you sound: tone, vocabulary, word rules (`terms.yaml`), sensitive topics, style |
| `copy/`, `visual/` | Approved wording, claims and disclaimers, logo and color rules |
| `security/brand-protection.md` | Impersonation defenses checklist |
| `tokens/*.obks.json`, `tokens/themes/` | Normative values |
| `tokens/exports/` | Generated; do not edit |
| `assets/logo/` | Logos (SVG checked for unsafe content) |

### Using the exports in apps

See [docs/using-exports.md](docs/using-exports.md) for CSS, Tailwind v3 and v4,
and DTCG (Style Dictionary and similar tools).

### GitHub Action

```yaml
# .github/workflows/brand-kit.yml in a kit repository
name: brand-kit
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: Good-Heart-Tech/Open-Brand-Kit-Standard@v1
        with:
          path: .
```

`@v1` always points at the latest 1.x release. Suggestions do not fail the build
unless you set `strict: "true"`. Inputs: `path`, `strict`, `parent-path`,
`check-exports`, `bundle`, `bundle-version`. See [`action.yml`](action.yml).

### Packages

| Package | Purpose |
|---------|---------|
| [`@goodheart/obks-cli`](packages/obks-cli/) | The `obks` command |
| [`@goodheart/obks-schema`](packages/obks-schema/) | JSON Schemas for the manifest and token files |
| [`@goodheart/obks-rules-ght`](packages/obks-rules-ght/) | Optional Good Heart Tech / Honey House rule pack |

### Repository scripts

| Script | What it does |
|--------|--------------|
| `npm test` | Unit and integration tests (Node's built-in runner) |
| `npm run examples` | Regenerate and strictly validate every example |
| `npm run validate` | Strictly validate every example without writing |
| `npm run obks -- <args>` | Run the CLI from this checkout |

## Sharing and safety

Kits are **private by default**. `publication.visibility` can be `partner` or
`public`, and only the paths listed in `publication.includedPaths` are shared.
Colors and a basic logo are low risk because they are already on your website.
`obks validate` warns before you share things that make phishing easier, like
email templates, donation page designs, or staff contact details. The real
defense is email authentication (DMARC) and watching for look-alike domains;
see [Protect your brand](docs/protect-your-brand.md).

## Adopters

See [ADOPTERS.md](ADOPTERS.md). Using OBKS? Add your kit with a pull request.

## Interop

- **W3C Design Tokens (2025.10)**: primary machine export (`tokens/exports/dtcg/`)
- **CSS custom properties** and **Tailwind v3 / v4**
- **AI agents**: `AGENTS.md`, size-capped digest, and a UI brief

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and [CHANGELOG.md](CHANGELOG.md).

## License

MIT for this specification and tooling. Brand assets in individual kits are not
MIT unless their `copy/legal.md` says so; trademarks stay with their owners.
