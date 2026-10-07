# Start your brand kit

This guide is for the people who own a brand but do not write code: founders,
marketing and communications staff, office managers, public information
officers, and solo business owners. It works the same for a company, a
government agency, a nonprofit, or a one-person studio.

You do not need to be technical. A developer, IT provider, or designer can
handle the computer parts; your job is to decide what the brand is.

## What you get

- **One place** for your logo, colors, fonts, how you sound, and your approved wording
- **Pictures of the brand right in GitHub:** the palette, the brand in use, and do and don't examples
- Websites, apps, email signatures, and AI tools that all use the **same** colors and words
- **Automatic checks** that your text colors are easy to read
- A **checklist** that helps stop scammers from pretending to be you

## The fastest way: ask an AI assistant

Open Claude, ChatGPT, or Cursor and paste:

> Read https://raw.githubusercontent.com/Good-Heart-Tech/Open-Brand-Kit-Standard/main/INSTRUCTIONS-FOR-AI.md and help me build my brand kit.

It interviews you one question at a time and creates the files. You can say
"skip" to anything you do not know. Nothing needs to be installed.

## You do not have to finish

A kit is useful the day it has three colors and a logo. You choose how far to go:

| Level (`maturity`) | What it means |
|--------------------|---------------|
| `basic` | A start. Nothing is required. Unfinished sections are only a friendly note. |
| `standard` | The everyday files are filled in: who you are, how you sound, facts, wording. |
| `advanced` | Also product kits, sharing rules, and word rules. |

If another tool already covers part of your brand (a style guide on your
website, a Canva brand kit), do not copy it. Point to it in `brandkit.yaml`
under `sections` and the kit will tell people and AI tools to look there.

## How long it takes

| Kit size | Time | What it covers |
|----------|------|----------------|
| Minimal | About 2 hours | Colors, logo, readability checks, scam protection checklist |
| Full | One or two afternoons | Everything above, plus who you are, how you sound, and approved wording |

You can start small and add more later. Every layer except the basics is optional.

## Step by step

### 1. Gather what you have (30 minutes)

- Your logo files. Ask your designer for an **SVG** if you can. PNG is fine too.
- Your colors, if you know them (six-character codes like `#2F6B3A`). If not,
  your technical helper can pick them from your logo or website.
- A few things you have written that sound "like you": a web page, a
  newsletter, a sales or service email, a social post.
- Any boilerplate you send to the press, partners, or investors.

### 2. Fill in the worksheet (1 hour)

Use the [intake worksheet](intake-worksheet.md). Answer in your own words;
there are no wrong answers. Your technical helper turns your answers into the kit.

### 3. Your technical helper sets up the kit

They run `obks init` (or use an AI assistant), fill in what you know from your
worksheet, take the screenshots with `obks preview`, and check the kit. Anything
you do not know yet can stay as "Not decided" and be filled in later. Then they
send you the link to the kit's README.

### 4. Review the brand

Open the kit's README on GitHub (or the brand-at-a-glance page). Check:

- Are these the right colors and logos?
- Does the "brand in use" screenshot look like you?
- Does every row in the readability table say **Pass**? If something fails,
  your helper will suggest a slightly darker or lighter shade.

### 5. Decide what you share

The kit is **private** unless you choose otherwise. Options:

| Setting | Means | Good for |
|---------|-------|----------|
| Private | Nothing leaves your organization | Most organizations |
| Partner | Only chosen files go to partners | Agencies, printers, resellers, sponsors, other departments |
| Public | Only chosen files may be shared with anyone | A press or media kit page |

Logos and colors are safe to share; they are already on your website. Keep
email templates, login, payment, or donation page designs, price lists, staff
contact lists, and internal names private. See [Protect your brand](protect-your-brand.md).

### 6. Use it

- Load it into Canva: [Canva guide](canva.md)
- Ask your web or app developer to use the generated CSS file
- Give AI assistants the `AGENTS.md` file from the kit

### 7. Keep it current

When something changes (new logo, new tagline), tell your technical helper.
They update the kit, and every tool that reads it stays in sync.
