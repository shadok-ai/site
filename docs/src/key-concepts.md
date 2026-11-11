---
title: Key concepts
nav: Key concepts
summary: The vocabulary — agent, session, group, profile, worktree — in one page.
---

# Key concepts

Six words carry the whole product. The cockpit's own copy says *agent*, while
the code, the endpoints and the stored files still say *channel* — same thing,
and worth knowing if you ever read the API.

## The cockpit

One server, one page, one launch directory. You start it in a directory and
that directory decides the instance: its agent list, its scheduled prompts, its
accounts and its Telegram bot are all keyed to it. Run the server from another
repository and you get a different cockpit, with a different bot.

The page itself is static HTML with no framework and no build step. Everything
live — the agent list included — travels over one WebSocket.

## An agent

One agent is **one `claude` process**, with its own conversation, its own
directory and its own state. Several run at once and do not interfere.

An agent outlives its viewers. Close the tab, open the cockpit on your phone,
and you are back in the same session — it is the same process, and several
browsers can follow it at the same time. With `tmux` present (the default) it
also survives the server restarting, which includes every auto-update. An agent
ends when you end it, or after an hour with nobody watching.

## A room [[alpha]]

A room is a channel with **no agent behind it** — a place for people to talk,
in the same column and the same groups as the agents. Nothing runs there, so it
costs no quota, and like an agent it can mirror a Telegram topic.

The column tells the three kinds apart without your reading a name: an agent is
a round avatar with its initials, a room is a square 💬 tile with no presence
dot, and an agent carrying scheduled prompts wears a dashed ring and a ⏰.

## A turn, and a dialog

You send a prompt; the agent works; the turn ends. While it works you see its
text arrive, the tools it calls and the results.

When Claude Code needs a decision — a permission prompt, a multiple-choice
question — it does not stall in a terminal nobody is looking at. The question
becomes **buttons in the chat**, and an inline keyboard in Telegram. The card
carries the prompt's own text, including Claude Code's warnings, so you approve
what the terminal would have shown you.

## A group

Agents are filed into groups, and on a desktop the groups have their own column
on the left. Picking one narrows the agent list to it. Drag an agent onto a
group to move it, drag groups to reorder them, double-click a name to rename.

On a deployment that can isolate, a group is also a wall: its agents run as
their own OS user, with their own home and secrets.
[Groups](/docs/groups) is the page for that.

## A profile

A named bundle of **role prompt + guardrails + secrets + model**, applied when
an agent starts. Forbid `git commit` in a profile and agents on that profile
cannot commit. Eight roles ship with it — a lead that delegates, a dev, a QA
agent that may not fix the code it tests, a release agent, a product agent,
three go-to-market roles — and every one of them is yours to edit or delete.

The guardrails are **soft**: they stop misfires, they are not a sandbox. On a
single-tenant instance every agent is the same OS user as you.
[Profiles](/docs/profiles) spells out where the line is.

## A worktree

A spawned agent gets its own git worktree and its own branch, so two agents
working on the same repository never collide. Nothing is ever auto-discarded:
an agent that did nothing has its checkout reclaimed when it closes, anything
with changes or commits stays, and `Recover` reopens it.
[Worktrees](/docs/worktrees) has the rules.

## The two channels

**beta** is the default and what a fresh `npx shadok-ai` installs; it moves only
when a version is promoted, so an instance sits still for days. **alpha** moves
on every merge to the main branch: newest work, freshest bugs. The number tells
you which one you are on — an alpha carries a commit count (`0.17.44`), a
promotion is round (`0.17.0`).
