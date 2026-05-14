# Coventry Judo Club Website

Modern website rebuild for Coventry Judo Club.

## Current intended direction

- Astro + TypeScript static/edge site.
- Lightweight content/admin workflow for news, timetable, prices, alumni, FAQs.
- Hosted handoffs for member/payment flows: Coacha, British Judo membership, and GoCardless/Direct Debit via the current Coacha-managed process for launch, with a separate review of whether direct GoCardless Billing Request Flow plus Coacha reconciliation/sync should replace the clunky current journey later.
- Warm, family-friendly design using the final official CJC crest.
- Homepage media should use a mix of:
  - Option B: animated/ken-burns photo collage using approved CJC photography.
  - Option C: lightweight CSS/SVG motion around still photography and brand motifs.

## Key approval boundaries

- No public deployment without approval.
- No public GitHub repo without approval; private initially.
- No secrets in git.
- No production payment/member-system changes without approval; Coacha is currently the member-system source of truth for GoCardless/Direct Debit, and bank details must be collected only on Coacha/GoCardless-hosted approved surfaces, never directly on the CJC site.
- Photos involving children/members are allowed where supplied for this project, because Bobbie confirmed current photos have consent. New Google Drive candidates should still be vision-reviewed for suitability before use.

## Local development

```sh
npm install
npm run dev
npm run build
npm test
```

The Playwright browser cache is not committed. If tests fail because Chromium is missing, run:

```sh
npx playwright install chromium
```

## Quality gates

- `npm run build` runs `astro check` and creates the static build.
- `npm test` runs Playwright smoke and axe accessibility checks.
- GitHub Actions runs install, build and Playwright tests on pull requests and pushes to `main`.

## Planning source

Project planning files live outside this repo at:

`/home/robert/.hermes/projects/coventry-judo-club/planning/`
