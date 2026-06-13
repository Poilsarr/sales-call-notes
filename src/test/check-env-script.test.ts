import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { checkEnv, formatReport, type CheckSummary } from '../../scripts/check-env';

const REQUIRED_KEYS = [
  'DATABASE_URL',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'OPENAI_API_KEY',
  'GROQ_API_KEY',
  'HUBSPOT_CLIENT_ID',
  'HUBSPOT_CLIENT_SECRET',
  'SALESFORCE_CLIENT_ID',
  'SALESFORCE_CLIENT_SECRET',
  'TEAMS_CLIENT_ID',
  'TEAMS_CLIENT_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'PADDLE_API_KEY',
  'NEXT_PUBLIC_PADDLE_CLIENT_TOKEN',
  'PADDLE_WEBHOOK_SECRET',
];

const buildEnv = (overrides: Record<string, string | undefined>): NodeJS.ProcessEnv => {
  const env: Record<string, string | undefined> = {};
  for (const key of REQUIRED_KEYS) {
    if (!(key in overrides)) {
      env[key] = `value-${key}`;
    }
  }
  for (const [k, v] of Object.entries(overrides)) {
    if (v === undefined) continue;
    env[k] = v;
  }
  return env as NodeJS.ProcessEnv;
};

const summarize = (s: CheckSummary) => ({
  requiredSet: s.requiredSet,
  requiredMissing: s.requiredMissing,
  optionalSet: s.optionalSet,
  optionalMissing: s.optionalMissing,
  ok: s.ok,
});

describe('check-env script', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    for (const key of Object.keys(process.env)) {
      if (key.startsWith('CHECK_ENV_TEST_') || REQUIRED_KEYS.includes(key)) {
        delete process.env[key];
      }
    }
  });

  afterEach(() => {
    for (const key of Object.keys(process.env)) {
      delete process.env[key];
    }
    Object.assign(process.env, originalEnv);
  });

  it('marks ok=true when every required var is set', () => {
    const summary = checkEnv(buildEnv({}));
    expect(summarize(summary)).toEqual({
      requiredSet: REQUIRED_KEYS.length,
      requiredMissing: 0,
      optionalSet: 0,
      optionalMissing: expect.any(Number),
      ok: true,
    });
  });

  it('reports missing required vars and ok=false when keys are absent', () => {
    const summary = checkEnv(
      buildEnv({
        OPENAI_API_KEY: undefined,
        GROQ_API_KEY: undefined,
      }),
    );

    const missing = summary.results.filter((r) => r.status === 'missing' && r.level === 'required');
    expect(missing.map((r) => r.key).sort()).toEqual(['GROQ_API_KEY', 'OPENAI_API_KEY']);
    expect(summary.requiredMissing).toBe(2);
    expect(summary.ok).toBe(false);
  });

  it('treats empty string as missing', () => {
    const summary = checkEnv(
      buildEnv({
        HUBSPOT_CLIENT_ID: '',
        HUBSPOT_CLIENT_SECRET: '   ',
      }),
    );

    const hubspot = summary.results.filter((r) => r.group === 'HubSpot');
    expect(hubspot.find((r) => r.key === 'HUBSPOT_CLIENT_ID')?.status).toBe('missing');
    expect(hubspot.find((r) => r.key === 'HUBSPOT_CLIENT_SECRET')?.status).toBe('missing');
    expect(summary.ok).toBe(false);
  });

  it('does not include unset optional vars in requiredMissing', () => {
    const summary = checkEnv(buildEnv({}));
    expect(summary.requiredMissing).toBe(0);
    expect(summary.optionalMissing).toBeGreaterThan(0);
    const unset = summary.results.filter(
      (r) => r.status === 'missing' && r.level === 'optional',
    );
    expect(unset.length).toBe(summary.optionalMissing);
  });

  it('groups results under their category', () => {
    const summary = checkEnv(buildEnv({}));
    const groups = new Set(summary.results.map((r) => r.group));
    expect(groups).toContain('Core');
    expect(groups).toContain('AI');
    expect(groups).toContain('HubSpot');
    expect(groups).toContain('Salesforce');
    expect(groups).toContain('Microsoft Teams');
    expect(groups).toContain('Slack');
  });

  it('handles a fully empty env without throwing', () => {
    const summary = checkEnv({} as NodeJS.ProcessEnv);
    expect(summary.ok).toBe(false);
    expect(summary.requiredSet).toBe(0);
    expect(summary.requiredMissing).toBe(REQUIRED_KEYS.length);
  });

  it('reads from process.env when no argument is passed', () => {
    process.env.DATABASE_URL = 'postgres://test';
    process.env.OPENAI_API_KEY = 'sk-test';
    process.env.GROQ_API_KEY = 'gsk-test';
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_xyz';
    process.env.CLERK_SECRET_KEY = 'sk_test_xyz';

    const summary = checkEnv();
    const db = summary.results.find((r) => r.key === 'DATABASE_URL');
    const hubspot = summary.results.find((r) => r.key === 'HUBSPOT_CLIENT_ID');
    expect(db?.status).toBe('set');
    expect(hubspot?.status).toBe('missing');
  });

  it('produces a printable report with status text for every var', () => {
    const summary = checkEnv(buildEnv({}));
    const report = formatReport(summary, { color: false });
    expect(report).toContain('environment check');
    expect(report).toContain('DATABASE_URL');
    expect(report).toContain('HUBSPOT_CLIENT_ID');
    expect(report).toContain('Summary');
  });

  it('ok=false report flags the missing count in the footer', () => {
    const summary = checkEnv(buildEnv({ SALESFORCE_CLIENT_ID: undefined }));
    const report = formatReport(summary, { color: false });
    expect(report).toMatch(/required env var\(s\) missing/);
  });

  it('ok=true report prints a green-style success line', () => {
    const summary = checkEnv(buildEnv({}));
    const report = formatReport(summary, { color: false });
    expect(report).toContain('All required env vars are set.');
  });
});
