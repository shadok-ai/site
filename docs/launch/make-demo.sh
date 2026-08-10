#!/usr/bin/env bash
# Cut the raw take into shots and build the hero assets: a VP9 WebM, an H.264
# MP4 fallback, a poster still, and the Open Graph card.
#
# This replaced make-gif.sh. The GIF of the same 39 s edit weighed 5.29 MB and
# was 99.7% of the page — it put mobile LCP in Google's "poor" band on an
# ordinary 4G connection. Video carries the same footage at a tenth of the
# weight, can be paused (an animated GIF cannot, which is a WCAG 2.2.2 failure),
# and hands the browser a cheap poster to paint immediately.
#
# A single wide shot reads as a screen recording. Punching in on the question,
# the agent list, the diff and the icons is what makes it read as a demo — the
# viewer is told where to look instead of hunting for it. The moves between
# shots are animated rather than cut, which is what makes it feel filmed.
#
# It has to be zoompan, not crop: crop evaluates w/h once at configuration and
# only x/y per frame, so an animated zoom is impossible with it. zoompan
# re-evaluates its zoom every frame.
#
# Every framing is 8:5, the source's own aspect, so interpolating between two of
# them never stretches anything. Timings come from the marks capture-demo.mjs
# prints; re-check them after a new take.
set -euo pipefail

# awk formats floats with the locale's decimal separator. Under a French locale
# that is a comma, so a zoom factor comes out as "1,000000" and every expression
# below is silently malformed — ffmpeg then reports only "nothing was written
# into output file".
export LC_ALL=C

RAW="${1:-$(ls -t docs/launch/raw/*.webm | head -1)}"
OUTDIR="${2:-.}"
# Dimensions must be even: libx264 in yuv420p refuses odd ones, and reports it
# only as "nothing was written into output file".
W=${DEMO_W:-960}; H=${DEMO_H:-600}; FPS=${DEMO_FPS:-24}
IW=1280

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
: > "$TMP/list.txt"
N=0

# A framing is "<width> <x> <y>" in source pixels; the zoom follows from width.
WIDE="1280 0 0"
DIALOG="880 240 230"
LIST="480 0 55"
DIFF="800 470 90"
ICONS="400 880 20"

# move <start> <duration> <from framing> <to framing>
# Identical framings hold; different ones travel, eased in and out.
move () {
  local ss=$1 dur=$2
  read -r w0 x0 y0 <<< "$3"
  read -r w1 x1 y1 <<< "$4"
  local z0 z1 frames k ease zx xx yx
  z0=$(awk -v a="$IW" -v b="$w0" 'BEGIN{printf "%.6f", a/b}')
  z1=$(awk -v a="$IW" -v b="$w1" 'BEGIN{printf "%.6f", a/b}')
  frames=$(awk -v d="$dur" -v f="$FPS" 'BEGIN{printf "%d", int(d*f)}')
  k=$(( frames > 1 ? frames - 1 : 1 ))

  # smoothstep over the output frame index: no linear ramp, no visible stop
  ease="(min(on/$k\,1)*min(on/$k\,1)*(3-2*min(on/$k\,1)))"
  zx="$z0+($z1-$z0)*$ease"
  xx="$x0+($x1-$x0)*$ease"
  yx="$y0+($y1-$y0)*$ease"

  N=$((N + 1))
  ffmpeg -v error -y -ss "$ss" -t "$dur" -i "$RAW" \
    -vf "fps=${FPS},zoompan=z='${zx}':x='${xx}':y='${yx}':d=1:s=${W}x${H}:fps=${FPS}" \
    -c:v libx264 -crf 12 -pix_fmt yuv420p "$TMP/$(printf %02d "$N").mp4"
  printf "file '%s'\n" "$TMP/$(printf %02d "$N").mp4" >> "$TMP/list.txt"
}

#     start  dur   from       to
move  14.0   2.0   "$WIDE"    "$WIDE"     # three agents, a question waiting
move  16.0   0.8   "$WIDE"    "$DIALOG"   # push in on the question
move  16.8   3.0   "$DIALOG"  "$DIALOG"   # read it; it is answered with a click
move  20.2   0.7   "$DIALOG"  "$LIST"     # slide to the agent list
move  20.9   1.6   "$LIST"    "$LIST"     # the others are working too
move  22.5   0.7   "$LIST"    "$WIDE"     # pull back out
move  23.2   3.4   "$WIDE"    "$WIDE"     # it goes back to work
move  26.6   0.9   "$WIDE"    "$DIFF"     # push in on what it wrote
move  27.5   4.4   "$DIFF"    "$DIFF"     # the diff, readable line by line
move  31.9   0.7   "$DIFF"    "$ICONS"    # travel to the channel icons
move  32.6   1.3   "$ICONS"   "$ICONS"    # the terminal is one of them
move  33.9   0.9   "$ICONS"   "$WIDE"     # pull back out
move  34.8   5.2   "$WIDE"    "$WIDE"     # the raw TUI, live

ffmpeg -v error -y -f concat -safe 0 -i "$TMP/list.txt" -c copy "$TMP/all.mp4"

# VP9 for everyone modern; H.264 for Safari versions that still refuse VP9 in
# <video>, and for anything embedding the file outside a browser.
# -row-mt and -cpu-used keep a two-pass-quality result within one pass.
ffmpeg -v error -y -i "$TMP/all.mp4" \
  -c:v libvpx-vp9 -crf "${DEMO_CRF_VP9:-38}" -b:v 0 -row-mt 1 -cpu-used 2 \
  -pix_fmt yuv420p -an "$OUTDIR/demo.webm"

# faststart moves the moov atom to the front, so playback can start before the
# whole file has arrived.
ffmpeg -v error -y -i "$TMP/all.mp4" \
  -c:v libx264 -crf "${DEMO_CRF_H264:-28}" -preset slow -profile:v main \
  -pix_fmt yuv420p -movflags +faststart -an "$OUTDIR/demo.mp4"

# The poster is what the browser paints while the video is still arriving, so
# it must be the frame the video opens on — anything else flashes on play. It is
# also the LCP element on mobile, which is the whole point of the exercise, so
# it stays small.
# cwebp rather than ffmpeg: the ffmpeg here is built without libwebp, and its
# only complaint is "Unknown encoder". `brew install webp` if it is missing.
ffmpeg -v error -y -i "$TMP/all.mp4" -frames:v 1 "$TMP/poster.png"
cwebp -quiet -q 82 "$TMP/poster.png" -o "$OUTDIR/demo-poster.webp"

# The Open Graph card is built from the same frame, at the ratio the social
# crawlers actually render (1.91:1), by a separate script that draws the
# wordmark and the headline around it.
node "$(dirname "$0")/make-og-card.mjs" "$OUTDIR/demo-poster.webp" "$OUTDIR/og-card.jpg"

for f in demo.webm demo.mp4 demo-poster.webp og-card.jpg; do
  printf '%-20s %s\n' "$f" "$(ls -lh "$OUTDIR/$f" | awk '{print $5}')"
done
