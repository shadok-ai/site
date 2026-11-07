---
title: Getting started
nav: Getting started
summary: Three places to run the cockpit — your own machine, a container, a server — and what each one gives you.
---

# Getting started

There is one thing to install and no account to create. What changes between
the three ways of running it is who can reach the cockpit, and how far apart
agents are kept from each other.

## On your own machine

```
npx shadok-ai
```

The cockpit opens in your browser, bound to `127.0.0.1` — this machine only.
You are the only user, there is no login screen, and every agent runs as you.
This is the right setup for one person driving several agents on their own
projects, and it is what most of these pages assume.

It needs Node 20 or newer. The `claude` CLI and `tmux` are installed for you if
they are missing; the one step nobody can do for you is signing in to your
Claude account, which happens once, in the cockpit itself.

[Install](/docs/install) has the detail.

## In the official container

```
docker build -t shadok-ai .
```

The image bundles Claude Code, shadok-ai, a headless browser, `git`, `gh`,
`tmux` and a C toolchain, so an agent can screenshot a page or compile something
without a first-run download. Three volumes carry everything that must survive
a recreate: the vault and the channel list, the Claude credentials, and the
agents' files.

A container is also the honest boundary for anything you expose. The cockpit
runs arbitrary commands on its host by design — that is what an agent **is** —
so running it in a container you can throw away is the real isolation, not a
setting.

[Docker](/docs/docker) has the full `docker run`, the volumes, and the one flag
an older image needs.

## On a server, for a team

A deploy where the server can create OS users — the official image, or a VPS
where it runs as root or with passwordless `sudo` — and where a GUI password is
set, unlocks the part a laptop cannot do: **groups that actually isolate**. Each
agent then runs as its own OS user, with its own home and its own secrets, and a
private group is invisible even to an admin. [[alpha]]

You do not configure this. It follows from how you ran it, it is checked once at
boot, and the boot log prints which mode you got. Anything short of those two
conditions stays single-tenant and says so, rather than drawing a wall that
protects nothing.

[Groups](/docs/groups) covers what a group isolates, and
[Beyond this machine](/docs/expose) covers the password, the accounts and TLS.

## What you need either way

- **Node 20+** (not needed in the container).
- **A Claude subscription.** Agents run on it, and they consume it like any
  session you would run yourself. There is no API-key mode — though an agent
  can run on [a model you host yourself](/docs/model-backend) instead, and then
  it costs you nothing and is never held back by the quota guard.
- **git**, if you want the worktree isolation that is on by default.
