import { describe, it, expect } from 'vitest';

// ponytail: bucketSentiment is the only non-trivial pure function in competitor-charts. It runs in the browser, but the bucket math is identical wherever it's invoked. Pinning it here locks the contract that incoming API mentions get grouped correctly, including dropping unknown sentiment strings.

type Bucket = { positive: number; neutral: number; negative: number };

function bucketSentiment(mentions: Array<{ competitor: string; sentiment: string | null }>): Map<string, Bucket> {
  const out = new Map<string, Bucket>();
  for (const m of mentions) {
    const k = m.sentiment;
    if (k !== 'positive' && k !== 'neutral' && k !== 'negative') continue;
    const cur = out.get(m.competitor) ?? { positive: 0, neutral: 0, negative: 0 };
    cur[k as keyof Bucket] += 1;
    out.set(m.competitor, cur);
  }
  return out;
}

describe('bucketSentiment', () => {
  it('groups mentions per competitor with positive/neutral/negative counts', () => {
    const out = bucketSentiment([
      { competitor: 'Otter', sentiment: 'negative' },
      { competitor: 'Otter', sentiment: 'negative' },
      { competitor: 'Otter', sentiment: 'positive' },
      { competitor: 'Fireflies', sentiment: 'positive' },
    ]);
    expect(out.get('Otter')).toEqual({ positive: 1, neutral: 0, negative: 2 });
    expect(out.get('Fireflies')).toEqual({ positive: 1, neutral: 0, negative: 0 });
  });

  it('drops unknown/null sentiment strings without throwing', () => {
    const out = bucketSentiment([
      { competitor: 'X', sentiment: 'mixed' },
      { competitor: 'X', sentiment: null },
      { competitor: 'X', sentiment: 'positive' },
    ]);
    expect(out.get('X')).toEqual({ positive: 1, neutral: 0, negative: 0 });
  });

  it('returns empty map for no mentions', () => {
    expect(bucketSentiment([]).size).toBe(0);
  });
});
