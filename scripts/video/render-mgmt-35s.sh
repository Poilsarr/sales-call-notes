#!/usr/bin/env bash
#
# render-mgmt-35s.sh — Build the 39s management hero asset (Variant 1: "The Line You Missed").
#
# Output:
#   public/videos/gauge-hero-mgmt-35s.mp4   (39s container = 35s story + 4s pad,
#                                            1920x1080 30fps H.264 High + AAC 128k, <12MB)
#   (poster is extracted separately — see POSTER step / file gauge-hero-mgmt-poster.jpg)
#
# Beats (match docs/video/35s-mgmt-script-final.md + hyperframes-gauge-mgmt-35s):
#   0–8s   HOOK      paper  — THE LINE YOU NEVER HEARD + 00:14:22 Gong flash
#   8–18s  WHAT+HOW  paper  — Upload / Record / Meet, no bot ever joins
#   18–28s NOTES     paper  — Summary + owners + dates + draft -> 1-click CRM
#   28–39s FLAG+CLOSE ink    — Slack #deal-room-acme proof + Start free 300min $9 flat
#
# Method: LOCAL ONLY, no network, no external assets.
#   1. Python/PIL renders 4 full-frame PNG cards (1920x1080) into a mktemp dir.
#      (PIL is used because this box's ffmpeg 8.1.1 ships WITHOUT drawtext/libfreetype
#      and WITHOUT libass — verified via `ffmpeg -filters`. Text cannot be rendered
#      by this ffmpeg at all, so the "supreme simplicity" fallback is upgraded to
#      locally-rendered cards: same 4 beats, same copy, still zero network.)
#   2. ffmpeg loops each PNG for its beat duration, concats, adds alignment-free
#      drawbox accents (top rule, amber border pulse, progress bar), muxes a silent
#      AAC track (anullsrc) so <video> + captions behave, encodes H.264 High.
#   3. Gate: ffprobe duration 38.5–39.5s, 1920x1080, size <12MB.
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="$ROOT/public/videos/gauge-hero-mgmt-35s.mp4"
TMP="$(mktemp -d /tmp/mgmt35s.XXXXXX)"
trap 'rm -rf "$TMP"' EXIT

command -v ffmpeg >/dev/null || { echo "FATAL: ffmpeg not found" >&2; exit 1; }
command -v ffprobe >/dev/null || { echo "FATAL: ffprobe not found" >&2; exit 1; }
command -v python3 >/dev/null || { echo "FATAL: python3 not found" >&2; exit 1; }

echo "==> rendering beat cards with PIL (local, no network) ..."
python3 - "$TMP" <<'PYEOF'
import sys
from PIL import Image, ImageDraw, ImageFont

TMP = sys.argv[1]
W, H = 1920, 1080

PAPER = (245, 240, 230)
CREAM = (255, 253, 247)
INK   = (19, 19, 22)
AMBER = (217, 162, 27)
ORANGE = (242, 101, 34)
TEAL  = (14, 124, 107)
GREY  = (120, 114, 102)

ARIAL      = "/System/Library/Fonts/Supplemental/Arial.ttf"
ARIAL_B    = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
ANDALE     = "/System/Library/Fonts/Supplemental/Andale Mono.ttf"
HELV       = "/System/Library/Fonts/Helvetica.ttc"

def load(primary, size, fallback=HELV):
    for path in (primary, fallback):
        try:
            return ImageFont.truetype(path, size)
        except Exception:
            continue
    return ImageFont.load_default()

def F(size, bold=False, mono=False):
    if mono:
        return load(ANDALE, size)
    return load(ARIAL_B if bold else ARIAL, size)

def card(d, box, fill=CREAM, outline=INK, width=3, radius=18, shadow=True):
    if shadow:
        sh = [box[0] + 8, box[1] + 8, box[2] + 8, box[3] + 8]
        d.rounded_rectangle(sh, radius=radius, fill=INK)
    d.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)

def chip(d, cx, cy, text, font, bg, fg, pad_x=22, pad_y=12, outline=INK, width=2):
    tw = d.textlength(text, font=font)
    asc, desc = font.getmetrics()
    th = asc + desc
    box = [cx - tw / 2 - pad_x, cy - th / 2 - pad_y,
           cx + tw / 2 + pad_x, cy + th / 2 + pad_y]
    d.rounded_rectangle(box, radius=(th + pad_y * 2) // 2, fill=bg, outline=outline, width=width)
    d.text((cx, cy), text, font=font, fill=fg, anchor="mm")

def chrome(d, bg, fg, dim):
    # top rule + chrome bars (mirror hyperframes prototype)
    d.rectangle([0, 0, W, 6], fill=INK)
    d.text((48, 40), "GAUGE  —  THE LINE YOU NEVER HEARD", font=F(24, bold=True), fill=fg)
    d.text((W - 48, 40), "SALES CALL 14:22   ● REC", font=F(22, mono=True), fill=fg, anchor="ra")
    d.rectangle([0, H - 56, W, H], fill=INK)
    d.text((48, H - 28), "MUTED-READABLE  ·  SEEK-SAFE  ·  DETERMINISTIC",
           font=F(20, mono=True), fill=(245, 240, 230), anchor="lm")

def kicker(d, y, text, color=GREY):
    d.text((W // 2, y), text, font=F(24, mono=True), fill=color, anchor="mm")

# ---------------- BEAT 1 : 0–8 HOOK (paper) ----------------
img = Image.new("RGB", (W, H), PAPER)
d = ImageDraw.Draw(img)
chrome(d, PAPER, INK, GREY)
kicker(d, 250, "0-8S  ·  THE HOOK  ·  MUTED FIRST")
d.text((W // 2, 400), "THE LINE YOU", font=F(118, bold=True), fill=INK, anchor="mm")
d.text((W // 2, 530), "NEVER HEARD", font=F(118), fill=INK, anchor="mm")
# quote card with amber Gong chip
card(d, [430, 640, 1490, 760])
left, mid, right = '00:14:22  —  "we are also looking at ', "Gong", '."  —  Customer · missed'
f_body = F(30)
lw = d.textlength(left, font=f_body)
mw = d.textlength(mid, font=F(30, bold=True))
rw = d.textlength(right, font=f_body)
chip_w = mw + 44
total = lw + chip_w + rw
x = W // 2 - total / 2
cy = 700
d.text((x, cy), left, font=f_body, fill=INK, anchor="lm")
cx_chip = x + lw + chip_w / 2
d.rounded_rectangle([x + lw + 4, cy - 30, x + lw + chip_w - 4, cy + 30],
                    radius=14, fill=AMBER, outline=INK, width=2)
d.text((cx_chip, cy), mid, font=F(30, bold=True), fill=INK, anchor="mm")
d.text((x + lw + chip_w, cy), right, font=f_body, fill=GREY, anchor="lm")
chip(d, W // 2 - 260, 830, "00:14:22  ·  RIVAL NAMED", F(22, bold=True), AMBER, INK)
chip(d, W // 2 + 260, 830, "NO ONE WROTE IT DOWN", F(22, bold=True), CREAM, INK)
img.save(f"{TMP}/beat1.png")

# ---------------- BEAT 2 : 8–18 WHAT+HOW (paper) ----------------
img = Image.new("RGB", (W, H), PAPER)
d = ImageDraw.Draw(img)
chrome(d, PAPER, INK, GREY)
kicker(d, 170, "8-18S  ·  WHAT + HOW  ·  REPS JUST TALK")
d.text((W // 2, 260), "Upload  ·  Record  ·  Meet  —", font=F(64, bold=True), fill=INK, anchor="mm")
d.text((W // 2, 340), "no bot ever joins", font=F(56), fill=INK, anchor="mm")
cards = [
    ("01 · DROP IT IN", "MP3 upload", "Drag the call file.", "Gauge does the rest.", "no invite needed", AMBER),
    ("02 · HIT RECORD", "Browser record", "Waveform in-browser.", "Nobody else is added.", "no participant added", CREAM),
    ("03 · CAPTURE MEET", "Google Meet", "Captions capture tile.", "No extra attendee.", "NO BOT EVER JOINS", None),
]
x0, cw, gap, top, bot = 150, 500, 60, 430, 900
for i, (step, title, l1, l2, tag, tagbg) in enumerate(cards):
    x = x0 + i * (cw + gap)
    card(d, [x, top, x + cw, bot])
    d.text((x + 36, top + 34), step, font=F(21, mono=True), fill=GREY, anchor="lt")
    d.text((x + 36, top + 74), title, font=F(40, bold=True), fill=INK, anchor="lt")
    d.text((x + 36, top + 140), l1, font=F(26), fill=INK, anchor="lt")
    d.text((x + 36, top + 178), l2, font=F(26), fill=GREY, anchor="lt")
    if tagbg is None:  # teal solid chip for the proof card
        chip(d, x + cw / 2, bot - 62, "✓ " + tag, F(20, bold=True), TEAL, CREAM, outline=TEAL)
    else:
        chip(d, x + cw / 2, bot - 62, "✓ " + tag, F(20, bold=True), tagbg, INK)
img.save(f"{TMP}/beat2.png")

# ---------------- BEAT 3 : 18–28 NOTES (paper) ----------------
img = Image.new("RGB", (W, H), PAPER)
d = ImageDraw.Draw(img)
chrome(d, PAPER, INK, GREY)
d.text((120, 200), "18-28S  ·  THE NOTES  ·  NO ADMIN TAX", font=F(24, mono=True), fill=GREY, anchor="lt")
d.text((120, 280), "Summary + owners", font=F(62, bold=True), fill=INK, anchor="lt")
d.text((120, 355), "+ dates  →  1-click CRM", font=F(62), fill=INK, anchor="lt")
rows = [
    "✓  Clean summary  —  3 lines, not 30",
    "✓  Who does what by when  —  owners + dates",
    "✓  Draft follow-up  —  ready to send",
]
y = 470
for r in rows:
    d.rounded_rectangle([120, y, 880, y + 78], radius=14, fill=CREAM, outline=INK, width=3)
    d.text((150, y + 39), r, font=F(26), fill=INK, anchor="lm")
    y += 104
# draft follow-up card (right)
card(d, [980, 200, 1800, 880])
d.text((1024, 250), "DRAFT FOLLOW-UP", font=F(22, mono=True), fill=GREY, anchor="lt")
d.text((1756, 250), "● READY", font=F(22, bold=True), fill=TEAL, anchor="rt")
body = "Thanks for the time — sending the consolidation one-pager + Thursday review invite. Owner: Maya · Due Thu."
words, lines, cur = body.split(), [], ""
fb = F(30)
for w_ in words:
    trial = (cur + " " + w_).strip()
    if d.textlength(trial, font=fb) <= 700:
        cur = trial
    else:
        lines.append(cur)
        cur = w_
lines.append(cur)
yy = 320
for ln in lines:
    d.text((1024, yy), ln, font=fb, fill=INK, anchor="lt")
    yy += 48
chip(d, 1210, 790, "↗ HubSpot · 1-click", F(22, bold=True), INK, CREAM, outline=INK)
chip(d, 1560, 790, "↗ Salesforce", F(22, bold=True), CREAM, INK)
img.save(f"{TMP}/beat3.png")

# ---------------- BEAT 4 : 28–39 FLAG + CLOSE (ink) ----------------
img = Image.new("RGB", (W, H), INK)
d = ImageDraw.Draw(img)
d.rectangle([0, 0, W, 6], fill=PAPER)
d.text((48, 40), "GAUGE  —  THE PROOF IN SLACK", font=F(24, bold=True), fill=PAPER)
d.text((W - 48, 40), "#deal-room-acme   ● NOW", font=F(22, mono=True), fill=AMBER, anchor="ra")
d.text((120, 170), "28-39S  ·  THE PROOF  ·  IN SLACK, NOT A DASHBOARD",
       font=F(24, mono=True), fill=AMBER, anchor="lt")
d.text((120, 250), "Exact quote. Who said it.", font=F(60, bold=True), fill=PAPER, anchor="lt")
d.text((120, 325), "When. In Slack.", font=F(60), fill=AMBER, anchor="lt")
# slack proof card (cream on dark)
card(d, [120, 430, 1000, 720])
d.rounded_rectangle([160, 480, 220, 540], radius=12, fill=AMBER)
d.text((190, 510), "S", font=F(34, bold=True), fill=INK, anchor="mm")
d.text((244, 488), "#deal-room-acme  ·  GAUGE APP  ·  NOW", font=F(21, mono=True), fill=INK, anchor="lt")
q1, qg, q2 = '"We are also looking at ', "Gong", '." — Sarah Chen, 00:14:22'
fq, fqb = F(28), F(28, bold=True)
d.text((244, 545), q1, font=fq, fill=INK, anchor="lt")
w1 = d.textlength(q1, font=fq)
gw = d.textlength(qg, font=fqb)
d.rounded_rectangle([244 + w1, 522, 244 + w1 + gw + 16, 568], radius=8, fill=AMBER)
d.text((244 + w1 + 8, 545), qg, font=fqb, fill=INK, anchor="lt")
d.text((244 + w1 + gw + 16, 545), q2, font=fq, fill=INK, anchor="lt")
d.text((244, 600), "call link + owners attached", font=F(24), fill=GREY, anchor="lt")
d.text((244, 655), "You never get blindsided again.", font=F(28, bold=True), fill=INK, anchor="lt")
# end card (cream, right)
card(d, [1060, 160, 1800, 920], radius=22)
chip(d, 1265, 235, "PRIVATE BETA", F(20, bold=True), CREAM, INK)
chip(d, 1560, 235, "300 FREE MIN · NO CARD", F(20, bold=True), INK, CREAM, outline=INK)
d.text((1430, 360), "Start free", font=F(72, bold=True), fill=INK, anchor="mm")
d.text((1430, 445), "300 min · $9 flat", font=F(44), fill=INK, anchor="mm")
# CTA pill
d.rounded_rectangle([1230, 520, 1630, 610], radius=45, fill=ORANGE, outline=INK, width=3)
d.text((1405, 565), "Start free   →", font=F(34, bold=True), fill=CREAM, anchor="mm")
d.text((1430, 670), "$9/MO PRO · NO BOT", font=F(22, mono=True), fill=GREY, anchor="mm")
d.text((1430, 710), "USEGAUGE.VERCEL.APP", font=F(22, mono=True), fill=GREY, anchor="mm")
d.rectangle([0, H - 56, W, H], fill=INK)
d.text((48, H - 28), "YOU NEVER GET BLINDSIDED AGAIN", font=F(20, mono=True), fill=AMBER, anchor="lm")
img.save(f"{TMP}/beat4.png")

print("cards ok:", TMP)
PYEOF

echo "==> encoding 39s H.264 High + silent AAC ..."
ffmpeg -y -hide_banner -loglevel error \
  -loop 1 -framerate 30 -t 8  -i "$TMP/beat1.png" \
  -loop 1 -framerate 30 -t 10 -i "$TMP/beat2.png" \
  -loop 1 -framerate 30 -t 10 -i "$TMP/beat3.png" \
  -loop 1 -framerate 30 -t 11 -i "$TMP/beat4.png" \
  -f lavfi -t 39 -i "anullsrc=r=48000:cl=stereo" \
  -filter_complex "[0:v][1:v][2:v][3:v]concat=n=4:v=1:a=0,\
drawbox=x=0:y=0:w=iw:h=6:color=0x131316:t=fill,\
drawbox=x=0:y=0:w=iw:h=ih:color=0xD9A21B:t=14:enable='between(t,3.2,3.9)',\
drawbox=x=0:y=1074:w='1920*t/39':h=6:color=0xD9A21B:t=fill[v]" \
  -map "[v]" -map 4:a \
  -c:v libx264 -profile:v high -level 4.1 -pix_fmt yuv420p -r 30 \
  -b:v 2200k -maxrate 2500k -bufsize 5000k \
  -c:a aac -b:a 128k -ar 48000 -ac 2 \
  -movflags +faststart -t 39 "$OUT"

echo "==> gate: ffprobe + size ..."
DUR="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT")"
VW="$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$OUT")"
VH="$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$OUT")"
ACODEC="$(ffprobe -v error -select_streams a:0 -show_entries stream=codec_name -of csv=p=0 "$OUT")"
VCODEC="$(ffprobe -v error -select_streams v:0 -show_entries stream=codec_name -of csv=p=0 "$OUT")"
SIZE="$(stat -f%z "$OUT")"
echo "file:     $OUT"
echo "duration: ${DUR}s (gate 38.5–39.5)"
echo "video:    ${VCODEC} ${VW}x${VH} (gate 1920x1080)"
echo "audio:    ${ACODEC} (gate aac)"
ls -lh "$OUT"
python3 - "$DUR" "$SIZE" <<'PYEOF'
import sys
dur, size = float(sys.argv[1]), int(sys.argv[2])
ok = True
if not (38.5 <= dur <= 39.5):
    print(f"GATE FAIL: duration {dur} outside 38.5-39.5s"); ok = False
if size >= 12 * 1024 * 1024:
    print(f"GATE FAIL: size {size} >= 12MB"); ok = False
print("GATE PASS" if ok else "GATE FAILED")
sys.exit(0 if ok else 1)
PYEOF

echo "==> done: $OUT"
