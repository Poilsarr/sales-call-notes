import { describe, it, expect } from 'vitest';
import { normalizeScorecard } from '@/lib/scorecard';

describe('normalizeScorecard', () => {
  it('coerces plain numeric metrics into {score, evidence} objects', () => {
    const result = normalizeScorecard({
      meddic: { metrics: 7, economicBuyer: 6, decisionCriteria: 8, decisionProcess: 7, identifyPain: 8, champion: 5 },
      bant: { budget: 6, authority: 7, need: 8, timeline: 5 },
      spin: { situation: 7, problem: 8, implication: 6, needPayoff: 7 },
      overallScore: 85,
    });

    expect(result.meddic.metrics).toEqual({ score: 7, evidence: '' });
    expect(result.meddic.champion.score).toBe(5);
    expect(result.bant.budget.score).toBe(6);
    expect(result.spin.needPayoff.score).toBe(7);
    expect(result.overallScore).toBe(85);
  });

  it('keeps object-form fields with score and evidence', () => {
    const result = normalizeScorecard({
      bant: { budget: { score: 9, evidence: 'We have Q1 budget approved' } },
      overallScore: 92,
    });

    expect(result.bant.budget).toEqual({ score: 9, evidence: 'We have Q1 budget approved' });
    expect(result.overallScore).toBe(92);
    expect(result.bant.authority).toEqual({ score: 0, evidence: '' });
    expect(result.meddic.metrics).toEqual({ score: 0, evidence: '' });
  });

  it('handles missing/invalid scorecard and clamps out-of-range scores', () => {
    const result = normalizeScorecard(null);

    expect(result.overallScore).toBe(0);
    expect(result.meddic.metrics).toEqual({ score: 0, evidence: '' });
    expect(result.spin.problem).toEqual({ score: 0, evidence: '' });

    const clamped = normalizeScorecard({
      meddic: { metrics: { score: 99, evidence: 'x' } },
      overallScore: -5,
    });
    expect(clamped.meddic.metrics.score).toBe(10);
    expect(clamped.overallScore).toBe(0);
  });

  it('always returns all framework keys', () => {
    const result = normalizeScorecard({});

    expect(Object.keys(result.meddic).sort()).toEqual(['champion', 'decisionCriteria', 'decisionProcess', 'economicBuyer', 'identifyPain', 'metrics'].sort());
    expect(Object.keys(result.bant).sort()).toEqual(['authority', 'budget', 'need', 'timeline'].sort());
    expect(Object.keys(result.spin).sort()).toEqual(['implication', 'needPayoff', 'problem', 'situation'].sort());
  });
});
