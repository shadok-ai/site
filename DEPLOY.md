# Deploying this page

There is no build step. Whatever is at the root of this repository is the site.

## What is actually true right now

Written down because none of it was, and the last person to deploy left no trace
in the repository — `.vercel/` is git-ignored, so a local link is invisible here
by design.

- **The site is not online.** `https://site-sigma-lyart-46.vercel.app` — still
  the repository's `homepage` on GitHub — answers `DEPLOYMENT_NOT_FOUND`. That
  URL belonged to a Vercel project linked to the *previous* `shadok-ai/site`
  repository, which was deleted and recreated to purge a file from its history.
  A Vercel project follows a repository by id, so the recreation broke the link
  and took the deployment with it.
- **The Vercel GitHub App is installed on the `shadok-ai` organisation.** So
  connecting this repository is a few clicks, not an install.
- **The Vercel CLI on this machine is signed out.** `vercel whoami` returns
  *"The specified token is not valid"*. Only a human can fix that:
  `npx vercel@latest login`.

## The one thing to decide first: the production URL

The page carries six absolute URLs — `canonical`, `og:url`, `og:image`,
`twitter:image`, and the two `:alt`s reference the same card. They all read

```
https://shadok-ai.vercel.app
```

They are absolute because a relative `og:image` shows a grey rectangle in half
the places a launch link gets pasted. Absolute means they have to name the host
that actually serves the page.

**So name the Vercel project `shadok-ai`**, not `site` — a project's production
alias is `<project>.vercel.app`, and `site.vercel.app` is not available anyway.
If the site ends up somewhere else (a custom domain, a different alias), change
those six lines in `index.html`; they sit together under the `SHARE CARD`
comment at the top, and `docs/launch/check-meta.mjs` fails loudly when they name
a host other than the one serving the page.

## Connect it to git (the way it should run)

1. Vercel → **Add New… → Project** → import `shadok-ai/site`.
2. Name the project **`shadok-ai`**.
3. Framework preset: **Other**. Build command: **none**. Output directory:
   **`.`** (the repository root). There is nothing to build.
4. Deploy. From then on every push to `main` is a production deploy and every
   branch gets a preview URL.

## Or deploy by hand

```bash
npx vercel@latest login          # human, once
npx vercel@latest link           # writes .vercel/ (git-ignored)
npx vercel@latest deploy --prod
```

`vercel deploy` without `--prod` gives a preview URL, which is the right way to
look at a change before it is the site.

## After any deploy

```bash
node docs/launch/check-meta.mjs https://shadok-ai.vercel.app/
```

It reads the **served** page and then fetches what the page claims, so it
catches the two failures that are invisible in the source: a card that 404s, and
a card that is served from a host the tags do not name. Exit code is non-zero
when something is wrong.

Then set the repository's homepage to the real URL, so GitHub stops advertising
a dead one:

```bash
gh repo edit shadok-ai/site --homepage https://shadok-ai.vercel.app
```

## What gets served

```
index.html          the whole page, no framework, no CDN, no fonts
demo.webm/.mp4      the hero, attached by script only when it scrolls into view
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
