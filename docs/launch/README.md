# Launch assets

`demo.gif` is generated, not hand-made. Regenerate it whenever the
cockpit UI moves — the full staging checklist and the privacy pass are in Task 3 of the launch
plan, which lives with the product repository.

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

## 4. Convert

A single-pass GIF quantises to one shared 256-colour table and turns UI text to
mush. Generate a palette from the actual frames first. The `-ss`/`-t` window
comes from the timestamps the script printed.

````bash
RAW=$(ls -t docs/launch/raw/*.webm | head -1)
ffmpeg -y -ss 13 -t 25 -i "$RAW" -vf "fps=10,scale=900:-1:flags=lanczos,palettegen=stats_mode=diff" /tmp/pal.png
ffmpeg -y -ss 13 -t 25 -i "$RAW" -i /tmp/pal.png \
  -lavfi "fps=10,scale=900:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle" \
  -loop 0 demo.gif
````

900 px wide is deliberate: that is what GitHub renders a README image at, so the
browser never rescales it. Keep the result under ~5 MB — drop `fps` first, then
`scale`, and only then shorten the take.

Raw recordings land in `docs/launch/raw/` and are git-ignored: they are large,
and they are the copy most likely to still hold something that should not ship.
