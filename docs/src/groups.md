---
title: Groups and isolation
nav: Groups
summary: Groups organise the cockpit — and on a deployment that can create OS users, they isolate for real.
---

# Groups and isolation

Every agent lives in a **group**. On a laptop that is organisation: a left
column of groups, pick one to narrow the agent list to it, drag an agent onto a
group to file it there, drag groups to reorder them, double-click a name to
rename it. A group's icon opens a picker — choose from the grid, type any emoji,
or type a word (`rocket`, `bug`, `money`) to search for one — and its **＋**
creates a new agent straight into it.

On a deployment that can isolate, the same group is also a **wall**.

## The three natures [[alpha]]

- **Private** — only you. One per person, sealed, invisible even to an admin.
- **Restricted** — your team: a member list, and any member can invite.
- **Public** — everyone. `Main` is the default public group.

You see and drive your own groups plus the public ones. That covers the agent
list, the secrets, the shared ledger and messaging between agents.

Private and restricted groups are real walls: each agent runs as **its own OS
user**, with its own home and its own secrets, never as root. Crossing a wall is
always a deliberate act — drop a file in the shared `~/shared/` folder, record a
ledger line as public, push a branch, or send a letter to another agent (freely
to a public group, to a restricted one only with a handle they gave you; a
private group cannot be written to at all).

## What it takes [[alpha]]

Real isolation needs two things, checked once at boot:

1. the server can **create OS users** — it runs as root or has passwordless
   `sudo`, which means the official Docker image or a VPS deploy; **and**
2. a **GUI password** is set, because accounts are who the walls protect.

Both → **multi-tenant**. Anything else — `npx shadok-ai` on your own machine,
Docker without a password — stays **single-tenant**, exactly as it was. You do
not configure this; it follows from how you ran it, and the boot log prints
`deployment mode: …`.

> **A single-tenant instance refuses to pretend.** It will not create a private
> or restricted group rather than draw a wall that protects nothing. If the
> cockpit tells you that, the answer is a deployment that meets the two
> conditions above — not a setting.

## Migrating an existing instance [[alpha]]

An instance that comes up capable is migrated for you: what you have becomes the
public `Main` group, each account gets a private group, and agents restart one
at a time. A banner shows the progress.

Until the migration completes — or if it fails — agents keep running exactly as
before, which means the non-root guarantee does not hold for them yet. On a
brand-new instance one step (seeding the shared Claude credential) can only run
once you have signed in to Claude, so the banner stays up until then and the
migration finishes on its own the moment you do. No restart needed.

## The subscription token [[alpha]]

Agents in isolated groups authenticate with a **subscription token** injected
into their environment, not with a shared credential file. Until it is set,
group spawns are refused with a message naming this step and the cockpit shows a
red banner.

You provide it from the cockpit, with **no shell**: as an admin, click **Provide
token** on that banner — or *Replace subscription token…* in the version menu to
rotate it — authorise on your Claude subscription in the browser, and paste the
code back. From Telegram, `/mttoken` then `/mtcode <code>`. The token is minted
and vaulted server-side and is never shown. It lasts about a year; re-run the
card before it expires.

## Connectors: token or login [[alpha]]

That token can only make model requests. It does **not** carry your claude.ai
**Connectors** — Slack, Google Workspace, Microsoft 365, Atlassian.

If you want agents to use your connectors, switch the instance's agent auth mode
to **login**: each OS user (the shared commons user, plus each private group's
user) does a one-time `claude auth login` from the cockpit, into its own home,
and its agents then see the connectors. The trade-off is lifetime — a login
lasts about a **month** against a year for the token, and it is **per user**, so
the cockpit shows a status row per user and reminds you before each lapses. A
login is never shared across OS users, which is why each one signs in
separately.

The default stays **token**. Nothing changes until an admin switches.

## In Docker, persist the group homes [[alpha]]

Each dropped agent's home sits under `SHADOK_HOME_BASE` (default `/home`), which
is **not** on the data volume. A `docker rm` and recreate therefore wipes those
homes — taking Claude's first-run and trust state with them, and in **login**
mode the per-user credentials, so everyone has to sign in again.

shadok re-seeds the trust robustly at boot, but to avoid the churn entirely,
mount the home base: add `-v shadok-homes:/home` to your `docker run`. A plain
`docker restart` never needed this; only a recreate does.

## What isolation is not [[alpha]]

Isolation is **per group, never per agent**: two agents in the same group share
a user. Telegram stays single-owner. There are no disk quotas. And with no GUI
password there is no boundary at all, because there are no accounts for a wall
to protect.
