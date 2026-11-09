---
title: The secret vault
nav: Secrets
summary: Credentials live outside your repository and reach only the agents that need them, by name.
---

# The secret vault

A key in a repository is a key in every clone of it. The vault keeps
credentials in `~/.shadok-ai` (mode 600), outside every checkout, and injects
them as **environment variables** into the agents that should have them.

A [profile](/docs/profiles) names the secrets its agents need; the values arrive
at spawn. That is the only path — a value reaches a process when it starts, so
after adding or rotating one you reload the agents that use it. The panel offers
exactly that in one click.

## Add, update, rotate

The Secrets panel takes a name and a value, and lets you tick the **profiles**
it should feed right there. Updating a value is the same gesture; the panel then
offers to reload the running agents on those profiles so the new value takes
effect now rather than at their next restart.

From Telegram, `/secret KEY value` does the same (and the bot deletes your
message afterwards, which is why it wants *Delete messages*). An existing name
is never replaced unless you append `--overwrite`.

## An agent can fill it in

An agent that **obtains** a credential — a CLI login it just completed, a key it
provisioned — can put it in the vault itself, so the next agent does not start
from nothing. Three limits make that safe:

- it is **write-only**: an agent can store a value, never read one back;
- the value is **piped in**, never typed as a command-line argument;
- an existing name is never overwritten without you saying so.

It can also attach that secret to **its own profile** and reload itself to pick
it up — but only a secret it stored itself. A value you typed, or one another
role stored, stays yours to attach from the panel.

## The **+** beside a missing variable

When an agent says in its answer that a credential is missing — a code span like
`HUBSPOT_TOKEN missing from the environment` — a **+** appears right after it.
One click opens the vault with the name already filled in and the agent's
profile already ticked, so all you do is paste the value. Then reload the agent
when offered.

Only names that look like a credential or a connection setting get one
(`…_TOKEN`, `…_KEY`, `…_URL`, `…_ID`…), never `NODE_ENV` and never shadok's own
`SHADOK_*`.

## Connected accounts

A LinkedIn account is not a value in the vault: the same panel holds
[connected accounts](/docs/connected-accounts), where the server keeps the
credential and an agent only ever names the account it wants to post from.
[[alpha]]

## Who touched what

The vault keeps an audit log — *Audit log* in the panel, and 🕘 on each secret.
It records who created, updated or deleted a secret, which profile it was
attached to, and which agent **received** it, at a spawn or in a cron guard,
with the person or the door that caused it.

Names only. The log never holds a value, and neither does the API: `/secrets`
returns names, for every caller, including a cross-instance peer with a
member's reach.
