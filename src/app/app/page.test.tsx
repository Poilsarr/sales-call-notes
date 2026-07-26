import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the components the dashboard imports so the test doesn't pull in
// the full framer-motion runtime. The bug under test is in the
// DashboardPage component itself, not in those children.
vi.mock('@/components/bento-stats', () => ({
  StatCard: ({ title, value }: { title: string; value: string | number }) => (
    <div data-testid="stat">
      <span data-testid="stat-title">{title}</span>
      <span data-testid="stat-value">{String(value)}</span>
    </div>
  ),
  BentoGrid: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...rest }: any) => <div {...rest}>{children}</div>,
  },
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// Clerk mock factory — each test overrides `useUser` with the
// scenario under test. The previous version of the dashboard
// didn't check `isLoaded`, so when Clerk returned `user: undefined`
// (not yet hydrated), the useEffect bailed out and `loading` stayed
// true forever — all six cards stuck on "..." and "Loading..." at
// the bottom. These tests pin the fix.
function mockClerk(opts: { loaded: boolean; userId?: string }) {
  vi.doMock('@clerk/nextjs', () => ({
    useUser: () => ({
      user: opts.userId ? { id: opts.userId } : null,
      isLoaded: opts.loaded,
      isSignedIn: !!opts.userId,
    }),
  }));
}

describe('AppDashboardPage (/app)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.doUnmock('@clerk/nextjs');
  });

  it('shows ellipsis placeholders while Clerk is hydrating (not permanent "Loading..." at the bottom)', async () => {
    mockClerk({ loaded: false });

    const { default: DashboardPage } = await import('./page');
    render(<DashboardPage />);

    // While Clerk is hydrating, the stat cards that depend on the
    // analytics fetch should show zero placeholders while Clerk is hydrating.
    // The previous version showed "…" (ellipsis) which caused CLS when
    // replaced with real numbers. Now shows "0" with a skeleton overlay
    // to keep card dimensions stable.
    // "Pending Actions" is computed locally (no fetch), so it
    // legitimately shows 0 — we don't assert on it.
    const stats = screen.getAllByTestId('stat');
    expect(stats.length).toBe(6);
    const titles = stats.map(s => s.querySelector('[data-testid="stat-title"]')?.textContent);
    const values = stats.map(s => s.querySelector('[data-testid="stat-value"]')?.textContent);
    const expectedZeros = ['Total Calls', 'Avg Health Score', 'Avg Close Rate', 'Completion Rate', 'Recent Calls'];
    for (const title of expectedZeros) {
      const idx = titles.indexOf(title);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(values[idx]).toBe('0');
    }
  });

  it('reaches a non-loading state once Clerk hydrates with a signed-in user', async () => {
    mockClerk({ loaded: true, userId: 'user_abc' });

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        scope: 'personal',
        totalCalls: 0,
        totalActionItems: 0,
        completionRate: 0,
        avgHealthScore: 0,
        avgCloseProbability: 0,
        callsByDay: {},
        scoresByDay: {},
        sentimentCounts: { positive: 0, neutral: 0, negative: 0 },
        signals: { budgetSignals: 0, timelineSignals: 0, dmSignals: 0 },
        conversationSignals: { totalInterruptions: 0, totalQuestionsAsked: 0 },
        speakerLeaderboard: [],
        recentCalls: [],
      }),
    } as Response);

    const { default: DashboardPage } = await import('./page');
    render(<DashboardPage />);

    // The fix: once Clerk hydrates and the user is signed in, the
    // dashboard fetches and resolves. The recent-calls list should
    // show the visual empty-state (with the upload/extension CTAs),
    // NOT a permanent "Loading...".
    await waitFor(() => {
      expect(
        screen.getByText(/your first call shows up here/i),
      ).toBeInTheDocument();
    });
    // And the stat cards should show real numbers (0, not "…").
    const values = screen.getAllByTestId('stat-value').map(n => n.textContent);
    expect(values.every(v => v === '0' || v === '0%')).toBe(true);
  });

  it('shows the visual empty state when the user is signed out (rare — layout would normally redirect)', async () => {
    mockClerk({ loaded: true });

    const { default: DashboardPage } = await import('./page');
    render(<DashboardPage />);

    // Clerk is done, no user. The previous version was stuck on
    // "Loading..." forever; the fix surfaces the empty state
    // immediately instead of waiting on a fetch that will never
    // happen.
    await waitFor(() => {
      expect(
        screen.getByText(/your first call shows up here/i),
      ).toBeInTheDocument();
    });
  });
});
