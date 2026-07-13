import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import DashboardPage from './page';

vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    user: { id: 'user_123' },
  }),
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    userId: 'user_123',
  }),
  UserButton: () => <div data-testid="user-button-mock" />,
  SignInButton: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  SignOutButton: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  SignUpButton: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  ClerkProvider: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => '/',
}));

vi.mock('@/components/nav', () => ({
  default: () => <nav data-testid="nav-mock" />,
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders an error state instead of crashing when analytics fails', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Analytics failed' }),
    } as Response);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Analytics failed')).toBeInTheDocument();
    });
  });
});
