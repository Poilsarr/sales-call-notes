import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initializePaddle } from '@paddle/paddle-js';
import type { Tier } from '@/lib/pricing-tiers';

const { clerkState } = vi.hoisted(() => ({
  clerkState: {
    isLoaded: true,
    isSignedIn: false,
    user: null as null | { id: string; primaryEmailAddress?: { emailAddress: string } },
  },
}));

vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    user: clerkState.user,
    isLoaded: clerkState.isLoaded,
    isSignedIn: clerkState.isSignedIn,
  }),
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

vi.mock('@/components/pricing-calculator', () => ({
  default: () => <div />,
}));
vi.mock('@/components/exit-intent-modal', () => ({
  default: () => <div />,
}));
vi.mock('@/components/sticky-pricing-cta', () => ({
  default: () => <div />,
}));
vi.mock('@/components/pricing-social-proof', () => ({
  default: () => <div />,
}));

vi.mock('@paddle/paddle-js', () => ({
  initializePaddle: vi.fn(async () => ({
    Checkout: { open: vi.fn() },
  })),
}));

import PricingClient from '@/components/pricing-client';

const FREE_TIER: Tier = {
  name: 'Free',
  description: 'Free desc',
  features: ['f1'],
  priceId: { month: '', year: '' },
  cta: 'Start free',
  ctaKind: 'signup',
};

const PRO_TIER: Tier = {
  name: 'Pro',
  description: 'Pro desc',
  features: ['f1'],
  priceId: { month: 'pri_pro_monthly', year: 'pri_pro_yearly' },
  cta: 'Subscribe',
  ctaKind: 'checkout',
};

const PRICE_PREVIEW_RESPONSE = {
  ok: true,
  status: 200,
  json: async () => ({ prices: {} }),
};

function proCardCheckoutButton() {
  const heading = screen.getByRole('heading', { name: 'Pro' });
  const card = heading.closest('.doppel-outer') as HTMLElement;
  return within(card).getByRole('button');
}

describe('PricingClient openCheckout auth gate', () => {
  const realLocation = window.location;

  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_PADDLE_CLIENT_KEY', 'test_abc');
    vi.mocked(initializePaddle).mockClear();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(PRICE_PREVIEW_RESPONSE));
    Object.defineProperty(window, 'location', {
      value: { href: 'http://localhost/pricing', origin: 'http://localhost' },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: realLocation,
      writable: true,
      configurable: true,
    });
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('waits while Clerk loads: no navigation for a settling session', async () => {
    clerkState.isLoaded = false;
    clerkState.isSignedIn = false;
    clerkState.user = null;

    render(<PricingClient initialCountry={null} tiers={[FREE_TIER, PRO_TIER]} />);

    const button = await waitFor(() => proCardCheckoutButton());
    fireEvent.click(button);

    // Checkout waits for Clerk — must never bounce a possibly-signed-in
    // buyer to /sign-up while the session settles.
    expect(window.location.href).toBe('http://localhost/pricing');
    expect(vi.mocked(initializePaddle)).not.toHaveBeenCalled();
  });

  it('redirects to /sign-up only when loaded && signed out', async () => {
    clerkState.isLoaded = true;
    clerkState.isSignedIn = false;
    clerkState.user = null;

    render(<PricingClient initialCountry={null} tiers={[FREE_TIER, PRO_TIER]} />);

    const button = await waitFor(() => proCardCheckoutButton());
    fireEvent.click(button);

    expect(window.location.href).toBe('/sign-up?redirect=/pricing');
    expect(vi.mocked(initializePaddle)).not.toHaveBeenCalled();
  });

  it('signed-in users proceed to Paddle, never to /sign-up', async () => {
    clerkState.isLoaded = true;
    clerkState.isSignedIn = true;
    clerkState.user = {
      id: 'user_1',
      primaryEmailAddress: { emailAddress: 'buyer@x.com' },
    };

    render(<PricingClient initialCountry={null} tiers={[FREE_TIER, PRO_TIER]} />);

    const button = await waitFor(() => proCardCheckoutButton());
    fireEvent.click(button);

    await waitFor(() => {
      expect(vi.mocked(initializePaddle)).toHaveBeenCalled();
    });
    expect(window.location.href).toBe('http://localhost/pricing');
  });
});
