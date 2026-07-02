import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

/**
 * Regression test for the bug where the marketing footer
 * (rendered on every public page) contained two hrefs to
 * routes that didn't exist: /blog and /security. The result
 * was two guaranteed 404s for any visitor who clicked them
 * from the home, /pricing, /features, /integrations, or
 * /sign-in pages. The /security page was added in commit
 * fixing this PR; /blog is now a "coming soon" index so
 * the link goes somewhere real instead of a global 404.
 *
 * The test parses the rendered footer HTML (or, in CI
 * without a server, the source files) and asserts every
 * anchor href points to a route whose page.tsx exists.
 */
describe("footer links resolve to real routes", () => {
  function findFiles(dir: string, pattern: RegExp): string[] {
    const out: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        out.push(...findFiles(full, pattern));
      } else if (pattern.test(entry.name)) {
        out.push(full);
      }
    }
    return out;
  }

  function extractHrefs(filePath: string): string[] {
    const src = fs.readFileSync(filePath, "utf-8");
    const hrefs: string[] = [];
    const re = /href="(\/[^"#?]*)"/g;
    let m;
    while ((m = re.exec(src)) !== null) {
      const href = m[1];
      // Skip dynamic routes and api/ — we only verify static
      // marketing routes.
      if (
        href.startsWith("/_") ||
        href.startsWith("/api/") ||
        href.includes("[") ||
        href.startsWith("mailto:") ||
        href.startsWith("http")
      ) {
        continue;
      }
      hrefs.push(href);
    }
    return hrefs;
  }

  function routeExists(href: string): boolean {
    const trimmed = href.split("#")[0].split("?")[0];
    if (!trimmed) return true; // pure fragment is fine
    const pagePath = path.join(process.cwd(), "src", "app", trimmed, "page.tsx");
    if (fs.existsSync(pagePath)) return true;
    // Next.js catch-all convention: /sign-in/[[...sign-in]]/page.tsx
    // is the implementation of /sign-in. Search the immediate
    // child directories for a [[...]] catch-all.
    const dir = path.join(process.cwd(), "src", "app", trimmed);
    if (!fs.existsSync(dir)) return false;
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      if (/^\[\[\.\.\..*\]\]$/.test(entry)) {
        const subPage = path.join(dir, entry, "page.tsx");
        if (fs.existsSync(subPage)) return true;
      }
    }
    return false;
  }

  it("every internal href in the layout and the public marketing pages resolves to a real page.tsx", () => {
    const targets = [
      "src/app/layout.tsx",
      "src/app/page.tsx",
      "src/app/features/page.tsx",
      "src/app/pricing/page.tsx",
      "src/app/integrations/page.tsx",
      "src/app/api-docs/page.tsx",
      "src/app/demo/page.tsx",
      ...findFiles("src/components", /^footer\.(tsx|ts)$/i),
      ...findFiles("src/components", /footer/i),
    ];
    const seen = new Set<string>();
    for (const file of targets) {
      if (!fs.existsSync(file)) continue;
      for (const href of extractHrefs(file)) {
        if (href.length <= 1) continue;
        seen.add(href);
      }
    }
    expect(seen.size).toBeGreaterThan(0);
    const dead: string[] = [];
    for (const href of Array.from(seen)) {
      if (!routeExists(href)) dead.push(href);
    }
    expect(dead, `dead footer links: ${dead.join(", ")}`).toEqual([]);
  });
});
