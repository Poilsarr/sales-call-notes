import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the shared Nav shell — the component under test is the page
// body, not the navigation.
vi.mock('@/components/nav', () => ({
  default: () => <div />,
}));

// next/link passthrough — the page renders Links (branding, performance).
vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// The page calls router.replace only on redirect paths (401 / signed out);
// the mock must return a STABLE router object — useRouter is called on every
// render, and fetchMembers' useCallback depends on `router`. A fresh object
// per render would change router identity → refetch → re-render → new object
// → infinite fetch loop that clobbers state.
const { mockRouter } = vi.hoisted(() => ({
  mockRouter: { replace: vi.fn(), push: vi.fn() },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

// Clerk mock factory — each test overrides `useUser` / `useAuth` with the
// scenario under test. A solo user has no team membership, so the page's
// `isAdmin` (derived from members[]) is false — the invite form must still
// render for them.
function mockClerk(opts: { email: string; signedIn?: boolean }) {
  vi.doMock('@clerk/nextjs', () => ({
    useUser: () => ({
      user: {
        primaryEmailAddress: { toString: () => opts.email },
      },
      isLoaded: true,
      isSignedIn: opts.signedIn ?? true,
    }),
    useAuth: () => ({ isLoaded: true, isSignedIn: opts.signedIn ?? true }),
  }));
}

const EMPTY_TEAM_ANALYTICS = {
  sharedCalls: 0,
  avgHealthScore: 0,
  openActionItems: 0,
  assignedCalls: 0,
};

const EMPTY_GET_RESPONSE = {
  ok: true,
  json: async () => ({
    members: [],
    teamName: null,
    slug: null,
    sharedCalls: [],
    teamAnalytics: EMPTY_TEAM_ANALYTICS,
  }),
};

const TWO_MEMBER_GET_RESPONSE = {
  ok: true,
  json: async () => ({
    members: [
      { id: 'u1', name: 'Alice', email: 'alice@x.com', teamRole: 'ADMIN', avatar: null },
      { id: 'u2', name: 'Bob', email: 'bob@x.com', teamRole: 'MEMBER', avatar: null },
    ],
    teamName: "Alice's Team",
    slug: 'team-1',
    sharedCalls: [],
    teamAnalytics: EMPTY_TEAM_ANALYTICS,
  }),
};

describe('TeamPage (/team)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.doUnmock('@clerk/nextjs');
  });

  it('solo user sees the invite form and the honest empty state', async () => {
    mockClerk({ email: 'alice@x.com' });

    vi.mocked(fetch).mockResolvedValue(EMPTY_GET_RESPONSE as Response);

    const { default: TeamPage } = await import('./page');
    render(<TeamPage />);

    await waitFor(() => {
      expect(screen.getByText('Invite member')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('colleague@company.com')).toBeInTheDocument();
      expect(
        screen.getByText(/Invite your first teammate with the form above/)
      ).toBeInTheDocument();
    });
  });

  it('admin sees the invite form', async () => {
    mockClerk({ email: 'alice@x.com' });

    vi.mocked(fetch).mockResolvedValue(TWO_MEMBER_GET_RESPONSE as Response);

    const { default: TeamPage } = await import('./page');
    render(<TeamPage />);

    await waitFor(() => {
      expect(screen.getByText('Invite member')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('colleague@company.com')).toBeInTheDocument();
    });
  });

  it('non-admin member does NOT see the invite form', async () => {
    mockClerk({ email: 'bob@x.com' });

    vi.mocked(fetch).mockResolvedValue(TWO_MEMBER_GET_RESPONSE as Response);

    const { default: TeamPage } = await import('./page');
    render(<TeamPage />);

    await waitFor(() => {
      expect(screen.getByText('2 total')).toBeInTheDocument();
    });
    expect(screen.queryByPlaceholderText('colleague@company.com')).toBeNull();
  });

  it('invite failure surfaces the API error in the banner', async () => {
    mockClerk({ email: 'alice@x.com' });

    const getResponse = EMPTY_GET_RESPONSE;
    const postResponse = {
      ok: false,
      status: 403,
      json: async () => ({
        error: 'Team workspaces are a Pro feature. Upgrade to Pro to invite up to 5 members.',
      }),
    };

    vi.mocked(fetch).mockImplementation((url, init) => {
      if ((init as RequestInit | undefined)?.method === 'POST') {
        return Promise.resolve(postResponse as Response);
      }
      return Promise.resolve(getResponse as Response);
    });

    const { default: TeamPage } = await import('./page');
    render(<TeamPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('colleague@company.com')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('colleague@company.com'), {
      target: { value: 'bob@x.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /invite/i }));

    await waitFor(() => {
      expect(screen.getByText(/Team workspaces are a Pro feature/)).toBeInTheDocument();
    });
  });

  it('successful invite refreshes the member list', async () => {
    mockClerk({ email: 'alice@x.com' });

    const getResponse = EMPTY_GET_RESPONSE;
    const postResponse = {
      ok: true,
      json: async () => ({
        members: [
          { id: 'u1', name: 'Alice', email: 'alice@x.com', teamRole: 'ADMIN', avatar: null },
          { id: 'u2', name: 'Bob', email: 'bob@x.com', teamRole: 'MEMBER', avatar: null },
        ],
        teamName: "Alice's Team",
        slug: 'team-1',
      }),
    };

    vi.mocked(fetch).mockImplementation((url, init) => {
      if ((init as RequestInit | undefined)?.method === 'POST') {
        return Promise.resolve(postResponse as Response);
      }
      return Promise.resolve(getResponse as Response);
    });

    const { default: TeamPage } = await import('./page');
    render(<TeamPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('colleague@company.com')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('colleague@company.com'), {
      target: { value: 'bob@x.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /invite/i }));

    await waitFor(() => {
      expect(screen.getByText('2 total')).toBeInTheDocument();
      expect(screen.getByText(/Member invited/)).toBeInTheDocument();
    });
  });
});
