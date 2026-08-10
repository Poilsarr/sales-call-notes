import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import IntegrationHealth, { IntegrationHealthStatus } from "@/components/integration-health";

function status(
  overrides: Partial<IntegrationHealthStatus> = {},
): IntegrationHealthStatus {
  return {
    connected: false,
    enabled: false,
    syncedAt: null,
    configured: false,
    sandbox: false,
    ...overrides,
  };
}

describe("IntegrationHealth", () => {
  it("renders a row per provider in the record", () => {
    render(
      <IntegrationHealth
        integrations={{
          hubspot: status(),
          salesforce: status(),
          teams: status(),
          slack: status(),
          google_calendar: status(),
        }}
      />,
    );

    expect(screen.getByText("Integration health")).toBeDefined();
    expect(screen.getByText("HubSpot")).toBeDefined();
    expect(screen.getByText("Salesforce")).toBeDefined();
    expect(screen.getByText("Microsoft Teams")).toBeDefined();
    expect(screen.getByText("Slack")).toBeDefined();
    expect(screen.getByText("Google Calendar")).toBeDefined();
  });

  it("shows Connected, Configured, and the formatted sync date when everything is set", () => {
    render(
      <IntegrationHealth
        integrations={{
          hubspot: status({
            connected: true,
            configured: true,
            syncedAt: "2026-08-10T09:30:00.000Z",
          }),
        }}
      />,
    );

    expect(screen.getByText("Connected")).toBeDefined();
    expect(screen.getByText("Active")).toBeDefined();
    expect(screen.getByText("Configured")).toBeDefined();
    expect(screen.getByText(/Last sync:/)).toBeDefined();
    expect(screen.queryByText("SANDBOX")).toBeNull();
  });

  it("shows Disconnected, Not configured, and Never synced for an empty provider", () => {
    render(<IntegrationHealth integrations={{ salesforce: status() }} />);

    expect(screen.getByText("Disconnected")).toBeDefined();
    expect(screen.getAllByText("Not configured").length).toBeGreaterThan(0);
    expect(screen.getByText("Never synced")).toBeDefined();
    expect(screen.queryByText("Connected")).toBeNull();
  });

  it("flags sandbox providers with a SANDBOX tag", () => {
    render(
      <IntegrationHealth
        integrations={{
          google_calendar: status({ connected: true, sandbox: true }),
        }}
      />,
    );

    expect(screen.getByText("SANDBOX")).toBeDefined();
  });

  it("renders the header without rows for an empty record", () => {
    render(<IntegrationHealth integrations={{}} />);

    expect(screen.getByText("Integration health")).toBeDefined();
    expect(screen.getByText("No integrations configured.")).toBeDefined();
  });
});
