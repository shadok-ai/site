---
title: Telegram
nav: Telegram
summary: Mirror an agent into a Telegram topic and drive it from your phone — pairing, commands, operators.
---

# Telegram

The cockpit is a web page, and a web page is no good to you in a taxi. The
Telegram bridge mirrors agents into a group: **one topic, one agent**. You read
what it writes, answer its questions with an inline keyboard, and send it new
work — including photos, files and voice notes.

It is the same session the browser sees. The bridge holds a WebSocket client to
the cockpit's own server, so there is one agent and two windows onto it, never
two copies.

## Set it up

The Telegram panel in the header carries a folded step-by-step guide, open until
a token is saved and a group is bound. The short version:

1. Create a bot with Telegram's **@BotFather** and paste its token into the
   panel (or answer the question on first launch).
2. Add the bot to a group with **Topics** enabled. Make it an admin with *Manage
   topics*, and with *Delete messages* so `/secret` can scrub values after
   itself.
3. In the panel, click **Pair Telegram**. It shows an 8-digit code, valid 10
   minutes, single use, cancelled after five wrong tries.
4. Send `/setup <code>` in the group to make it the board. The panel's
   one-click links pass the code for you.

The bot answers nobody until it is paired. One group per instance; to move to
another, unbind it in the panel and pair again.

## Commands

| Command | |
|---|---|
| `/setup <code>` | bind this group as the board — in an already-bound board, makes the sender an operator |
| `/spawn [profile] <name>` | a new isolated agent in its own topic (and a web tab) |
| `/stop` (alias `/esc`) | interrupt the current turn — does **not** end the session |
| `/new` · `/end` | reset · kill the session |
| `/restart` | respawn the agent in place, e.g. to pick up a new secret |
| `/profiles` · `/list` | list the roles · list the bindings |
| `/cron every 30m <prompt>` | schedule a recurring prompt on this agent |
| `/cron daily 09:00 <prompt>` | same, once a day, in the instance's time zone |
| `/cron once 2026-08-25T08:42 <prompt>` | fire once on that date, then stay disabled and marked `(fired)` |
| `/cron list` · `/cron on\|off\|del <id>` | manage them — `<id>` takes the printed 8-character prefix |
| `/secrets` · `/secret KEY value` · `/unsecret KEY` | the vault; an existing name is never replaced without `--overwrite` |
| `/login` · `/code <code>` | sign the instance in to Claude |
| `/update` | fetch the latest version and respawn |

Creating a topic by hand also spawns an agent. Anything that is not a command is
sent to that topic's agent as a prompt — photos and files included, which are
downloaded and handed to Claude Code.

## Who may do what

Being in the board group lets you talk to its agents, answer their dialogs and
use the per-topic commands. It does **not** let you act on the host.

The commands that reach the vault, the Claude account or the process —
`/secret`, `/unsecret`, `/login`, `/code`, `/update`, and `/spawn` with an
explicit profile — are reserved to **operators**: whoever typed a pairing code.
To make someone an operator, click **Pair Telegram** again and have them send
`/setup <code>` in the already-bound group. Anyone else gets a refusal that says
exactly that. Unbinding the group clears its operators.

**Direct messages belong to one person.** The first user to DM the bot claims
it and everyone else is refused. At startup the owner is adopted from an
existing DM or from the board group's creator, so an instance that already has
an owner never hands itself to whoever messages next — a bot username is public,
and a DM is a shell.

## Voice and video

Send a **voice message** to a topic and it is transcribed locally, then acted
on. What was understood is echoed back first (`🎙 « … »`), so a misheard
instruction is visible before it runs — and the agent is told the words were
spoken, so it asks about an odd branch name instead of acting on a mishearing.

Share a **video**, a GIF or a round video note and the agent actually sees it:
shadok pulls a handful of stills out of the clip and transcribes the sound when
there is speech. Clips longer than two minutes keep their stills and the prompt
says the audio was left unheard — ask, and the agent can listen.

Both run on a toolchain installed on first use, on your machine: nothing leaves
it. [Files, photos and voice](/docs/files) has the detail, including the 20 MB
ceiling Telegram puts on what a bot may download.
