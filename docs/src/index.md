---
title: Documentation
nav: Documentation
summary: What shadok-ai is, and where to start depending on what you want from it.
---

# shadok-ai documentation

shadok-ai is a **web cockpit for real Claude Code sessions**. Each agent in the
cockpit is one `claude` process, running in its own git worktree, on the Claude
subscription you already pay for. They work in parallel; when one of them has a
question, you answer it with a click — in the browser, or from Telegram when you
are away from the desk.

```
npx shadok-ai
```

It is self-hosted. Nothing about your repositories, your prompts or your
credentials goes anywhere but the machine you run it on.

## Start here

Three ways in, depending on what you came for.

- **You want to try it in the next five minutes.** [Install](/docs/install) is
  one command, then [your first agent](/docs/first-agent) walks the loop
  end to end: start an agent, answer the question it asks, read the diff.
- **You want to know what it is before installing anything.**
  [Key concepts](/docs/key-concepts) is the vocabulary — agent, group, profile,
  worktree — in one page. [Getting started](/docs/getting-started) covers where
  it can run and what each place gives you.
- **It is already running and you want more out of it.** The *Core concepts*
  pages take one mechanism each: [profiles](/docs/profiles) to put an agent on a
  leash, [scheduled prompts](/docs/schedules) to make it watch something for
  free, [the vault](/docs/secrets) to give it a credential without putting it in
  your repository.

## What it actually does

It drives the **Claude Code TUI** — the interactive `claude` CLI — through a
real terminal, and reads the answers back out of Claude Code's own transcript.
There is no API key and no separate billing: an agent is a session of yours,
metered against your subscription like any other.

That has a consequence worth knowing early. The TUI is not a stable API, so a
Claude Code update can break the detection the cockpit relies on. For a
production pipeline, the
[Claude Agent SDK](https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk)
is the right tool. shadok-ai is for the other thing: sitting several agents
side by side and staying in the loop with all of them.

## Two release channels

Every page here describes the **beta** channel, which is what `npx shadok-ai`
installs. Anything marked [[alpha]] is on the alpha channel only — merged, built,
published, but not promoted yet. [Update](/docs/update) explains how to switch
and what the version numbers tell you.
