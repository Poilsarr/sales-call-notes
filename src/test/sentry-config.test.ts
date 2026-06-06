import { describe, it, expect, vi } from "vitest";

vi.mock("@sentry/nextjs", () => ({
  init: vi.fn(),
  captureException: vi.fn(),
}));

describe("Sentry config files", () => {
  it("client config exports init path", async () => {
    const fs = await import("fs/promises");
    const path = await import("path");
    const root = path.resolve(__dirname, "../..");
    const stat = await fs.stat(path.join(root, "sentry.client.config.ts"));
    expect(stat.isFile()).toBe(true);
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

  it("app/error.tsx exists", async () => {
    const fs = await import("fs/promises");
    const path = await import("path");
    const root = path.resolve(__dirname, "../..");
    const stat = await fs.stat(path.join(root, "src/app/app/error.tsx"));
    expect(stat.isFile()).toBe(true);
  });
});
