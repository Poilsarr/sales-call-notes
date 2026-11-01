import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, "renders");
fs.mkdirSync(outDir, { recursive: true });

const shots = [
  { file: "fe-hero-v1.html", out: "fe-hero-v1.png", vw: 900, vh: 820 },
  { file: "fe-install-v1.html", out: "fe-install-v1.png", vw: 1440, vh: 1000 },
  { file: "fe-demo-v1.html", out: "fe-demo-v1.png", vw: 1440, vh: 1250 },
  { file: "fe-truth-v1.html", out: "fe-truth-v1.png", vw: 1440, vh: 900 },
  { file: "fe-fix-v1.html", out: "fe-fix-v1.png", vw: 1440, vh: 1250 },
  { file: "fe-cta-v1.html", out: "fe-cta-v1.png", vw: 620, vh: 480 },
];

// fresh browser per shot — resilient to a chromium context dying mid-run
for (const s of shots) {
  try {
    const html = fs.readFileSync(path.join(here, s.file), "utf-8");
    if (!html.includes('class="capture"')) {
      console.log("SKIP (no .capture):", s.file);
      continue;
    }
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: s.vw, height: s.vh }, deviceScaleFactor: 2 });
    await page.goto(`file://${path.join(here, s.file)}`, { waitUntil: "load" });
    await page.waitForTimeout(1400); // settle animations at a good frame
    await page.locator(".capture").screenshot({ path: path.join(outDir, s.out), timeout: 30000 });
    console.log("rendered", s.out);
    await page.close();
    await browser.close();
  } catch (e) {
    console.log("FAILED", s.out, "-", String(e).split("\n")[0]);
  }
}
