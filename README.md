# shadok-ai — the landing page

The one-pager for [shadok-ai](https://github.com/shadok-ai/shadok-ai), kept in
its own repository so it can be deployed without touching the product.

```
index.html      the whole page — no build step, no framework, no CDN
demo.gif        the hero asset, generated (see below)
vercel.json     one cache header for the GIF
docs/launch/    the tooling that produces the GIF
```

## Deploy

```bash
npx vercel@latest deploy --prod
```

Nothing to build. The page is self-contained: no CDN, no fonts, no analytics.
It makes exactly **one** request to anything outside itself — the GitHub API,
for the star count on the button — and it degrades to a plain "Star" when that
call fails.

## The demo GIF

`demo.gif` is generated, not hand-made, and regenerating it is one command once
the cockpit is staged. `docs/launch/README.md` has the procedure: start a
capture instance, stage the agents by hand, record, then cut.

It goes stale quietly. The cockpit's UI moves, and the GIF keeps showing the
version it was shot against — check it against a running instance before any
launch, not after.

## The post drafts are not here

They live outside this repository, in `~/.shadok-ai/marketing/posts.md`. This
repo is public and they are a launch playbook — a held Show HN draft, the
sequencing, and prepared answers to the objections the launch will attract.
Nothing secret, but nothing worth handing over before the launch either.
