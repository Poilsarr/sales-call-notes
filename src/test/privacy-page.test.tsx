import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { render, screen } from "@testing-library/react";
import SiteFooter from "@/components/site-footer";

/**
 * Pins the honest data-processing claims on the public /privacy page
 * (ship-order item 1, SECURITY-HARDENING-PLAN W-D). Guards against
 * regressions into the old false claims ("local processing", "SOC 2")
 * that were stripped in 4e38488: if anyone reintroduces a compliance
 * claim or a "processed locally on your device" statement, the test
 * fails with a message naming the offending copy.
 */

const PRIVACY_PAGE = path.join(process.cwd(), "src/app/privacy/page.tsx");
const FOOTER = path.join(process.cwd(), "src/components/site-footer.tsx");

function read(file: string): string {
  return fs.readFileSync(file, "utf-8");
}

describe("privacy page is honest about data processing", () => {
  const src = read(PRIVACY_PAGE);

  it("names every cloud processor involved", () => {
    for (const provider of [
      "Groq",
      "OpenAI",
      "Deepgram",
      "Vercel Blob",
      "Upstash",
      "Neon",
    ]) {
      expect(src, `privacy page must name ${provider}`).toMatch(provider);
    }
  });

  it("states cloud processing explicitly and never claims local processing", () => {
    expect(
      src,
      "page must state calls are processed in the cloud"
    ).toMatch(/processed in the cloud/i);
    expect(
      src,
      "page must say nothing is processed locally on the device"
    ).toMatch(/nothing is processed locally/i);
    expect(src, "old 'local-first' claim slipped back in").not.toMatch(
      /local-first/i
    );
  });

  it("states audio is not used to train model providers' models", () => {
    expect(
      src,
      "page must state we don't train on user audio"
    ).toMatch(/do not use your call data to train or fine-tune/i);
  });

  it("never claims SOC 2 or any other compliance status", () => {
    expect(src, "SOC 2 claim must never appear on the privacy page").not.toMatch(
      /SOC\s*2/i
    );
    expect(src, "ISO claim must never appear").not.toMatch(/ISO/i);
    expect(src, "compliance claim must never appear").not.toMatch(
      /complian[ct]/i
    );
  });

  it("documents the real retention and export controls", () => {
    expect(src, "must document call deletion").toMatch(/delete a call/i);
    expect(src, "must document account deletion").toMatch(
      /delete your account/i
    );
    expect(src, "must document the GDPR export path").toMatch(
      /Request export/i
    );
    expect(src, "must reference the Settings page").toMatch(/href="\/settings"/);
  });

  it("documents the real security posture", () => {
    expect(src, "must state private cloud storage").toMatch(
      /private cloud storage/i
    );
    expect(src, "must state rate limits").toMatch(/rate limited/i);
    expect(src, "must state credential encryption").toMatch(
      /AES-256-GCM/i
    );
  });

  it("exposes a questions contact line with the site's support email", () => {
    expect(src, "must link the support email").toMatch(
      /mailto:support@usegauge\.com/
    );
  });

  it("exports metadata with a title and description", () => {
    expect(src, "metadata title missing").toMatch(
      /export const metadata = \{[\s\S]*?title:/
    );
    expect(src, "metadata description missing").toMatch(
      /export const metadata = \{[\s\S]*?description:/
    );
  });
});

describe("footer links to /privacy", () => {
  it("the site footer contains a Privacy link to /privacy", () => {
    const footer = read(FOOTER);
    expect(footer, "footer lost the /privacy link").toMatch(
      /href: "\/privacy"/
    );
  });

  it("the rendered footer renders the Privacy link", () => {
    render(<SiteFooter />);
    const link = screen.getByRole("link", { name: "Privacy Notice" });
    expect(link).toHaveAttribute("href", "/privacy");
  });
});