# Download a brand kit (no GitHub account needed)

This guide is for designers, marketing and communications staff, vendors, and
anyone who needs an organization's logos and colors, or who wants to start a
brand kit of their own. You do not need a GitHub account, and you do not need
to know how GitHub works.

## Option 1: Start your own kit

1. Open the [Releases page](https://github.com/Good-Heart-Tech/Open-Brand-Kit-Standard/releases/latest).
2. Under **Assets**, click the file that starts with **obks-starter-kits-** (the numbers after it are the version). The download starts right away.
3. Unzip it. On Windows, right-click and choose **Extract All**. On a Mac, double-click it.
4. Open **README.txt** first. It tells you which folder to start with.

If you are not sure which kit to use, start with `minimal-kit`: three colors and a logo.

## Option 2: Get an organization's brand files

Organizations that share their brand publish a zip like this:

`good-heart-tech-brand-kit-v1.2.0-2026-10-03.zip`

| Part of the name | What it means |
|---|---|
| `good-heart-tech` | Whose brand it is |
| `v1.2.0` | The version. A higher number is newer |
| `2026-10-03` | The date it was built (year, month, day) |

- A file named `...-brand-kit-latest.zip` is always the newest copy, so a link to it never goes out of date.
- Every zip has a `README.md` inside. It lists what is in the zip and how to use the logos.
- If the file is older than you expected, ask the organization for the newest one.

## Check that your download is untouched (optional)

Each release includes **SHA256SUMS.txt**. If you want to confirm a file was not changed on the way to you,
compare the number next to its name with the one your computer reports:

- Windows (PowerShell): `Get-FileHash .\file.zip`
- Mac or Linux: `shasum -a 256 file.zip`

## For the person who owns the kit

Run this from the kit folder (needs the [OBKS command line tool](../README.md#commands)):

```bash
obks publish --zip --kit-version 1.2.0
```

- The kit must be set to `partner` or `public` in `publication.visibility`. Private kits are never zipped.
- Only files listed in `publication.includedPaths` go in the zip. Warnings about risky files still appear.
- Set `brand.version` in `brandkit.yaml` to stop typing `--kit-version`. The date is added automatically (use `--date YYYY-MM-DD` to set it).
- The zips, a `-latest` copy, and `SHA256SUMS.txt` are written to the kit's `dist/` folder.
- To attach the zip to a GitHub release or share it by email, SharePoint, or Drive, just send the file.
- In GitHub Actions, add `bundle: "true"` to the OBKS action and the zip is saved as a workflow artifact.
