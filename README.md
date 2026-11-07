# shadok-ai — the landing page

The one-pager for [shadok-ai](https://github.com/shadok-ai/shadok-ai), kept in
its own repository so it can be deployed without touching the product.

```
index.html          the one-pager — no build step, no framework, no CDN
demo.webm/.mp4      the hero, in the two codecs browsers need between them
demo-poster.webp    the still the browser paints before the video arrives
og-card.jpg         1200x630, what a shared link shows
favicon.svg
vercel.json         cache headers, and cleanUrls for /docs/<page>
docs/               the manual — see below
docs/launch/        the tooling that produces all of the above
```

## The manual (`/docs`)

Twenty-five pages at [shadok.ai/docs](https://shadok.ai/docs), in the same
palette and the same three typefaces as the one-pager.

```
docs/src/*.md       the SOURCE — this is the file you edit
docs/launch/build-docs.mjs
                    the generator: sidebar, breadcrumb, prev/next, alpha badges
docs/*.html         the OUTPUT — generated, committed, served as-is
docs/docs.css       the manual's own stylesheet
```

```bash
node docs/launch/build-docs.mjs     # after any edit under docs/src/
```

The deploy still has no build step: Vercel serves committed HTML and runs
nothing. The generator exists because twenty-five pages cannot share a sidebar
and a prev/next strip by hand. **Edit the `.md` and re-run it** — an edit made
straight in a `.html` is overwritten by the next build, silently.

The page order, and the sidebar with it, is the `NAV` array at the top of the
generator. A source file that is not in `NAV` is not published, and the build
says so and exits non-zero.

**The channel line.** These pages describe the **beta** channel — what
`npx shadok-ai` installs. Anything that is merged but not yet promoted is
marked `[[alpha]]`, inline or as `alpha: true` in a page's front matter. To find
what is still alpha, diff the published beta README against `main`:

```bash
npm pack shadok-ai@latest          # the beta README, inside the tarball
```

Writing an alpha capability as if it shipped is the one mistake that costs a
reader their afternoon: they install, and it is not there.

## Deploy

See [DEPLOY.md](DEPLOY.md) — including the current state, which is that nothing
is online and the URL GitHub advertises is dead.

Nothing to build. The page is self-contained: no CDN, no fonts, no analytics.
It makes exactly **one** request to anything outside itself — the GitHub API,
for the star count on the button — and it degrades to a plain "Star" when that
call fails.

## The hero

Generated, not hand-made, and regenerating it is one command once the cockpit is
staged: `docs/launch/README.md` has the procedure.

It weighs 1.1 MB, and nothing waits for it: the page paints from 58 KB of HTML
and poster, and the video's sources are attached only once it is on screen — so
a visitor who reads the headline and leaves never pays for it. On a laptop the
hero is on screen at once, so there it does download; on a phone, and for anyone
who bounces from the fold, it does not.

It used to be a 5.29 MB GIF — 99.7% of the page, and a mobile LCP of 4.6 s on a
10 Mbps connection, inside Google's "poor" band. Measured the same way after the
change: **208 ms**.

It goes stale quietly. The cockpit's UI moves, and the hero keeps showing the
version it was shot against — check it against a running instance before any
launch, not after.

## The post drafts are not here

They live outside this repository, in `~/.shadok-ai/marketing/posts.md`. This
repo is public and they are a launch playbook — a held Show HN draft, the
sequencing, and prepared answers to the objections the launch will attract.
Nothing secret, but nothing worth handing over before the launch either.
