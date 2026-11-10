---
title: Install
nav: Install
summary: One command, what it needs, what it installs for you, and the one-time Claude sign-in.
---

# Install

```
npx shadok-ai
```

That is the whole install. The server comes up, and **your browser opens** on
the port it actually landed on — which is not always 3789, because a busy port
walks to the next free one. Only the launch you asked for opens a tab; an
auto-update respawn never does. It is skipped where it would make no sense — in
a container, over SSH, on a Linux box with no display — and `--no-open` turns it
off.

## What it needs

**Node 20 or newer.** That is the hard requirement.

Everything else is handled, and says so when it cannot be:

- **The `claude` CLI.** shadok-ai drives Claude Code on your own subscription.
  If the CLI is missing it is installed at the first agent launch
  (`npm i -g @anthropic-ai/claude-code`); if that cannot write the global
  directory, the cockpit tells you the one command to run.
- **`tmux`.** With it, agents survive the server restarting — including every
  auto-update — so it is auto-installed at boot when missing (`brew` on macOS,
  `apt`/`apk`/`dnf`/`pacman` on Linux, with `sudo` when not root). If it cannot
  be installed, the cockpit falls back to a plain pseudo-terminal and names the
  command. `SHADOK_TMUX=0` skips all of it.

On the first run it asks once for an optional **Telegram bot token**. Press
Enter to skip — you can add it later from the cockpit.

## Flags

| Flag | Effect |
|---|---|
| `--port, -p <n>` | HTTP/WS port (default 3789; falls back to the next free one) |
| `--no-telegram` | web only; do not prompt for or use a bot token |
| `--no-open` | do not open the browser on launch |
| `--password <p>` | require this password to open the cockpit (stored in config) |
| `--version, -v` · `--help, -h` | version / help |

## Sign in to Claude

Agents run on your Claude account, so there is one step nobody can skip — and
you never need a shell on the host for it.

When the instance is not connected, the **Connect Claude** card takes over the
page: an **Open claude.ai** link and a field for the code you get back. *I
already have a token* takes one you minted elsewhere with `claude setup-token`. Agents **refuse to start** until it
is done, so you cannot accidentally manufacture an agent with no credentials.
A token minted that way runs the agents but cannot read usage, so the quota
gauges stay empty — see [when the gauges stay blank](/docs/quota#when-the-gauges-stay-blank).
The card exists only while it is needed: there is no button that opens it when
everything is fine.

From Telegram, which is where you usually are when a session expires
mid-afternoon:

```
/login          → replies with the link
/code <code>    → finishes the sign-in (your message is deleted afterwards)
```

The sign-in is instance-wide, so a code pasted in Telegram also closes the card
waiting in a browser.

> **The first-run screens are already answered.** A virgin `claude` opens on a
> theme picker and then a per-directory trust dialog, and an agent started there
> never reaches a prompt at all. shadok-ai seeds those answers — at boot for the
> global ones, and before every spawn for the session's directory, because a new
> worktree is a new directory and therefore a new trust dialog. The seeding only
> ever adds: a value already there is never overwritten, so on a machine that has
> used Claude Code before, nothing is written.

## When it expires

The version menu shows which Claude login this cockpit runs on — the email, the
subscription, and when the sign-in **expires**. The timestamp is read from
Claude Code's own credentials store, never from a token. A **↻ Re-login to
Claude** button is right there, and in the last 48 hours a banner carries the
same one click, so agents never quietly start failing because nobody renewed the
session.

## Keeping it up to date

The server polls npm and can update and reload itself in place. It runs the
npm-installed copy rather than a checkout, so a merged fix reaches a running
instance on its own within minutes. [Update](/docs/update) covers the channels
and the switch.
