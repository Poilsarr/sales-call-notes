export const TITLE_MAX_LENGTH = 120;

const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;
const CSV_FORMULA_START = /^[=+\-@\t\r]/;

export function countCodePoints(s: string): number {
  return Array.from(s).length;
}

export function sanitizeTitleText(input: string): string {
  return input.replace(CONTROL_CHARS, '').trim();
}

export type TitleValidation =
  | { ok: true; value: string | null }
  | { ok: false; error: string };

export function validateTitle(input: unknown): TitleValidation {
  if (input === null || input === undefined) return { ok: true, value: null };
  if (typeof input !== 'string') {
    return { ok: false, error: 'title must be a string or null' };
  }
  const cleaned = sanitizeTitleText(input);
  if (cleaned.length === 0) return { ok: true, value: null };
  if (countCodePoints(cleaned) > TITLE_MAX_LENGTH) {
    return { ok: false, error: `Title must be ${TITLE_MAX_LENGTH} characters or fewer` };
  }
  return { ok: true, value: cleaned };
}

export function sanitizeCsvCell(value: unknown): string {
  const escaped = String(value ?? '').replace(/"/g, '""');
  if (CSV_FORMULA_START.test(escaped)) return `'${escaped}`;
  return escaped;
}
