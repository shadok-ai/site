---
title: Running in Docker
nav: Docker
summary: The official image, the volumes that must survive a recreate, what a recreate rolls back, and the pid-1 flag an older image needs.
---

# Running in Docker

The repository ships an official `Dockerfile`.

```bash
docker build -t shadok-ai .
docker run -d --name shadok-ai --restart unless-stopped \
  -p 127.0.0.1:3789:3789 \
  -v shadok-data:/root/.shadok-ai \
  -v shadok-claude:/root/.claude \
  -v shadok-workspace:/workspace \
  -e SHADOK_HOST=0.0.0.0 -e SHADOK_GUI_PASSWORD=change-me \
  shadok-ai
```

A fresh container needs the one-time Claude sign-in. Do it in the cockpit, or
from a shell: `docker exec -it shadok-ai claude`.

Tagging it `shadok-ai` is fine while you try it out. For an instance that stays
up, tag the build with a date and a commit, then pin the image **id**: a tag is a
label that moves, while a container keeps the id it was created with — so two
containers can both report `shadok-ai` and be running genuinely different
software.

**Putting one online for someone else, behind a domain?** The product repository
carries the whole order of operations on one page, with a `docker-compose.yml` to
copy, the proxy and certificate steps, and the upgrade path:
[deploying an instance](https://github.com/shadok-ai/shadok-ai/blob/main/docs/deploying-an-instance.md).

## What the image carries

**Claude Code**, **shadok-ai** and a **headless browser** (Playwright Chromium,
at `PLAYWRIGHT_BROWSERS_PATH=/opt/playwright-browsers`), so an agent can
screenshot a page or drive the web with no first-run download. Plus `git`, `gh`,
`tmux`, `jq` and a C toolchain for the agents' own work.

## The volumes

Three on every instance. They are what survives `docker restart` **and**
`docker rm` + recreate:

| Volume | Holds |
|---|---|
| `/root/.shadok-ai` | the vault, profiles, the agent list, scheduled prompts, the SSH identity |
| `/root/.claude` | Claude credentials and transcripts |
| `/workspace` | the agents' own files |

Two more exist only where groups isolate for real, and neither sits on the data
volume — so a recreate wipes both: [[alpha]]

| Volume | Holds |
|---|---|
| `/home` | the group homes: each group's own transcripts, memories, keys and worktrees |
| `/var/lib/shadok-ai` | the shared pot, which is the `~/shared/` folder in every group home, and the attachments agents are sent |

Mounting them on a single-tenant instance costs nothing and saves you a recreate
later — and a recreate is what erases whatever accumulated in the meantime. On a
single-tenant instance attachments stay in `~/.shadok-ai/media`, on the data
volume, unchanged. See
[Groups](/docs/groups#in-docker-persist-the-group-homes).

## A recreate rolls Claude Code back

`docker restart` keeps the container's writable layer; `docker rm` and recreate
destroys it. Every volume above survives either one — but **Claude Code is
installed into the image**, not onto a volume, and its own updater writes there.
A recreate therefore returns it to the version baked into the image you built,
which on a container up for months is a real downgrade. It surfaces as an API
error naming a minimum version, with nothing in it about Docker.

That is the reason to rebuild the image when you recreate, rather than recreating
on the old one. The cockpit is the opposite case: it updates itself into
`~/.shadok-ai/app`, which is on the data volume, so those upgrades survive a
recreate and you never rebuild for them — see [Updates](/docs/update).

## Two things about the network

`SHADOK_HOST=0.0.0.0` is the only value that works in a container: the
container's own loopback is not reachable from the host. And it **requires a
password**, as everywhere else.

Publish the port on the host's loopback — `-p 127.0.0.1:3789:3789`. Plain
`-p 3789:3789` publishes on **every** host interface and **bypasses
ufw/firewalld**, because Docker inserts its own iptables rules upstream of them.
[Beyond this machine](/docs/expose) is the page for exposing it on purpose.

## pid 1 reaps

The image enters through `tini`, and that is load-bearing in the long run.

Agents orphan processes all day: a backgrounded `sleep` loop, an abandoned
`esbuild`, a killed `gh`. An orphan is re-parented to pid 1 and only pid 1 can
reap it — which the cockpit's own supervisor never does, since Node waits only
for the children it spawned itself. A zombie costs no memory and no CPU, just a
pid slot, so nothing shows at all until the container's pid budget runs out and
it can no longer fork anything: no new agent, no `git`, no shell. Measured on an
instance running since August: **79,055 zombies against a 113,098 pid budget**.

Two consequences for an existing deployment:

- running an image from before this, or any image whose pid 1 is the app? Add
  `--init` and Docker supplies the reaper.
- it is decided when the container is **created**. `docker restart` empties the
  table — pid 1 restarts, the kernel drops the lot — but the leak starts over.
  A recreate is what makes it stop.

## The SSH identity

In a container, shadok-ai gives itself an SSH key on first boot so agents can
`git clone`/`push` private repositories and `ssh` into servers. It lives under
`~/.shadok-ai/ssh/` — on the data volume you already mount — so it survives both
a restart and a recreate, unlike a plain `~/.ssh`, which a recreate wipes. Each
container has its own volume and therefore its own unique key, and `~/.ssh` is
symlinked to it, so `git` and `ssh` use it with no extra configuration. Nothing
to add to `docker run`.

Read the public key to register it as a GitHub **deploy key**, or in the target
hosts' `authorized_keys`:

```bash
docker logs <name> | grep 'ssh identity'          # printed on every boot
docker exec <name> cat /root/.shadok-ai/ssh/id_ed25519.pub
```

On a normal host this is a **no-op**: shadok never touches your `~/.ssh`.
Detection is `/.dockerenv`; `SHADOK_SSH_IDENTITY=0` disables it,
`SHADOK_FORCE_SSH_IDENTITY=1` forces it on.
