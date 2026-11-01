import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, "renders");
fs.mkdirSync(outDir, { recursive: true });

const BASE = process.env.PD_BASE || "http://localhost:3199";
const URL = `${BASE}/features`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
await page.goto(URL, { waitUntil: "networkidle", timeout: 90000 });
await page.waitForTimeout(1500);

// settle ScrollTrigger reveals by scrolling through each target section
async function shoot(selector, out) {
  const el = page.locator(selector).first();
  await el.scrollIntoViewIfNeeded();
  await page.mouse.move(720, 300);
  await page.waitForTimeout(1800);
  await el.screenshot({ path: path.join(outDir, out) });
  console.log("shot", out);
}

// section order on /features: hero → ProductVisualsSection → bundle (features grid)
// → StatsSection → divider area → WorkflowSection → rest
await shoot('section[data-track-section="product-visuals"]', "dev-fa-proof.png");
await shoot(".fst-sec", "dev-fa-stats.png");
await shoot(".fws-sec", "dev-fa-steps.png");

// mobile quick checks of same sections
const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
await m.goto(URL, { waitUntil: "networkidle", timeout: 90000 });
await m.locator('section[data-track-section="product-visuals"]').scrollIntoViewIfNeeded();
await m.waitForTimeout(1200);
await m.locator('section[data-track-section="product-visuals"]').screenshot({ path: path.join(outDir, "dev-fa-proof-mobile.png") });
console.log("shot dev-fa-proof-mobile.png");
await m.locator(".fst-sec").scrollIntoViewIfNeeded();
await m.waitForTimeout(1200);
await m.locator(".fst-sec").screenshot({ path: path.join(outDir, "dev-fa-stats-mobile.png") });
console.log("shot dev-fa-stats-mobile.png");
await m.close();

await browser.close();
