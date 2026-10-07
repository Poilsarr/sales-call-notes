import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

vi.mock('@/lib/posthog', () => ({
  getPostHogDistinctId: vi.fn(() => 'anon-123'),
  identifyPostHogLead: vi.fn(),
}));

import FooterLeadForm from '@/components/footer-lead-form';
import { trackEvent } from '@/lib/analytics';
import { getPostHogDistinctId, identifyPostHogLead } from '@/lib/posthog';

describe('FooterLeadForm', () => {
  beforeEach(() => {
    vi.mocked(trackEvent).mockClear();
    vi.mocked(identifyPostHogLead).mockClear();
    vi.mocked(getPostHogDistinctId).mockClear();
    vi.mocked(getPostHogDistinctId).mockReturnValue('anon-123');
    window.history.pushState({}, '', '/');
    Object.defineProperty(document, 'referrer', { value: '', configurable: true });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, id: 'lead_1' }) }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    window.history.pushState({}, '', '/');
    Object.defineProperty(document, 'referrer', { value: '', configurable: true });
  });

  it('renders an accessible email input with no auto-popup behavior', () => {
    render(<FooterLeadForm />);
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /subscribe/i })).toBeInTheDocument();
    // Static form only — no dialog/modal auto-popup.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('blocks invalid emails without calling fetch', async () => {
    render(<FooterLeadForm />);

    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'not-an-email' },
    });
    fireEvent.submit(screen.getByLabelText('Email address').closest('form') as HTMLFormElement);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/valid email/i);
    });
    expect(fetch).not.toHaveBeenCalled();
    expect(identifyPostHogLead).not.toHaveBeenCalled();
  });

  it('submits the success path: POST /api/leads, identify, lead_captured', async () => {
    window.history.pushState({}, '', '/?utm_source=google&utm_medium=cpc');
    Object.defineProperty(document, 'referrer', {
      value: 'https://google.com/search',
      configurable: true,
    });
    render(<FooterLeadForm />);

    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'buyer@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /subscribe/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });
    const [url, opts] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/leads');
    const payload = JSON.parse(opts.body as string);
    expect(payload).toMatchObject({
      email: 'buyer@example.com',
      source: 'footer',
      ctaId: 'footer-newsletter',
      distinctId: 'anon-123',
    });
    expect(typeof payload.landingPage).toBe('string');
    expect(payload.landingPage).toContain('utm_source=google');
    expect(payload.referrer).toBe('https://google.com/search');
    expect(payload.utm_source).toBe('google');
    expect(payload.utm_medium).toBe('cpc');

    expect(identifyPostHogLead).toHaveBeenCalledWith('buyer@example.com');
    expect(trackEvent).toHaveBeenCalledWith('lead_captured', {
      source: 'footer',
      ctaId: 'footer-newsletter',
    });

    // Raw email never leaks into analytics event props.
    for (const call of vi.mocked(trackEvent).mock.calls) {
      expect(JSON.stringify(call[1] ?? {})).not.toContain('buyer@example.com');
    }

    await waitFor(() => {
      expect(screen.getByText(/you're on the list/i)).toBeInTheDocument();
    });
  });

  it('omits distinctId when anonymous id is unavailable', async () => {
    vi.mocked(getPostHogDistinctId).mockReturnValue(null);
    render(<FooterLeadForm />);

    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'buyer@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /subscribe/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });
    const [, opts] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    const payload = JSON.parse(opts.body as string);
    expect(payload.email).toBe('buyer@example.com');
    expect(payload.distinctId).toBeUndefined();
    expect(identifyPostHogLead).toHaveBeenCalledWith('buyer@example.com');
  });

  it('shows a server error without identifying', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Too many requests' }),
    } as Response);
    render(<FooterLeadForm />);

    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'buyer@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /subscribe/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Too many requests');
    });
    expect(identifyPostHogLead).not.toHaveBeenCalled();
    expect(trackEvent).not.toHaveBeenCalledWith('lead_captured', expect.anything());
  });

  it('shows a network error without identifying', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('boom'));
    render(<FooterLeadForm />);

    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'buyer@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /subscribe/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/network error/i);
    });
    expect(identifyPostHogLead).not.toHaveBeenCalled();
  });
});
