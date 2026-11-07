---
title: Known limits
nav: Known limits
summary: What this does not do, written down rather than discovered.
---

# Known limits

Written down here rather than left for you to discover.

## It spends your subscription

Every agent consumes your Claude quota like a normal session. There is no API
billing mode and no pooled capacity — five agents is five sessions' worth. The
[gauges and the pace guard](/docs/quota) are there to make that visible, not to
make it cheaper. An agent on [a model you host](/docs/model-backend) is the
exception.

## Profile guardrails are soft

Agents run as the same OS user as you, on a single-tenant instance. A profile
prevents **misfires** — it is not a sandbox. A deployment with [isolated
groups](/docs/groups) is what turns that into a real boundary, and even there
isolation is per group, never per agent. [[alpha]]

## The TUI is not an API

shadok drives the interactive `claude` CLI and reads its transcript. A Claude
Code update can change the markers the detection relies on — `❯`, `⏺`, `esc to
interrupt` — and break it. For a production pipeline, use the
[Claude Agent SDK](https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk)
or `claude -p --output-format stream-json` instead.

## Worktrees drift

An agent's worktree is branched at spawn and **never rebased**, so a
long-running agent falls further and further behind a moving main branch. A
design for it exists in the repository and was deliberately deferred.

## The real terminal is experimental

The in-browser terminal (xterm.js over the raw tmux pane stream) is
experimental and needs tmux. Without tmux, the engine room's screen snapshot is
all there is.

Dialogs the chat cannot handle in one click are answered through the engine
room — or, in library mode, with `waitFor()` and `press()`.

## The screen is only the screen

The TUI runs in the alternate screen, so `fullBuffer()` is roughly the visible
screen: a very long response scrolls out of view. Increase `rows` if you are
reading from the screen rather than from the transcript, which is where the
content actually lives.

## Agents survive a server restart, not a reboot

With tmux, an agent lives through the server restarting — including every
auto-update. It does not live through the machine rebooting.

## Telegram is single-owner

One board group per instance, and the bot's direct messages belong to one
person. There is no per-person Telegram identity, and on an isolated-group
deployment Telegram stays single-owner. [[alpha]]

## There are no disk quotas

Nothing caps what an agent writes. On a shared deployment, that is a
per-group home directory with no ceiling on it. [[alpha]]
