import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import BotPanel from "@/app/app/calendar/bot-panel";

/**
 * Part 7B — bot panel (calendar visibility UI) tests.
 *
 * - Renders the paste-link card + auto-join toggle (auto-join seeded via
 *   GET /api/calendar/auto-join).
 * - Invalid URLs surface a joinable-URL error without POSTing /api/v1/bots.
 * - A valid URL POSTs { meetingUrl } and surfaces { id, status, mode }
 *   plus the pending_manual hint when no Recall key is configured.
 * - Flipping the toggle POSTs { autoJoin } and updates its state.
 */

const mockFetch = vi.fn();

type FetchInit = {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
};

function jsonResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body } as Response;
}

function callsTo(url: string, method?: string) {
  return mockFetch.mock.calls.filter(([u, init]) => {
    if (String(u) !== url) return false;
    if (!method) return true;
    return ((init as FetchInit | undefined)?.method ?? "GET") === method;
  });
}

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockImplementation((url: unknown, init?: unknown) => {
    const u = String(url);
    const method = (init as FetchInit | undefined)?.method ?? "GET";
    if (u === "/api/calendar/auto-join" && method === "GET") {
      return Promise.resolve(jsonResponse({ autoJoin: false }));
    }
    if (u === "/api/calendar/auto-join" && method === "POST") {
      const body = JSON.parse(String((init as FetchInit)?.body ?? "{}")) as {
        autoJoin?: boolean;
      };
      return Promise.resolve(jsonResponse({ autoJoin: body.autoJoin === true }));
    }
    if (u === "/api/v1/bots" && method === "POST") {
      return Promise.resolve(
        jsonResponse({
          id: "bot_123",
          status: "pending_manual",
          mode: "manual",
          platform: "zoom",
        }),
      );
    }
    return Promise.resolve(jsonResponse({}, false, 404));
  });
  vi.stubGlobal("fetch", mockFetch);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("BotPanel (calendar visibility UI)", () => {
  it("renders the paste-link card and the auto-join toggle", async () => {
    render(<BotPanel />);
    expect(screen.getByLabelText(/meeting link/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send to bot/i })).toBeInTheDocument();
    expect(await screen.findByLabelText(/auto-join upcoming meetings/i)).toBeInTheDocument();
  });

  it("shows a joinable-URL error for invalid input without calling the bot API", async () => {
    render(<BotPanel />);
    fireEvent.change(screen.getByLabelText(/meeting link/i), {
      target: { value: "not-a-meeting-link" },
    });
    // jsdom does not implement implicit form submission on submit-button
    // click, so submit the form directly (real browsers submit on click/Enter).
    const form = screen.getByRole("button", { name: /send to bot/i }).closest("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form as HTMLFormElement);
    expect(await screen.findByText(/joinable/i)).toBeInTheDocument();
    expect(callsTo("/api/v1/bots", "POST")).toHaveLength(0);
  });

  it("posts the meeting URL and surfaces status/mode with the pending-manual hint", async () => {
    render(<BotPanel />);
    fireEvent.change(screen.getByLabelText(/meeting link/i), {
      target: { value: "https://zoom.us/j/123456789" },
    });
    const form = screen.getByRole("button", { name: /send to bot/i }).closest("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form as HTMLFormElement);
    // "pending_manual" appears twice (status value + manual-mode hint),
    // so use the plural query.
    const statusHits = await screen.findAllByText(/pending_manual/i);
    expect(statusHits.length).toBeGreaterThan(0);
    expect(screen.getByText(/no recall key/i)).toBeInTheDocument();
    expect(callsTo("/api/v1/bots", "POST")).toHaveLength(1);
  });

  it("flips auto-join via POST and updates the toggle state", async () => {
    render(<BotPanel />);
    const toggle = await screen.findByLabelText(/auto-join upcoming meetings/i);
    await waitFor(() => expect(toggle).not.toBeDisabled());
    expect(toggle).not.toBeChecked();
    fireEvent.click(toggle);
    await waitFor(() => expect(callsTo("/api/calendar/auto-join", "POST")).toHaveLength(1));
    await waitFor(() => expect(toggle).toBeChecked());
  });
});
