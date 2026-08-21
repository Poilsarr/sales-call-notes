import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the heavy/dependency-heavy imports the Intelligence page pulls
// in so the tests exercise the page's own state machine (loading →
// 403 / 401 / 5xx / network / empty / populated) instead of framer
// motion's runtime or SVG internals.
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

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock('@/components/upgrade-prompt', () => ({
  default: ({ featureName }: { featureName: string }) => (
    <div data-testid="upgrade-prompt">{featureName}</div>
  ),
}));

// Chip mock: render trend competitors as clickable buttons so the
// selectedCompetitor → refetch wiring can be tested without depending
// on CompetitorCharts' SVG internals.
vi.mock('@/components/competitor-charts', () => ({
  CompetitorCharts: ({ trend, onSelectCompetitor }: any) => (
    <div>
      {(trend ?? []).map((t: { competitor: string }) => (
        <button
          key={t.competitor}
          data-testid={`chip-${t.competitor}`}
          onClick={() => onSelectCompetitor(t.competitor)}
        >
          {t.competitor}
        </button>
      ))}
    </div>
  ),
}));

const ok = (body: unknown) =>
  ({ ok: true, status: 200, json: async () => body } as Response);

const err = (status: number, body: unknown) =>
  ({ ok: false, status, json: async () => body } as Response);

const gongMention = {
  id: 'm1',
  competitor: 'Gong',
  context: 'They mentioned Gong.',
  sentiment: 'positive',
  mentionedBy: 'Prospect',
  timestamp: 1700000000000,
  createdAt: new Date().toISOString(),
  call: {
    id: 'c1',
    filename: 'acme-discovery.mp3',
    displayName: 'Acme Corp discovery call',
    createdAt: new Date().toISOString(),
  },
};

const populatedBody = {
  mentions: [gongMention],
  trend: [
    { competitor: 'Gong', count: 4 },
    { competitor: 'Otter', count: 2 },
  ],
  summary: { total: 6, uniqueCompetitors: 2, days: 30 },
  meta: { companyName: 'Acme Corp', watchlistSize: 2, mode: 'watchlist' as const },
};

const legacyMention = {
  id: 'm2',
  competitor: 'Gong',
  context: null,
  sentiment: null,
  mentionedBy: null,
  timestamp: null,
  createdAt: '2026-08-01T00:00:00.000Z',
  call: {
    id: 'c2',
    filename: 'acme-discovery.mp3',
    displayName: 'Acme Corp discovery call',
    createdAt: '2026-08-01T00:00:00.000Z',
  },
};

const legacyPopulatedBody = {
  mentions: [legacyMention],
  trend: [{ competitor: 'Gong', count: 1 }],
  summary: { total: 1, uniqueCompetitors: 1, days: 30 },
  meta: { companyName: 'Acme Corp', watchlistSize: 1, mode: 'watchlist' as const },
};

// Helper to mock fetch handling company/competitors + intelligence
function mockIntelligenceFetch(intelBody: unknown, opts?: { companyName?: string | null; watchlistEntries?: { id: string; name: string }[]; watchlistSize?: number }) {
  const companyName = opts?.companyName ?? 'Acme Corp';
  const entries = opts?.watchlistEntries ?? [{ id: '1', name: 'Gong' }, { id: '2', name: 'Otter' }];
  const size = opts?.watchlistSize ?? entries.length;
  vi.mocked(fetch).mockImplementation(async (url: string | Request | URL) => {
    const u = typeof url === 'string' ? url : url.toString();
    if (u.includes('/api/company')) return ok({ companyName });
    if (u.includes('/api/competitors')) return ok({ entries, watchlistSize: size });
    if (u.includes('/api/competitive-intelligence')) return ok(intelBody);
    return ok({});
  });
}

function mockIntelligenceFetchWithQueue(intelBodies: unknown[], opts?: { companyName?: string | null; watchlistEntries?: { id: string; name: string }[] }) {
  const companyName = opts?.companyName ?? 'Acme Corp';
  const entries = opts?.watchlistEntries ?? [{ id: '1', name: 'Gong' }];
  let callIdx = 0;
  vi.mocked(fetch).mockImplementation(async (url: string | Request | URL) => {
    const u = typeof url === 'string' ? url : url.toString();
    if (u.includes('/api/company')) return ok({ companyName });
    if (u.includes('/api/competitors')) return ok({ entries });
    if (u.includes('/api/competitive-intelligence')) {
      const body = intelBodies[callIdx] ?? intelBodies[intelBodies.length - 1];
      callIdx += 1;
      return ok(body);
    }
    return ok({});
  });
}

describe('IntelligencePage (/app/intelligence)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders stat cards, the mention row, and the truncation caption for populated data', async () => {
    mockIntelligenceFetch(populatedBody);

    const { default: IntelligencePage } = await import('./page');
    render(<IntelligencePage />);

    await waitFor(() => {
      expect(screen.getByText('Total Mentions')).toBeInTheDocument();
    });
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('Competitors Tracked')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Top Competitor')).toBeInTheDocument();
    expect(screen.getByText('4 mentions')).toBeInTheDocument();
    expect(screen.getAllByText('Gong').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/They mentioned Gong/)).toBeInTheDocument();
    expect(
      screen.getByText(/Showing the most recent 1 of 6 mentions\./)
    ).toBeInTheDocument();
  });

  it('renders the plan-locked upgrade prompt on 403 PLAN_REQUIRED (no stat cards)', async () => {
    vi.mocked(fetch).mockImplementation(async (url: string | Request | URL) => {
      const u = typeof url === 'string' ? url : url.toString();
      if (u.includes('/api/company')) return ok({ companyName: null });
      if (u.includes('/api/competitors')) return ok({ entries: [] });
      if (u.includes('/api/competitive-intelligence')) return err(403, { error: 'Upgrade to Pro to access competitive intelligence', code: 'PLAN_REQUIRED' });
      return ok({});
    });

    const { default: IntelligencePage } = await import('./page');
    render(<IntelligencePage />);

    await waitFor(() => {
      expect(screen.getByTestId('upgrade-prompt')).toBeInTheDocument();
    });
    expect(screen.getByTestId('upgrade-prompt').textContent).toBe(
      'Competitive Intelligence'
    );
    expect(screen.queryByText('Total Mentions')).toBeNull();
  });

  it('renders the session-expired message on 401', async () => {
    vi.mocked(fetch).mockImplementation(async (url: string | Request | URL) => {
      const u = typeof url === 'string' ? url : url.toString();
      if (u.includes('/api/company')) return ok({ companyName: null });
      if (u.includes('/api/competitors')) return ok({ entries: [] });
      if (u.includes('/api/competitive-intelligence')) return err(401, {});
      return ok({});
    });

    const { default: IntelligencePage } = await import('./page');
    render(<IntelligencePage />);

    await waitFor(() => {
      expect(screen.getByText(/Your session expired\./)).toBeInTheDocument();
    });
  });

  it('renders the error card with the API message on 5xx', async () => {
    vi.mocked(fetch).mockImplementation(async (url: string | Request | URL) => {
      const u = typeof url === 'string' ? url : url.toString();
      if (u.includes('/api/company')) return ok({ companyName: null });
      if (u.includes('/api/competitors')) return ok({ entries: [] });
      if (u.includes('/api/competitive-intelligence')) return err(500, { message: 'Failed to fetch competitive intelligence' });
      return ok({});
    });

    const { default: IntelligencePage } = await import('./page');
    render(<IntelligencePage />);

    await waitFor(() => {
      expect(screen.getByText(/Couldn.t load competitive data\./)).toBeInTheDocument();
    });
    expect(
      screen.getByText(/Failed to fetch competitive intelligence/)
    ).toBeInTheDocument();
  });

  it('renders the network error card — NOT the empty state — when fetch rejects', async () => {
    vi.mocked(fetch).mockImplementation(async (url: string | Request | URL) => {
      const u = typeof url === 'string' ? url : url.toString();
      if (u.includes('/api/company')) return ok({ companyName: null });
      if (u.includes('/api/competitors')) return ok({ entries: [] });
      if (u.includes('/api/competitive-intelligence')) throw new TypeError('Network request failed');
      return ok({});
    });

    const { default: IntelligencePage } = await import('./page');
    render(<IntelligencePage />);

    await waitFor(() => {
      expect(
        screen.getByText(/Network error.*could not load competitive data/)
      ).toBeInTheDocument();
    });
    expect(screen.queryByText(/No competitor mentions found yet/)).toBeNull();
  });

  it('renders the truthful empty-state copy for an empty success response', async () => {
    mockIntelligenceFetch(
      {
        mentions: [],
        trend: [],
        summary: { total: 0, uniqueCompetitors: 0, days: 30 },
        meta: { companyName: null, watchlistSize: 0, mode: 'all' as const },
      },
      { companyName: null, watchlistEntries: [] }
    );

    const { default: IntelligencePage } = await import('./page');
    render(<IntelligencePage />);

    await waitFor(() => {
      expect(screen.getByText(/No competitor mentions found yet\./)).toBeInTheDocument();
    });
    expect(screen.getByText(/Add your rivals in Settings → Workspace → Company & Competitors\. Until then, discovery mode\./)).toBeInTheDocument();
  });

  it('re-fetches with ?competitor= when a competitor chip is clicked', async () => {
    mockIntelligenceFetchWithQueue([
      populatedBody,
      {
        mentions: [gongMention],
        trend: [{ competitor: 'Gong', count: 4 }],
        summary: { total: 4, uniqueCompetitors: 1, days: 30 },
        meta: { companyName: 'Acme Corp', watchlistSize: 1, mode: 'watchlist' as const },
      },
    ]);

    const { default: IntelligencePage } = await import('./page');
    render(<IntelligencePage />);

    await waitFor(() => {
      expect(screen.getByTestId('chip-Gong')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('chip-Gong'));

    await waitFor(() => {
      const calls = vi.mocked(fetch).mock.calls.map((c) => String(c[0]));
      const intelCalls = calls.filter((u) => u.includes('competitive-intelligence'));
      expect(intelCalls.some((u) => u.includes('competitor=Gong'))).toBe(true);
    });
    await waitFor(() => {
      expect(screen.getAllByText(/Mentions of "Gong"/)).toHaveLength(2);
    });
  });

  it('renders the honesty banner when mentions have no context or sentiment (legacy calls)', async () => {
    mockIntelligenceFetch(legacyPopulatedBody);

    const { default: IntelligencePage } = await import('./page');
    render(<IntelligencePage />);

    await waitFor(() => {
      expect(screen.getByText('Total Mentions')).toBeInTheDocument();
    });
    expect(
      screen.getByText(
        /1 mention\(s\) detected, but these calls were analyzed before competitor tracking shipped/
      )
    ).toBeInTheDocument();
  });

  it('does not render the honesty banner when mentions have context and sentiment', async () => {
    mockIntelligenceFetch(populatedBody);

    const { default: IntelligencePage } = await import('./page');
    render(<IntelligencePage />);

    await waitFor(() => {
      expect(screen.getByText('Total Mentions')).toBeInTheDocument();
    });
    expect(
      screen.queryByText(/mention\(s\) detected, but these calls were analyzed before/)
    ).toBeNull();
  });

  // V2a — watchlist ownership extensions
  it('renders header meta strip showing Company and Watchlist size', async () => {
    mockIntelligenceFetch(populatedBody, { companyName: 'Acme Corp', watchlistEntries: [{ id: '1', name: 'Gong' }, { id: '2', name: 'Otter' }] });

    const { default: IntelligencePage } = await import('./page');
    render(<IntelligencePage />);

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });
    expect(screen.getByText(/Watchlist 2/)).toBeInTheDocument();
  });

  it('renders watchlist/all toggle and switches mode on click', async () => {
    mockIntelligenceFetch(populatedBody);

    const { default: IntelligencePage } = await import('./page');
    render(<IntelligencePage />);

    await waitFor(() => {
      expect(screen.getByTestId('mode-watchlist')).toBeInTheDocument();
    });
    expect(screen.getByTestId('mode-all')).toBeInTheDocument();

    // Default should be watchlist when size>0
    expect(screen.getByTestId('mode-watchlist').className).toContain('bg-[#F26522]');

    fireEvent.click(screen.getByTestId('mode-all'));
    await waitFor(() => {
      const calls = vi.mocked(fetch).mock.calls.map((c) => String(c[0]));
      const intelCalls = calls.filter((u) => u.includes('competitive-intelligence'));
      // Last intel call should have mode=all
      expect(intelCalls[intelCalls.length - 1]).toContain('mode=all');
    });
  });

  it('shows discovery mode message when watchlist empty', async () => {
    mockIntelligenceFetch(
      {
        mentions: [],
        trend: [],
        summary: { total: 0, uniqueCompetitors: 0, days: 30 },
        meta: { companyName: null, watchlistSize: 0, mode: 'all' as const },
      },
      { companyName: null, watchlistEntries: [] }
    );

    const { default: IntelligencePage } = await import('./page');
    render(<IntelligencePage />);

    await waitFor(() => {
      expect(screen.getByText(/Watchlist empty — showing discovery mode\./)).toBeInTheDocument();
    });
    // Toggle should be visible but watchlist disabled
    expect(screen.getByTestId('mode-watchlist')).toBeDisabled();
  });

  it('watchlist toggle disabled when empty has tooltip', async () => {
    mockIntelligenceFetch(
      {
        mentions: [{ ...gongMention, competitor: 'DiscoveryCo' }],
        trend: [{ competitor: 'DiscoveryCo', count: 1 }],
        summary: { total: 1, uniqueCompetitors: 1, days: 30 },
        meta: { companyName: null, watchlistSize: 0, mode: 'all' as const },
      },
      { companyName: null, watchlistEntries: [] }
    );

    const { default: IntelligencePage } = await import('./page');
    render(<IntelligencePage />);

    await waitFor(() => {
      expect(screen.getByTestId('mode-watchlist')).toBeInTheDocument();
    });
    expect(screen.getByTestId('mode-watchlist').title).toMatch(/Add rivals in Settings/);
  });
});
