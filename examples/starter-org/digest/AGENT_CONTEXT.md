# Agent context (generated)

> Regenerate with `obks digest`. Normative values live in `tokens/*.obks.json` and `tokens/exports/`.

## Brand

- **Id:** acme-labs
- **Name:** Acme Labs
- **Maturity:** advanced
- **Role:** organization
- **Organization type:** company
- **Industry:** workplace software for small and mid-sized businesses
- **Based in:** Denver, Colorado
- **Founded:** 2017
- **Website:** https://acme-labs.example
- **Sharing:** Partner: only paths in `publication.includedPaths` may go to partners. Build them with `obks publish`.
- **Report impersonation:** security@acme-labs.example

## Mission, vision, and values

## Mission

Acme Labs makes workplace software that keeps small and mid-sized teams
consistent, without a design department.

## Vision

Every growing company can run tools that are easy to trust and easy to
maintain.

## Values

- **Calm and competent:** we fix problems quietly and explain them plainly.
- **Plain language over buzzwords:** if a customer has to look it up, we wrote it wrong.
- **Evidence before hype:** we say what a product does, and we can show it.
- **Inclusive by default:** our products and words work for everyone on a team.

## Approved facts and claims to never make

Last reviewed: 2026-10-02

People and AI tools may state these facts as written. Anything not listed here
needs a source before it is published. Update the date above whenever you
review this page; `obks validate` warns when it is more than a year old.

| Fact | Source or owner |
|------|-----------------|
| Acme Labs, Inc. was founded in 2017 | Company records; legal team |
| Acme Labs is based in Denver, Colorado | Company records; legal team |
| Acme Labs makes workplace software for small and mid-sized businesses | `identity/about.md`; marketing lead |
| Acme Docs is the Acme Labs knowledge base product | `identity/naming.md`; product lead |
| Every Acme Labs product reads one shared brand kit | Product documentation; product lead |
| Every product has a free trial | Pricing page; marketing lead |

## Never claim

- Customer counts, revenue, growth rates, or retention numbers that are not in
  this table
- "Customers cut onboarding time by 30 percent" or any other result, unless a
  current, documented customer study backs it (the example in `voice/tone.md`
  shows the style, not a real number)
- Customer names or logos without that customer's written permission
- "The only", "the best", "number one", or "industry-leading"
- "SOC 2 certified", "SOC 2 compliant", "HIPAA compliant", or any other
  certification or audit we do not hold (see `copy/claims.md`)
- "Guaranteed uptime", "100% uptime", or "unhackable"
- Partnerships or integrations that are not live and announced

## Word rules (follow exactly)

- Use "Acme Labs" instead of "ACME", "Acme labs", "AcmeLabs" (topic: our name; exact capitalization; Spell our name exactly, and never write "Acme" alone)
- Use "Acme Docs" instead of "AcmeDocs", "Acme docs" (topic: product names; exact capitalization; Product names are Title Case with a space)
- Use "sign in" instead of "log in", "login to" (topic: product and support; Matches the words in our products)
- Use "email" instead of "e-mail" (Modern spelling)
- Use "team" instead of "resource" (People are not resources)
- Use "people" instead of "users" (topic: customer-facing copy; Say "people" or "staff" to customers; API docs may say users)
- Never use "synergy", "disrupt", "disruptive", "best-in-class", "world-class", "revolutionary" (Hype words people do not trust)
- Never use "simply", "just" (topic: instructions; It makes people feel bad when the step is not simple)

## Claims, disclaimers, and approvals

Security, uptime, and compliance claims carry legal weight for a software
company: customers rely on them in contracts and security reviews. This file is
internal and is never shared with partners or the public.

## Required disclaimers

| When | Disclaimer text | Where it goes |
|------|-----------------|---------------|
| Any uptime figure | "Measured over [period]. See the status page for current and past uptime." | Same sentence or directly below |
| Any uptime commitment | "Service levels are defined in your service agreement." | Same page, linked to the agreement |
| AI features | "AI suggestions can be wrong. Review them before you publish." | In the product next to the feature, and on its help page |
| Prices on ads or landing pages | "Prices in USD. Taxes may apply. See the pricing page for current plans." | Same page, near the price |

## Words and claims we cannot use

These are legal and contract limits. Brand word choices belong in
`voice/terms.yaml` instead.

- **SOC 2:** SOC 2 is an audit report, not a certificate. Never say "SOC 2
  certified" or "SOC 2 compliant". We do not hold a SOC 2 report today, so we
  make no SOC 2 claim at all. If we complete an audit, the approved wording
  will be "Acme Labs has completed a SOC 2 Type II audit", and only while the
  report is current.
- **Uptime:** never "guaranteed uptime", "100% uptime", "always available", or
  "zero downtime". Quote a past uptime figure only with its period, from the
  status page.
- **Security:** never "unhackable", "bank-level security", "military-grade
  encryption", or "completely secure". Describe the actual control instead:
  "Data is encrypted in transit and at rest."
- **Compliance:** never "HIPAA compliant", "GDPR certified", or "FedRAMP"
  unless the legal team approves the exact
…

## About

Acme Labs is a software company that makes workplace tools for small and
mid-sized businesses. Our products help teams keep their docs, brand, and
customer messages consistent without hiring a design department.

## Personality

- Calm and competent
- Plain language over buzzwords
- Evidence before hype
- Inclusive by default

## Who we talk to

- Operations and marketing leads at small and mid-sized companies (often non-technical)
- IT admins who approve and roll out our tools
- Investors, analysts, and the press
- Developers who build on our API

## Positioning

We are the dependable, easy-to-roll-out option. We do not compete on the
longest feature list; we compete on being easy to trust and easy to maintain.

## What we offer

Prices change often, so they are not listed here. Link to the pricing page
instead of quoting a number.

| Offering | What it is | Who it is for | Why choose it |
|----------|------------|---------------|---------------|
| Acme Docs | A knowledge base where teams write down how things work | Operations managers and team leads | Easy for first-time writers, so knowledge does not leave when people do |
| Shared brand kit | One set of colors, wording, and accessibility rules that every Acme Labs product reads | Marketing and operations leads | Websites, apps, and AI assistants stay on brand without extra work |
| Acme Labs API | Programmatic access to Acme Labs products | Developers and IT admins | Connect Acme Labs to the tools a team already uses |
| Free trial | Try Acme Labs products before buying | Anyone evaluating us | No sales call needed to get started |

## What we do not offer

- Design, branding, or agency services. We make software; we do not design
  logos or websites for customers.
- Custom development or one-off features for a single customer.
- On-premises or self-hosted versions of our products.
- Products that are not listed above. New product names are announced only
  after they are approved in `identity/naming.md`.

## Who we talk to

| Audience | What they care about | How we sound to them |
|----------|----------------------|----------------------|
| Operations and marketing leads at small and mid-sized companies | Saving time, looking consistent, not needing a specialist | Warm, confident, no jargon |
| IT admins | Security, easy rollout, sign-in options, clear admin controls | Direct and precise; explain technical terms once |
| Developers | Clear API docs, stable behavior, honest changelogs | Specific and brief, with working examples |
| Investors and analysts | Growth, retention, and what makes us different | Specific, outcome-first, only approved numbers |
| The press | A clear story and facts they can check | Factual and quotable; lead with what is new |

## Voice and tone

Our voice stays the same everywhere: calm, clear, and helpful. Our tone shifts
with the moment.

| Situation | Tone | Example |
|-----------|------|---------|
| Website and newsletters | Warm, confident | "Your team's tools, set up once and kept up to date." |
| Product screens | Direct, helpful | "Save changes" not "Submit" |
| Support replies | Patient, precise | "Here is what happened, and here is the fix." |
| Investors and analysts | Specific, outcome-first | "Customers cut onboarding time by 30 percent in the first quarter." |
| Legal | Formal | No jokes, no slang |

## Always

- Short sentences and active verbs
- Explain any technical term the first time it appears
- Blame the problem, never the person

## Sensitive topics

How we talk about subjects where a careless sentence could hurt trust. For each
topic: our position, what to say, what not to say, and who approves anything
public. If a topic says **no comment**, do not write about it at all.

| Topic | Our position | Say | Do not say | Approver |
|-------|--------------|-----|------------|----------|
| Pricing changes | Give customers notice and a clear reason | What changes, when, who it affects, and where to get help | Amounts or dates before they are final; "small" or "minor" increase | Head of finance and marketing lead |
| Outages and security incidents | Be prompt, factual, and calm | What happened, who is affected, what to do next, and when the next update comes | Guesses about cause, blame, or "no data was affected" before it is confirmed | Head of engineering and security lead |
| Competitors | We focus on what we do well | Our strengths, in our own words | Competitor names, comparisons, or criticism | Marketing lead |
| AI features | Explain what the AI does and its limits | What it helps with, that people review its output, and how customer data is handled | "Fully automatic", "always accurate", or that customer data trains models | Product lead and security lead |
| Customer data | Customers own their data | How to export or delete it, and where the privacy policy is | Anything about a specific customer's account | Security lead |
| Politics | No comment | | Any position on candidates, parties, or elections | CEO |

## Style rules

A short checklist, not a style manual. When something is not covered here,
follow AP style and add the decision here.

- **Headings:** Sentence case ("Start a free trial", not "Start A Free Trial")
- **Product names:** Title Case, with "Acme" on first mention: "Acme Docs", then "Docs"
- **Buttons and screen labels:** Bold, spelled exactly as they appear in the product: **Save changes**
- **Lists:** Oxford comma ("docs, brand, and customer messages")
- **Numbers:** Spell out one to nine; numerals for 10 and up and for money
- **Percentages:** "30 percent" in prose, "30%" in tables, charts, and the product
- **Dates:** "October 2, 2026" in prose; "2026-10-02" in data, changelogs, and file names
- **Times:** "9 a.m. MT"; always include the time zone in outage and maintenance notices
- **Acronyms:** Spell out on first use: "multi-factor authentication (MFA)"
- **Person:** "we" for Acme Labs, "you" for the reader
- **Exclamation points:** At most one per page, never in support replies
- **Emoji:** Only on social media, never in the product, headings, or legal text
- **Links:** Describe where the link goes ("see pricing"), never "click here"

## Vocabulary highlights

- "team" over "resource"
- "sign in" over "log in"
- "email" over "e-mail"
- "people" or "staff" over "users" when talking to customers
- "synergy", "disrupt", "best-in-class"
- Acronyms without explanation (write "multi-factor authentication (MFA)" first)
- "Simply" or "just" in instructions (it makes people feel bad when it is not simple)
- Gender-neutral defaults ("they", "everyone", "folks")
- Avoid idioms that do not translate well

## Approved messaging (excerpt)

**Tagline:** Tools that stay on brand.

**One sentence:** Acme Labs makes workplace software that keeps small and
mid-sized teams consistent.

**Boilerplate (short):** Acme Labs helps growing companies run dependable,
consistent tools without a design department.

**Boilerplate (long):** Acme Labs builds workplace software for small and
mid-sized businesses. Our products share one brand kit, so colors, wording,
and accessibility stay consistent across every website, app, and AI assistant
a team uses.

**Call to action:** Start a free trial.

## Logo rules (excerpt)

| File | Use |
|------|-----|
| `assets/logo/mark.svg` | Default, full color on light backgrounds |
| `assets/logo/mark-reversed.svg` | On dark backgrounds or photos |
| `assets/logo/mark-mono.svg` | One-color printing, stamps, embroidery |
| `assets/logo/wordmark.svg` | Website headers and letterhead |
| `assets/logo/favicon.svg` | Browser tabs and app icons |

## Clear space

Leave empty space around the logo equal to at least 12% of its width.

## Minimum size

- Mark: 24px on screen, 0.5 inch in print
- Wordmark: 120px wide on screen

## Colorways

- Default: full color on `surface`
- Dark: reversed mark on `ink`

## Do not

- Stretch, rotate, or add shadows
- Recolor the mark
- Place it on busy photos without the reversed version

## Logo files

## Consumption

- CSS variables: `tokens/exports/css/variables.css`
- UI brief (colors, type, approved contrast pairs): `tokens/exports/agent/ui-brief.md`
- Do not invent hex values or fonts outside exported tokens.
- Load full `copy/legal.md` before external publication.
