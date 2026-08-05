import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CallSearch from "@/components/call-search";

const { mockFetch } = vi.hoisted(() => ({ mockFetch: vi.fn() }));
vi.stubGlobal("fetch", mockFetch);

function result(overrides: Record<string, unknown> = {}) {
  return {
    id: "c1",
    filename: "recording-1.mp3",
    title: null,
    summary: "quarterly renewal talk",
    date: "2026-06-01T10:00:00.000Z",
    similarity: 0.87,
    ...overrides,
  };
}

function okResponse(payload: unknown) {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(payload),
  } as Response;
}

describe("CallSearch — dashboard semantic recall", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders a labelled search input and submit button", () => {
    render(<CallSearch />);

    const input = screen.getByRole("searchbox", { name: /search your calls/i });
    expect(input).toBeDefined();
    expect(screen.getByRole("button", { name: /search/i })).toBeDefined();
  });

  it("fires exactly one fetch on submit with the query", async () => {
    mockFetch.mockResolvedValue(okResponse({ results: [], degraded: false }));
    render(<CallSearch />);

    fireEvent.change(screen.getByRole("searchbox", { name: /search your calls/i }), {
      target: { value: "renewal talk" },
    });
    fireEvent.click(screen.getByRole("button", { name: /search/i }));

    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledTimes(1)
    );
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("/api/calls/search");
    expect(JSON.parse(init.body)).toEqual({ query: "renewal talk" });
  });

  it("does not fire a fetch for an empty query", () => {
    render(<CallSearch />);

    fireEvent.click(screen.getByRole("button", { name: /search/i }));

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("submits on Enter (keyboard submittable)", async () => {
    mockFetch.mockResolvedValue(okResponse({ results: [], degraded: false }));
    render(<CallSearch />);

    fireEvent.change(screen.getByRole("searchbox", { name: /search your calls/i }), {
      target: { value: "objections" },
    });
    fireEvent.submit(screen.getByRole("form", { name: /search your calls/i }));

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
  });

  it("shows a loading state while the request is in flight", async () => {
    let resolveFetch: (v: unknown) => void;
    mockFetch.mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      })
    );
    render(<CallSearch />);

    fireEvent.change(screen.getByRole("searchbox", { name: /search your calls/i }), {
      target: { value: "renewal" },
    });
    fireEvent.click(screen.getByRole("button", { name: /search/i }));

    expect(screen.getByText("Searching…")).toBeDefined();
    expect(screen.getByRole("button", { name: /search/i })).toBeDisabled();

    resolveFetch!(okResponse({ results: [], degraded: false }));
    await waitFor(() => expect(screen.queryByText("Searching…")).toBeNull());
  });

  it("renders results ranked with title, date, similarity, and a link to the call", async () => {
    mockFetch.mockResolvedValue(
      okResponse({
        results: [result({ title: "Acme Q3 renewal", similarity: 0.9 })],
        degraded: false,
      })
    );
    render(<CallSearch />);

    fireEvent.change(screen.getByRole("searchbox", { name: /search your calls/i }), {
      target: { value: "renewal" },
    });
    fireEvent.click(screen.getByRole("button", { name: /search/i }));

    const status = await screen.findByRole("status");
    expect(status.textContent).toContain("1 call");
    expect(screen.getByText("Acme Q3 renewal")).toBeDefined();
    expect(screen.getByText(/quarterly renewal talk/)).toBeDefined();
    expect(screen.getByText(/90% match/)).toBeDefined();
    expect(screen.getByRole("link", { name: /Acme Q3 renewal/ })).toHaveAttribute(
      "href",
      "/app/calls/c1"
    );
  });

  it("shows an empty state with a hint when nothing matches", async () => {
    mockFetch.mockResolvedValue(okResponse({ results: [], degraded: false }));
    render(<CallSearch />);

    fireEvent.change(screen.getByRole("searchbox", { name: /search your calls/i }), {
      target: { value: "zzz" },
    });
    fireEvent.click(screen.getByRole("button", { name: /search/i }));

    const status = await screen.findByRole("status");
    expect(status.textContent).toContain("No calls matched “zzz”");
    expect(screen.getByText(/no calls matched/i)).toBeDefined();
  });

  it("shows an error state with a retry button that carries pending state", async () => {
    mockFetch.mockRejectedValueOnce(new Error("network down"));
    render(<CallSearch />);

    const input = screen.getByRole("searchbox", { name: /search your calls/i });
    const searchBtn = screen.getByRole("button", { name: /search/i });
    fireEvent.change(input, { target: { value: "renewal" } });
    fireEvent.click(searchBtn);

    const retryBtn = await screen.findByRole("button", { name: /retry/i });
    expect(screen.getByText(/couldn.t search/i)).toBeDefined();

    mockFetch.mockResolvedValue(okResponse({ results: [result()], degraded: false }));
    fireEvent.click(retryBtn);

    expect(screen.getByRole("button", { name: /retrying/i })).toBeDisabled();
    await waitFor(() => expect(screen.queryByRole("button", { name: /retrying/i })).toBeNull());
    expect(screen.getByRole("status").textContent).toContain("1 call");
  });

  it("degrades to a message when the service is unavailable (503)", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 503,
      json: () =>
        Promise.resolve({ error: "Embeddings unavailable: set OPENAI_API_KEY in env vars." }),
    });
    render(<CallSearch />);

    fireEvent.change(screen.getByRole("searchbox", { name: /search your calls/i }), {
      target: { value: "renewal" },
    });
    fireEvent.click(screen.getByRole("button", { name: /search/i }));

    const retryBtn = await screen.findByRole("button", { name: /retry/i });
    expect(screen.getByText(/couldn.t search/i)).toBeDefined();
    expect(retryBtn).toBeDefined();
  });
});
