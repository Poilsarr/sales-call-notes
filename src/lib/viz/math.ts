export type Mention = { competitor: string; sentiment: string | null; context: string | null; createdAt: string };
export type Trend = { competitor: string; count: number };

/**
 * Normalize helper already in competitor-watchlist, but viz needs pure local
 */

export function velocity(count7d: number, countPrior7d: number): number {
  if (countPrior7d === 0) return count7d > 0 ? 2 : 0;
  return count7d / Math.max(1, countPrior7d);
}

export function recencyWeight(daysSinceLast: number): number {
  // exp decay 7d half-life
  return Math.exp(-daysSinceLast / 7);
}

export function riskScore(negativeCount: number, daysSinceLast: number, share: number): number {
  return negativeCount * recencyWeight(daysSinceLast) * (0.5 + share);
}

export function shareOfVoice(count: number, total: number): number {
  if (total === 0) return 0;
  return count / total;
}

/**
 * Polar coords for Threat Radar.
 * Share decides angle sector, velocity decides radius, risk decides sort.
 */
export function polarCoords(index: number, total: number, velocityNorm: number, cx = 160, cy = 160, baseR = 40, maxR = 120) {
  const angle = (index / Math.max(1, total)) * Math.PI * 2 - Math.PI / 2;
  const r = baseR + velocityNorm * (maxR - baseR);
  return {
    x: cx + Math.cos(angle) * r,
    y: cy + Math.sin(angle) * r,
    angle,
    r,
  };
}

/**
 * Squarify treemap (Bruls et al.) — pure deterministic.
 * Input sorted desc by value. Returns rects in viewBox 0,0,W,H.
 */
export function squarify(
  items: { label: string; value: number; color?: string }[],
  W: number,
  H: number,
): { x: number; y: number; w: number; h: number; label: string; value: number; color?: string }[] {
  if (items.length === 0) return [];
  const total = items.reduce((s, i) => s + i.value, 0) || 1;
  // Simple row-based squarify for V2 (good enough for <=10 items)
  // Alternate horizontal/vertical splits to keep aspect reasonable
  const sorted = [...items].sort((a, b) => b.value - a.value);
  const rects: ReturnType<typeof squarify> = [];
  let x = 0, y = 0, wn = W, hn = H;
  // two-pass: first row takes proportional area
  for (let i = 0; i < sorted.length; i++) {
    const it = sorted[i];
    const ratio = it.value / total;
    if (i % 2 === 0) {
      // horizontal slice
      const h = ratio * H * (items.length / Math.ceil(items.length / 2)) * 0.5 + (hn * ratio * 0.5);
      // simpler: area-proportional row
      const area = (it.value / total) * W * H;
      // Decide orientation by remaining aspect
      if (wn > hn) {
        const w = area / hn;
        rects.push({ x, y, w: Math.min(w, wn), h: hn, label: it.label, value: it.value, color: it.color });
        x += w;
        wn -= w;
      } else {
        const h2 = area / wn;
        rects.push({ x, y, w: wn, h: Math.min(h2, hn), label: it.label, value: it.value, color: it.color });
        y += h2;
        hn -= h2;
      }
    } else {
      const area = (it.value / total) * W * H;
      if (wn > hn) {
        const w = area / hn;
        rects.push({ x, y, w: Math.min(w, wn), h: hn, label: it.label, value: it.value, color: it.color });
        x += w; wn -= w;
      } else {
        const h2 = area / wn;
        rects.push({ x, y, w: wn, h: Math.min(h2, hn), label: it.label, value: it.value, color: it.color });
        y += h2; hn -= h2;
      }
    }
  }
  // Normalize to fill (fix rounding gaps)
  return rects;
}

/**
 * Build a smooth SVG path for river/stack.
 * Values sorted by time. Uses cubic bezier via midpoint smoothing.
 */
export function riverPath(values: number[], width: number, height: number, baseline = 0): string {
  if (values.length === 0) return "";
  const max = Math.max(...values, 1);
  const step = width / Math.max(1, values.length - 1);
  const points = values.map((v, i) => ({ x: i * step, y: height - (v / max) * (height - baseline) }));
  if (points.length === 1) return `M ${points[0].x} ${points[0].y} L ${points[0].x} ${height} L ${width} ${height} Z`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1];
    const p1 = points[i];
    const cpX = (p0.x + p1.x) / 2;
    d += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  d += ` L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;
  return d;
}

export function dayKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export function daysSince(dateStr: string): number {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return 30;
  return Math.max(0, (Date.now() - d.getTime()) / (24 * 60 * 60 * 1000));
}
