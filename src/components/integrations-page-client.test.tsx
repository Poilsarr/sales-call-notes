import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import IntegrationsPageClient from "@/components/integrations-page-client";
import { toast } from "sonner";

// The page's actions navigate via useRouter().replace; hoist the mock
// so assertions can inspect exactly where it was pointed. The search
// params are read from a mutable holder so tests can simulate
// OAuth callback URLs (e.g. ?google=connected).
const { replaceMock, searchParamsMock } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  searchParamsMock: { params: new URLSearchParams() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, push: vi.fn() }),
  useSearchParams: () => searchParamsMock.params,
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
  google_calendar: providerState(),
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
    searchParamsMock.params = new URLSearchParams();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
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
    // One per unconfigured provider card (hubspot, salesforce, teams, slack, google_calendar).
    expect(links).toHaveLength(5);
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

  it("handles ?google=connected with a success toast and refetches the integration list", async () => {
    vi.mocked(fetch).mockResolvedValue(
      okResponse({ integrations: unconfiguredStates, configuredProviders: {} })
    );

    searchParamsMock.params = new URLSearchParams("google=connected");
    render(<IntegrationsPageClient />);

    // Success toast fires (and no generic error toast).
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Google Calendar connected");
    });
    expect(toast.error).not.toHaveBeenCalled();

    // On-mount list load + the callback-triggered refetch = 2 calls to the
    // list endpoint.
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
    expect(fetch).toHaveBeenNthCalledWith(1, "/api/integrations", expect.objectContaining({ cache: "no-store" }));
    expect(fetch).toHaveBeenNthCalledWith(2, "/api/integrations", expect.objectContaining({ cache: "no-store" }));

    // The callback param is cleared so it is not re-processed on re-render.
    expect(replaceMock).toHaveBeenCalledWith("/integrations");
  });

  it("renders the Google Calendar provider card as a live provider", async () => {
    vi.mocked(fetch).mockResolvedValue(
      okResponse({
        integrations: {
          ...unconfiguredStates,
          google_calendar: providerState({ configured: true }),
        },
        configuredProviders: {},
      })
    );

    render(<IntegrationsPageClient />);

    const heading = await screen.findByRole("heading", { name: "Google Calendar" });
    expect(heading).toBeInTheDocument();

    const card = heading.closest(".doppel-outer") as HTMLElement;
    // Live provider badge, an actionable Connect button, and no "Coming Soon".
    expect(within(card).getByText("Live")).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: /connect/i })).toBeInTheDocument();
    expect(within(card).queryByText("Coming Soon")).toBeNull();
  });
});
