# Launch assets

The hero is generated, not hand-made. Regenerate it whenever the cockpit UI
moves — the full staging checklist and the privacy pass are in Task 3 of the
launch plan, which lives with the product repository.

One take produces all four files:

```
demo.webm         the hero, VP9 — what almost every visitor plays
demo.mp4          H.264 fallback for browsers that still refuse VP9
demo-poster.webp  the first frame; the LCP element on mobile
og-card.jpg       1200x630, the card every shared link shows
```

It used to be a single 5.29 MB `demo.gif`. That was 99.7% of the page and put
mobile LCP at 4,424 ms on a 10 Mbps connection — Google's "poor" band starts at
4,000. A GIF also cannot be paused by anything (WCAG 2.2.2), and X caps card
images at 5 MB and renders them as stills anyway, so sending one as `og:image`
bought nothing and broke every share.

## 1. Start a capture instance

Run it from **its own directory**, not from the repo. Channels are persisted per
launch directory and tmux sessions outlive the server, so an instance started
from the live cockpit's directory inherits its channel list and can reattach to
agents that are mid-work. A different port does not protect against that.

````bash
npm run build
mkdir -p /tmp/shadok-capture && cd /tmp/shadok-capture
PORT=3899 node ~/projects/shadok-ai/dist/server.js &     # never 3789
````

Auto-update will otherwise kill it: `autoUpdate` in `~/.shadok-ai/config.json`
wins over the environment, and without a supervisor the server exits and nothing
restarts it. The value is read **only at boot**, so flip it to `false`, start the
capture instance, and restore it immediately — the running production server
holds its own value in memory and never notices.

## 2. Stage the agents by hand

Deliberately not scripted: scripting it would mean filming whatever an agent
happened to do that day. Create three or four agents on the same repo with
worktree isolation on — that parallelism is the product's actual story — give
them real work, and leave the agent you want filmed **with a question pending**.

Then run the privacy pass from the plan before recording anything: no secrets
panel, no tokens, no employer or client material on screen.

## 3. Record

````bash
NODE_PATH=$HOME/projects/aibrowser/node_modules \
  SHADOK_URL=http://localhost:3899 FILMED=3 node docs/launch/capture-demo.mjs
````

`FILMED` is the index of the tab to film; `BUSY` (default `1,2`) lists the tabs
put to work off-camera so their LEDs move during the take. The script prints a
timestamp for each beat — use those to pick the trim window.

Raw recordings land in `docs/launch/raw/` and are git-ignored: they are large,
and they are the copy most likely to still hold something that should not ship.

## 4. Cut

````bash
bash docs/launch/make-demo.sh          # newest raw take, outputs into the repo root
````

The shot list and its timings live at the bottom of `make-demo.sh`, and they are
keyed to the beats `capture-demo.mjs` printed — **re-check them after a new
take** or the camera will punch in on the wrong thing. Everything else is
tunable from the environment: `DEMO_W`, `DEMO_H`, `DEMO_FPS`, `DEMO_CRF_VP9`,
`DEMO_CRF_H264`.

Needs `ffmpeg` and `cwebp` (`brew install ffmpeg webp`). The ffmpeg on this
machine is built without libwebp and says only "Unknown encoder" about it, which
is why the poster goes through `cwebp`.

The Open Graph card is drawn as HTML and screenshotted, by
`make-demo.sh` → `make-og-card.mjs`. It needs a Playwright; there is no
`node_modules` here, so it borrows the one in `~/projects/aibrowser` — override
with `PLAYWRIGHT_FROM`.

## 5. Check the share card against the deployed page

````bash
node docs/launch/check-meta.mjs https://shadok-ai-site.vercel.app/
````

Reads the **served** page, not this source, then fetches what it claims: the
card has to be absolute, reachable, an image, and under 1 MB. It also runs
against a local server as a dry run, and says so.
