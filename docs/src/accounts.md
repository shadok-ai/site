---
title: People and accounts
nav: People and accounts
summary: Invitations, roles, two-factor sign-in with passkeys, recovery, and the security log.
---

# People and accounts

With no password there are no accounts and no login screen — nothing changes for
a machine you use alone. Set one and the cockpit grows a sign-in, because the
password **is** the `admin` account.

Accounts belong to **one instance** — one launch directory — like its agents and
its scheduled prompts.

## Inviting someone

An admin invites people from the **Users** panel. Each invitation is a
single-use link, valid 48 hours, on which the invitee chooses their own
password — so the admin never learns it — and redeeming it signs them in
straight away.

Two roles: **admin** manages accounts, **member** does everything else you do.
The ⋯ menu names who you are and lets you sign out. When a signed-in session
expires — the cookie lasts a week — the open tab returns you to the login screen
on its next request, instead of failing in place on a paste that will not send.

Once people are named, a prompt **carries its sender**: the agent sees who
asked, and other browsers show the name above the message instead of "pilot
(elsewhere)". The server takes that name from the session, never from what the
browser claims.

## Two-factor sign-in

Anyone signed in with a named account can register a **passkey** from the Users
panel — the fingerprint, face or PIN unlock of their own phone or laptop
(WebAuthn, user verification required). An admin can then turn **Two-factor
sign-in** on for the instance, and from that point a correct password only opens
a second step.

Passkeys need a **secure context**: `https://` or `localhost`. They are bound to
the host name, so one made on `cockpit.example.com` does not work on
`localhost`.

### Switching it on

It needs **at least two named admins, each with a passkey**. Recovery here is
"another admin resets you", so a lone admin who lost their phone would lock the
cockpit for good. The acting admin confirms with their own passkey.

### Adding a device

On a device already signed in, *Add another device (code)* shows an 8-character
code, valid 10 minutes, single use. On the new device, sign in with the password,
choose *use a code*, and register.

A password alone never registers a passkey. That is what stops a stolen password
from enrolling the thief's phone.

### Losing something

Another admin opens *recover access…* on your row and picks what you lost,
always confirming with their own passkey. **Nobody can recover themselves.**

- **lost password** — one admin; you get a link valid 48 hours, choose a new
  password, then confirm with one of your passkeys, which are all kept;
- **lost passkey** — a **second admin approves**; you then get a device code,
  valid 48 hours, to register a new device;
- **lost everything** — password and passkeys are wiped **24 hours** later, or as
  soon as a second admin approves. You, the asker, or any admin can cancel it
  meanwhile.

Making or unmaking an admin also needs a second admin's approval. Every session
opened before a recovery stops working — including one on the lost device.
Removing a passkey or demoting an admin does the same.

### The security panel

🛡 in the header, with a badge when something is new. It shows what was done to
**your** account — invited, made admin, reset, a passkey added or removed, a
recovery asked about you — and, for admins, the whole log, the requests waiting
for their approval, and their own requests with the link or code to hand over.

On anything you do not recognise, **This wasn't me** ends your other sessions,
removes a passkey you did not add, and flags it to every admin. There is no mail
yet: this panel is the channel, so keep an eye on its badge.

### While it is on

The instance password cannot sign in to the browser any more — nobody could
reset it — so use a named account. Agents, Telegram and peers keep working, as
they never use the login, but account and two-factor management is reserved to a
signed-in person: an agent's key can no longer create or reset accounts.

**Break-glass**, if every admin loses everything at once: on the machine, remove
the instance's entry under `twoFactor` in `~/.shadok-ai/config.json` and
restart. Whoever has that shell could read every secret anyway.

### What it protects, and what it does not

It stops a leaked password used over the network, and it invalidates every
session issued before it was switched on. It does nothing about anything already
running as the machine's user — the same soft boundary as
[profiles](/docs/profiles).

## An agent is not the admin

An agent authenticates to its own cockpit with `SHADOK_SESSION_KEY`, and that
key makes it **that agent**: a member of its own group, never an admin.

It can drive its siblings, schedule prompts on its own channel, store a secret
it obtained, record in the shared ledger, send you files and reload itself. It
is refused (`403`) on the account, peer, Telegram and backend routes, and on
every browser-only route — guardrails, shell mode, uploads — which now require a
signed-in person rather than an `Origin` header. Agents are no longer handed the
admin's cookie or the instance password.

**And on an isolated instance it cannot rewrite a role.** Profiles are global
and any agent can be started on any of them, so an agent editing "its own"
prompt would plant instructions that another group's agents — private ones
included — load with their own secrets. That write is refused outright wherever
groups isolate; it stays open on a single-tenant instance, where an agent could
edit the profile file directly anyway. Picking a role at spawn is unaffected:
without the write, a role only lends its guardrails, and its secrets resolve
against the spawning agent's own group.

> **Upgrading to this.** The first start of that version signs out whoever is
> signed in with the instance password, once. Agents spawned **before** it still
> hold the password in their environment: change the password and reload those
> agents (version menu → *Restart all agents*) to take it away from them.
