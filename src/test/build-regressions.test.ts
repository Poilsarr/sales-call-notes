import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(__dirname, "../..");

describe("build regressions", () => {
  it("marks competitive intelligence route as dynamic", () => {
    const routeSource = readFileSync(
      path.join(repoRoot, "src/app/api/competitive-intelligence/route.ts"),
      "utf8",
    );

    expect(routeSource).toContain("export const dynamic = 'force-dynamic'");
  });

  it("uses the edge-safe Upstash Redis entrypoint in rate limiting", () => {
    const rateLimitSource = readFileSync(
      path.join(repoRoot, "src/lib/rate-limit.ts"),
      "utf8",
    );

    expect(rateLimitSource).toContain('from "@upstash/redis/cloudflare"');
    expect(rateLimitSource).not.toContain('from "@upstash/redis";');
  });
});
