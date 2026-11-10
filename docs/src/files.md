---
title: Files, photos and voice
nav: Files and voice
summary: Hand an agent a file, get one back, view what it made — and talk to it instead of typing.
---

# Files, photos and voice

An agent that can only read text in a box is half an agent. Everything here runs
on the machine the cockpit runs on: no upload service, no transcription API.

## Files you hand an agent

Paste a file into the composer, drop it there, or pick one with the 📎 button —
an image, a PDF, a CSV. It becomes a **chip** above the text box: a thumbnail
for an image, a named tag for anything else, each with a ✕ to remove it. A
message can be attachments alone, with no words.

On send, an image shows **inline in your own bubble**. Under the hood the agent
receives it as an `[Attached …: path]` line, the same format Telegram uses, so
nothing about how it reads the file changes. If the agent is mirrored into
Telegram, the file is posted into its topic too — a photo as a photo, anything
else as a document — so whoever is reading there sees what you sent instead of a
path.

## Files an agent hands you

When an agent's result **is** a file — a report, an export, a screenshot, an
archive — it arrives as a download card in the chat, inline if it is an image,
and as an upload in the Telegram topic.

It goes through shadok's own file-handover skill rather than depending on the
harness's own file tool, which is **not on every agent**: a long-lived agent
keeps the Claude Code binary it started with, so an older one would otherwise
just print a local path you cannot open.

For the same reason **artifacts are denied** cockpit-wide — a page on claude.ai
is not the file you asked for. `SHADOK_ALLOW_ARTIFACTS=1` lifts that.

## Looking at what came back

An image or a **video** (mp4, webm, mov…) renders inline, a video with a real
player, and clicking a photo opens it full-size in a lightbox. Videos are served
with HTTP range requests, so they seek and stream instead of downloading whole.

The 🖼 button in an agent's bar opens a **media gallery**: a grid of every photo
and video in that conversation, click a thumbnail to view or play it full-size,
then back to the grid.

## Dictate instead of typing

A 🎙 button beside *Send* records your microphone and transcribes it with a
local whisper.cpp — nothing leaves the machine. The text lands in the composer
**editable** and is never auto-sent, so a misheard word is fixed before it goes.
Click to start, click to stop, a red timer runs while recording.

It needs a secure context for the browser to grant the microphone at all:
`localhost` or HTTPS.

## Voice notes and video on Telegram

A **voice message** in a topic is transcribed and acted on. What was understood
is echoed back first (`🎙 « … »`), and the agent is told the words were
**spoken**, so it asks about an odd file name instead of acting on a mishearing.

A **video**, GIF or round video note is really looked at: shadok pulls a handful
of stills out of the clip and transcribes the sound when there is speech. Past
two minutes it keeps the stills and says the audio was left unheard — ask, and
the agent can listen. Telegram caps what a bot may download at **20 MB**; past
that you get a clear notice rather than silence.

## The transcription toolchain

It is installed **on first use**, and the topic says so rather than going quiet
for several minutes: a static ffmpeg, whisper.cpp, and a 181 MB model.

- `SHADOK_WHISPER_MODEL` picks a bigger model if your recordings need it.
- Every download is checked against a **SHA-256 pinned in the source** — ffmpeg
  per platform, the whisper.cpp source, the model at a fixed Hugging Face commit.
  A mismatch is refused, and transcription stays off until the next restart.
- Only two models carry a pinned hash; any other needs
  `SHADOK_WHISPER_MODEL_SHA256=<hex>`, or it is refused.
- `SHADOK_WHISPER_DIR` can point at a directory shared between containers, and
  one copy then serves them all.

## Link to a message

Every message, yours and the agent's, has a 🔗 button beside copy. It copies a
URL like `…/#agent=<session>&msg=<id>`; whoever opens it — after the usual
sign-in — lands on that agent, scrolled to that message, highlighted.

The link lives in the URL's `#` part, so it never reaches the server or a proxy
log. A message older than the history shown, or an agent that was closed, says
so rather than opening somewhere else.

## Compaction summaries, folded away

When Claude Code runs out of context it compacts the conversation and writes a
long "This session is being continued…" summary as the first message of what
follows. Shown in full it buried the chat, so the cockpit folds it into a
collapsible **Context summary** box — collapsed by default, one click to read,
capped and scrolling even when open. It is still real history, just out of the
way.
