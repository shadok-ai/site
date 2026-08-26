# Deploying this page

There is no build step. Whatever is at the root of this repository is the site.

## Where it lives

**https://shadok.ai** — a Vercel project connected to this repository through
the Vercel GitHub App, which is installed on the `shadok-ai` organisation. Every
push to `main` is a production deploy; every branch gets a preview URL.

`shadok-ai-site.vercel.app` still answers with the same page. Point it at the
domain with a redirect in the Vercel project rather than leaving two hosts
serving identical content — `canonical` already tells a crawler which one is
real, but a redirect settles it for everything that does not read the tag.
`www.shadok.ai` does not resolve at all; add it as a redirecting alias if you
expect anyone to type it.

Written down because none of it was: `.vercel/` is git-ignored, so a local link
leaves no trace here by design, and nothing else in the repository named the
host.

### The absolute URLs have to name that host

The page carries four absolute URLs — `canonical`, `og:url`, `og:image` and
`twitter:image` — and they all read `https://shadok.ai`. They are absolute
because a relative `og:image` shows a grey rectangle in half the places a launch
link gets pasted, and being absolute means naming the host that actually serves
the page.

**Move the site and those four lines move with it.** They sit together under the
`SHARE CARD` comment at the top of `index.html`, and `check-meta.mjs` below
fails loudly when they name a host other than the one answering.

They name the **domain**, not the `.vercel.app` alias. The alias keeps working,
and that is the trap: a crawler that follows the card back to a second hostname
sees two pages where there is one. Whatever host you put in front of this page,
these four lines follow it the same day.

### A previous deployment died here — how, so it does not happen twice

`https://site-sigma-lyart-46.vercel.app` was this page's URL until early
August 2026 and now answers `DEPLOYMENT_NOT_FOUND`. Its Vercel project was
linked to the *previous* `shadok-ai/site` repository, which was deleted and
recreated to purge a file from its history. **A Vercel project follows a
repository by id**, not by name — so the recreation silently broke the link and
took the deployment with it, while GitHub went on advertising the dead URL as
the repository's homepage. Recreate this repository again and the same thing
happens again.

## Deploying by hand

Only needed to look at something before it is the site — pushing to `main` is
the normal path.

```bash
npx vercel@latest login          # human, once; the CLI signs itself out
npx vercel@latest link           # writes .vercel/ (git-ignored)
npx vercel@latest deploy         # preview URL
npx vercel@latest deploy --prod
```

## After any deploy

```bash
node docs/launch/check-meta.mjs https://shadok.ai/
```

It reads the **served** page and then fetches what the page claims, so it
catches the two failures that are invisible in the source: a card that 404s, and
a card that is served from a host the tags do not name. Exit code is non-zero
when something is wrong.

Then set the repository's homepage to the real URL, so GitHub stops advertising
a dead one:

```bash
gh repo edit shadok-ai/site --homepage https://shadok.ai
```

## What gets served

```
index.html          the whole page, no framework, no CDN, no fonts
demo.webm/.mp4      the hero, attached by script only when it scrolls into view
demo.gif            the same demo for the product README, which cannot play a video;
                    hosted here, referenced absolutely, and NOT loaded by the page
demo-poster.webp    what the browser paints immediately; the LCP element
og-card.jpg         1200x630 share card
favicon.svg
vercel.json         cache headers for the five assets above
```

The page makes exactly **one** request to anything outside itself — the GitHub
API, for the star count — and degrades to a plain "Star" when that call fails.

`vercel.json` caches the assets for a day with a week of stale-while-revalidate.
It is not `immutable` on purpose: the filenames carry no content hash, so a
re-shot demo under the same name would keep serving the old file to anyone who
had already loaded it.
