/**
 * Marketing assets inventory test (Level 5.4).
 *
 * Pin: OG image exists and is the correct dimensions / size.
 * If a future PR accidentally deletes public/og.png this catches it.
 */
import { describe, it, expect } from "vitest";
import { existsSync, statSync, readFileSync } from "node:fs";
import { join } from "node:path";

const OG_PATH = join(process.cwd(), "public", "og.png");
const SVG_PATH = join(process.cwd(), "public", "og.svg");

describe("marketing assets", () => {
  it("og.png exists in public/", () => {
    expect(existsSync(OG_PATH)).toBe(true);
  });

  it("og.png is a PNG file", () => {
    const buf = readFileSync(OG_PATH);
    expect(buf.subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
  });

  it("og.png is under 250 kB (perfs budget)", () => {
    const stat = statSync(OG_PATH);
    expect(stat.size).toBeLessThan(250 * 1024);
  });

  it("og.svg source exists (so we can re-render if needed)", () => {
    expect(existsSync(SVG_PATH)).toBe(true);
  });
});