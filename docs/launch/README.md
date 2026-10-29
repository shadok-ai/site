# The mirror, and the pictures that come out of it

Every screenshot on shadok.ai is a real cockpit. Not the live one — that is full
of client names and work in progress — but a **mirror**: a second instance,
kept running, driving a company that does not exist.

The product's interface moves most days. So this is built to be re-shot in
minutes rather than re-described in words: when a merge changes what the cockpit
looks like, the answer is to retake the picture.

```bash
docs/launch/mirror.sh status     # up on 3899 — {"current":"0.16.6",…}
docs/launch/mirror.sh start      # after a container restart
```

## What the mirror is

| | |
|---|---|
| port | **3899**, loopback only, no GUI password (3789 is the live cockpit — never touch it) |
| HOME | `/root/capture-home` — its own channels, crons, vault, ledger |
| token | a **symlink** to the live `~/.claude/.credentials.json`; a copy goes stale and every agent then answers *"Login expired · Please run /login"* |
| transport | `SHADOK_TMUX=0`. tmux keys its socket by uid, not by HOME: on the tmux transport the mirror's agents join the **live** tmux server and write their transcripts into the live `~/.claude`, so the mirror shows no history at all |
| launch dir | `/root/capture-work` — a different directory from the live one, or it inherits its agent list |
| update | `autoUpdate: false`, and it runs the npm-installed app the live supervisor keeps current. Restart the mirror to pick up a new build |

The fictional company lives in `/root/capture-work`: `orchard` (an orders API),
`orchard-site`, `support-inbox`. Groups: **Main, Tech, Marketing, Support**.

## Staging

Deliberately by hand, with `pilotctl` pointed at the mirror:

```bash
export SHADOK_PORT=3899
P=~/.claude/skills/shadok-ai-agents/pilotctl.mjs
node $P spawn --cwd /root/capture-work/orchard --profile Shadok-dev --name orders-api --worktree
node $P prompt <id8> "Add a POST handler to the /orders route…"
```

Three things to know before an agent stalls on you:

- a fresh worktree opens Claude Code's **trust screen** ("Is this a project you
  created or one you trust?") and nothing else happens until it is answered.
  Seed `hasCompletedProjectOnboarding` and `hasTrustDialogAccepted` for the new
  directory in `/root/capture-home/.claude.json` instead;
- `pilotctl prompt` can answer `{"status":"answer","text":""}` while the agent is
  still working. Read `/live` or the screen, not that;
- what you type at the agent is **in the picture**. "Ask me with your question
  tool, two options, nothing else" ends up on the page. Ask the way a person
  would ask, and let the agent choose to put the decision back.

## Taking the pictures

```bash
PLAYWRIGHT=/root/tools/node_modules/playwright/index.mjs    # no node_modules here

OUT=./frames node docs/launch/film-agents.mjs     # 72 stills of the agents column, 2x
OUT=./shots  node docs/launch/shoot-page.mjs      # the site itself: first screen, full, phone
node docs/launch/measure-images.mjs               # every drawn ratio over its natural ratio
node docs/launch/check-meta.mjs https://shadok.ai/   # the share card, on the live page
node docs/launch/make-og-card.mjs shots/cockpit-approval.webp og-card.jpg
```

Then encode — any ffmpeg will do, `ffmpeg-static` included:

```bash
# film-agents.mjs prints the crop and writes frames.ffconcat, which carries the
# real gap between frames — that is what keeps the clip at life speed.
C=crop=504:500:392:128
ffmpeg -f concat -safe 0 -i frames/frames.ffconcat -t 8 -vf "$C" -r 25 \
       -c:v libvpx-vp9 -b:v 0 -crf 36 -pix_fmt yuv420p -an shots/agents-live.webm
ffmpeg -f concat -safe 0 -i frames/frames.ffconcat -t 8 -vf "$C" -r 25 \
       -c:v libx264 -preset slow -crf 27 -pix_fmt yuv420p -movflags +faststart -an shots/agents-live.mp4
ffmpeg -f concat -safe 0 -i frames/frames.ffconcat -ss 2 -frames:v 1 -vf "$C" -quality 80 shots/agents-live-poster.webp
ffmpeg -i shot.png -vf scale=1440:-2 -quality 82 shots/<name>.webp
```

Rules the page already paid for:

- **film with the screencast, and keep the frame times.** Playwright's recorder
  films at CSS size (264px of column blown up on a page is mush), and a loop of
  `page.screenshot()` lands frames at an irregular 2-3 per second — encode those
  at a flat 9fps and the cockpit plays back at three times life speed, juddering.
  CDP screencast gives ~40 frames a second at 2x, each stamped, and the stamps
  become the durations in `frames.ffconcat`;
- **a wide screenshot does not survive a phone.** Below 760px the page serves a
  capture taken at 390px through `<picture>`; a desktop fragment shrunk into a
  350px column puts its type at six pixels;
- **crop a panel to the panel.** A modal over a dimmed cockpit, at page width, is
  unreadable murk;
- **`height: auto` wherever CSS sets a width.** The `width`/`height` attributes
  are presentational hints: a CSS width alone leaves the attribute height in
  force and the picture is stretched. `measure-images.mjs` catches it;
- **nothing with a real client's name on screen.** That is why the mirror exists.

## The retired hero video

`capture-demo.mjs` and `make-demo.sh` filmed the 39-second hero that the page
carried until October 2026 (`demo.webm` / `demo.mp4` / `demo.gif`). The page no
longer shows it, but the files stay: the product's README links
`shadok.ai/demo.gif`.
