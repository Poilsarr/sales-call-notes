import { describe, it, expect, vi } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { render, screen } from "@testing-library/react";

/**
 * Part 6B — extension demo page pins.
 *
 * Every assertion ties back to code that was read, not marketing:
 * sidepanel labels (extension/sidepanel.js), the Bearer exchange
 * (POST /api/v1/keys/exchange), Recent calls (GET /api/v1/calls ->
 * /app/calls/{id}), the permission set (extension/manifest.json +
 * extension/content.js), and the plan caps in the upload/analyze
 * routes (free 30 / pro 200 / business 500 MB).
 */

vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({ user: null, isLoaded: true, isSignedIn: false }),
  useAuth: () => ({ isSignedIn: false, isLoaded: true }),
  UserButton: () => null,
  SignInButton: ({ children }: { children: unknown }) => children,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/extension",
}));

import ExtensionPage from "@/app/extension/page";

const PAGE_FILE = path.join(process.cwd(), "src/app/extension/page.tsx");

function source(): string {
  return fs.readFileSync(PAGE_FILE, "utf-8");
}

// Blocks of U+1F300-U+1FAFF (symbols, pictographs, emoji), U+2600-U+27BF
// (misc symbols, dingbats), U+2B00-U+2BFF (arrows/supplement), plus
// U+FE0F (variation selector). Arrow "->" (U+2192) and ellipsis
// (U+2026) used legitimately on the page sit outside these ranges.
const EMOJI_RE = new RegExp(
  "[\\u{1F300}-\\u{1FAFF}\\u{2600}-\\u{27BF}\\u{2B00}-\\u{2BFF}\\u{FE0F}]",
  "u",
);

describe("extension demo page", () => {
  it("renders the hero h1", () => {
    render(<ExtensionPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /moment you press send/i }),
    ).toBeInTheDocument();
  });

  it("renders the Install section with three steps", () => {
    render(<ExtensionPage />);
    expect(
      screen.getByRole("heading", { name: /install in three steps/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /load the extension unpacked/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /paste your api key and press save/i,
      }),
    ).toBeInTheDocument();
    expect(source()).toMatch(/chrome:\/\/extensions/);
  });

  it("renders the 60-second demo with six numbered steps", () => {
    render(<ExtensionPage />);
    expect(
      screen.getByRole("heading", { name: /the 60-second demo/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/STEP 0[1-6]/)).toHaveLength(6);
    expect(
      screen.getByRole("heading", { name: /press stop, then send/i }),
    ).toBeInTheDocument();
  });

  it("renders the permissions truth table", () => {
    render(<ExtensionPage />);
    expect(
      screen.getByRole("heading", { name: /what the extension can see/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Captures" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Never captures" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/aria-live regions/i)).toBeInTheDocument();
  });

  it("renders all five troubleshooting entries", () => {
    render(<ExtensionPage />);
    expect(
      screen.getByRole("heading", { name: /when something looks wrong/i }),
    ).toBeInTheDocument();
    for (const name of [
      /no captions are captured/i,
      /upload fails with 413/i,
      /key rejected with 401 or 403/i,
      /meeting bot instead/i,
      /automatic upload is unavailable/i,
    ]) {
      expect(screen.getByRole("heading", { name })).toBeInTheDocument();
    }
  });

  it("quotes the exact sidepanel button labels", () => {
    render(<ExtensionPage />);
    expect(screen.getAllByText("Record").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Stop").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Send").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Recent calls").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/32kbps opus/i).length).toBeGreaterThan(0);
  });

  it("quotes the key flow labels", () => {
    render(<ExtensionPage />);
    expect(screen.getAllByText("API key").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Save").length).toBeGreaterThan(0);
    const src = source();
    expect(src).toMatch(/cn_live_/);
    expect(src).toMatch(/cn_test_/);
    expect(src).toMatch(/POST \/api\/v1\/keys\/exchange/);
    expect(src).toMatch(/Settings → API Keys/);
    expect(src).toMatch(/\/settings\?tab=api-keys/);
    expect(src).toMatch(/session memory only/);
  });

  it("links the store placeholder to #store-pending", () => {
    render(<ExtensionPage />);
    const link = screen.getByRole("link", { name: /coming soon/i });
    expect(link).toHaveAttribute("href", "#store-pending");
    expect(source()).toMatch(/href="#store-pending"/);
    expect(source()).toMatch(/id="store-pending"/);
  });

  it("documents the Done summary, Recent calls, health score, and Slack digest", () => {
    const src = source();
    expect(src).toMatch(/Done - summary:/);
    expect(src).toMatch(/\/app\/calls\/{id}/);
    expect(src).toMatch(/GET \/api\/v1\/calls/);
    expect(src).toMatch(/health score/i);
    expect(src).toMatch(/Slack digest/);
    expect(src).toMatch(/POST \/api\/v1\/bots/);
    expect(src).toMatch(/\/app\/record/);
  });

  it("contains zero absolute URLs and zero emojis", () => {
    const src = source();
    expect(src, "absolute URL slipped into the extension page").not.toMatch(
      /https?:\/\//,
    );
    expect(src, "emoji slipped into the extension page").not.toMatch(EMOJI_RE);
  });

  it("contains no hardcoded secrets", () => {
    const src = source();
    expect(src, "real-looking API key in the page").not.toMatch(
      /cn_(live|test)_[A-Za-z0-9]{4,}/,
    );
    expect(src, "Sk key in the page").not.toMatch(/sk-(live|test)-[A-Za-z0-9]+/);
    expect(src, "Authorization header value in the page").not.toMatch(
      /Authorization:\s*Bearer\s+[A-Za-z0-9._-]{12,}/,
    );
  });

  it("contains none of the removed false copy", () => {
    const src = source();
    expect(src, "auto-save claim is back").not.toMatch(/auto-save/i);
    expect(src, "hangup claim is back").not.toMatch(/hangup/i);
    expect(src, "live store URL is back").not.toMatch(/chromewebstore/i);
    expect(src, "repo URL is back").not.toMatch(/github\.com/i);
    // Plan caps must match the upload/analyze route table.
    expect(src).toMatch(/Free\s+30MB/);
    expect(src).toMatch(/Pro\s+200MB/);
    expect(src).toMatch(/Business\s+500MB/);
  });
});
