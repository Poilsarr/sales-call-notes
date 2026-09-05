import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the heavy/dependency-heavy imports the call detail page pulls in
// so the tests exercise the page's own fetch/state/toast wiring (mount
// load, Sync to CRM POST, success/error toasts) instead of framer-motion,
// transcript rendering, or panel internals.
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

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(), message: vi.fn() },
}));

vi.mock('@/components/transcript-viewer', () => ({
  TranscriptViewer: () => <div data-testid="transcript-viewer" />,
}));

vi.mock('@/components/analysis-panel', () => ({
  AnalysisPanel: () => <div data-testid="analysis-panel" />,
}));

vi.mock('@/components/chat-sidebar', () => ({
  ChatSidebar: () => <div data-testid="chat-sidebar" />,
}));

vi.mock('@/components/call-title-editor', () => ({
  CallTitleEditor: () => <div data-testid="call-title-editor" />,
}));

import { toast } from 'sonner';
import CallDetailPage from './page';

const ok = (body: unknown) =>
  ({ ok: true, status: 200, json: async () => body } as Response);

const err = (status: number, body: unknown) =>
  ({ ok: false, status, json: async () => body } as Response);

// React 19's use() reads thenable.status; a marked-'fulfilled' thenable
// resolves synchronously, so the page's `use(params)` never suspends and
// the mounted effect (and thus the Sync to CRM button) shows up. A plain
// Promise.resolve would suspend forever under this RTL 16 + react-dom
// 19.2 combo — the Suspense retry never fires inside the test act scope.
function fulfilledThenable<T>(value: T): Promise<T> {
  return {
    status: 'fulfilled',
    value,
    then() {
      /* React never calls then for fulfilled thenables */
    },
  } as unknown as Promise<T>;
}

const CALL = {
  id: 'call-1',
  transcript: 'Alice: hello\n\nBob: hi there',
  summary: 'Discovery call summary',
  healthScore: 8,
  actionItems: [],
  decisions: [],
  nextSteps: [],
  sharedWithTeam: false,
  isPublic: false,
  assignee: null,
  user: { id: 'u1', name: 'Ada Lovelace', email: 'ada@example.com' },
  audioUrl: null,
  comments: [],
  canManageCollaboration: true,
  analytics: null,
  insight: null,
  title: 'Acme discovery',
  filename: 'acme.mp3',
};

// URL-aware fetch handler. The page fires /api/history/:id, /api/team,
// and /api/integrations on mount, then POST /api/calls/:id/sync-crm on
// button click. syncResponse / configuredProviders are swapped per test.
let syncResponse: () => Promise<Response>;
let configuredProviders: Record<string, boolean>;
const fetchMock = vi.fn();

function renderPage() {
  return render(
    <CallDetailPage params={fulfilledThenable({ id: 'call-1' })} />,
  );
}

describe('CallDetailPage (/app/calls/[id])', () => {
  beforeEach(() => {
    syncResponse = () => Promise.resolve(ok({ success: true, result: { dealId: 'deal-1' } }));
    configuredProviders = { hubspot: true, salesforce: false, teams: false };
    fetchMock.mockReset();
    fetchMock.mockImplementation((url: unknown) => {
      const u = String(url);
      if (u.includes('/sync-crm')) return syncResponse();
      if (u.includes('/api/history/')) return Promise.resolve(ok(CALL));
      if (u.includes('/api/team')) return Promise.resolve(ok({ members: [] }));
      if (u.includes('/api/integrations'))
        return Promise.resolve(ok({ configuredProviders }));
      return Promise.resolve(err(404, { error: 'not found' }));
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders a visible, enabled "Sync to CRM" button in the header', async () => {
    renderPage();
    const button = await screen.findByRole('button', { name: 'Sync to CRM' });
    expect(button).toBeInTheDocument();
    expect(button).toBeEnabled();
  });

  it('POSTs the provider to /api/calls/:id/sync-crm and shows a success toast', async () => {
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Sync to CRM' }));

    await waitFor(() => {
      expect(vi.mocked(toast.success)).toHaveBeenCalledWith('Call synced to CRM');
    });

    const syncCall = fetchMock.mock.calls.find(([url]) =>
      String(url).includes('/api/calls/call-1/sync-crm'),
    );
    expect(syncCall).toBeDefined();
    const [url, init] = syncCall as [string, RequestInit];
    expect(url).toBe('/api/calls/call-1/sync-crm');
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toEqual({ provider: 'hubspot' });
  });

  it('uses the team-configured CRM provider when it differs from the default', async () => {
    configuredProviders = { hubspot: false, salesforce: true, teams: false };
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Sync to CRM' }));

    await waitFor(() => {
      expect(vi.mocked(toast.success)).toHaveBeenCalled();
    });

    const syncCall = fetchMock.mock.calls.find(([url]) =>
      String(url).includes('/api/calls/call-1/sync-crm'),
    );
    const [, init] = syncCall as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({ provider: 'salesforce' });
  });

  it('disables the button and shows "Syncing..." while the request is in flight', async () => {
    let resolveSync!: (r: Response) => void;
    syncResponse = () =>
      new Promise<Response>((resolve) => {
        resolveSync = resolve;
      });

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Sync to CRM' }));

    const syncingButton = await screen.findByRole('button', { name: 'Syncing...' });
    expect(syncingButton).toBeDisabled();

    resolveSync(ok({ success: true, result: {} }));
    await waitFor(() => {
      expect(vi.mocked(toast.success)).toHaveBeenCalledWith('Call synced to CRM');
    });
  });

  it('shows toast.error with the server error when sync is rejected (e.g. 403 admin gate)', async () => {
    syncResponse = () => Promise.resolve(err(403, { error: 'Forbidden' }));
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Sync to CRM' }));

    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith('Forbidden');
    });
    expect(vi.mocked(toast.success)).not.toHaveBeenCalled();
  });

  it('falls back to a "Sync failed" message with the status when the server error body has no message', async () => {
    syncResponse = () => Promise.resolve(err(500, {}));
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Sync to CRM' }));

    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith('Sync failed (500)');
    });
  });

  it('shows toast.error when the sync fetch rejects with a network error', async () => {
    syncResponse = () => Promise.reject(new TypeError('Network request failed'));
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Sync to CRM' }));

    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith('Network request failed');
    });
  });

  it('bounds the 3-column grid to the viewport on xl so the chat input is not pushed to the page bottom', async () => {
    renderPage();
    await screen.findByTestId('chat-sidebar');
    const grid = screen.getByTestId('transcript-viewer').closest('.grid');
    expect(grid).not.toBeNull();
    expect(grid!.className).toContain('xl:h-[calc(100vh-12rem)]');
  });

  it('gives the transcript and chat cards a bounded xl height with internal scroll', async () => {
    renderPage();
    await screen.findByTestId('chat-sidebar');
    const chatCard = screen.getByTestId('chat-sidebar').parentElement;
    expect(chatCard!.className).toContain('xl:h-full');
    const transcriptCard = screen
      .getByTestId('transcript-viewer')
      .closest('.doppel-inner-dark');
    expect(transcriptCard).not.toBeNull();
    expect(transcriptCard!.className).toContain('xl:h-full');
  });
});

// The page mocks ChatSidebar, so the 403 upgrade affordance is exercised
// here against the real component via importActual (mock bypass), with
// Clerk's useUser stubbed per the doMock + resetModules pattern.
describe('ChatSidebar 403 upgrade affordance', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.doMock('@clerk/nextjs', () => ({
      useUser: () => ({ user: { id: 'u1' }, isLoaded: true, isSignedIn: true }),
    }));
    Element.prototype.scrollIntoView = vi.fn() as any;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.doUnmock('@clerk/nextjs');
  });

  async function renderRealChatSidebar(chatResponse: unknown, status = 403) {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: status >= 200 && status < 300,
        status,
        json: async () => chatResponse,
      } as Response),
    );
    const { ChatSidebar: RealChatSidebar } = await vi.importActual<
      typeof import('@/components/chat-sidebar')
    >('@/components/chat-sidebar');
    render(<RealChatSidebar />);
    fireEvent.change(screen.getByPlaceholderText('Ask about this call...'), {
      target: { value: 'Summarize this call' },
    });
    fireEvent.submit(
      screen.getByPlaceholderText('Ask about this call...').closest('form')!,
    );
  }

  it('renders an upgrade link to /pricing instead of an Error bubble on 403 PLAN_REQUIRED', async () => {
    await renderRealChatSidebar(
      { error: 'AI chat is a Pro plan feature', code: 'PLAN_REQUIRED' },
      403,
    );

    const link = await screen.findByRole('link', { name: /upgrade to pro/i });
    expect(link).toHaveAttribute('href', '/pricing');
    expect(screen.queryByText(/^Error:/)).not.toBeInTheDocument();
    // Quick-query buttons stay visible above the affordance.
    expect(
      screen.getByRole('button', { name: /objections were raised/i }),
    ).toBeInTheDocument();
  });

  it('still renders a plain Error bubble for non-plan errors', async () => {
    await renderRealChatSidebar({ error: 'Boom' }, 500);

    expect(await screen.findByText('Error: Boom')).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /upgrade to pro/i }),
    ).not.toBeInTheDocument();
  });
});
