# shadok-ai — the landing page

The one-pager for [shadok-ai](https://github.com/shadok-ai/shadok-ai), kept in
its own repository so it can be deployed without touching the product.

```
index.html          the whole page — no build step, no framework, no CDN
demo.webm/.mp4      the hero, in the two codecs browsers need between them
demo-poster.webp    the still the browser paints before the video arrives
og-card.jpg         1200x630, what a shared link shows
favicon.svg
vercel.json         cache headers
docs/launch/        the tooling that produces all of the above
```

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

It weighs 1.1 MB and is attached only when it scrolls into view, so the page
lands in well under 50 KB. It used to be a 5.29 MB GIF — 99.7% of the page, and
a mobile LCP of 4.4 s on a 10 Mbps connection, which is inside Google's "poor"
band. Measured after the change: **176 ms**.

It goes stale quietly. The cockpit's UI moves, and the hero keeps showing the
version it was shot against — check it against a running instance before any
launch, not after.

## The post drafts are not here

They live outside this repository, in `~/.shadok-ai/marketing/posts.md`. This
repo is public and they are a launch playbook — a held Show HN draft, the
sequencing, and prepared answers to the objections the launch will attract.
Nothing secret, but nothing worth handing over before the launch either.
