import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const MW = readFileSync(
  join(process.cwd(), "src/middleware.ts"),
  "utf8",
);

describe("/billing auth gate (hot-fix)", () => {
  it("middleware includes /billing in isProtectedRoute", () => {
    // /billing was returning 200 unauthenticated — paid-feature page
    // exposed to non-logged-in users. The fix adds it to the Clerk
    // protected-route matcher. Verify the literal substring.
    expect(MW).toMatch(/\/billing\(\.\*\)/);
  });

  it("all other known protected routes are still in the matcher", () => {
    expect(MW).toMatch(/\/api\/\(\.\*\)/);
    expect(MW).toMatch(/\/dashboard\(\.\*\)/);
    expect(MW).toMatch(/\/app\(\.\*\)/);
    expect(MW).toMatch(/\/team\(\.\*\)/);
    expect(MW).toMatch(/\/integrations\(\.\*\)/);
    expect(MW).toMatch(/\/settings\(\.\*\)/);
  });

  it("unauthenticated /api/* still returns 401 (not redirect)", () => {
    expect(MW).toMatch(/NextResponse\.json\(\{ error: "Unauthorized" \}, \{ status: 401 \}\)/);
  });
});
