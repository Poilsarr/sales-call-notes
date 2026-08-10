import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import IntegrationsPanel from "@/components/settings/integrations-panel";

const { mockFetch } = vi.hoisted(() => ({ mockFetch: vi.fn() }));
vi.stubGlobal("fetch", mockFetch);

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), message: vi.fn() },
}));

import { toast } from "sonner";

function okResponse(payload: unknown) {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(payload),
  } as Response;
}

function status(
  overrides: Partial<{
    connected: boolean;
    enabled: boolean;
    syncedAt: string | null;
    configured: boolean;
    sandbox: boolean;
  }> = {},
) {
  return {
    connected: false,
    enabled: false,
    syncedAt: null,
    configured: false,
    sandbox: false,
    ...overrides,
  };
}

function directory() {
  return within(screen.getByText("Integrations directory").closest("section") as HTMLElement);
}

function connectedApps() {
  return within(screen.getByText("Connected apps").closest("section") as HTMLElement);
}

describe("IntegrationsPanel", () => {
  let assignMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch.mockReset();
    (toast.error as ReturnType<typeof vi.fn>).mockReset();
    assignMock = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: { assign: assignMock },
    });
  });

  it("renders the Connected apps and Integrations directory sections", () => {
    mockFetch.mockRejectedValue(new Error("network down"));
    render(<IntegrationsPanel />);

    expect(screen.getByText("Connected apps")).toBeDefined();
    expect(screen.getByText("Integrations directory")).toBeDefined();
    expect(screen.getAllByText("Google Calendar")).toHaveLength(2);
    expect(screen.getByRole("button", { name: /connect/i })).toBeDefined();
  });

  it("keeps honest static badges when the status fetch fails", async () => {
    mockFetch.mockRejectedValue(new Error("network down"));
    render(<IntegrationsPanel />);

    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith("/api/integrations"));

    expect(screen.getAllByText("Not configured")).toHaveLength(5);
    expect(screen.getAllByText("Coming soon")).toHaveLength(3);
    expect(screen.queryByText("Live")).toBeNull();
    expect(screen.queryByText("Connected")).toBeNull();
    expect(screen.queryByText("SANDBOX")).toBeNull();
  });

  it("shows a Connected badge and hides the Connect button when Google Calendar is connected", async () => {
    mockFetch.mockResolvedValue(
      okResponse({
        integrations: { google_calendar: status({ connected: true }) },
        configuredProviders: [],
      }),
    );
    render(<IntegrationsPanel />);

    await waitFor(() => expect(connectedApps().getAllByText("Connected")).toHaveLength(1));
    expect(screen.queryByRole("button", { name: /connect/i })).toBeNull();
  });

  it("derives directory badges from the fetched status", async () => {
    mockFetch.mockResolvedValue(
      okResponse({
        integrations: {
          hubspot: status({ connected: true }),
          salesforce: status({ configured: true }),
          teams: status(),
          slack: status(),
          google_calendar: status(),
        },
        configuredProviders: ["hubspot", "salesforce"],
      }),
    );
    render(<IntegrationsPanel />);

    await waitFor(() => expect(directory().getAllByText("Not configured")).toHaveLength(3));
    expect(directory().getAllByText("Connected")).toHaveLength(1);
    expect(directory().getAllByText("Ready to connect")).toHaveLength(1);
    expect(directory().getAllByText("Coming soon")).toHaveLength(3);
  });

  it("appends a SANDBOX tag next to the badge when the provider is in sandbox mode", async () => {
    mockFetch.mockResolvedValue(
      okResponse({
        integrations: { hubspot: status({ sandbox: true }) },
        configuredProviders: [],
      }),
    );
    render(<IntegrationsPanel />);

    await waitFor(() => expect(directory().getAllByText("SANDBOX")).toHaveLength(1));
  });

  it("requests an auth URL from /api/integrations and redirects to it on success", async () => {
    const authUrl = "https://accounts.google.com/o/oauth2/v2/auth?client_id=abc";
    mockFetch.mockResolvedValue(okResponse({ authUrl }));
    render(<IntegrationsPanel />);

    fireEvent.click(screen.getByRole("button", { name: /connect/i }));

    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith("/api/integrations?action=auth-url&provider=google_calendar")
    );
    await waitFor(() => expect(assignMock).toHaveBeenCalledWith(authUrl));
  });

  it("shows the server error toast when the auth URL is missing or the request fails", async () => {
    mockFetch.mockResolvedValue(okResponse({ error: "Google OAuth is not configured" }));
    render(<IntegrationsPanel />);

    fireEvent.click(screen.getByRole("button", { name: /connect/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Google OAuth is not configured")
    );
    expect(assignMock).not.toHaveBeenCalled();
  });

  it("shows an error toast when the response is not ok", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "Provider unavailable" }),
    } as Response);
    render(<IntegrationsPanel />);

    fireEvent.click(screen.getByRole("button", { name: /connect/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Provider unavailable"));
    expect(assignMock).not.toHaveBeenCalled();
  });

  it("shows a fallback toast when the request throws", async () => {
    mockFetch.mockRejectedValue(new Error("network down"));
    render(<IntegrationsPanel />);

    fireEvent.click(screen.getByRole("button", { name: /connect/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Could not connect to calendar service")
    );
    expect(assignMock).not.toHaveBeenCalled();
  });
});
