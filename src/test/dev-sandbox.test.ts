import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getDevSandboxCredentials,
  getDevSandboxProviders,
  isDevSandboxEnabled,
} from "@/lib/integrations/dev-sandbox";

function setEnv(env: { NODE_ENV?: string; VERCEL?: string }) {
  // vi.stubEnv(key, undefined) deletes the variable (restored by
  // vi.unstubAllEnvs in afterEach).
  vi.stubEnv("NODE_ENV", env.NODE_ENV);
  vi.stubEnv("VERCEL", env.VERCEL);
}

describe("dev-sandbox gate", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is enabled for a truly local development build (NODE_ENV=development, no VERCEL)", () => {
    setEnv({ NODE_ENV: "development", VERCEL: undefined });
    expect(isDevSandboxEnabled()).toBe(true);
  });

  it("is disabled on Vercel preview builds (NODE_ENV=development, VERCEL=1)", () => {
    setEnv({ NODE_ENV: "development", VERCEL: "1" });
    expect(isDevSandboxEnabled()).toBe(false);
  });

  it("is disabled in production", () => {
    setEnv({ NODE_ENV: "production", VERCEL: undefined });
    expect(isDevSandboxEnabled()).toBe(false);
  });

  it("is disabled in production on Vercel", () => {
    setEnv({ NODE_ENV: "production", VERCEL: "1" });
    expect(isDevSandboxEnabled()).toBe(false);
  });

  it("is disabled in test environments", () => {
    setEnv({ NODE_ENV: "test", VERCEL: undefined });
    expect(isDevSandboxEnabled()).toBe(false);
  });

  it("returns no credentials when the sandbox is disabled on Vercel", () => {
    setEnv({ NODE_ENV: "development", VERCEL: "1" });
    expect(getDevSandboxCredentials("salesforce")).toBeNull();
  });

  it("returns fake credentials only when the sandbox is enabled locally", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    setEnv({ NODE_ENV: "development", VERCEL: undefined });
    expect(getDevSandboxCredentials("google_calendar")?.clientId).toBe("dev-google-client-id");
    expect(getDevSandboxCredentials("google_calendar")?.clientSecret).toBe("dev-google-client-secret");
    warn.mockRestore();
  });

  it("lists all sandbox providers regardless of the gate", () => {
    setEnv({ NODE_ENV: "test", VERCEL: undefined });
    expect(getDevSandboxProviders()).toEqual([
      "hubspot",
      "salesforce",
      "teams",
      "slack",
      "google_calendar",
    ]);
  });
});
