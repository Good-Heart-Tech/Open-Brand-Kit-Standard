# Instructions for AI assistants: build a brand kit

You are helping a person or small team create an **Open Brand Kit Standard (OBKS)** brand kit. A kit is a folder of plain files that describes an organization's brand so that people, websites, and AI tools all use the same colors, logo, voice, and facts.

Read this whole file, then follow it. You do not need any special software. You only need to create text files.

## Ground rules

1. **Never invent facts.** Do not make up numbers, dates, customers, awards, certifications, or quotes. If you do not know something, write `Not decided` and move on.
2. **Ask one question at a time.** Use plain words. Never ask for everything at once.
3. **Skipping is always fine.** If the person says "skip", "not sure", or "we do not have that", accept it and continue. A small kit is a good kit.
4. **If another system already covers something** (for example a style guide on their website, a Canva brand kit, or a SharePoint folder), do not create files for it. Record where it lives with `sections` (see "Covered elsewhere").
5. **Keep it private by default.** Never put staff names, personal emails, or phone numbers in the kit.
6. **Do not use em dashes.** Use commas, periods, or colons.
7. **Show your work.** After creating files, list what you made and what is still "Not decided".

## The interview

Ask these in order, one at a time. Stop whenever the person wants to stop.

1. What is the organization called, and what do you do in one or two sentences?
2. What are your brand colors? (Hex codes like `#2F5BEA` are best. If they only have a logo or website, ask for the main colors you can see, and say you are estimating.)
3. Do you have a logo file? (Ask them to place it in `assets/logo/`. SVG is best, PNG is fine.)
4. How do you want to sound? (Ask for three to five words or rules, such as "friendly, plain, no jargon".)
5. What facts are you happy to have repeated, and where do they come from?
6. What should never be said or promised?
7. Is any of this already written down somewhere else? (Record it as covered elsewhere.)

## Files to create

Create these files in a new folder. Replace `{{Name}}` with the organization name and `{{id}}` with a lowercase, hyphenated id such as `acme-labs`.

### `brandkit.yaml`

```yaml
schema: obks/v1
specVersion: 1.0.0
brand:
  id: {{id}}
  displayName: {{Name}}
  maturity: basic
role: organization
profiles:
  core: true
  tokens: true
publication:
  visibility: private
  includedPaths: []
validation:
  minContrastRatio: 4.5
  contrastPairs:
    - foreground: palette.text
      background: palette.background
      use: all text
    - foreground: palette.background
      background: palette.primary
      use: button labels
```

`maturity` is `basic` (a start, nothing is required), `standard` (the everyday files are filled in), or `advanced` (also product kits, sharing, and word rules). Use `basic` unless the person says otherwise.

If the person has no colors yet, remove the `tokens` line under `profiles` and the `validation` block.

### `tokens/colors.obks.json`

```json
{
  "meta": { "brandId": "{{id}}", "layer": "color" },
  "tokens": {
    "palette": {
      "primary": { "value": "#2F5BEA", "type": "color", "description": "Main brand color for buttons and the logo." },
      "text": { "value": "#1B1F2A", "type": "color", "description": "All text." },
      "background": { "value": "#FFFFFF", "type": "color", "description": "Page background and button labels." }
    }
  }
}
```

Use the person's real hex values. Colors must be six-digit hex like `#2F5BEA`. Add more colors under `palette` if they have them, each with a short `description` saying what it is for.

**Check readability.** Text on its background needs a contrast ratio of at least 4.5 to 1. If you can calculate it, check `text` on `background` and `background` on `primary`. If a pair is too low, tell the person and suggest a darker or lighter value. Do not silently change their colors.

### `BRAND.md`

```markdown
# {{Name}} at a glance

Last reviewed: YYYY-MM-DD

## Who we are
(One or two sentences from the interview.)

## How we sound
(Three to five short rules from the interview.)

## Facts we are happy to have quoted
| Fact | Source |
|------|--------|
| (fact) | (where it comes from) |

## Never say
- (claim to avoid, or "Not decided")

## Logo and colors
- Logo files are in `assets/logo/`. Do not stretch, recolor, or redraw the logo.
- Colors are in `tokens/colors.obks.json`. Do not invent other colors.
```

Use today's date for `Last reviewed`. Use `Not decided` for anything unknown.

### `README.md`

Write a short README with the organization name, one sentence on what the folder is, and a link to `BRAND.md`.

### `assets/logo/`

Do not create or redraw the logo. Tell the person to put their logo file here.

## Covered elsewhere

If a part of the brand lives in another tool, add a `sections` block to `brandkit.yaml` instead of creating files for it:

```yaml
sections:
  voice:
    see: "https://example.org/our-style-guide"
  visual:
    see: "Canva brand kit, owned by Maria"
```

Valid section names are `identity`, `voice`, `visual`, `copy`, `tokens`, and `security`. A section with `see` is not checked for files. Anyone reading the kit, including AI tools, is told to follow the pointer and not guess.

## Growing the kit later

Only when the person asks, add more:

| To add | Create |
|--------|--------|
| Who we are in more depth | `identity/about.md`, `identity/mission.md`, `identity/offerings.md`, `identity/audiences.md` |
| Approved facts with sources | `identity/facts.md` (include a `Last reviewed: YYYY-MM-DD` line and a "Never claim" list) |
| Voice and word rules | `voice/tone.md`, `voice/terms.yaml`, `voice/style.md` |
| Approved wording and legal | `copy/messaging.md`, `copy/legal.md`, `copy/claims.md` |
| Logo and color rules | `visual/palette.md`, `visual/logo.md`, `visual/accessibility.md` |
| Protection from impersonation | `security/brand-protection.md` |

For each file you add, turn on its section in `brandkit.yaml` under `profiles` (for example `voice: true`). The full file list and rules are in [`spec/OBKS-SPEC.md`](spec/OBKS-SPEC.md). When the person says the kit is filled in, change `maturity` to `standard`.

## Optional: checking and exporting

None of this is required. If the person (or you, with a terminal) has Node.js 20 or newer, the free command line tool can check the kit and create CSS, Tailwind, and a brand page:

```bash
npx @goodheart/obks-cli validate
npx @goodheart/obks-cli export --all
npx @goodheart/obks-cli digest
```

Warnings are suggestions, not failures. A basic kit is allowed to be unfinished.

## Sharing

Kits are private by default. Only if the person asks to share logos or colors with vendors, designers, or the public, set `publication.visibility` to `partner` (specific outside people) or `public` (anyone) and list exactly which files may be shared in `publication.includedPaths`. Never include email signature templates, login or donation page designs, staff contact lists, or internal pricing. Then `obks publish --zip` builds a download-ready zip.

## When you are done

Tell the person, in plain language:

1. What you created.
2. What is still "Not decided".
3. The one next step that would help most (usually: add the logo file, or confirm the facts).
