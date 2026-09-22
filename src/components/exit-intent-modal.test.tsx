import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

vi.mock('@/lib/posthog', () => ({
  getPostHogDistinctId: vi.fn(() => 'anon-123'),
  identifyPostHogLead: vi.fn(),
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import ExitIntentModal from '@/components/exit-intent-modal';
import { trackEvent } from '@/lib/analytics';
import { identifyPostHogLead } from '@/lib/posthog';

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
const sessionStorageMock = createStorageMock();
Object.defineProperty(window, 'localStorage', { value: localStorageMock, configurable: true });
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock, configurable: true });

const SHOWN_KEY = 'pricing-exit-intent-shown';

async function renderAndTriggerExitIntent() {
  vi.useFakeTimers();
  render(<ExitIntentModal />);
  await act(async () => {
    vi.advanceTimersByTime(3100);
  });
  fireEvent(
    document,
    new MouseEvent('mouseleave', { bubbles: true, clientY: 5 } as MouseEventInit),
  );
  vi.useRealTimers();
  await waitFor(() => {
    expect(screen.getByRole('heading', { name: 'Not ready to upgrade?' })).toBeInTheDocument();
  });
}

describe('ExitIntentModal lead capture', () => {
  beforeEach(() => {
    sessionStorageMock.clear();
    localStorageMock.clear();
    vi.mocked(trackEvent).mockClear();
    vi.mocked(identifyPostHogLead).mockClear();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, id: 'lead_1' }) }),
    );
    // Force the desktop path: no touch points, no stored "already shown".
    Object.defineProperty(window.navigator, 'maxTouchPoints', {
      value: 0,
      configurable: true,
    });
    delete (window as any).ontouchstart;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('shows on exit intent and tracks pricing_exit_intent_shown', async () => {
    await renderAndTriggerExitIntent();
    expect(trackEvent).toHaveBeenCalledWith('pricing_exit_intent_shown');
    expect(sessionStorageMock.getItem(SHOWN_KEY)).toBe('true');
  });

  it('submits the email happy path: POST /api/leads, identify, lead_captured, success', async () => {
    await renderAndTriggerExitIntent();

    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'buyer@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /email me my free minutes/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });
    const [url, opts] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/leads');
    expect(JSON.parse(opts.body as string)).toEqual({
      email: 'buyer@example.com',
      source: 'pricing-exit-intent',
      ctaId: 'exit-intent',
      distinctId: 'anon-123',
    });

    expect(identifyPostHogLead).toHaveBeenCalledWith('buyer@example.com');
    expect(trackEvent).toHaveBeenCalledWith('lead_captured', {
      source: 'pricing-exit-intent',
      ctaId: 'exit-intent',
    });
    // Existing click event still fires on conversion.
    expect(trackEvent).toHaveBeenCalledWith('pricing_exit_intent_click');

    // Raw email never leaks into analytics event props.
    for (const call of vi.mocked(trackEvent).mock.calls) {
      expect(JSON.stringify(call[1] ?? {})).not.toContain('buyer@example.com');
    }

    // Success view keeps the Start-free link + dismiss.
    await waitFor(() => {
      expect(screen.getByText(/you're on the list/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: /start free/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /keep exploring/i })).toBeInTheDocument();
  });

  it('blocks invalid emails without calling fetch', async () => {
    await renderAndTriggerExitIntent();

    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'not-an-email' },
    });
    // Submit the form directly to bypass jsdom native constraint
    // validation and exercise the JS regex fallback (browsers enforce
    // type=email natively; jsdom blocks the submit event entirely).
    fireEvent.submit(document.querySelector('form') as HTMLFormElement);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/valid email/i);
    });
    expect(fetch).not.toHaveBeenCalled();
    expect(identifyPostHogLead).not.toHaveBeenCalled();
  });

  it('shows a server error without identifying', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Too many requests' }),
    } as Response);
    await renderAndTriggerExitIntent();

    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'buyer@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /email me my free minutes/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Too many requests');
    });
    expect(identifyPostHogLead).not.toHaveBeenCalled();
    expect(trackEvent).not.toHaveBeenCalledWith(
      'lead_captured',
      expect.anything(),
    );
  });
});
