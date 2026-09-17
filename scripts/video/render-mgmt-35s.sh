#!/usr/bin/env bash
#
# render-mgmt-35s.sh — Build the 39s management hero asset (Variant 1: "The Line You Missed").
#
# Output:
#   public/videos/gauge-hero-mgmt-35s.mp4   (39.0s, 1920x1080 30fps H.264 High + AAC 128k, <12MB)
#   public/videos/gauge-hero-mgmt-poster.jpg (1280w still @ t=38.5s, q:v 4, <250KB)
#
# Beats (match public/videos/gauge-hero-mgmt-captions.vtt — DO NOT retime):
#   0–8s   HOOK      — THE LINE YOU NEVER HEARD + 00:14:22 Gong quote chip
#   8–18s  WHAT+HOW  — Upload · Record · Meet, no bot ever joins (3 cards)
#   18–28s NOTES     — Summary + owners + dates → 1-click CRM
#   28–39s FLAG+CLOSE— Slack #deal-room-acme ping resolves + cream end-card CTA
#
# Method: LOCAL ONLY, no network, no external assets.
#   Python (PIL + numpy) renders 1170 true-3D-studio frames (1920x1080 @30fps):
#     dark studio void #0a0a0b + spotlight pool + cool rim light, floating glass
#     cards (bevel top-highlight, layered soft shadows, perspective tilt, floor
#     reflection, #F26522 edge glow, amber #D9A21B "Gong" chip), slow dolly
#     1.00→1.06 per beat + fg/bg parallax, ease-in-out crossfade transitions,
#     film grain + vignette. All text in PIL (this box's ffmpeg has NO
#     drawtext/libfreetype). Frames pipe as rawvideo to ffmpeg (H.264 High
#     2200k/maxrate 2500k + silent AAC 128k, faststart).
#   Gate: ffprobe duration 38.5–39.5, 1920x1080, size <12MB. Poster @38.5s.
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="$ROOT/public/videos/gauge-hero-mgmt-35s.mp4"
POSTER="$ROOT/public/videos/gauge-hero-mgmt-poster.jpg"
TMP="$(mktemp -d /tmp/mgmt35s.XXXXXX)"
trap 'rm -rf "$TMP"' EXIT

command -v ffmpeg >/dev/null || { echo "FATAL: ffmpeg not found" >&2; exit 1; }
command -v ffprobe >/dev/null || { echo "FATAL: ffprobe not found" >&2; exit 1; }
command -v python3 >/dev/null || { echo "FATAL: python3 not found" >&2; exit 1; }

echo "==> writing frame renderer ..."
cat > "$TMP/render.py" <<'PYEOF'
import sys, math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps

W, H, FPS = 1920, 1080, 30
S = 1.1                      # overscan for dolly headroom
OW, OH = int(W * S), int(H * S)   # 2112 x 1188
DURS = [8, 10, 10, 11]       # beat durations (VTT-locked)
STARTS = [0, 8, 18, 28]
NFRAMES = 39 * FPS           # 1170
TRANS = 12                   # crossfade frames at each beat cut

VOID   = (10, 10, 11)
PAPER  = (245, 240, 230)
CREAM  = (252, 250, 244)
INK    = (19, 19, 22)
AMBER  = (217, 162, 27)
ORANGE = (242, 101, 34)
TEAL   = (46, 191, 138)
DIM    = (168, 162, 152)
GREY   = (120, 114, 102)
RIM    = (140, 175, 210)

def sc(v):
    return int(round(v * S))

# ---------- fonts (system only; box has no libfreetype in ffmpeg, PIL is fine) ----------
_CANDS = {
    "bold": [("/System/Library/Fonts/Supplemental/Arial Bold.ttf", None),
             ("/System/Library/Fonts/Helvetica.ttc", 1),
             ("/System/Library/Fonts/Helvetica.ttc", 0)],
    "reg":  [("/System/Library/Fonts/Supplemental/Arial.ttf", None),
             ("/System/Library/Fonts/Helvetica.ttc", 0)],
    "mono": [("/System/Library/Fonts/Supplemental/Andale Mono.ttf", None),
             ("/System/Library/Fonts/Courier.dfont", 0)],
}
def font(px, bold=False, mono=False):
    size = max(8, sc(px))
    kind = "mono" if mono else ("bold" if bold else "reg")
    for path, idx in _CANDS[kind]:
        try:
            if idx is None:
                return ImageFont.truetype(path, size)
            return ImageFont.truetype(path, size, index=idx)
        except Exception:
            continue
    try:
        import matplotlib
        import os
        dj = os.path.join(os.path.dirname(matplotlib.__file__), "mpl-data", "fonts", "ttf",
                          "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf")
        return ImageFont.truetype(dj, size)
    except Exception:
        return ImageFont.load_default()

# ---------- studio background (precomputed, overscan size) ----------
def build_bg(spot_x=0.5, rim_strength=1.0):
    yy, xx = np.mgrid[0:OH, 0:OW].astype(np.float32)
    nx, ny = xx / OW, yy / OH
    base = 10 + 14 * ny                       # vertical falloff #0a0a0b -> lighter low
    img = np.stack([base, base, base + 3 * ny], axis=-1)
    # spotlight pool
    dx, dy = nx - spot_x, (ny - 0.42) * 1.25
    d2 = dx * dx + dy * dy
    pool = np.exp(-d2 / 0.16) * 34.0
    img += pool[..., None] * np.array([1.0, 0.96, 0.88], np.float32)
    # warm practical glow low-left (orange spill, very subtle)
    dx2, dy2 = nx - 0.12, (ny - 0.85) * 1.4
    img += (np.exp(-(dx2 * dx2 + dy2 * dy2) / 0.10) * 10.0)[..., None] \
        * np.array([1.0, 0.42, 0.13], np.float32)
    # cool rim light from top-right
    rim = np.clip(1.0 - ((1.0 - nx) * 0.9 + ny * 1.1), 0, 1) ** 2 * 22.0 * rim_strength
    img += rim[..., None] * np.array([0.55, 0.72, 0.90], np.float32)
    img = np.clip(img, 0, 255).astype(np.uint8)
    im = Image.fromarray(img, "RGB")
    d = ImageDraw.Draw(im)
    fy = sc(778)  # reflective floor line (~72% of frame)
    d.rectangle([0, fy, OW, fy + sc(2)], fill=(52, 54, 60))
    sheen = np.zeros((OH, OW, 3), np.float32)
    depth = OH - fy
    fade = np.linspace(0.9, 0.0, depth, dtype=np.float32)[:, None]
    sheen[fy:, :, :] = fade[:, :, None] * np.array([16, 15, 14], np.float32)
    im = Image.fromarray(np.clip(np.asarray(im).astype(np.float32) + sheen, 0, 255).astype(np.uint8))
    return im

# ---------- card primitives ----------
def _blob(box, radius, fill, blur):
    layer = Image.new("RGBA", (OW, OH), (0, 0, 0, 0))
    ImageDraw.Draw(layer).rounded_rectangle(box, radius=radius, fill=fill)
    return layer.filter(ImageFilter.GaussianBlur(blur))

def glass_card(fg, box, r, fill=(23, 24, 28, 233), edge=None, tilt=0):
    x0, y0, x1, y1 = box
    if tilt:  # subtle perspective tilt: shift top edge
        box = [x0 + tilt, y0, x1 + tilt, y1]
        x0, y0, x1, y1 = box
    # layered soft shadows (precomputed once per beat — cheap at runtime)
    fg.alpha_composite(_blob([x0, y0 + sc(26), x1, y1 + sc(26)], r, (0, 0, 0, 150), sc(46)))
    fg.alpha_composite(_blob([x0, y0 + sc(7), x1, y1 + sc(7)], r, (0, 0, 0, 130), sc(13)))
    if edge:  # glowing #F26522 edge light: blurred halo + crisp rim
        halo = Image.new("RGBA", (OW, OH), (0, 0, 0, 0))
        ImageDraw.Draw(halo).rounded_rectangle(box, radius=r, outline=edge + (255,), width=sc(7))
        fg.alpha_composite(halo.filter(ImageFilter.GaussianBlur(sc(17))))
    d = ImageDraw.Draw(fg, "RGBA")
    d.rounded_rectangle(box, radius=r, fill=fill)
    # bevel top-highlight
    d.rounded_rectangle([x0 + sc(3), y0 + sc(2), x1 - sc(3), y0 + sc(6)],
                        radius=sc(3), fill=(255, 255, 255, 64))
    # border
    d.rounded_rectangle(box, radius=r, outline=(255, 255, 255, 52), width=sc(2))
    if edge:
        d.rounded_rectangle(box, radius=r, outline=edge + (235,), width=sc(3))
        d.rounded_rectangle([x0, y1 - sc(6), x1, y1], radius=sc(2), fill=edge + (255,))
    return box

def chip(d, cx, cy, text, fnt, bg, fg_, outline=None, width=None, pad_x=24, pad_y=13, tick=None):
    tw = d.textlength(text, font=fnt)
    asc, desc = fnt.getmetrics()
    th = asc + desc
    extra = sc(30) if tick else 0
    box = [cx - (tw + extra) / 2 - sc(pad_x), cy - th / 2 - sc(pad_y),
           cx + (tw + extra) / 2 + sc(pad_x), cy + th / 2 + sc(pad_y)]
    d.rounded_rectangle(box, radius=int((th + sc(pad_y) * 2) // 2), fill=bg,
                        outline=outline, width=sc(width) if width else 1)
    tx = cx + extra / 2 if tick else cx
    if tick:  # vector check (system fonts lack U+2713) left of label
        draw_check(d, tx - tw / 2 - sc(17), cy, sc(11), tick, sc(4))
    d.text((tx, cy), text, font=fnt, fill=fg_, anchor="mm")
    return (tw, th)

def draw_check(d, cx, cy, s, color, w):
    d.line([(cx - s, cy), (cx - s * 0.15, cy + s * 0.8),
            (cx + s, cy - s * 0.9)], fill=color, width=w, joint="curve")

def ctext(d, x, y, s, fnt, fill, anchor="mm"):
    d.text((sc(x), sc(y)), s, font=fnt, fill=fill, anchor=anchor)

def add_reflection(fg, floor_y=778):
    """Reflective floor fade: flipped fg below floor line, faded to 0."""
    fy, depth = sc(floor_y), sc(300)
    flip = ImageOps.flip(fg)
    dy = 2 * fy - OH  # align flipped image so card bottoms mirror at floor
    canvas = Image.new("RGBA", (OW, OH), (0, 0, 0, 0))
    canvas.alpha_composite(flip, (0, dy))
    a = np.asarray(canvas).astype(np.float32)
    fade = np.zeros(OH, np.float32)
    rng = np.arange(fy, min(OH, fy + depth))
    fade[rng] = 0.30 * (1.0 - (rng - fy) / depth)
    a[..., 3] *= fade[:, None]
    fg.alpha_composite(Image.fromarray(a.astype(np.uint8), "RGBA"))

# ---------- beat scenes (each returns fg RGBA at overscan size) ----------
def beat_hook():
    fg = Image.new("RGBA", (OW, OH), (0, 0, 0, 0))
    d = ImageDraw.Draw(fg, "RGBA")
    ctext(d, 960, 205, "THE HOOK  ·  MUTED-READABLE  ·  00:14:22", font(25, mono=True), DIM)
    ctext(d, 960, 360, "THE LINE YOU", font(148, bold=True), PAPER)
    ctext(d, 960, 508, "NEVER HEARD", font(148, bold=True), AMBER)
    box = glass_card(fg, [sc(330), sc(640), sc(1590), sc(782)], sc(20), edge=ORANGE)
    f_body, f_bold = font(34), font(34, bold=True)
    left = "00:14:22  —  \u201cwe are also looking at "
    right = ".\u201d  —  Customer · missed"
    lw, mw, rw = (d.textlength(t, font=f) for t, f in
                  ((left, f_body), ("Gong", f_bold), (right, f_body)))
    chip_w = mw + sc(46)
    x = OW / 2 - (lw + chip_w + rw) / 2
    cy = sc(700)
    d.text((x, cy), left, font=f_body, fill=PAPER, anchor="lm")
    d.rounded_rectangle([x + lw + sc(4), cy - sc(30), x + lw + chip_w - sc(4), cy + sc(30)],
                        radius=sc(14), fill=AMBER)
    d.text((x + lw + chip_w / 2, cy), "Gong", font=f_bold, fill=INK, anchor="mm")
    d.text((x + lw + chip_w, cy), right, font=f_body, fill=DIM, anchor="lm")
    chip(d, OW / 2 - sc(265), sc(852), "RIVAL NAMED", font(22, bold=True), AMBER, INK)
    chip(d, OW / 2 + sc(265), sc(852), "NO ONE WROTE IT DOWN", font(22, bold=True),
         None, PAPER, outline=(200, 195, 185, 200), width=2)
    ctext(d, 48, 40, "GAUGE", font(24, bold=True), DIM, anchor="lt")
    ctext(d, 1872, 40, "● REC", font(22, mono=True), AMBER, anchor="rt")
    add_reflection(fg)
    return fg

def beat_how():
    fg = Image.new("RGBA", (OW, OH), (0, 0, 0, 0))
    d = ImageDraw.Draw(fg, "RGBA")
    ctext(d, 960, 148, "WHAT + HOW  ·  REPS JUST TALK", font(25, mono=True), DIM)
    ctext(d, 960, 248, "Upload · Record · Meet", font(82, bold=True), PAPER)
    ctext(d, 960, 328, "— no bot ever joins", font(50, bold=True), TEAL)
    cards = [
        ("01 · DROP IT IN", "MP3 upload", "Drag the call file.", "Gauge does the rest.", "no invite needed", False),
        ("02 · HIT RECORD", "Browser record", "Waveform in-browser.", "Nobody else is added.", "no participant added", False),
        ("03 · CAPTURE MEET", "Google Meet", "Captions capture tile.", "No extra attendee.", "NO BOT EVER JOINS", True),
    ]
    x0, cw, gap, top, bot = 150, 500, 60, 430, 892
    for i, (step, title, l1, l2, tag, hot) in enumerate(cards):
        x = x0 + i * (cw + gap)
        glass_card(fg, [sc(x), sc(top), sc(x + cw), sc(bot)], sc(22),
                   edge=ORANGE if hot else None, tilt=(i - 1) * 7)
        ctext(d, x + 36, top + 40, step, font(21, mono=True), DIM, anchor="lt")
        ctext(d, x + 36, top + 82, title, font(40, bold=True), PAPER, anchor="lt")
        ctext(d, x + 36, top + 150, l1, font(26), PAPER, anchor="lt")
        ctext(d, x + 36, top + 188, l2, font(26), DIM, anchor="lt")
        if hot:
            chip(d, sc(x + cw / 2), sc(bot - 62), tag, font(20, bold=True), TEAL, INK, tick=INK)
        else:
            chip(d, sc(x + cw / 2), sc(bot - 62), tag, font(20, bold=True),
                 None, PAPER, outline=(200, 195, 185, 200), width=2, tick=(220, 215, 205))
    add_reflection(fg)
    return fg

def beat_notes():
    fg = Image.new("RGBA", (OW, OH), (0, 0, 0, 0))
    d = ImageDraw.Draw(fg, "RGBA")
    ctext(d, 120, 168, "THE NOTES  ·  NO ADMIN TAX", font(24, mono=True), DIM, anchor="lt")
    ctext(d, 120, 250, "Summary + owners", font(62, bold=True), PAPER, anchor="lt")
    ctext(d, 120, 328, "+ dates  →  1-click CRM", font(62), AMBER, anchor="lt")
    rows = ["Clean summary  —  3 lines, not 30",
            "Who does what by when  —  owners + dates",
            "Draft follow-up  —  ready to send"]
    y = 452
    for r_ in rows:
        glass_card(fg, [sc(120), sc(y), sc(880), sc(y + 78)], sc(14))
        draw_check(d, sc(168), sc(y + 39), sc(11), TEAL, sc(5))
        ctext(d, 196, y + 39, r_, font(26), PAPER, anchor="lm")
        y += 104
    glass_card(fg, [sc(980), sc(168), sc(1800), sc(902)], sc(22), tilt=-6)
    ctext(d, 1024, 228, "DRAFT FOLLOW-UP", font(22, mono=True), DIM, anchor="lt")
    ctext(d, 1756, 228, "● READY", font(22, bold=True), TEAL, anchor="rt")
    body = ("Thanks for the time — sending the consolidation one-pager + Thursday "
            "review invite. Owner: Maya · Due Thu.")
    words, lines, cur, fb = body.split(), [], "", font(30)
    for w_ in words:
        trial = (cur + " " + w_).strip()
        if d.textlength(trial, font=fb) <= sc(700):
            cur = trial
        else:
            lines.append(cur)
            cur = w_
    lines.append(cur)
    yy = 320
    for ln in lines:
        ctext(d, 1024, yy, ln, fb, PAPER, anchor="lt")
        yy += 48
    chip(d, sc(1210), sc(800), "→ HubSpot · 1-click", font(22, bold=True), PAPER, INK, tick=INK)
    chip(d, sc(1565), sc(800), "→ Salesforce", font(22, bold=True),
         None, PAPER, outline=(200, 195, 185, 200), width=2)
    add_reflection(fg)
    return fg

PING_AT = None  # (overscan coords) set by beat_close
def beat_close():
    global PING_AT
    fg = Image.new("RGBA", (OW, OH), (0, 0, 0, 0))
    d = ImageDraw.Draw(fg, "RGBA")
    ctext(d, 120, 120, "THE PROOF  ·  IN SLACK, NOT A DASHBOARD", font(24, mono=True), AMBER, anchor="lt")
    ctext(d, 120, 200, "Exact quote. Who said it.", font(58, bold=True), PAPER, anchor="lt")
    ctext(d, 120, 276, "When. In Slack.", font(58), AMBER, anchor="lt")
    glass_card(fg, [sc(120), sc(382), sc(1000), sc(762)], sc(22), edge=ORANGE)
    d.ellipse([sc(160), sc(432), sc(220), sc(492)], fill=AMBER)
    ctext(d, 190, 462, "S", font(34, bold=True), INK)
    ctext(d, 244, 448, "#deal-room-acme  ·  GAUGE APP  ·  NOW", font(21, mono=True), PAPER, anchor="lt")
    q1, qg, q2 = '"We are also looking at ', "Gong", '." — Sarah Chen, 00:14:22'
    fq, fqb = font(28), font(28, bold=True)
    d.text((sc(244), sc(505)), q1, font=fq, fill=PAPER, anchor="lt")
    w1 = d.textlength(q1, font=fq)
    gw = d.textlength(qg, font=fqb)
    d.rounded_rectangle([sc(244) + w1, sc(505) - sc(23), sc(244) + w1 + gw + sc(16), sc(505) + sc(23)],
                        radius=sc(8), fill=AMBER)
    d.text((sc(244) + w1 + sc(8), sc(505)), qg, font=fqb, fill=INK, anchor="lt")
    d.text((sc(244) + w1 + gw + sc(16), sc(505)), q2, font=fq, fill=PAPER, anchor="lt")
    ctext(d, 244, 562, "call link + owners attached", font(24), DIM, anchor="lt")
    ctext(d, 244, 668, "You never get blindsided again.", font(30, bold=True), PAPER, anchor="lt")
    PING_AT = (sc(952), sc(418))
    # ---- cream end card (Swiss Paper pop for CTA) ----
    card = [sc(1060), sc(150), sc(1800), sc(932)]
    fg.alpha_composite(_blob([card[0], card[1] + sc(26), card[2], card[3] + sc(26)],
                             sc(24), (0, 0, 0, 170), sc(46)))
    halo = Image.new("RGBA", (OW, OH), (0, 0, 0, 0))
    ImageDraw.Draw(halo).rounded_rectangle(card, radius=sc(24), outline=ORANGE + (255,), width=sc(6))
    fg.alpha_composite(halo.filter(ImageFilter.GaussianBlur(sc(16))))
    d.rounded_rectangle(card, radius=sc(24), fill=PAPER)
    d.rounded_rectangle([card[0] + sc(4), card[1] + sc(3), card[2] - sc(4), card[1] + sc(9)],
                        radius=sc(4), fill=(255, 255, 255, 220))
    d.rounded_rectangle(card, radius=sc(24), outline=ORANGE + (255,), width=sc(3))
    chip(d, sc(1262), sc(228), "PRIVATE BETA", font(20, bold=True), None, INK,
         outline=INK, width=2)
    chip(d, sc(1562), sc(228), "300 FREE MIN · NO CARD", font(20, bold=True), INK, CREAM)
    ctext(d, 1430, 352, "Start free", font(74, bold=True), INK)
    ctext(d, 1430, 440, "300 min · $9 flat", font(44), INK)
    d.rounded_rectangle([sc(1245), sc(528), sc(1615), sc(618)], radius=sc(45), fill=ORANGE)
    ctext(d, 1430, 573, "Start free   →", font(34, bold=True), CREAM)
    ctext(d, 1430, 672, "$9/MO PRO · NO BOT", font(22, mono=True), GREY)
    ctext(d, 1430, 712, "USEGAUGE.VERCEL.APP", font(22, mono=True), GREY)
    # floor reflection under the cream card only (dark glass would double-glow)
    add_reflection(fg)
    return fg

# ---------- precompute (static layers; per-frame work is crop/composite/grain only) ----------
print("precomputing studio layers ...", file=sys.stderr)
BG = [build_bg(0.50), build_bg(0.44), build_bg(0.56), build_bg(0.62, rim_strength=0.7)]
BG_RGBA = [b.convert("RGBA") for b in BG]
FG = [beat_hook(), beat_how(), beat_notes(), beat_close()]

yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
_vd = np.sqrt(((xx / W - 0.5) * 1.15) ** 2 + ((yy / H - 0.5) * 1.35) ** 2)
VIG = np.clip(1.0 - 0.34 * np.clip(_vd, 0, 1) ** 2.1, 0, 1).astype(np.float32)[..., None]

def smooth(p):
    p = min(max(p, 0.0), 1.0)
    return p * p * (3 - 2 * p)

def crop_resize(img, cx, cy, cw, ch):
    x0 = min(max(cx - cw / 2, 0), OW - cw)
    y0 = min(max(cy - ch / 2, 0), OH - ch)
    return img.crop((int(x0), int(y0), int(x0 + cw), int(y0 + ch))).resize((W, H), Image.BILINEAR)

def render_frame(b, lt):
    """Render beat b at local time lt (seconds) -> PIL RGB 1920x1080."""
    p = smooth(lt / DURS[b])
    scale = 1.0 + 0.06 * p                      # slow camera dolly per beat
    cx = OW / 2 + 12 * math.sin(6.28318 * (p + 0.10 * b))
    cy = OH / 2 + 8 * math.cos(6.28318 * (p + 0.07 * b))
    cw, ch = OW / scale, OH / scale
    bg = crop_resize(BG_RGBA[b], cx, cy, cw, ch)
    fg_src = FG[b]
    if b == 3 and lt > 0.5:                     # Slack ping resolves: expanding rings + ✓
        fg_src = fg_src.copy()
        dp = ImageDraw.Draw(fg_src, "RGBA")
        px, py = PING_AT
        k = lt - 0.5
        for j in range(2):
            frac = (k * 0.9 + j * 0.5) % 1.0
            r = sc(12) + frac * sc(96)
            a = int(210 * (1 - frac))
            dp.ellipse([px - r, py - r, px + r, py + r], outline=ORANGE + (a,), width=sc(4))
        dp.ellipse([px - sc(10), py - sc(10), px + sc(10), py + sc(10)], fill=ORANGE + (255,))
        if lt > 1.2:                            # resolved check badge
            bx, by = sc(898), sc(660)
            dp.ellipse([bx - sc(20), by - sc(20), bx + sc(20), by + sc(20)], fill=TEAL + (255,))
            draw_check(dp, bx, by, sc(11), INK + (255,), sc(5))
    # parallax: fg breathes on a slightly different scale + counter-drift
    px_ = 26 * (0.5 - p) + 8 * math.sin(6.28318 * (p + 0.23 * b))
    py_ = 14 * (0.5 - p)
    s2 = scale * 1.012
    fg_r = crop_resize(fg_src, cx + px_, cy + py_, OW / s2, OH / s2)
    comp = Image.alpha_composite(bg, fg_r.convert("RGBA")).convert("RGB")
    a = np.asarray(comp).astype(np.float32)
    a *= VIG                                    # vignette finish
    a += np.random.randint(-5, 6, size=(H, W, 1)).astype(np.float32)  # film grain
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))

def frame_at(f):
    t = f / FPS
    b = 0
    for i, s in enumerate(STARTS):
        if t >= s:
            b = i
    lf = f - int(STARTS[b] * FPS)
    if b > 0 and lf < TRANS:                    # ease-in-out crossfade between beats
        prev_end = render_frame(b - 1, DURS[b - 1] - 1e-3)
        cur = render_frame(b, lf / FPS)
        al = smooth(lf / TRANS)
        return Image.blend(prev_end, cur, al)
    return render_frame(b, lf / FPS)

out = sys.stdout.buffer
for f in range(NFRAMES):
    img = frame_at(f)
    d = ImageDraw.Draw(img)
    d.rectangle([0, H - sc(6) // 2, int(W * (f + 1) / NFRAMES), H], fill=ORANGE)  # progress
    out.write(img.tobytes())
    if f % 120 == 0:
        print(f"frame {f}/{NFRAMES}", file=sys.stderr)
print("frames done", file=sys.stderr)
PYEOF

echo "==> rendering 1170 studio frames -> H.264 High + silent AAC ..."
python3 "$TMP/render.py" | ffmpeg -y -hide_banner -loglevel error \
  -f rawvideo -pix_fmt rgb24 -s 1920x1080 -framerate 30 -i - \
  -f lavfi -t 39 -i "anullsrc=r=48000:cl=stereo" \
  -map 0:v -map 1:a \
  -c:v libx264 -profile:v high -level 4.1 -pix_fmt yuv420p -r 30 \
  -b:v 2200k -maxrate 2500k -bufsize 5000k \
  -c:a aac -b:a 128k -ar 48000 -ac 2 \
  -movflags +faststart -t 39 "$OUT"

echo "==> gate: ffprobe full stream dump ..."
ffprobe -hide_banner -show_streams -show_format "$OUT"
DUR="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT")"
VW="$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$OUT")"
VH="$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$OUT")"
SIZE="$(stat -f%z "$OUT")"
echo "duration: ${DUR}s (gate 38.5–39.5) | video: ${VW}x${VH} (gate 1920x1080)"
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
