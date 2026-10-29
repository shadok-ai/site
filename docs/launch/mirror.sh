#!/usr/bin/env bash
# The mirror: a second cockpit, kept running so the pictures on shadok.ai can be
# retaken the day the product's interface moves — which is most days.
#
#   mirror.sh start | stop | status
#
# Why a mirror and not the live cockpit: the live one is full of client names and
# work in progress, and the capture procedure forbids both on screen. This one
# runs a company that does not exist.
#
# Three things it must NOT do, each learned the hard way:
#   - share the live launch directory (it would inherit its agent list);
#   - run on 3789 (that is the live cockpit, and only the human restarts it);
#   - use the tmux transport. tmux keys its socket by uid, not by HOME, so the
#     mirror's agents would join the live tmux server and write their
#     transcripts into the live ~/.claude — the cockpit would then show them
#     no history at all.
set -uo pipefail

PORT="${MIRROR_PORT:-3899}"
HOME_DIR="${MIRROR_HOME:-/root/capture-home}"
WORK="${MIRROR_WORK:-/root/capture-work}"
APP="${MIRROR_APP:-/root/.shadok-ai/app/node_modules/shadok-ai/dist/server.js}"
LOG="$WORK/server.log"

pid_of() {
  pgrep -f "shadok-ai/dist/server.js" | while read -r p; do
    grep -qz "$HOME_DIR" "/proc/$p/environ" 2>/dev/null && echo "$p"
  done
}

case "${1:-status}" in
  start)
    [ -n "$(pid_of)" ] && { echo "already up on $PORT"; exit 0; }
    mkdir -p "$HOME_DIR/.claude" "$HOME_DIR/.shadok-ai" "$WORK"
    # The token is a SYMLINK to the live one: a copy goes stale and every agent
    # then answers "Login expired · Please run /login".
    [ -e "$HOME_DIR/.claude/.credentials.json" ] ||
      ln -s "$HOME/.claude/.credentials.json" "$HOME_DIR/.claude/.credentials.json"
    [ -f "$HOME_DIR/.shadok-ai/config.json" ] ||
      printf '%s\n' '{"autoUpdate": false}' > "$HOME_DIR/.shadok-ai/config.json"
    chmod 600 "$HOME_DIR/.shadok-ai/config.json"
    # No GUI password, loopback only: the fail-closed bind refuses a network
    # bind without one, and a login screen is not what we want to photograph.
    cd "$WORK" && env -u SHADOK_GUI_PASSWORD -u SHADOK_PASSWORD -u SHADOK_SESSION_KEY \
      HOME="$HOME_DIR" PORT="$PORT" SHADOK_HOST=127.0.0.1 SHADOK_AUTOUPDATE=0 SHADOK_TMUX=0 \
      nohup node "$APP" > "$LOG" 2>&1 &
    sleep 6
    curl -sf -o /dev/null "http://localhost:$PORT/" && echo "mirror up on $PORT" || { tail -3 "$LOG"; exit 1; }
    ;;
  stop)
    p="$(pid_of)"; [ -z "$p" ] && { echo "not running"; exit 0; }
    kill $p && echo "stopped $p"
    ;;
  status)
    v="$(curl -sf --max-time 4 "http://localhost:$PORT/version" || true)"
    [ -n "$v" ] && echo "up on $PORT — $v" || echo "down"
    ;;
  *) echo "usage: mirror.sh start|stop|status" >&2; exit 2 ;;
esac
