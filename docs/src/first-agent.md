---
title: Your first agent
nav: Your first agent
summary: The whole loop once — start an agent, answer the question it asks, read the diff it wrote.
---

# Your first agent

A fresh cockpit is not empty. An instance with no agent at all gets one:
**`general`**, running the `Shadok-Boss` profile, in the directory you launched
from and without a worktree. It is the home base — pinned at the top of the
list, with no close button — and it is created once, so it never appears twice.

Its first message is written from a deterministic read of the directory it woke
up in: version control, stack markers, CI configuration, the convention files.
It names what it **saw** (`package.json`, `Shadok.xcodeproj`) and offers one
concrete thing that fits, then lists the other roles this cockpit holds. When
nothing in the directory is recognisable it says so plainly instead of guessing
a stack. It is an offer, not a first-run screen: ignore it and the cockpit works
exactly the same. `SHADOK_GREETING=0` turns it off.

On a brand-new instance that first message also asks you two or three questions
— what this cockpit is for, who works on it, which language — and writes the
answers once as the [instance context](/docs/profiles#instance-context), which
every agent here then receives at spawn.

## Start one of your own

The **＋** on a group creates an agent straight into that group. The creation
box is profile-first — a grid of role cards, the rest folded away — so the
decision you make first is *what this agent is for*:

- **A profile**, which is the role plus its guardrails plus its secrets. Without
  one the agent starts as bare Claude: no role, no guardrail, no secrets.
- **A worktree**, on by default: its own checkout and its own branch, so it
  cannot collide with another agent or with you.
- **A model**, overriding the profile's, with a long-context tick beside it.
- **A name**, which is just the tab's label — rename it later by double-clicking.

Then talk to it. A prompt is a prompt; the agent is a real Claude Code session
and behaves like one.

## Answer the question it asks

Sooner or later it asks something — permission to run a command, or a
multiple-choice question of its own. It arrives as an **Approval requested**
card with buttons. Click one and the turn continues.

Three things are worth knowing about that card:

- It carries the prompt's **own text**: what will run, what will be read, and
  Claude Code's warnings — a read that leaves the working directory through a
  symlink, for instance. You approve what the terminal would have shown you.
- The same question reaches Telegram as an inline keyboard, if that agent is
  mirrored there. Answer in either place.
- Anything the chat cannot express in one click is still reachable: the **engine
  room** shows the raw TUI screen, live, with clickable keys.

## Read what it changed

The diff panel shows what the agent actually changed, against the base its
worktree was branched at. That is the point of the worktree: you read the change
before it touches anything of yours.

The branch and the checkout are **never** merged or deleted for you. Merging is
yours.

## When it asks you to run something

An agent cannot always act — a command needs your keychain, or your shell, or
a confirmation only you should give. When it writes `! cmd` for you, a **▶ run
button** sits on that command's own code block, beside its copy button. One
click, one confirmation showing the exact command, and it runs in the agent's
shell — as you, not as the agent, and only from your browser, since shell mode
sits outside the agent's guardrails. The command and its output stay in the
chat, reload included.

## And when you close the laptop

Nothing stops. The agent keeps working, and if you mirrored it into a Telegram
topic you get its questions on your phone and answer them there.
[Telegram](/docs/telegram) is one token and one `/setup`.
