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

A wall also decides where an agent can be dragged. On an isolating deployment a
move is allowed only where it changes nothing about the running process: between
public groups and `Main`, which all share one OS user. Into or out of a walled
group it is refused, and the drop tells you so at once rather than sliding the
tab back on the next sync — the agent's process, its home and its transcripts
belong to the user it was born as. On a single-tenant instance groups are
cosmetic, so every move is allowed. [[alpha]]

Private and restricted groups are real walls: each agent runs as **its own OS
user**, with its own home and its own secrets, never as root. Crossing a wall is
always a deliberate act — drop a file in the shared `~/shared/` folder, record a
ledger line as public, push a branch, or send a letter to another agent (freely
to a public group, to a restricted one only with a handle they gave you; a
private group cannot be written to at all).

## What it takes [[alpha]]

Real isolation needs two things, checked once at boot:

1. the server runs on **Linux** and can **create OS users** — as root or with
   passwordless `sudo`, which means the official Docker image or a VPS deploy.
   The walls are built with `useradd` and `runuser`, so a macOS or Windows host
   stays single-tenant however privileged it is; **and**
2. a **GUI password** is set, because accounts are who the walls protect.

Both → **multi-tenant**. Anything else — `npx shadok-ai` on your own machine, a
Mac with a password, Docker without a password — stays **single-tenant**, exactly
as it was. You do
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

## Connecting Claude [[alpha]]

Agents in isolated groups authenticate with a credential of their **own**,
injected into their environment, not with a shared file. A space that has none
refuses its spawns — the socket answers `code: "space-not-connected"` and names
the space — and an admin is handed the card that connects it. A member is told
to ask an admin, and never sees an authorisation flow.

The **Connect Claude** card opens by itself on a fresh instance, after the
welcome tour, and asks one question: how long the connection should last.

| Choice | Lasts | What its agents get |
|---|---|---|
| **1 month** | about a month, per space | model access **and** your claude.ai connectors |
| **1 year** | about a year, one token for the instance | model access only |

Pick one, click **Open claude.ai**, authorise, paste the code back. No shell at
any point. *I already have a token* takes one minted elsewhere with `claude
setup-token`, and *Replace subscription token…* in the version menu rotates it
later. From Telegram, `/mttoken` then `/mtcode <code>` do the same. Nothing is
shown back to you: the credential is captured and vaulted server-side.

The one-month choice is **per space**, because a login belongs to an OS user and
is never shared between them — the cockpit shows a row per space and reminds you
before each lapses. The year-long token is one credential for the whole
instance.

## Connectors: what the month buys [[alpha]]

The year-long token can only make model requests. It does **not** carry your
claude.ai **Connectors** — Slack, Google Workspace, Microsoft 365, Atlassian.

The one-month choice is a real `claude auth login` into each space's own home,
so its agents see your connectors. That is the whole trade-off: a month against
a year, and one sign-in per space against one token for the instance. The
default is the token; nothing changes until an admin picks otherwise.

## Git over SSH, per group [[alpha]]

Each group has its own SSH identity. Every public group shares the cockpit's
historical container key — the one already registered on your forge — and each
**walled** group (restricted or private) gets a keypair of its own, minted when
the group is provisioned. The keypairs live on the data volume, so they survive a
recreate even though the agent homes do not, and the private half never leaves
the server's own home.

A key is an identity only once a remote accepts it, so read a group's public key
and register it wherever its agents must clone or push. `GET /groups/ssh` returns
one row per group you can see — `{group, name, osUser, publicKey, shared}` —
filtered exactly like `GET /groups`, so a private group stays invisible even to
an admin. `shared: true` marks the historical key, which you register once for
every public group; `publicKey: null` means no keypair has been minted yet, not
an error. Until a group's key is registered, its agents cannot reach that remote
over SSH.

> **Separate keys are separate authority only if the remote treats them as
> separate accounts.** Paste every public key into the same forge account and the
> separation is bookkeeping, not a wall.

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
