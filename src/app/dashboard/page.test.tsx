import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import DashboardPage from './page';

vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    user: { id: 'user_123' },
  }),
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
