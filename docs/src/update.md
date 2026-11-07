---
title: Updating
nav: Updating
summary: Two channels, what the version numbers mean, and how an instance updates itself without losing a turn.
---

# Updating

An instance follows one of two release streams, picked in the version menu —
click the version next to the brand.

- **beta** — the default, and what a fresh `npx shadok-ai` installs. It moves
  only when a version is **promoted**, so an instance sits still for days at a
  time.
- **alpha** — moves on every merge to the main branch. Newest work, freshest
  bugs.

Promoting is deliberate: someone bumps the minor version and merges, and that
merge becomes the new beta for everyone.

## The numbers tell you which

An alpha carries the **commit count** — `0.17.44`. A promotion is **round** —
`0.17.0`. The auto-update switch and the reload behaviour are identical on both.

Everything in these pages describes the beta channel. Anything marked
[[alpha]] is published but not promoted, so you need the alpha channel to see
it:

```bash
npx shadok-ai@alpha
```

## How an update lands

`npx shadok-ai` does not run a checkout. It runs a **supervisor** that manages
an auto-updating npm-installed copy under `~/.shadok-ai/app`, so a merged fix
reaches a running instance on its own within minutes.

The install is deliberately careful:

- npm's lifecycle scripts are **off** (`--ignore-scripts`). Only node-pty's
  native build runs, explicitly.
- each release ships its tested lockfile as `npm-shrinkwrap.json`, so every
  transitive dependency lands at the exact version and integrity hash CI ran.
- it installs into a **staging copy** and replaces the live one only once
  complete, so a failed native build leaves the running version in place.

With `tmux` — the default — agents are in detached sessions of their own, so the
server restarting costs you nothing: they are reattached on the next boot, and
the transcript tail resumes at the byte offset it had reached rather than at the
end of the file. An update mid-turn does not eat the answer.

You can also update from Telegram with `/update`, which fetches and respawns.

## Agents do not update with the server

An agent's context is fixed when it starts, so a server update does not change
a running agent. The cockpit notices the gap and offers a **reload** — see
[reload to apply](/docs/agents#reload-to-apply). A reload respawns the agent in
place and keeps its history.

## Turning it off

The auto-update switch is in the version menu and is stored in the config,
which is **authoritative** once used: `SHADOK_AUTOUPDATE` is a fallback for an
instance that has never touched the setting, not an override.
