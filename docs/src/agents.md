---
title: Agents
nav: Agents
summary: One agent is one claude process — how it lives, who can see it, and what happens when agents launch agents.
---

# Agents

One agent is **one `claude` process**, with one conversation, one directory and
one state. The cockpit's job is to keep several of them useful at once.

## They run in parallel, and they outlive you

Nothing is queued. Five agents working is five processes working.

An agent survives losing its viewers — a reload, another device, a dropped
socket. The process keeps running and is only reclaimed after an hour with
nobody watching (`SHADOK_IDLE_MIN`). With `tmux`, which is the default
transport when it is installed, it also survives the **server** restarting, so
an auto-update does not cost you a single turn; the sessions are reattached on
the next boot. It does not survive a machine reboot.

Ending it is explicit and it ends everywhere: the tab's ✕, *End session*,
Telegram's `/end`, or closing the topic.

## Several windows, one agent

Open the same agent in two tabs, on your laptop and on your phone, in the
browser and in a Telegram topic: it is the same process and they all get the
same events. A prompt sent from one place shows up in the others as an echo
that says **who** sent it — the signed-in account, the agent, or the peer. The
server resolves that name from the session; it is never what the browser claims.

## Content comes from the transcript

Worth knowing if you ever debug something: an agent's answers are not scraped
off the terminal. Claude Code writes every turn into a `.jsonl` transcript and
that file is the source of truth, which is what makes long answers reliable.
The rendered screen is used only for control — submitting, noticing the turn
ended, reading dialogs, and mirroring the raw TUI in the engine room.

One deliberate exception, on the web only: while a long paragraph is still being
generated the transcript has not written it yet, so the cockpit shows the
in-flight text from the screen in a **provisional grey bubble**, replaced
one-for-one by the real block the moment it lands.

## Agents that launch agents

An agent can start other agents, each with its own worktree, branch and role.
It is registered as the **parent** automatically, and it is told when one of its
own children finishes its turn, blocks on a question, or dies.

It hears about **its own** children and nothing else, so a busy cockpit never
wakes it. What arrives is the child's own summary plus pointers — its branch, a
link to its diff — never the diff itself, which on a large session costs far
more than it is worth. You can attach or detach an agent by hand from its ⋯
menu.

A prompt from another agent reaches the recipient under a header naming the
sender and ending with its short session id — its reply address, since a tab
name is not unique. That id never shows in the chat.

## What it left running

An agent's tab carries a turning ⏳ for background shells and a still 👁 for
monitors, each with its count past one. Claude Code knows about both and says
so in its own footer; the cockpit passes it on, so a script an agent left behind
is visible from the outside. Monitors matter most: a persistent one runs for the
whole session and never ends on its own.

## The engine room

The raw TUI screen, live, with clickable keys — for anything the chat cannot
express. With `tmux` there is also an **experimental real terminal** (xterm.js
over the pane's byte stream) when a snapshot is not enough.

## Reload to apply

An agent's context is fixed **at spawn**, so a long-lived one drifts: the role
prompt changed, its guardrails changed, a new skill was seeded, Claude Code
itself updated. The cockpit notices by comparing what the running process
actually got against what a fresh spawn would give it — a content comparison,
not a version number, so a release that changed nothing relevant raises nothing.

A `↻` lights up on the agent, with the reasons on hover, and the version menu
offers to reload the lot. A reload respawns the agent in place and keeps its
history.

You do not have to click it. The cockpit applies it by itself as soon as the
agent has nothing to lose — no turn running, no question waiting, nothing typed
in its box, no background shell or monitor, no child notification queued — and
has been quiet for two minutes. One agent at a time, at most once every 30
minutes each, so a change that will not stick cannot loop.
`SHADOK_AUTO_RELOAD=0` turns the automatic half off. [[alpha]]

## What shadok sent it

A collapsed block at the head of every conversation shows what the cockpit
added to **that** agent: its role, its guardrails and permission mode, the
**names** of the variables injected (never the values), the cockpit prompt, and
the capabilities shadok installs — the skills that let an agent start other
agents, schedule its own prompts or store a credential.

It is captured at spawn, so it is what the running process was actually given,
not a recomputation that would quietly show today's profile. It also says
plainly that it is only shadok's half: Claude Code adds its own context, which
shadok never sees.
