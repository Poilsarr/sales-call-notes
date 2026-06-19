import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Level 6.2 — Sentry release + environment tagging.
 * Every error in Sentry should be filterable by:
 *   - release: which commit
 *   - environment: production / preview / development
 * If either is missing, error tracking across deploys is useless.
 */
const CONFIGS = [
  "sentry.server.config.ts",
  "sentry.edge.config.ts",
  "sentry.client.config.ts",
];

describe("GATE 6.2 — Sentry release + environment tagged", () => {
  for (const file of CONFIGS) {
    it(`${file} sets release from VERCEL_GIT_COMMIT_SHA or SENTRY_RELEASE`, () => {
      const c = readFileSync(join(process.cwd(), file), "utf8");
      expect(c).toMatch(/release:\s*process\.env\.VERCEL_GIT_COMMIT_SHA/);
      expect(c).toMatch(/SENTRY_RELEASE/);
    });

    it(`${file} sets environment from VERCEL_ENV or SENTRY_ENV or NODE_ENV`, () => {
      const c = readFileSync(join(process.cwd(), file), "utf8");
      expect(c).toMatch(/environment:\s*process\.env\.VERCEL_ENV/);
      expect(c).toMatch(/SENTRY_ENV/);
      expect(c).toMatch(/NODE_ENV/);
    });
  }
});