---
title: Connected accounts
nav: Connected accounts
summary: Connect LinkedIn once, then ask an agent to post — and approve the exact text before anything goes out.
alpha: true
---

# Connected accounts

An agent that can write a release note cannot publish it. A connected account
closes that gap for **LinkedIn**: a person connects the account once, and from
then on *"write a post about the release and publish it on our LinkedIn"* is a
thing you can ask for.

The agent **never sees the token**. It names an account; the server holds the
credential and makes the call.

## Connect one

In *Secrets → Connected accounts*, click **Connect LinkedIn**, consent on
LinkedIn, and the account appears in the list. Nothing else to set up: an
instance reaches the shared broker at `connect.shadok.ai` by default, so the
LinkedIn client secret lives there and never on your instance.

## Nothing goes out without a person

By default a post is a **draft**. An approval card appears in the agent's chat
with the account, the **exact text** and the image, and nothing is published
until someone clicks *Publish* — or *Discard*.

Two details that matter more than they look:

- **The image published is the one on the card.** The server takes its own copy
  the moment the agent drafts, so editing or deleting the file afterwards
  changes nothing about what goes out.
- **A pending draft counts as waiting for you**, exactly like a dialog: favicon
  badge, blinking tab. An unapproved draft expires after **7 days**.

## Owner, share, policy

| | |
|---|---|
| **Owner** | the person who connected it. Only they can loosen the policy. |
| **Share** | any combination of the owner's *Personal* group (the default), chosen restricted groups, and *Public* — `Main` and every public group. Optionally narrowed to agents running given **profiles**. |
| **Policy** | `approve` (the default) or `autonomous`, which publishes at once. Only the **owner** can switch an account to `autonomous`. |

## Every attempt is logged

Published, refused, expired, failed — each attempt is written to a
**publication log**: who triggered it, who approved it, the text, and the post
URL or LinkedIn's own error. The row's **Log** button shows the last 50 entries,
to anyone who can use that account.

## When the token expires

A LinkedIn token lasts about **60 days**. Seven days before it lapses the owner
gets a dismissible banner at the top of the cockpit — and again once it has
expired — plus a Telegram DM if they are the DM owner. An expired account
refuses to publish with a sentence the agent can relay to you, rather than
failing silently.

## How much of a wall this is

On a **single-tenant** instance — a laptop, any macOS cockpit — agents run as
your own OS user. This is then a **soft layer**: it stops accidents and prompt
injection, an agent posting because a web page told it to, but not an agent
determined to read `~/.shadok-ai/connected-accounts/` itself. It also means
every agent on such an instance can use every connected account: there is no
wall between agents to scope by, so *share* decides which **people** see an
account. The profile filter applies either way.

On an instance where [groups isolate](/docs/groups) the agents run as other OS
users, and the same setting is a real boundary: *share* then also decides which
groups' **agents** may use the account.

## Not yet

Posting to a LinkedIn **Company Page** needs a second LinkedIn app — LinkedIn
requires the Community Management API to stand alone — and is planned for a
later version. Today's accounts post as the **member** who connected them.

## For whoever runs the broker

Only relevant if you host your own instead of using `connect.shadok.ai`. It is a
small **stateless Cloudflare Worker** (`broker/` in the repository) whose only
job is to hold the LinkedIn client secret, so no instance ever has it. It needs
two LinkedIn apps — **A**: *Sign in with LinkedIn* (OIDC) plus *Share on
LinkedIn*, for member posts; **B**: the *Community Management API* alone, for
Pages later — both with the redirect URL
`https://connect.shadok.ai/linkedin/callback`. Point instances at yours with
`SHADOK_CONNECT_BROKER`.

LinkedIn sunsets its API versions, so the version an instance sends has to be
raised about once a year or posting stops working.
