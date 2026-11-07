---
title: The Skill Factory
nav: Skill Factory
summary: Write a Claude Code skill with an agent, share it with the groups that need it, and every agent there has it.
alpha: true
---

# The Skill Factory

The flask icon in the header switches the cockpit to the **Skills** page. A
skill is a Claude Code skill — a named set of instructions, with scripts if it
needs them — and here people and agents write them together.

An agent that has a skill can be asked for it by name in the composer:
`/name:name`.

## The list

Every skill with its tags, who it is shared with, whether it is saved or
carries draft changes, where it is used, and how many times it ran this week.
Filter by tag, by *shared with*, or by status — draft changes, unused, feedback,
archived. Tick rows to share, tag or archive them in one go.

The detail panel beside it holds the skill's numbers, the agents that have it
(group by group, each with its run count), the secrets agents running it get,
and its feedback.

## Creating one

The new-skill form asks for a **name**, which is what people see, and a
**technical name**, which is what agents call it — proposed from the name until
you type your own.

Choose the technical name carefully: it is the skill's repository and plugin
name, so it **cannot be changed afterwards**. A name already taken gets a number
(`-2`, `-3`…), and the form says so before you create it.

Renaming later changes only the displayed name. Agents keep calling it by its
technical name, so attached agents are never disturbed.

## Editing, on one screen

Skills are listed by name on the left. In the middle, the skill reads as one
document — *When to use it*, *Instructions*, *Needs* — with the scripts folded
away for developers.

On the right, **change it by prompt**: a `Shadok-Skillsmith` agent edits, tests
and pushes, and its changes appear in the document.

Two buttons, and no versions to manage:

- **Save draft** keeps your edits while agents keep running the last saved
  skill;
- **Save** makes it what they run. Idle agents already running it reload onto it
  at once; the others pick it up at their next reload.

## Sharing is where it runs

A skill is shared with **only me**, with **one or more groups**, or with
**everyone** — and that is also where it runs. Every agent of those groups has
it; with *everyone*, every agent; with *only me*, only the agents you created,
and nobody else sees it.

A skill is never handed to one agent at a time.

> **Sharing is not a permission boundary.** *Only me* hides a skill; it does not
> seal it. Having a skill grants nothing beyond the rights that already exist —
> each group's own acceptance, and the secrets approved for it — but anyone who
> can see a skill can put it on any agent they can drive.

## Secrets travel by name, once you approve them

A save asks for the secrets the skill declares, plus any vault name its code
reads. It lists those names and asks you to approve them, and agents receive
only what you approved.

A save or a push holding a vault **value** is refused. So is a push carrying a
symlink or a submodule.

## Running one

A saved skill is loaded by every agent it is shared with, as `<name>:<name>`.
To run it on a schedule, set the schedule **on the agent** — its own cron — not
on the skill. Agents report problems with the factory's own feedback command,
and the feedback shows up in the skill's detail panel.

You can also import a skill from `~/.claude/skills`, make a variant of one, or
archive it.
