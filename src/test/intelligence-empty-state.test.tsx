/**
 * Regression test for the bug where /app/intelligence
 * silently swallowed a 403 PLAN_REQUIRED response and
 * rendered an "empty" zero-state page. The user thought
 * the feature was broken; the actual cause was the
 * upgrade gate.
 *
 * The fix surfaces the 403 in a real upgrade prompt
 * instead of an empty card.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...rest }: any) => <div {...rest}>{children}</div>,
  },
}));

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

vi.mock("next/link", () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

beforeEach(() => {
  fetchMock.mockReset();
});

describe("/app/intelligence fetch handling", () => {
  it("surfaces a 403 PLAN_REQUIRED response as an upgrade prompt, not an empty card", async () => {
    fetchMock.mockResolvedValueOnce({
      status: 403,
      json: async () => ({
        error: "Upgrade to Pro to access competitive intelligence",
        code: "PLAN_REQUIRED",
      }),
    });

    const { default: IntelligencePage } = await import(
      "@/app/app/intelligence/page"
    );
    render(<IntelligencePage />);

    await waitFor(() => {
      expect(screen.getByText(/Pro plan required/i)).toBeInTheDocument();
    });
    expect(
      screen.getByText(/Upgrade to Pro to access competitive intelligence/i),
    ).toBeInTheDocument();
    const cta = screen.getByRole("link", { name: /see pro plan/i });
    expect(cta.getAttribute("href")).toBe("/billing");
  });

  it("surfaces a 500 server error as a retry card, not an empty card", async () => {
    fetchMock.mockResolvedValueOnce({
      status: 500,
      json: async () => ({ error: "Prisma client error: column does not exist" }),
    });

    const { default: IntelligencePage } = await import(
      "@/app/app/intelligence/page"
    );
    render(<IntelligencePage />);

    await waitFor(() => {
      expect(screen.getByText(/Couldn't load intelligence/i)).toBeInTheDocument();
    });
    expect(
      screen.getByText(/Prisma client error: column does not exist/i),
    ).toBeInTheDocument();
  });

  it("surfaces a network failure with the error message", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Failed to fetch"));

    const { default: IntelligencePage } = await import(
      "@/app/app/intelligence/page"
    );
    render(<IntelligencePage />);

    await waitFor(() => {
      expect(screen.getByText(/Couldn't load intelligence/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Failed to fetch/i)).toBeInTheDocument();
  });
});
