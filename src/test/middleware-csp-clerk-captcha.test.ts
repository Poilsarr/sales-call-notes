import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const MW = readFileSync(join(process.cwd(), "src/middleware.ts"), "utf8");

describe("middleware CSP allows Clerk bot-protection origins (CAPTCHA regression pin)", () => {
  it("script-src allows Cloudflare Turnstile (challenges.cloudflare.com)", () => {
    expect(MW).toMatch(/script-src[\s\S]*?https:\/\/challenges\.cloudflare\.com/);
  });

  it("script-src allows Clerk abuse/fraud protection (*.protect.clerk.com)", () => {
    expect(MW).toMatch(/script-src[\s\S]*?https:\/\/\*\.protect\.clerk\.com/);
  });

  it("frame-src allows the Turnstile iframe (challenges.cloudflare.com)", () => {
    expect(MW).toMatch(/frame-src[^"]*https:\/\/challenges\.cloudflare\.com/);
  });

  it("frame-src allows Clerk protection iframes (*.protect.clerk.com)", () => {
    expect(MW).toMatch(/frame-src[^"]*https:\/\/\*\.protect\.clerk\.com/);
  });

  it("connect-src allows Clerk protection origins (*.protect.clerk.com)", () => {
    expect(MW).toMatch(/connect-src[^"]*https:\/\/\*\.protect\.clerk\.com/);
  });

  it("img-src allows Clerk-hosted images (img.clerk.com)", () => {
    expect(MW).toMatch(/img-src[^"]*https:\/\/img\.clerk\.com/);
  });

  it("worker-src allows Clerk's blob: Web Worker (session management)", () => {
    expect(MW).toMatch(/worker-src 'self' blob:/);
  });
});
