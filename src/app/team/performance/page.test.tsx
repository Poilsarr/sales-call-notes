import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';

vi.mock('@/components/nav', () => ({
  default: () => <div />,
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const { mockRouter } = vi.hoisted(() => ({
  mockRouter: { replace: vi.fn(), push: vi.fn() },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(), message: vi.fn() },
}));

function mockClerk(opts: { signedIn?: boolean; authLoaded?: boolean }) {
  const loaded = opts.authLoaded ?? true;
  const signedIn = opts.signedIn ?? true;
  vi.doMock('@clerk/nextjs', () => ({
    useUser: () => ({ user: null, isLoaded: loaded, isSignedIn: signedIn }),
    useAuth: () => ({ isLoaded: loaded, isSignedIn: signedIn }),
  }));
}

const EMPTY_PERF_RESPONSE = {
  ok: true,
  status: 200,
  json: async () => ({ calls: [], members: [] }),
};

const UNAUTH_RESPONSE = {
  ok: false,
  status: 401,
  json: async () => ({ error: 'Unauthorized' }),
};

describe('TeamPerformancePage (/team/performance)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('fetch', vi.fn());
    mockRouter.replace.mockClear();
    mockRouter.push.mockClear();
    vi.mocked(toast.error).mockClear();
    vi.mocked(toast.success).mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.doUnmock('@clerk/nextjs');
  });

  it('renders the honest empty state for a signed-in user', async () => {
    mockClerk({ signedIn: true });

    vi.mocked(fetch).mockResolvedValue(EMPTY_PERF_RESPONSE as Response);

    const { default: TeamPerformancePage } = await import('./page');
    render(<TeamPerformancePage />);

    await waitFor(() => {
      expect(screen.getByText('Team Performance')).toBeInTheDocument();
      expect(screen.getByText('No calls yet')).toBeInTheDocument();
    });
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('confirmed signed-out state redirects with redirect_url preserved', async () => {
    mockClerk({ signedIn: false });

    vi.mocked(fetch).mockResolvedValue(EMPTY_PERF_RESPONSE as Response);

    const { default: TeamPerformancePage } = await import('./page');
    render(<TeamPerformancePage />);

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith(
        '/sign-in?redirect_url=%2Fteam%2Fperformance'
      );
    });
  });

  it('does not redirect while auth is still loading', async () => {
    mockClerk({ signedIn: false, authLoaded: false });

    vi.mocked(fetch).mockResolvedValue(EMPTY_PERF_RESPONSE as Response);

    const { default: TeamPerformancePage } = await import('./page');
    render(<TeamPerformancePage />);

    await waitFor(() => {
      expect(screen.getByText('Team Performance')).toBeInTheDocument();
    });
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('transient 401 while signed in toasts and never auto-bounces', async () => {
    mockClerk({ signedIn: true });

    vi.mocked(fetch).mockResolvedValue(UNAUTH_RESPONSE as Response);

    const { default: TeamPerformancePage } = await import('./page');
    render(<TeamPerformancePage />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Session still settling — please refresh to retry.'
      );
    });
    expect(mockRouter.replace).not.toHaveBeenCalled();
    // Page is kept (retry on next load) — empty table, not a bounce.
    expect(await screen.findByText('No calls yet')).toBeInTheDocument();
  });

  it('confirmed signed-out 401 redirects with redirect_url preserved', async () => {
    mockClerk({ signedIn: false });

    vi.mocked(fetch).mockResolvedValue(UNAUTH_RESPONSE as Response);

    const { default: TeamPerformancePage } = await import('./page');
    render(<TeamPerformancePage />);

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith(
        '/sign-in?redirect_url=%2Fteam%2Fperformance'
      );
    });
  });
});
