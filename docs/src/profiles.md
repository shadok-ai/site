---
title: Profiles
nav: Profiles
summary: A role, its guardrails, its secrets and its model — applied when an agent starts.
---

# Profiles

A profile is what turns "an agent" into "the QA agent". It is a named bundle,
applied at spawn and remembered across a resume:

- a **role prompt**, appended to the agent's system prompt;
- **permission guardrails** — Claude Code's own deny and allow lists, so you can
  forbid `git commit` and the agent cannot commit;
- the **secrets** from the vault it should receive, by name;
- a **model**, and a thinking effort.

Without a profile an agent starts as bare Claude: no role, no guardrail, no
secrets. The Profiles panel in the header is where they live.

## The eight that ship

A lead that reads everything and delegates; a dev with full access; a **QA agent
that writes the failing test and may not fix the code it covers**; a release
agent that prepares a deployment and leaves the trigger to you; a product agent
that writes the spec instead of the change; and three go-to-market roles (paid,
organic, support).

Each one is yours to edit, and a role you delete stays deleted.

## The guardrails are soft

This is the sentence to read twice. Profile guardrails stop an agent from
**misfiring**. They are not a sandbox: on a single-tenant instance every agent
runs as the same OS user as you, with your files and your keys.

What makes that a real boundary instead of a convention is a deployment that can
isolate — one OS user per group, each with its own home. That is
[Groups](/docs/groups). [[alpha]]

## A model per agent

The creation form picks the model **this one agent** runs on, overriding its
profile's, with a **long context (1M)** tick beside it. Pick a family — Opus,
Sonnet, Haiku, Fable — and it follows Claude Code's releases, or fold out *Pin
an exact version*: that list is read from the installed `claude` binary, so a
model Anthropic ships appears on its own at the next Claude Code update, with
nothing to maintain here.

Leave it on *profile default* and no flag is sent at all. The choice is stored
on the agent, so a resume or a restart keeps it, and the quota gauge meters it
against the window it actually asked for.

The resolution chain is **agent → profile → machine**. The last step is the ⋯
menu's *Default model*, which writes Claude Code's own `settings.json` and
applies at each agent's next spawn. Agents carrying no model of their own follow
Claude Code's default, which tracks the newest model — so that setting is for
**pinning** one, not for getting the latest.

## Thinking effort

How hard an agent thinks before answering, set on a role and overridable per
agent from its menu. Higher levels cost more tokens, and thinking tokens are
billed even when they stay collapsed, so the picker says so.

There is deliberately no thinking on/off switch: current models always think,
and the settings that used to disable it are ignored by them. A toggle would
change nothing.

## MCP servers

A profile can carry **MCP servers** as JSON, in the CLI's `--mcp-config` shape.
Write a token as `${NAME}` and tick `NAME` under the profile's secrets: the CLI
expands it from the agent's environment, so the value is never in the profile,
never in argv and never in `~/.claude.json`.

Put references in `env` or `headers`, **not in `args`** — an expanded argument
shows up in the MCP server's own command line. Pasting a vault value instead of
its name is refused.

## Sign-ins that end on localhost

An MCP or CLI sign-in finishes on `http://localhost:PORT/…`, which your browser
cannot reach when the agents run in a container or on a remote box. Paste that
failed address under *Finish a sign-in* in the Secrets panel and the cockpit
opens it on the agents' machine.

Loopback http addresses with a port only, and only a callback — `code=`,
`state=` or `error=` in the query. The cockpit's own ports and well-known local
services (debuggers, Docker's API, databases) are refused, and only the
listener's HTTP status comes back.
