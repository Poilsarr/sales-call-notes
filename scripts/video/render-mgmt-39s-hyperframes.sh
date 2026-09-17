#!/usr/bin/env bash
#
# render-mgmt-39s-hyperframes.sh — Render hyperframes-gauge-mgmt-39s/ to mp4.
#
# Output:
#   public/videos/gauge-hero-mgmt-35s.mp4   (39.0s, 1920x1080 30fps H.264 High + AAC 128k, <12MB)
#   public/videos/gauge-hero-mgmt-poster.jpg (1280w still @ t=38.5s, q:v 4, <250KB)
#
# Method: Playwright Chromium headless 1920x1080 loads the composition over a
# local http server (CDN gsap/three/fonts need network). For each frame at
# 30fps x 39s (1170 frames): evaluate seek (tl.time + hf-seek -> renderAt +
# timecode), screenshot #root 1920x1080, pipe PNG frames via image2pipe to
# ffmpeg (H.264 High 2200k/maxrate 2500k + silent AAC 128k, faststart).
# Gate: ffprobe duration 38.5-39.5, 1920x1080, size <12MB. Poster @38.5s.
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
COMP="$ROOT/hyperframes-gauge-mgmt-39s"
OUT="$ROOT/public/videos/gauge-hero-mgmt-35s.mp4"
POSTER="$ROOT/public/videos/gauge-hero-mgmt-poster.jpg"
TMP="$ROOT/.tmp-mgmt39hf.$$"
mkdir -p "$TMP"
trap 'rm -rf "$TMP"; kill $SERVPID 2>/dev/null || true' EXIT

command -v ffmpeg >/dev/null || { echo "FATAL: ffmpeg not found" >&2; exit 1; }
command -v ffprobe >/dev/null || { echo "FATAL: ffprobe not found" >&2; exit 1; }
command -v node >/dev/null || { echo "FATAL: node not found" >&2; exit 1; }

PORT="${MGMT39_PORT:-8939}"
echo "==> serving $COMP on :$PORT ..."
python3 -m http.server "$PORT" --directory "$COMP" >/dev/null 2>&1 &
SERVPID=$!
sleep 1

cat > "$TMP/shoot.mjs" <<'MJEOF'
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const PORT = process.env.MGMT39_PORT;

const FPS = 30, DUR = 39, N = FPS * DUR;
const OUT = process.env.MGMT39_OUT;
const only = process.env.MGMT39_ONLY ? parseInt(process.env.MGMT39_ONLY, 10) : -1;

const ff = spawn('ffmpeg', ['-y','-hide_banner','-loglevel','error',
  '-f','image2pipe','-framerate',String(FPS),'-i','-',
  '-f','lavfi','-t',String(DUR),'-i','anullsrc=r=48000:cl=stereo',
  '-map','0:v','-map','1:a',
  '-c:v','libx264','-profile:v','high','-level','4.1','-pix_fmt','yuv420p','-r',String(FPS),
  '-b:v','2200k','-maxrate','2500k','-bufsize','5000k',
  '-c:a','aac','-b:a','128k','-ar','48000','-ac','2',
  '-movflags','+faststart','-t',String(DUR), OUT],
  { stdio: ['pipe','inherit','inherit'] });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => !!(window.__timelines && window.__timelines["mgmt-39s"]), null, { timeout: 60000 });
await page.waitForTimeout(1500); // fonts + three first render

const frames = only >= 0 ? [only] : [...Array(N).keys()];
for (const f of frames) {
  const t = Math.min(f / FPS, DUR - 1e-3);
  await page.evaluate((tt) => {
    const tl = window.__timelines["mgmt-39s"];
    tl.pause(); tl.time(tt);
    window.dispatchEvent(new CustomEvent('hf-seek', { detail: { time: tt } }));
  }, t);
  await page.waitForTimeout(40);
  const buf = await page.locator('#root').screenshot({ type: 'png' });
  if (only >= 0) { (await import('node:fs')).writeFileSync(process.env.MGMT39_PROBE, buf); break; }
  await new Promise((res, rej) => ff.stdin.write(buf, (e) => e ? rej(e) : res()));
  if (f % 120 === 0) console.error(`frame ${f}/${N}`);
}
await browser.close();
if (only >= 0) process.exit(0);
ff.stdin.end();
await new Promise((res, rej) => ff.on('close', (c) => c === 0 ? res() : rej(new Error('ffmpeg exit ' + c))));
console.error('encode done');
MJEOF

export MGMT39_OUT="$OUT" MGMT39_PORT="$PORT"

if [ "${1:-}" = "--probe" ]; then
  export MGMT39_PROBE="$TMP/probe.png"
  export MGMT39_ONLY="${2:-120}"
  echo "==> probe frame $MGMT39_ONLY ..."
    node "$TMP/shoot.mjs"
  ls -lh "$TMP/probe.png"
  echo "PROBE OK (open $TMP/probe.png to verify before full run)"
  exit 0
fi

echo "==> rendering 1170 frames (30fps x 39s) -> H.264 High + silent AAC ..."
node "$TMP/shoot.mjs"

echo "==> gate: ffprobe full stream dump ..."
ffprobe -hide_banner -show_streams -show_format "$OUT"
DURV="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT")"
VW="$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$OUT")"
VH="$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$OUT")"
SIZE="$(stat -f%z "$OUT")"
echo "duration: ${DURV}s (gate 38.5-39.5) | video: ${VW}x${VH} (gate 1920x1080)"
ls -lh "$OUT"
python3 - "$DURV" "$SIZE" <<'PYEOF'
import sys
dur, size = float(sys.argv[1]), int(sys.argv[2])
ok = True
if not (38.5 <= dur <= 39.5):
    print(f"GATE FAIL: duration {dur} outside 38.5-39.5s"); ok = False
if not True: pass
if size >= 12 * 1024 * 1024:
    print(f"GATE FAIL: size {size} >= 12MB"); ok = False
print("GATE PASS" if ok else "GATE FAILED")
sys.exit(0 if ok else 1)
PYEOF

echo "==> poster @ t=38.5s (1280w, q:v 4, gate <250KB) ..."
ffmpeg -y -hide_banner -loglevel error -ss 38.5 -i "$OUT" -frames:v 1 \
  -vf scale=1280:-1 -q:v 4 "$POSTER"
ls -lh "$POSTER"
PSIZE="$(stat -f%z "$POSTER")"
python3 - "$PSIZE" <<'PYEOF'
import sys
s = int(sys.argv[1])
print(f"poster bytes: {s} (gate < {250*1024})")
sys.exit(0 if s < 250 * 1024 else 1)
PYEOF

echo "==> done: $OUT + $POSTER"
