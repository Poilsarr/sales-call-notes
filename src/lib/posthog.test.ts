import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

function createStorageMock() {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
}

const localStorageMock = createStorageMock();
Object.defineProperty(window, 'localStorage', { value: localStorageMock, configurable: true });

describe('identifyPostHogLead', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', 'test-key');
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_HOST', 'https://us.i.posthog.com');
    localStorageMock.clear();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('sends $identify with $set email and preserves the anon distinct_id', async () => {
    window.localStorage.setItem('gauge_posthog_distinct_id', 'anon-123');
    const mod = await import('@/lib/posthog');

    mod.identifyPostHogLead('lead@example.com');

    expect(fetch).toHaveBeenCalledTimes(1);
    const [, opts] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(opts.body as string);
    expect(body.event).toBe('$identify');
    expect(body.properties.distinct_id).toBe('anon-123');
    expect(body.properties.$anon_distinct_id).toBe('anon-123');
    expect(body.properties.$set).toEqual({ email: 'lead@example.com' });
    // Anon id stays in storage — never overwritten with the email.
    expect(window.localStorage.getItem('gauge_posthog_distinct_id')).toBe('anon-123');
  });

  it('generates an anon id when absent and keeps it in storage', async () => {
    const mod = await import('@/lib/posthog');

    mod.identifyPostHogLead('new@example.com');

    expect(fetch).toHaveBeenCalledTimes(1);
    const stored = window.localStorage.getItem('gauge_posthog_distinct_id');
    expect(stored).toBeTruthy();
    const [, opts] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(opts.body as string);
    expect(body.properties.distinct_id).toBe(stored);
    expect(body.properties.$anon_distinct_id).toBe(stored);
    expect(body.properties.$set).toEqual({ email: 'new@example.com' });
  });

  it('never puts the raw email in any other event props', async () => {
    window.localStorage.setItem('gauge_posthog_distinct_id', 'anon-456');
    const mod = await import('@/lib/posthog');

    mod.capturePostHogEvent('lead_captured', { source: 'pricing-exit-intent', ctaId: 'exit-intent' });

    expect(fetch).toHaveBeenCalledTimes(1);
    const raw = JSON.stringify(vi.mocked(fetch).mock.calls[0][1]);
    // No email anywhere in the lead_captured payload.
    expect(raw).not.toContain('@');
  });
});
