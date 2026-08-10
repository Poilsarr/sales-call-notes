import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import IntegrationsPageClient from "@/components/integrations-page-client";

// The page's actions navigate via useRouter().replace; hoist the mock
// so assertions can inspect exactly where it was pointed.
const { replaceMock } = vi.hoisted(() => ({ replaceMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ isLoaded: true, isSignedIn: true }),
}));

vi.mock("@/components/nav", () => ({
  default: () => <nav data-testid="nav-mock" />,
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), message: vi.fn() },
}));

// jsdom has no IntersectionObserver; the page instantiates one to
// drive the .reveal scroll-in animation. Provide a no-op stub.
class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

// The GET /api/integrations response the component consumes:
// `data.integrations` must be the full provider-status record (see
// src/app/api/integrations/route.ts serializeStatuses → the component
// calls setProviderStates(data.integrations)).
const providerState = (overrides: Record<string, unknown> = {}) => ({
  connected: false,
  enabled: false,
  syncedAt: null,
  configured: false,
  ...overrides,
});

const unconfiguredStates = {
  hubspot: providerState(),
  salesforce: providerState(),
  teams: providerState(),
  slack: providerState(),
};

const okResponse = (payload: unknown) =>
  ({
    ok: true,
    status: 200,
    json: async () => payload,
  }) as Response;

describe("IntegrationsPageClient", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    globalThis.IntersectionObserver = IntersectionObserverStub as unknown as typeof IntersectionObserver;
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the hero, nav, and the integrations grid", async () => {
    vi.mocked(fetch).mockResolvedValue(
      okResponse({ integrations: unconfiguredStates, configuredProviders: {} })
    );

    render(<IntegrationsPageClient />);

    expect(screen.getByTestId("nav-mock")).toBeInTheDocument();
    expect(screen.getByText("Connect your stack")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "HubSpot" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Salesforce" })).toBeInTheDocument();
    // Drain the on-mount /api/integrations fetch so the state update
    // happens inside the test (no act() warning).
    await screen.findAllByRole("button", { name: /add credentials/i });
  });

  it("sends unconfigured CRM cards' Add credentials buttons to /settings?tab=integrations", async () => {
    vi.mocked(fetch).mockResolvedValue(
      okResponse({ integrations: unconfiguredStates, configuredProviders: {} })
    );

    render(<IntegrationsPageClient />);

    const addCredentialsButtons = await screen.findAllByRole("button", {
      name: /add credentials/i,
    });
    expect(addCredentialsButtons).toHaveLength(2);

    fireEvent.click(addCredentialsButtons[0]);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/settings?tab=integrations");
    });
    expect(replaceMock).not.toHaveBeenCalledWith("/settings?tab=crm");
  });

  it("points the inline Add OAuth credentials links at /settings?tab=integrations", async () => {
    vi.mocked(fetch).mockResolvedValue(
      okResponse({ integrations: unconfiguredStates, configuredProviders: {} })
    );

    render(<IntegrationsPageClient />);

    const links = await screen.findAllByRole("link", {
      name: /add oauth credentials/i,
    });
    // One per unconfigured provider card (hubspot, salesforce, teams, slack).
    expect(links).toHaveLength(4);
    for (const link of links) {
      expect(link).toHaveAttribute("href", "/settings?tab=integrations");
    }
  });

  it("renders a Manage affordance for a connected CRM and no Sync CRM no-op", async () => {
    vi.mocked(fetch).mockResolvedValue(
      okResponse({
        integrations: {
          ...unconfiguredStates,
          hubspot: providerState({
            connected: true,
            enabled: true,
            syncedAt: new Date().toISOString(),
            configured: true,
          }),
        },
        configuredProviders: { hubspot: true, salesforce: false, teams: false, slack: false },
      })
    );

    render(<IntegrationsPageClient />);

    const manageLink = await screen.findByRole("link", { name: /manage/i });
    expect(manageLink).toHaveAttribute("href", "/settings?tab=integrations");

    expect(screen.queryByText("Sync CRM")).toBeNull();
    expect(screen.queryByText(/CRM sync started/)).toBeNull();
    // The Connected status for the connected HubSpot card is still rendered.
    expect(screen.getByText("Connected")).toBeInTheDocument();
  });
});
