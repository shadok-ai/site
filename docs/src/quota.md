---
title: Quota and pace
nav: Quota and pace
summary: Agents spend your subscription. The gauges show both windows, and the guard can hold one back.
---

# Quota and pace

Every agent consumes your Claude quota **like a normal session**. Five agents
working is five sessions' worth of usage. That is the one cost model to keep in
mind, and the cockpit puts it on screen rather than letting you find out at the
end of the week.

## The gauges

Both subscription windows, live: the **5-hour** one and the **7-day** one. The
bar's centre is the pace that would spend the window exactly as it elapses, so
the question it answers is not "how much is left" but "am I ahead of the
clock".

Beside them, each agent carries a **context** bar — how full its conversation
is, measured against the window the model actually asked for, so an agent on a
long-context model is metered against that.

## Which agent is spending it [[alpha]]

The gauges above are the whole subscription. For one agent's share, open its ⋯
menu and pick **📊 Stats**: its token use over the last hour, 24 hours, 7 days
and 30 days, each window split in a tooltip into input, output, cache-write and
cache-read. The same view shows how long the agent has been **up** — the
session's age, which survives a restart — and when it **last respawned**, which
is the running process.

The header's own ⋯ menu totals those windows across **every agent you can
see** — your groups if you are a member, the whole instance if you are an admin
— so the fleet figure never shows you work you are not allowed to look at.

Beside each window sits a **notional cost**, and *notional* is the word that
carries the meaning: shadok drives your Claude **subscription**, not the API, so
nothing is billed per token. The figure prices those tokens at Anthropic's API
list rates, which makes it a fair way to compare two agents and not an invoice.

The numbers are read from the agent's current session transcript, once, when you
open the view. The instance total sums the running agents from memory and reads a
dormant one's transcript a single time, then keeps it, so neither view stalls the
cockpit.

## The pace guard

Turn it on and a prompt is refused when usage has run ahead of the ideal pace.
The agent is not killed and nothing is lost: the prompt is held, you are told,
and anything can **force through** when you mean it.

Two consequences worth knowing:

- A **scheduled** fire blocked this way is treated as a transient miss and
  retried about ten minutes later, up to three times, never past its next normal
  slot. See [Scheduled prompts](/docs/schedules).
- A **spawn** blocked this way is silent to the parent agent. If you are
  building something on top of agents spawning agents, surface it.

## The way out

An agent on [a model you host yourself](/docs/model-backend) spends nothing of
your subscription, so it is **never held by the pace guard** and needs no Claude
sign-in. Pointing one role at a local model and leaving the rest on the
subscription is a profile away.
