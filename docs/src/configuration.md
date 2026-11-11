---
title: Configuration
nav: Configuration
summary: Where settings live, which ones are per launch directory, and every environment variable.
---

# Configuration

Configuration lives in `~/.shadok-ai/config.json`, mode 600, and it is
**authoritative over the environment once set** from the cockpit. Two
exceptions, where the environment wins:

- `SHADOK_GUI_PASSWORD` — a password saved with `--password` is used only when
  that variable is unset, and nothing in the cockpit can change it. In Docker,
  the password is the one the container was created with.
- `TELEGRAM_BOT_TOKEN`.

## Per launch directory

Several things are keyed to the directory you started the server in, not to the
machine: the **agent list**, the **scheduled prompts**, the **accounts**, the
cockpit's **name** and **accent colour**, and the Telegram token, allowed chats
and on/off switch.

Run the server from another repository and you get a different cockpit, with a
different bot. Light or dark **mode**, by contrast, is per browser — the accent
is the instance's shared identity, the mode is personal. The cockpit opens
light; the header's ⋯ menu has the switch, under **Appearance**, and the
browser you flipped remembers it.

## Time zone

`timezone`, an IANA name like `Europe/Paris`, settable with `/timezone`, is the
default zone for reading a `daily` schedule. Without it the hour follows the
machine, which silently shifts every daily prompt on a server running in UTC.

## How much an agent may do without asking

New agents start in one of four modes, from the one that stops at every action
to the one that stops at none:

| Mode | What it does |
|---|---|
| Ask before each action | every command and edit waits for you |
| Auto-apply edits | file edits go through, commands still ask — the default |
| Auto mode | no prompts for the usual work |
| Bypass | zero prompts, ever |

The version menu has the dropdown. [[alpha]] `SHADOK_PERMISSION_MODE` sets the
same thing at launch, and the choice applies to agents **spawned afterwards**,
not to the ones already running.

Bypass deserves its own sentence, and the cockpit asks you to confirm it.
An agent is not sandboxed: it runs as the same user as the cockpit and it reads
things it did not write — web pages, cloned repositories, messages. With every
prompt removed, text that arrives from outside and text you wrote carry the
same weight. It is the right mode for a machine you keep for that, and the
wrong one for the laptop your keys live on.

## Environment variables

| Variable | |
|---|---|
| `PORT` | HTTP/WS port |
| `SHADOK_HOST` | interface to bind (default `127.0.0.1`, this machine only) |
| `SHADOK_GUI_PASSWORD` | require a password for the cockpit — overrides one saved by `--password` |
| `SHADOK_ORIGINS` | extra browser origins allowed, comma-separated (reverse proxy); their hosts also pass the Host check |
| `SHADOK_ALLOWED_HOSTS` | host names the cockpit answers besides its own (the DNS-rebinding guard); with a password, setting it makes the check strict. `*` disables it |
| `SHADOK_TMUX=0` | force the plain pseudo-terminal transport instead of tmux |
| `SHADOK_IDLE_MIN` | minutes with no client before a session is reclaimed (60) |
| `SHADOK_AUTO_RELOAD=0` | do not apply a pending "reload to apply" by itself — leave it to the ↻ click |
| `SHADOK_AUTO_RELOAD_IDLE_SEC` | how long an agent must be quiet before that automatic reload (120) |
| `SHADOK_PERMISSION_MODE` | the mode new agents start in (default `acceptEdits`) |
| `SHADOK_AUTOUPDATE` | fallback only — the cockpit's own setting wins once used |
| `SHADOK_PILOT_PROMPT=0` | do not inject the cockpit system prompt |
| `SHADOK_GREETING=0` | the lead agent starts silent — no first-message greeting |
| `SHADOK_LEDGER=0` | turn **off** the shared-ledger reflex: a per-instance state table siblings read and write so they stop re-surfacing resolved work, plus a delta pushed ahead of each message. On by default |
| `SHADOK_SEED_SKILLS=0` | do not rewrite the machine-wide skill scripts at boot — for a build run side by side with another instance, so it does not hand that instance's agents scripts newer than the server they call |
| `SHADOK_RESUME_SUMMARY=1` | do not auto-answer Claude Code's resume-from-summary prompt |
| `SHADOK_WS_PING_MS` | WebSocket keep-alive interval (25s) |
| `SHADOK_ALLOW_ARTIFACTS=1` | allow agents to answer with a claude.ai artifact instead of a real file |
| `SHADOK_WHISPER_MODEL` · `SHADOK_WHISPER_MODEL_SHA256` · `SHADOK_WHISPER_DIR` | the local transcription model, its pinned hash, and a shared install directory |
| `SHADOK_SSH_IDENTITY=0` · `SHADOK_FORCE_SSH_IDENTITY=1` | disable / force the container SSH identity |
| `SHADOK_HOME_BASE` | where a dropped agent's home is created (`/home`) |
| `SHADOK_CONNECT_BROKER` | the broker that holds the LinkedIn client secret for [connected accounts](/docs/connected-accounts) (`https://connect.shadok.ai`) |
| `TELEGRAM_BOT_TOKEN` · `TELEGRAM_ALLOWED_CHATS` | override the stored Telegram config |
| `ANTHROPIC_BASE_URL` · `ANTHROPIC_AUTH_TOKEN` · `ANTHROPIC_MODEL` · `SHADOK_CONTEXT_WINDOW` | run on [another model](/docs/model-backend) |
| `CLAUDE_CODE_OAUTH_TOKEN` | the usage gauges only; `claude` itself uses the keychain |

## What lives under `~/.shadok-ai`

The vault, the profiles, the per-directory agent lists and schedules, the
transcript tail offsets, the auto-updating application copy, the agents'
worktrees, the container SSH identity, and the shared ledger. It is the one
directory to back up, and the one to mount as a volume in Docker.
