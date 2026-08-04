import { describe, it, expect } from 'vitest';
import { validateTitle, sanitizeCsvCell, countCodePoints } from '@/lib/call-title';

describe('validateTitle', () => {
  it('accepts a trimmed string', () => {
    expect(validateTitle('  Acme Q3 renewal  ')).toEqual({ ok: true, value: 'Acme Q3 renewal' });
  });
  it('returns null for null / undefined / empty / whitespace-only', () => {
    expect(validateTitle(null)).toEqual({ ok: true, value: null });
    expect(validateTitle(undefined)).toEqual({ ok: true, value: null });
    expect(validateTitle('')).toEqual({ ok: true, value: null });
    expect(validateTitle('   ')).toEqual({ ok: true, value: null });
  });
  it('rejects non-strings', () => {
    expect(validateTitle(123).ok).toBe(false);
    expect(validateTitle(['x']).ok).toBe(false);
    expect(validateTitle({}).ok).toBe(false);
  });
  it('strips control characters', () => {
    expect(validateTitle('a\u0000b\u0007c')).toEqual({ ok: true, value: 'abc' });
    expect(validateTitle('a\nb\tc')).toEqual({ ok: true, value: 'abc' });
  });
  it('returns null for control-char-only input', () => {
    expect(validateTitle('\u0000\u0007')).toEqual({ ok: true, value: null });
  });
  it('rejects >120 code points (emoji count as 1 each)', () => {
    expect(validateTitle('😀'.repeat(120)).ok).toBe(true);
    expect(validateTitle('😀'.repeat(121)).ok).toBe(false);
  });
});

describe('sanitizeCsvCell', () => {
  it('escapes double quotes', () => {
    expect(sanitizeCsvCell('say "hi"')).toBe('say ""hi""');
  });
  it('prefixes formula-starting cells with a quote', () => {
    for (const s of ['=cmd()', '+SUM(A1)', '-2+3', '@x', '\t=1']) {
      expect(sanitizeCsvCell(s).startsWith("'")).toBe(true);
    }
  });
  it('handles null/undefined as empty', () => {
    expect(sanitizeCsvCell(null)).toBe('');
    expect(sanitizeCsvCell(undefined)).toBe('');
  });
});

describe('countCodePoints', () => {
  it('counts emoji as one code point', () => {
    expect(countCodePoints('😀😀')).toBe(2);
    expect(countCodePoints('a😀b')).toBe(3);
  });
});
