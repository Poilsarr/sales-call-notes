import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Level 5.5 — onboarding flow exists.
 * 3-step wizard: welcome -> upload -> ready.
 * Persists step state to localStorage so refresh resumes mid-flow.
 */
const PATH = join(process.cwd(), "src/app/onboarding/page.tsx");

describe("GATE 5.5 — onboarding flow", () => {
  it("page file exists", () => {
    expect(existsSync(PATH)).toBe(true);
  });

  it("declares 3 steps (welcome, upload, ready)", () => {
    const c = readFileSync(PATH, "utf8");
    expect(c).toMatch(/type\s+Step\s*=\s*0\s*\|\s*1\s*\|\s*2/);
    expect(c).toMatch(/Welcome/);
    expect(c).toMatch(/Drop a sample/);
    expect(c).toMatch(/Welcome to CallNote Pro/);
  });

  it("persists step in localStorage", () => {
    const c = readFileSync(PATH, "utf8");
    expect(c).toMatch(/localStorage/);
    expect(c).toMatch(/STORAGE_KEY/);
  });

  it("offers a skip path", () => {
    const c = readFileSync(PATH, "utf8");
    expect(c).toMatch(/Skip onboarding|Skip/);
    expect(c).toMatch(/skip\s*=\s*\(/);
  });

  it("lands on /app when finished", () => {
    const c = readFileSync(PATH, "utf8");
    expect(c).toMatch(/window\.location\.href\s*=\s*["']\/app["']/);
  });
});