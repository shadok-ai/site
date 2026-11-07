---
title: CLI and library
nav: CLI and library
summary: Run one prompt from a shell, drive agents from another agent, or embed the pilot in your own code.
---

# CLI and library

Three ways to use shadok-ai without the cockpit's page.

## One prompt, one answer

Separate from the cockpit: run a single prompt and print the answer.

```bash
shadok-ai-run [options] "<prompt>"      # or: node dist/cli.js …

  --cwd <dir>       working directory of the claude session
  --continue, -c    resume the latest session of this directory
  --resume <id>, -r resume a specific session (id printed at end of run)
  --watch           mirror the TUI live on stdout
  --keep            keep the session open at the end
  --timeout <sec>   max wait for the response (default 600)
```

Without `--continue` or `--resume`, every run starts a **new** session. The
session id is printed at the end of the run, and it is an ordinary Claude Code
session id — it lives in `~/.claude/projects/<encoded cwd>/` like any other.

```bash
shadok-ai-run --cwd ~/my-project "Explain this project's structure"
# ▶ session: 5fe046dd-…

shadok-ai-run --cwd ~/my-project --resume 5fe046dd-… "Now refactor it"
shadok-ai-run --cwd ~/my-project -c "Continue on the latest session"
```

## Driving agents from an agent

Agents get a thin client, `pilotctl`, and it is how an agent starts and steers
other agents. Each command prints **one JSON object** on stdout, and starts the
cockpit's server if it is not running — so the agents it creates are visible in
the web UI, and you can step in.

| Command | Effect |
|---|---|
| `spawn [--cwd DIR] [--worktree] [--profile NAME] [--name LABEL]` | creates an agent → `{sessionId, cwd, branch}` |
| `prompt <id> "text" [--timeout s]` | sends a prompt and waits for the end of the turn |
| `dialog <id>` · `choose <id> <n>` · `toggle` + `confirm` · `freetext` | read and answer a pending question |
| `list` · `diff <id>` · `screen <id>` · `stop <id>` | the driven agents, an agent's changes, its raw screen, end it |
| `talk-handle` · `talk <handle> "message"` | share an address · send a one-way letter across groups |
| `… --peer <alias>` | run the same command against [another instance](/docs/peers) |

`prompt` returns `{status:"answer"}`, `{status:"dialog"}`, `{status:"timeout"}`
or `{status:"pace-blocked"}` — and the last two are where callers get it wrong.
A **timeout** means the turn is still running server-side: do not resend, check
back with `dialog <id>`. A **pace-blocked** means nothing was sent at all; the
[quota guard](/docs/quota) held it, and insisting in a loop is the wrong move.

One guardrail worth repeating: **never `stop` a session you did not create.**
It ends that session for every client, including the person watching it in a
browser.

## As a library

```js
import { PtyPilot } from "shadok-ai";

const pilot = new PtyPilot({ cwd: "/my/project" });
pilot.start();
await pilot.waitForIdle();                 // TUI ready

await pilot.submit("Fix the bug in auth.ts");
await pilot.waitForIdle({ timeoutMs: 600_000 });
console.log(pilot.screen());               // rendered screen

await pilot.submit("Now add a test");      // same session, second turn
await pilot.waitForIdle();

await pilot.stop();                        // clean /exit, kill as fallback
```

| Method | Purpose |
|---|---|
| `start()` / `stop()` / `kill()` | process lifecycle |
| `submit(text)` | types a prompt and Enter, with verification and retries |
| `write(text)` / `press(key)` | low-level keystrokes (`enter`, `escape`, `up`, `tab`, `ctrl-c`…) |
| `screen()` / `fullBuffer()` | rendered screen / full buffer |
| `waitForIdle({stableMs, timeoutMs, settleOn?})` | waits for the end of a turn; `settleOn(screen)` names a dialog, so one that never holds still — a ticking countdown — still ends the wait |
| `waitFor(predicate)` | waits for an arbitrary screen condition |
| `isWorking()` | true while Claude is working |
| `onData(cb)` / `onExit(cb)` | the raw ANSI stream / process exit |

`TmuxPilot` exposes the same surface and additionally survives a server
restart. The repository's `examples/two-turns.mjs` shows a two-turn
conversation, and `debug/probe.mjs` logs the terminal sequences exchanged —
which is the tool to reach for when a Claude Code update breaks the detection.
