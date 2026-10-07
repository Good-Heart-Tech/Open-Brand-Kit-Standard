# Changelog

## 1.0.0 (2026-10)

The first stable release. Kits that are valid under 1.0 stay valid under every 1.x release.

### Easier to start, easier to keep

- **Use just part of the standard.** A kit only needs what it turns on. `profiles`, `consumption`, and `brand.status` are optional, and a kit with three colors and a logo is valid.
- **`brand.status` is now `brand.maturity`**: `basic` (default), `standard`, or `advanced`. It never makes a file required. Unfinished `TODO(obks)` sections are a note at `basic` and a suggestion at `standard` or `advanced`. They are never errors. `brand.retired: true` replaces the old `deprecated` status. The old `status` still works (`active` counts as `standard`); `obks upgrade` converts it.
- **Covered elsewhere.** `sections.<name>.see` points to where a section lives (another tool or service). Its files are not required, and the agent digest tells AI tools to follow the pointer and not guess.
- **Suggestions do not fail builds.** The GitHub Action's `strict` input now defaults to `false`. Messages are friendlier: "fix" for real problems, "suggestion" for the rest, "note" for tips.
- **Small starter.** `obks init` now makes a basic kit (colors, logo, one-page `BRAND.md`) with no rule pack. `--full` gives every optional file; product kits use `--full`. New example: `examples/starter-basic`.
- **Built for AI assistants.** New [`INSTRUCTIONS-FOR-AI.md`](INSTRUCTIONS-FOR-AI.md) and `llms.txt`: paste one line into Claude, ChatGPT, or Cursor and it interviews you and builds the kit with no software installed. The agent digest includes `BRAND.md`.
- Defaults: `consumption` paths default to `tokens/exports/css/variables.css`, `digest/AGENT_CONTEXT.md`, and `tokens/exports/tailwind/theme.cjs`.

### Downloads without GitHub

- Pushing a version bump to `main` creates the GitHub release, attaches `obks-starter-kits-v<version>.zip` and `SHA256SUMS.txt`, and moves the floating major tag (for example `v1`). Use `Good-Heart-Tech/Open-Brand-Kit-Standard@v1` to receive every 1.x fix.
- **`obks publish --zip`** builds `<brand-id>-brand-kit-v<version>-<YYYY-MM-DD>.zip`, a `-latest` copy, and `SHA256SUMS.txt`. Options: `--kit-version`, `--date`. Optional `brand.version` supplies the version. Private kits are still refused.
- GitHub Action inputs `bundle` and `bundle-version` save the zip as a workflow artifact.
- npm publishing runs after a new release when the `NPM_TOKEN` secret exists, and skips packages already published.
- `docs/download-a-brand-kit.md`, a plain-language download guide.

### Spec

- Spec 1.0.0 with a stability and deprecation promise (section 1). `specVersion` 0.1.x and 0.2.x kits are still read.
- `obks upgrade` moves a kit to 1.0 (see `spec/MIGRATION.md`). It no longer adds the security section to kits that chose not to have it.

## Before 1.0

| Version | Highlights |
|---------|------------|
| 0.6 | Renamed from "Brand Kit Repository (BKR)" to OBKS: `obks` command, `obks/v1`, `*.obks.json`, `TODO(obks)`. Old names still work and `obks upgrade` converts them. |
| 0.5 | Organization context and approved facts, word rules (`voice/terms.yaml`), `obks check-copy`, a digest that leads with facts and word rules. |
| 0.4 | Brand-at-a-glance page, previews and screenshots, do and don't sheets, logo display. |
| 0.3 | Typography tokens and a larger set of examples. |
| 0.2 | Sharing controls (`private`, `partner`, `public`) and `obks publish`, impersonation guardrails, contrast checks, themes, parent kit checks, rule packs, the GitHub Action. |
| 0.1 | Initial specification, CLI, schemas, and two examples. |
