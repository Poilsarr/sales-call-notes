import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const MW = readFileSync(join(process.cwd(), "src/middleware.ts"), "utf8");

describe("middleware auth() async contract (Clerk v6)", () => {
  it("awaits auth() before destructuring (v6 async auth regression pin)", () => {
    expect(MW).toMatch(/const \{ userId \} = await auth\(\);/);
  });
  it("no sync auth() destructure remains (forgotten await -> all protected routes 401)", () => {
    expect(MW).not.toMatch(/const \{ userId \} = (?!await )auth\(\);/);
  });
});
