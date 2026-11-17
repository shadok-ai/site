---
title: Connected accounts
nav: Connected accounts
summary: Connect Google, GitHub or LinkedIn once, then let an agent work inside the account — reads are free, and anything that leaves waits for your approval.
---

# Connected accounts

An agent that can draft an email cannot send it, and one that can write code
cannot push it — unless you hand it a token, which you should not. A connected
account closes that gap: a person connects **Google**, **GitHub** or
**LinkedIn** once, and from then on *"reply to that thread"*, *"open the pull
request"* or *"post about the release"* is a thing you can ask for.

The agent **never sees the token**. It names an account; the server holds the
credential and makes the call. On every provider, **reading is free and anything
that leaves waits for a person** — the shape of that approval differs per
provider, below.

## Your Google

Connect a Google account and an agent can work inside it:

- **Calendar** — read the agenda, and create, move or recolour an event.
- **Drive** — search, read and download any file; rename, move or bin one.
- **Docs, Sheets and Slides** — edit the *content*: replace text, add slides,
  style, build tables and tabs, write formulas.
- **Gmail** — search and read mail, write a draft, send it, or reply in a
  thread.

Every **write** — a sent email, a moved file, an edited document — goes through
an **approval card**, one operation at a time: the agent proposes, you see the
exact change, and nothing happens until you click *Approve*. Reads need no
approval.

## Your GitHub

Connect a GitHub account and `git` and `gh` act on the **repositories that
person picked** — nothing else. A private clone, a branch, a commit, a pull
request, an issue, a check: the agent works the repo directly, and **no token is
ever pasted** into a prompt, a profile or the repository itself. Pick the
repositories an account exposes when you connect it; an agent reaches only those.

## LinkedIn, to post

Connect LinkedIn and *"write a post about the release and publish it"* becomes a
request. By default a post is a **draft**: an approval card appears with the
account, the **exact text** and the image, and nothing is published until
someone clicks *Publish* — or *Discard*. The image that goes out is the one on
the card (the server copies it the moment the agent drafts, so editing the file
afterwards changes nothing), and a pending draft **counts as waiting for you**,
exactly like a dialog — favicon badge, blinking tab. An unapproved draft expires
after **7 days**.

## Connect one

In *Secrets → Connected accounts*, click **Connect Google**, **Connect GitHub**
or **Connect LinkedIn**, consent with the provider, and the account appears in
the list. Nothing else to set up: an instance reaches the shared broker at
`connect.shadok.ai` by default, so each provider's client secret lives there and
never on your instance.

## Owner, share, policy

| | |
|---|---|
| **Owner** | the person who connected it. Only they can loosen the policy. |
| **Share** | any combination of the owner's *Personal* group (the default), chosen restricted groups, and *Public* — `Main` and every public group. Optionally narrowed to agents running given **profiles**. |
| **Policy** | `approve` (the default) or `autonomous`, which acts without a card. Only the **owner** can switch an account to `autonomous`. |

## Every attempt is logged

For a published post, each attempt — published, refused, expired, failed — is
written to a **publication log**: who triggered it, who approved it, the text,
and the post URL or the provider's own error. The row's **Log** button shows the
last 50 entries, to anyone who can use that account.

## When the credential expires

A LinkedIn token lasts about **60 days**. Seven days before it lapses the owner
gets a dismissible banner at the top of the cockpit — and again once it has
expired — plus a Telegram DM if they are the DM owner. On a multi-tenant
instance the version menu shows and renews the agents' credential. An expired
account refuses with a sentence the agent can relay to you, rather than failing
silently.

## How much of a wall this is

On a **single-tenant** instance — a laptop, any macOS cockpit — agents run as
your own OS user. This is then a **soft layer**: it stops accidents and prompt
injection, an agent acting because a web page told it to, but not an agent
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
later version. Today's LinkedIn accounts post as the **member** who connected
them.

## For whoever runs the broker

Only relevant if you host your own instead of using `connect.shadok.ai`. It is a
small **stateless Cloudflare Worker** (`broker/` in the repository) whose only
job is to hold each provider's client secret, so no instance ever has it. Each
provider is registered there as an app — Google and GitHub as their own OAuth /
GitHub App, LinkedIn as *Sign in with LinkedIn* (OIDC) plus *Share on LinkedIn*
— each with its callback under `https://connect.shadok.ai/`. Point instances at
yours with `SHADOK_CONNECT_BROKER`.

LinkedIn sunsets its API versions, so the version an instance sends has to be
raised about once a year or posting stops working.
