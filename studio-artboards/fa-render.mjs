import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, "renders");
fs.mkdirSync(outDir, { recursive: true });

const shots = [
  { file: "fa-proof-v1.html", out: "fa-proof-v1.png", vh: 1200 },
  { file: "fa-proof-v2.html", out: "fa-proof-v2.png", vh: 1200 },
  { file: "fa-steps-v1.html", out: "fa-steps-v1.png", vh: 1700 },
  { file: "fa-stats-v1.html", out: "fa-stats-v1.png", vh: 620 },
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
