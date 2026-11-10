---
title: Scheduled prompts
nav: Scheduled prompts
summary: Put a prompt on a schedule, with a guard that runs without the model — so a quiet hour costs nothing at all.
---

# Scheduled prompts

Give an agent a recurring prompt: every N minutes, or daily at `HH:MM` in a time
zone you choose. It is how an agent watches a repository, a queue, a dashboard,
a log.

```
/cron every 30m check the open pull requests and tell me what is blocked
/cron daily 09:00 summarise what the team's agents did yesterday
/cron once 2026-08-25T08:42 run the migration
```

The same thing is in the cockpit, on each agent. `/cron list` prints them with
an 8-character id, and `on`, `off` and `del` take that prefix.

A `daily` prompt can also run on **chosen days only** — a triage that would be
pointless on a Sunday, a weekly report. [[alpha]] Name them after the time:

```
/cron daily 09:00 mon-fri triage whatever came in overnight
/cron daily 18:00 fri      write the week up for the team
```

`mon,wed,fri`, a range like `mon-fri`, `weekdays` and `weekend` all read, and so
do the French names. The cockpit shows the seven days as chips beside the time,
all ticked; untick the ones you do not want. Ticking none is refused rather than
guessed at, and a `daily` with no days named still means every day — which is
what every schedule you already have keeps meaning.

> **Set a time zone.** `daily` is read in the instance's zone (`/timezone`, an
> IANA name like `Europe/Paris`). Without one it follows the machine — and a
> server running in UTC silently shifts every daily prompt.

## The guard that costs nothing

This is the feature the project is named after. Les Shadoks were cartoon birds
whose entire joke was that they pumped: relentlessly, exhaustingly, and for no
result anyone could identify. An agent woken every hour to report that nothing
happened is pumping. You pay a model call to be told there was nothing to do,
and it will tell you that twenty-three more times today.

So a schedule can carry a **deterministic guard command**, which runs *without
the model*:

- it prints nothing → nothing happened, the agent is never woken, the run costs
  **zero tokens**;
- it prints something → that output is prepended to the prompt and the agent
  runs, with the news already in hand.

A watcher that is quiet most of the day costs nothing most of the day. In
exchange you write a few lines of shell, and the guard has one rule worth
knowing: **its exit code is not a failure signal**. `grep`, `diff` and `test`
all exit non-zero with no output exactly when there is nothing to report, so
news is read from stdout. A non-zero exit only counts as broken when it also
wrote to stderr, or was killed, or never started — and a broken guard wakes the
agent, so the monitoring does not die in silence.

The guard runs with the target agent's profile secrets. That is why an **agent**
may only put a guard on itself, while a person may guard any agent they can
drive.

## A fire that says what it did, and a lost one that comes back

Every fire logs one line, including the quiet one — otherwise "ran, nothing to
say" and "never ran" are indistinguishable from the outside, which was a real
bug here once.

A fire that was **lost on delivery** — the quota guard blocked it, the agent was
mid-turn, the socket dropped — is rescheduled about ten minutes out, at most
three times, and never past the next normal slot. A fire that timed out is
**not** replayed: the turn is still running, and replaying would stack two
prompts on one agent.

## Keeping it quiet on purpose

An agent that has nothing to report can answer exactly `NOTHING TO SHOW` and
the cockpit drops the message instead of posting it. A monitor that runs every
five minutes should be silent in the chat too, not just free.
