import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const SECURITY = path.join(process.cwd(), "src/app/security/page.tsx");
const PRIVACY = path.join(process.cwd(), "src/app/privacy/page.tsx");
const read = (p: string) => fs.readFileSync(p, "utf8");

describe("security page honesty (S6 extension)", () => {
  const src = read(SECURITY);

  it("never claims a numeric checklist count (research list has 14, not 20)", () => {
    expect(src).not.toMatch(/\b20\s*-?\s*point/i);
    expect(src).not.toMatch(/\b\d+\s*(point|item)s?\b/i);
  });

  it("every checklist item carries an explicit honest status", () => {
    const items = src.match(/item: "[^"]+"/g) ?? [];
    expect(items.length).toBeGreaterThanOrEqual(14);
    for (const item of items) {
      const name = item.slice(7, -1);
      // Bounded window: the status must belong to THIS item, not bleed
      // onto the next object literal (previous regex passed vacuously).
      const start = src.indexOf(item);
      const window = src.slice(start, start + 200);
      expect(window, `checklist item missing status: ${name}`).toMatch(
        /status: "(Live|Partial|Roadmap|N\/A)"/
      );
    }
    const statuses = src.match(/status: "(Live|Partial|Roadmap|N\/A)",/g) ?? [];
    expect(statuses.length, "status count must equal item count").toBe(items.length);
  });

  it("states true facts — no invented details (Reality Checker F1–F4)", () => {
    expect(src).not.toMatch(/HMAC/); // API keys are SHA-256, not HMAC
    expect(src).not.toMatch(/single-use/); // export tokens are 7-day, re-runnable
    expect(src).not.toMatch(/60 seconds/); // export TTL is 7 days
    expect(src).toMatch(/expires 7 days after it is issued/); // worker TTL
    expect(src).toMatch(/separate read \/ read_write\s*scopes/); // no admin scope
    expect(src).not.toMatch(/[Ee]very response carries a strict CSP/); // middleware matcher excludes marketing routes
    expect(src).toMatch(/SHA-256 hashes/);
  });

  it("provider roles match the code — Groq is the transcription default (F8)", () => {
    expect(src).toMatch(/Groq \(whisper-large-v3\) by default/);
    expect(src).toMatch(/OpenAI[\s\S]{0,80}fallback/);
    expect(src).toMatch(/Transcription \(default\)/);
    expect(src).toMatch(/Transcription fallback and analysis/);
  });

  it("does not overclaim OpenAI-style guarantees for Groq (F7)", () => {
    expect(src).toMatch(/OpenAI does not train on API data/);
    expect(src).not.toMatch(/neither provider trains/);
  });

  it("never overclaims SOC 2 — readiness only, never 'certified'", () => {
    expect(src).toMatch(/SOC 2 Type II[\s\S]*?Roadmap/i);
    expect(src).not.toMatch(/SOC\s*2[\s\S]{0,80}certified/i);
  });

  it("never claims HIPAA compliance or SSO as live", () => {
    expect(src).toMatch(/HIPAA BAA[\s\S]*?"N\/A"/);
    expect(src).toMatch(/SSO via SAML 2\.0[\s\S]*?Roadmap/);
    expect(src).not.toMatch(/\bSSO\b[\s\S]{0,40}live/i);
  });

  it("no-training clause is a prominent standalone section (not just a sentence)", () => {
    expect(src).toMatch(/<h2[^>]*>5\. Your data is never used for AI training<\/h2>/);
    expect(src).toMatch(/do not use your call data to train or fine-tune any model/);
  });

  it("is consistent with the /privacy page's no-training statement", () => {
    const privacy = read(PRIVACY);
    expect(privacy).toMatch(/do not use your call data to train/i);
    expect(src).toMatch(/train or fine-tune/i);
  });

  it("sub-processor table lists the active vendors and the 30-day notice promise", () => {
    for (const vendor of ["OpenAI", "Groq", "Clerk", "Neon", "Vercel", "Upstash"]) {
      expect(src, `missing sub-processor: ${vendor}`).toContain(vendor);
    }
    expect(src).toMatch(/30 days before\s+any new sub-processor/i);
  });

  it("metadata is honest and ≤160 chars — 'local processing' lie stays dead", () => {
    expect(src).not.toMatch(/local processing/i);
    const desc = src.match(/description:\s*\n?\s*"([^"]+)"/);
    expect(desc).not.toBeNull();
    expect(desc![1].length).toBeLessThanOrEqual(160);
  });

  it("keeps the skip-link target (id=main) required by WCAG 2.4.1", () => {
    expect(src).toMatch(/<main id="main"/);
  });
});
