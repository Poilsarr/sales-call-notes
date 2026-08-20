import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

vi.mock("@sentry/nextjs", () => ({
  init: vi.fn(),
  captureException: vi.fn(),
}));

describe("Sentry config files", () => {
  it("client config exports lazy init path", async () => {
    const fs = await import("fs/promises");
    const path = await import("path");
    const root = path.resolve(__dirname, "../..");
    const stat = await fs.stat(path.join(root, "sentry.client.config.ts"));
    expect(stat.isFile()).toBe(true);
  });

  it("client config inits only inside the lazy initSentryOnError export", () => {
    const src = readFileSync(join(process.cwd(), "sentry.client.config.ts"), "utf8");
    expect(src).toMatch(/export async function initSentryOnError/);
    expect(src).toMatch(/await import\("@sentry\/nextjs"\)/);
    const topLevel = src.slice(0, src.indexOf("export async function initSentryOnError"));
    expect(topLevel).not.toMatch(/Sentry\.init/);
  });

  it("server config exports init path", async () => {
    const fs = await import("fs/promises");
    const path = await import("path");
    const root = path.resolve(__dirname, "../..");
    const stat = await fs.stat(path.join(root, "sentry.server.config.ts"));
    expect(stat.isFile()).toBe(true);
  });

  it("edge config exists", async () => {
    const fs = await import("fs/promises");
    const path = await import("path");
    const root = path.resolve(__dirname, "../..");
    const stat = await fs.stat(path.join(root, "sentry.edge.config.ts"));
    expect(stat.isFile()).toBe(true);
  });
});

describe("Sentry helper", () => {
  it("exports captureApiError", async () => {
    const mod = await import("@/lib/sentry");
    expect(typeof mod.captureApiError).toBe("function");
  });
});

describe("Error boundary files", () => {
  it("global-error.tsx exists", async () => {
    const fs = await import("fs/promises");
    const path = await import("path");
    const root = path.resolve(__dirname, "../..");
    const stat = await fs.stat(path.join(root, "src/app/global-error.tsx"));
    expect(stat.isFile()).toBe(true);
  });

  it("global-error.tsx lazily inits Sentry instead of eager import", () => {
    const src = readFileSync(join(process.cwd(), "src/app/global-error.tsx"), "utf8");
    expect(src).toMatch(/initSentryOnError/);
    expect(src).toMatch(/await import\("@sentry\/nextjs"\)/);
    expect(src).not.toMatch(/import \* as Sentry from "@sentry\/nextjs"/);
  });

  it("app/error.tsx exists", async () => {
    const fs = await import("fs/promises");
    const path = await import("path");
    const root = path.resolve(__dirname, "../..");
    const stat = await fs.stat(path.join(root, "src/app/app/error.tsx"));
    expect(stat.isFile()).toBe(true);
  });
});