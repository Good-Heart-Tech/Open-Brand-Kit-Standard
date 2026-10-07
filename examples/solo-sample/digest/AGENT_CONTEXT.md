# Agent context (generated)

> Regenerate with `obks digest`. Normative values live in `tokens/*.obks.json` and `tokens/exports/`.

## Brand

- **Id:** juniper-lane-studio
- **Name:** Juniper Lane Studio
- **Maturity:** standard
- **Role:** organization
- **Organization type:** solo
- **Industry:** photography and design for small businesses
- **Website:** https://juniperlane.example
- **Sharing:** Partner: only paths in `publication.includedPaths` may go to partners. Build them with `obks publish`.
- **Report impersonation:** https://juniperlane.example/contact

## Word rules (follow exactly)

- Use "Juniper Lane Studio" instead of "JLS" (topic: my name; exact capitalization; Full name first, then "Juniper Lane"; "JL" is only the logo monogram)
- Use "I" instead of "our team", "our designers" (I am one person and never pretend to be an agency)
- Use "photos" instead of "assets" (topic: talking to clients)
- Use "final photos" instead of "deliverables" (topic: talking to clients)
- Use "project" instead of "engagement" (topic: talking to clients)
- Use "small business" instead of "SMB", "SMBs"
- Use "starter package" instead of "cheap", "discount" (topic: pricing; Talk about value, not cut prices)
- Use "photo shoot" instead of "photoshoot" (Two words)
- Never use "synergy", "leverage", "brand storytelling solutions" (Agency jargon)
- Never use "stunning", "world-class", "next level" (Hype words)

## Voice and tone

Juniper Lane Studio is one person, so it sounds like one person: friendly,
confident, and personal. I write "I" and "you", never "we" or "our team".
The voice stays the same everywhere; the tone shifts with the moment.

| Situation | Tone | Example |
|-----------|------|---------|
| Proposals | Confident, specific | "I will shoot your new menu over one afternoon and deliver 25 edited photos within a week." |
| Project updates | Warm, clear about next steps | "Your first edits are ready. Pick your favorites by Friday and I will finish the rest by Tuesday." |
| Social posts | Friendly, a little playful | "Fresh bread, good light, and a very patient baker. New work for Rise and Shine Bakery." |
| Invoices and payment reminders | Plain, polite, matter-of-fact | "Here is the invoice for your brand photos. It is due in 14 days, and you can pay it through the secure link in my invoicing tool." |
| Saying no or changing scope | Kind, honest, solution-first | "That is outside what we agreed, but I would love to help. Here is what it would add to the project." |
| Printers and vendors | Professional, precise | "Please print 250 cards on 16 pt matte stock. The files are CMYK with a 0.125 inch bleed." |

## Always

- Write the way I talk to a client over coffee: short sentences, plain words
- Lead with what the client gets, then the details
- Give dates and next steps in every project update
- Say "I", own mistakes, and fix them quickly

## Never

- Pretend to be a bigger agency ("our te
…

## Style rules

A short checklist, not a style manual. When something is not covered here,
follow AP style and add the decision here.

- **Person:** "I" and "me" for the studio, "you" and "your business" for the client; never "we" for the studio
- **Our name:** "Juniper Lane Studio" the first time, then "Juniper Lane"
- **Headings:** Sentence case ("Book a free 20-minute call")
- **Lists:** Oxford comma ("bakeries, salons, and makers")
- **Numbers:** Spell out one to nine; numerals for 10 and up, money, and photo counts ("25 edited photos")
- **Prices:** Only in proposals and invoices, never on social media
- **Dates:** "Friday, October 2" in project updates, with the next step in the same sentence
- **Times:** "9 a.m." and "2:30 p.m."
- **Print specs:** Numerals and units: "16 pt matte stock", "0.125 inch bleed"
- **Exclamation points:** At most one per message; none in invoices or payment reminders
- **Emoji:** Only on social media, never in proposals, invoices, or legal text
- **Links:** Describe where the link goes ("book a call on my website"), never "click here"

## Vocabulary highlights

- "I" and "me" over "we", "our team", or "the studio" (except in the name itself)
- "you" and "your business" over "the client"
- "photos" over "assets" or "content" when talking to clients
- "edits" or "final photos" over "deliverables"
- "project" over "engagement" or "job"
- "small business" over "SMB"
- "shoot" for photography days, "design" for logos, menus, and print work
- Agency jargon: "synergy", "leverage", "brand storytelling solutions"
- Gear talk with clients (lens names, camera models) unless they ask
- "Cheap" or "discount"; say "starter package" instead

## Approved messaging (excerpt)

This kit has no `identity/` layer, so the short "about me" lives here.

**Tagline:** Photos and design for small businesses with big hearts.

**One-sentence description:** Juniper Lane Studio is a one-person photography
and design studio that helps small businesses look as good as they are.

## About me (short bio)

Hi, I am the person behind Juniper Lane Studio. I photograph and design for
small businesses: bakeries, salons, makers, and the shops on your favorite
street. I work with a handful of clients at a time, so you always talk to me,
not an account manager. My goal is simple: photos and designs you are proud to
put on your website, your menu, and your front window.

## About me (one line, for social profiles)

Photographer and designer for small businesses. One studio, one person, real
attention.

## Services

| Service | What you get |
|---------|--------------|
| Brand photo session | A half-day shoot at your business and 25 or more edited photos for your website and social media |
| Product photos | Clean, consistent photos of your products on white or styled backgrounds |
| Logo and small brand kit | A logo, colors, and fonts, with files ready for print and web |
| Print
…

## Logo rules (excerpt)

This page is shared with printers, vendors, and clients.

| File | Use |
|------|-----|
| `assets/logo/mark.svg` | Default JL monogram, full color on light backgrounds |
| `assets/logo/mark-reversed.svg` | White outline version for dark backgrounds and photos |
| `assets/logo/wordmark.svg` | Monogram plus name, for website headers, business cards, and letterhead |
| `assets/logo/favicon.svg` | Browser tabs and small social profile images |

## Clear space

Leave empty space around the logo equal to at least a quarter of the monogram's
width. Nothing else (text, edges, other logos) goes inside that space.

## Minimum size

- Monogram: 32px on screen, 0.5 inch in print
- Wordmark: 160px wide on screen, 1.5 inches wide in print

## Colorways

- Default: full-color monogram or wordmark on `paper` or `white`
- On dark backgrounds or photos: the reversed monogram on `charcoal` or `primary`
- One-color printing (stamps, foil, engraving): the monogram in juniper green
  (`primary`) or solid black

## Notes for printers

- Match the hex values on the brand-at-a-glance page; ask for a proof on the
  chosen paper before a full run, because juniper green shifts on uncoated stock.
- The SVG fil
…

## Consumption

- CSS variables: `tokens/exports/css/variables.css`
- UI brief (colors, type, approved contrast pairs): `tokens/exports/agent/ui-brief.md`
- Do not invent hex values or fonts outside exported tokens.
- Load full `copy/legal.md` before external publication.
