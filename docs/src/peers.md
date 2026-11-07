---
title: Cross-instance peers
nav: Peers
summary: An agent can spawn and drive agents on another instance — opt-in, scoped, and revocable.
---

# Cross-instance peers

Agents can spawn and drive agents on **another** cockpit: another one of yours,
or a teammate's. It is opt-in and gated like an account.

## Inviting an agent

On the instance being reached — call it **B** — an admin invites an agent from
the **Users** panel, exactly like inviting a person, except the invitee is a
machine, so it gets a **prompt to paste** instead of a login link.

Give it a name and, optionally, a brief. B mints a named, revocable credential
and hands you a ready-to-paste block: the cockpit URL, the key, the brief and
the commands to join. Copy that into whatever agent you are inviting.

On the calling instance **A**, the invited agent registers B and drives it:

```bash
pilotctl peer add B https://B <token>
pilotctl spawn --peer B --profile dev --name "migration bot" --cwd /workspace
pilotctl prompt <id> "run the migration" --peer B
pilotctl diff <id> --peer B
```

## Scopes

Each invitation carries a scope, chosen when you invite:

- **restricted**, the default — only the agents it creates on B. It can never
  see, resume, drive or diff B's other agents.
- **member** — the invited agent acts **like a person you invited**: it sees,
  drives and measures every agent on B, spawns more, and reads its usage. It is
  not an admin, so no account or peer management.

The narrow scope is what you get when you say nothing, including for a peer
invited before scopes existed, which stays restricted until you re-invite it as
a member. A credential already in someone else's hands never widens on its own.

The credential is **non-expiring and revocable**: revoking it on B kills it
immediately — future calls **and** the live link.

> **This is remote code execution by a third party.** A peer that can spawn runs
> commands on B's machine, and a member-scope peer has a member's full reach. It
> is a deliberate admin grant: you trust an invited agent exactly as much as an
> invited person, and a container per instance stays the real boundary. Even a
> member cannot read secret **values** — the vault returns names only, for
> everyone.

## Letters between agents

Inside one cockpit, agents in **different groups** cannot drive each other —
see and drive stay within your own groups and the public ones. The one narrow
exception is a **letter**: a one-way message the recipient handles in its own
context, under its own guardrails. You never get its transcript, its stream or
its files back; you learn only that the letter was delivered.

- an agent in a **public** group can be written to freely;
- an agent in another **restricted** group only if you hold its **handle**, an
  opaque token it shared with you out of band — there is no roster to browse;
- an agent in a **private** group is **sealed inbound**: no letter gets in, even
  with a handle. It may still write outward.

There is no automatic reply channel, so if you want an answer, put your own
handle in the message. On a single-team cockpit everything is one public
commons, and letters are simply unrestricted. [[alpha]]
