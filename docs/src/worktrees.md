---
title: Worktrees and diffs
nav: Worktrees
summary: Every agent gets its own checkout and branch, nothing is auto-discarded, and you read the diff before anything merges.
---

# Worktrees and diffs

Two agents editing the same checkout is the fastest way to lose an afternoon.
So a spawned agent gets its own **git worktree** and its own branch
(`shadok-ai/<tag>`, under `~/.shadok-ai/worktrees/`), branched at the moment it
started.

This is on by default in the creation box. Turn it off and the agent works
directly in the directory you point it at — which is right for the lead agent
reading a repository, and wrong for anything that writes.

## Nothing is ever auto-discarded

The rule, in order:

- an agent whose checkout is **clean** has it reclaimed when the session ends,
  and its branch deleted **only** if it holds no commit beyond the base — that
  is, an agent that did nothing;
- **uncommitted changes** keep the whole worktree, no exception;
- **commits** keep the branch even if the checkout goes, and `Recover` recreates
  the checkout from it.

There is no force-remove anywhere in that path. If an agent wrote something, it
is still on disk.

## The diff panel

What the agent actually changed, against the base its worktree was branched at —
`git status` plus the diff. That is the point of the isolation: you read the
change as a change, not as a surprise in your working tree.

The branch and the worktree are **never merged or deleted for you**. Landing the
work is a deliberate, reviewed step, and it is yours.

## The drift

An agent's worktree is branched at spawn and **never rebased**, so an agent that
runs for days drifts further and further behind a moving main branch. A design
for handling that exists in the repository and was deliberately deferred — know
about it before you leave an agent running for a week on a busy repository.

## Resuming one

A worktree session must always be resumed with **its own path**. The transcript
is keyed by the session's real directory, so resuming a worktree session from
the repository root shows an empty history — the cockpit does this correctly on
its own; it matters if you drive the server yourself over
[the WebSocket protocol](/docs/websocket).
