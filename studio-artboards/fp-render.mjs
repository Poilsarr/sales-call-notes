import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, "renders");
fs.mkdirSync(outDir, { recursive: true });

const shots = [
  { file: "fp-hero-v1.html", out: "fp-hero-v1.png", vh: 820 },
  { file: "fp-migrate-v1.html", out: "fp-migrate-v1.png", vh: 980 },
  { file: "fp-seats-v1.html", out: "fp-seats-v1.png", vh: 1400 },
];

const browser = await chromium.launch();
for (const s of shots) {
  const page = await browser.newPage({ viewport: { width: 1440, height: s.vh }, deviceScaleFactor: 2 });
  await page.goto(`file://${path.join(here, s.file)}`, { waitUntil: "load" });
  await page.waitForTimeout(1400); // settle animations at a good frame
  await page.locator(".capture").screenshot({ path: path.join(outDir, s.out) });
  console.log("rendered", s.out);
  await page.close();
}
await browser.close();
