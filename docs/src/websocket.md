---
title: The WebSocket protocol
nav: WebSocket protocol
summary: The page is replaceable — all the intelligence is server-side. Here is the protocol to speak to it.
---

# The WebSocket protocol

The cockpit's page is plain static HTML: every decision lives server-side. Any
client — another front end, a bot, a script — can replace it by speaking this
JSON protocol on `ws://…/ws`. The built-in Telegram bridge **is** such a client:
it connects to the same server over loopback.

**Sessions are shared.** The server keeps one `claude` process per session id.
If several clients `start` the same id they attach to the same process and all
receive the same events, including other clients' prompts. Closing a connection
only detaches that client; the session is reclaimed after `SHADOK_IDLE_MIN` with
no client at all, or immediately on an explicit `stop`, which ends it for
everyone.

## Client → server

| Message | Purpose |
|---|---|
| `{type:"start", cwd?, resume?, continue?, worktree?, branch?, repo?, profile?, parent?, origin?}` | starts or attaches to the session, once per connection |
| `{type:"prompt", text, force?}` | sends a prompt — `force` bypasses the pace guard |
| `{type:"choose", n}` | single-select dialog: picks and validates option n |
| `{type:"toggle", n}` / `{type:"confirm"}` | multi-select: toggle option n / submit |
| `{type:"freetext", n, text}` | the "Type something" option: a free-form answer |
| `{type:"key", key}` | raw keystroke (`enter`, `escape`, `up`, `down`, `tab`, `ctrl-c`, or a single character) |
| `{type:"settle"}` | after a manual intervention: wait for the turn to finish |
| `{type:"restart"}` | respawn the agent in place, picking up new secrets or profile |
| `{type:"set-parent", parent}` | attach this channel under another (`null` detaches) |
| `{type:"term-attach"}` · `{type:"term-detach"}` · `{type:"term-input", data}` · `{type:"term-resize", cols, rows}` | **experimental, tmux only** — the pane's raw byte pipe |
| `{type:"stop", sessionId?}` | ends the session for all clients; `sessionId` targets another channel, for zombie cleanup |

Two notes on `start`. **`origin`** (`"web"`, `"cron"`, `"telegram"`, `"agent"`,
`"peer"`, `"cli"`) travels with the prompt echo so other clients can say who
spoke — and it is **derived by the server** from what the connection proved, not
believed from the frame; the frame's own value is only honoured to narrow an
unauthenticated local client. **`parent`** records who launched this agent; a
refused link is dropped and logged, never fatal to the spawn.

A prompt also reaches the TUI under a `⟦platform · time · sender⟧` header, so
the agent knows whether a human or a sibling is talking to it. A line of your
prompt text shaped like one of those headers is prefixed with `\` so it stays
text.

## Server → client

| Message | Purpose |
|---|---|
| `{type:"ready", sessionId, cwd}` | session started or attached |
| `{type:"working"}` / `{type:"turn-done", sessionId}` | turn started / finished |
| `{type:"stream-text", text, at?}` | a complete assistant text block, from the transcript. `at` is when it was **written**, not when it was read |
| `{type:"stream-tool", id, name, summary}` / `{type:"stream-result", …}` | a tool call / its result |
| `{type:"tokens", tokens}` / `{type:"context", pct}` | token usage / context fill |
| `{type:"history", turns:[…]}` | the transcript, replayed on resume or attach |
| `{type:"dialog", question, options:[{n,label,hint,checked?}], multi}` | a choice is pending |
| `{type:"screen", text, working}` | the rendered TUI screen, whenever it changes |
| `{type:"prompt-echo", text, origin?, from?}` | a prompt sent by another client. `from` is resolved server-side; a frame's own `from` is believed only from the Telegram bridge |
| `{type:"parent", parent}` | the channel's parent changed, broadcast so every tab follows |
| `{type:"pace-blocked"}` / `{type:"pace-hold"}` / `{type:"pace-resumed"}` | the quota guardrail |
| `{type:"auto-retry"}` / `-cancelled` / `-gave-up` | a transient API error being retried |
| `{type:"version", …}` / `{type:"server-reload", version}` | an update is available / the server updated, reload |
| `{type:"term-data", data}` | **experimental** — raw pane output for a client-side terminal |
| `{type:"gone"}` / `{type:"error", message, code?}` / `{type:"exited", code}` / `{type:"stopped"}` | session lost, errors, termination |

`error.code` saves a machine client from matching on message text: `"busy"` for
a prompt refused mid-turn, `"logged-out"` for a spawn refused because the
instance is not signed in to Claude, `"resume-refused"` for a shortened id that
matches no agent or several.

## HTTP

Behind the same auth as the socket. The read side: `/usage`, `/live`,
`/sessions`, `/recover`, `/diff`, `/channels`, `/groups`, `/crons`, `/profiles`,
`/secrets`, `/defaults`, `/version`, `/auth`, `/first-agent`. The write side
adds `/channel` (DELETE), `/timezone`, `/title`, `/theme`, `/telegram`,
`/autoupdate`, `/update-channel`, `/permission-mode`, `/secrets/audit`,
`/backend` and its `/test` and `/models`, and `/media/<name>` for an attachment
served back for inline display.

Two shapes to know about:

- **`GET /channels` adds a derived `crons` field** — the agent's schedules, for
  the ⏰ on its tab. It is computed, never stored.
- **The instance-wide writes are admin-only, and browser-only.** The
  auto-update and channel switches, the permission mode, a bare restart-all, the
  Claude sign-in routes, the title, the theme and deleting a profile all require
  a signed-in person; a member sees those controls disabled. An agent's session
  key is refused there, deliberately — see [an agent is not the
  admin](/docs/accounts#an-agent-is-not-the-admin). [[alpha]]
