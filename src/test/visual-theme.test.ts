import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * V1 theme core (OTTER-VISUAL-THEME-PLAN §1): pins the shared-class
 * redefinition. Class NAMES stay (142 doppel usages depend on source
 * strings); only computed style changes. Dark doppel stays byte-identical.
 */

const repoRoot = path.resolve(__dirname, "../..");
const GLOBALS = path.join(repoRoot, "src/app/globals.css");
const TAILWIND_CONFIG = path.join(repoRoot, "tailwind.config.ts");

function css(): string {
  return readFileSync(GLOBALS, "utf8");
}

function tailwindConfig(): string {
  return readFileSync(TAILWIND_CONFIG, "utf8");
}

describe("visual theme V1 — class names unchanged", () => {
  it("still emits doppel + btn-primary class names", () => {
    const src = css();
    for (const name of [
      ".doppel-outer",
      ".doppel-inner",
      ".doppel-outer-dark",
      ".doppel-inner-dark",
      ".btn-primary",
    ]) {
      expect(src, `lost class ${name}`).toContain(name);
    }
  });
});

describe("visual theme V1 — doppel light softened", () => {
  it(".doppel-outer uses 2xl radius + soft shadow + ring", () => {
    const src = css();
    expect(src).toContain("rounded-2xl");
    expect(src).toContain("ring-black/[0.06]");
    expect(src).toContain("shadow-sm");
  });

  it(".doppel-inner drops inner shadow for a hairline border", () => {
    const src = css();
    const start = src.indexOf(".doppel-inner {");
    expect(start).toBeGreaterThan(-1);
    const block = src.slice(start, src.indexOf("}", start));
    expect(block).toContain("border");
    expect(block).toContain("border-black/[0.04]");
    expect(block).toContain("shadow-none");
  });
});

describe("visual theme V1 — dark doppel refined", () => {
  it("keeps .doppel-outer-dark rules intact", () => {
    expect(css()).toContain(
      "@apply p-1.5 rounded-2xl ring-1 ring-white/[0.08] bg-white/[0.02] transition-all duration-300 hover:ring-white/[0.14];"
    );
  });

  it("keeps .doppel-inner-dark rules intact", () => {
    expect(css()).toContain(
      "@apply rounded-[calc(1rem-0.25rem)] bg-linear-surface border border-linear-secondary shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)] transition-colors;"
    );
  });
});

describe("visual theme V1 — btn-primary solid brand orange", () => {
  it("uses solid brand orange with subtle elevation", () => {
    const src = css();
    const start = src.indexOf(".btn-primary {");
    expect(start).toBeGreaterThan(-1);
    const block = src.slice(start, src.indexOf("}", start));
    expect(block).toContain("bg-[#F26522]");
    expect(block).toContain("hover:bg-[#e05a1a]");
    expect(block).toContain("shadow-sm");
  });
});

describe("visual theme V1 — marquee contract for V2", () => {
  it("defines @keyframes marquee-horizontal translating 0 → -50%", () => {
    const src = css();
    expect(src).toContain("@keyframes marquee-horizontal");
    expect(src).toContain("translateX(0)");
    expect(src).toContain("translateX(-50%)");
  });

  it("defines .animate-marquee as 40s linear infinite with pause-on-hover", () => {
    const src = css();
    expect(src).toContain(".animate-marquee");
    expect(src).toContain("marquee-horizontal 40s linear infinite");
    expect(src).toContain(".animate-marquee:hover");
    expect(src).toContain("animation-play-state: paused");
  });
});

describe("visual theme V1 — pastel section tints", () => {
  it("adds section-tint utilities with the pinned hexes", () => {
    const src = css();
    expect(src).toContain(".section-tint-blue");
    expect(src).toContain("#EFF4FF");
    expect(src).toContain(".section-tint-peach");
    expect(src).toContain("#FFF4ED");
    expect(src).toContain(".section-tint-mint");
    expect(src).toContain("#EDFAF5");
  });
});

describe("visual theme V1 — tailwind pastel palette + soft shadow", () => {
  it("adds pastel blue/peach/mint/lavender keys", () => {
    const src = tailwindConfig();
    expect(src).toContain("pastel");
    expect(src).toContain('blue: "#EFF4FF"');
    expect(src).toContain('peach: "#FFF4ED"');
    expect(src).toContain('mint: "#EDFAF5"');
    expect(src).toContain("lavender");
  });

  it("adds shadow.soft without renaming existing tokens", () => {
    const src = tailwindConfig();
    expect(src).toContain("boxShadow");
    expect(src).toContain("soft:");
    // Existing tokens survive — no renames/removals.
    for (const token of [
      "accent",
      "linear",
      "axion",
      "film",
      "surface-hover",
      "out-expo",
      "fadeUp",
    ]) {
      expect(src, `lost existing token ${token}`).toContain(token);
    }
  });
});
