import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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
    render(<IntegrationsPanel />);

    expect(screen.getByText("Connected apps")).toBeDefined();
    expect(screen.getByText("Integrations directory")).toBeDefined();
    expect(screen.getAllByText("Google Calendar")).toHaveLength(2);
    expect(screen.getByRole("button", { name: /connect/i })).toBeDefined();
  });

  it("shows honest status badges — no Live badge text anywhere", () => {
    render(<IntegrationsPanel />);

    expect(screen.getAllByText("Not configured")).toHaveLength(5);
    expect(screen.getAllByText("Coming soon")).toHaveLength(3);
    expect(screen.queryByText("Live")).toBeNull();
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
