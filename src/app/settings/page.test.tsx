import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Stable mock objects created before the module graph loads: the page
// calls useRouter()/useSearchParams() on every render, so fresh objects
// per render would break identity and the tab contract under test. The
// billing fetch fires on mount — stub it with a URL-aware handler so
// child components (branding/vocabulary/API keys) get benign responses.
const { mockRouter, mockSearchParams, mockFetch } = vi.hoisted(() => ({
  mockRouter: { replace: vi.fn(), push: vi.fn() },
  mockSearchParams: { get: vi.fn() },
  mockFetch: vi.fn(),
}));

vi.mock('@/components/nav', () => ({
  default: () => <div />,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => mockSearchParams,
}));

vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({ isLoaded: true, isSignedIn: true }),
  useUser: () => ({
    user: {
      imageUrl: 'https://img.clerk.test/avatar.png',
      fullName: 'Ada Lovelace',
      primaryEmailAddress: { emailAddress: 'ada@example.com' },
    },
  }),
}));

import SettingsPage from './page';

const BILLING = {
  plan: 'pro',
  usage: 12,
  minuteUsage: 30,
  limit: 100,
  minuteLimit: 200,
  teamMemberCount: 2,
  teamMemberLimit: 5,
  features: {},
  subscriptionStatus: null,
  subscriptionPlan: null,
  trialEndsAt: null,
  cancellationEffectiveDate: null,
};

// Every tab's content area opens with a unique Section h2 heading — that
// is what each case asserts on, avoiding matches against the NavTabs
// button labels (which are buttons, not headings).
const TAB_HEADINGS: Array<[string, string]> = [
  ['general', 'Profile'],
  ['workspace', 'Team vocabulary'],
  ['integrations', 'Connected apps'],
  ['api-keys', 'API Keys'],
  ['security', 'Data & privacy'],
];

async function tab(value: string | null) {
  mockSearchParams.get.mockReturnValue(value);
  render(<SettingsPage />);
  // Let the on-mount billing fetch resolve so its setState lands inside
  // act() instead of leaking an async-update warning into the test.
  await act(async () => {});
}

describe('SettingsPage (/settings) tab routing', () => {
  beforeEach(() => {
    mockSearchParams.get.mockReset();
    mockFetch.mockReset();
    mockFetch.mockImplementation((url: unknown) => {
      const u = String(url);
      if (u.includes('/api/billing')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => BILLING,
        } as Response);
      }
      return Promise.resolve({
        ok: false,
        status: 404,
        json: async () => ({ error: 'not found' }),
      } as Response);
    });
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders general content when no tab param is present', async () => {
    await tab(null);
    expect(screen.getByRole('heading', { level: 2, name: 'Profile' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Plan & usage' })).toBeInTheDocument();
  });

  it.each(TAB_HEADINGS)('renders non-empty %s content when tab=%s', async (tabValue, heading) => {
    await tab(tabValue);
    expect(screen.getByRole('heading', { level: 2, name: heading })).toBeInTheDocument();
  });

  it.each(['crm', 'bogus'])(
    'falls back to the general content for unknown tab=%s (no empty content area)',
    async (tabValue) => {
      await tab(tabValue);
      expect(screen.getByRole('heading', { level: 2, name: 'Profile' })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { level: 2, name: 'Workspace' })).toBeNull();
      expect(screen.queryByRole('heading', { level: 2, name: 'Connected apps' })).toBeNull();
      expect(screen.queryByRole('heading', { level: 2, name: 'Data & privacy' })).toBeNull();
    }
  );

  it('renders only the selected tab content', async () => {
    await tab('workspace');
    expect(screen.getByRole('heading', { level: 2, name: 'Workspace' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2, name: 'Profile' })).toBeNull();
    expect(screen.queryByRole('heading', { level: 2, name: 'Data & privacy' })).toBeNull();
  });

  it('shows honest "Not configured" badges in the Integrations directory — no "Live" badge', async () => {
    await tab('integrations');
    expect(
      screen.getByRole('heading', { level: 2, name: 'Integrations directory' })
    ).toBeInTheDocument();
    // OAuth providers (hubspot, salesforce, teams, slack, google) have
    // status "live" but no credentials exist yet on this page.
    expect(screen.getAllByText('Not configured')).toHaveLength(5);
    // Genuinely upcoming: zoom, meet, zapier.
    expect(screen.getAllByText('Coming soon')).toHaveLength(3);
    expect(screen.queryByText('Live')).toBeNull();
  });
});
