import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, "renders");
fs.mkdirSync(outDir, { recursive: true });

const BASE = process.env.PD_BASE || "http://localhost:3199";
const URL = `${BASE}/pricing`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
await page.goto(URL, { waitUntil: "networkidle", timeout: 90000 });
await page.waitForTimeout(1500);

async function shoot(selector, out) {
  const el = page.locator(selector).first();
  await el.scrollIntoViewIfNeeded();
  await page.mouse.move(720, 300);
  await page.waitForTimeout(1800);
  await el.screenshot({ path: path.join(outDir, out) });
  console.log("shot", out);
}

// hero island
await shoot(".fph-island", "dev-fp-hero.png");
// full hero section (light band + island)
await shoot("section.bg-\\[\\#EFEFEF\\]", "dev-fp-hero-band.png");
// migration band
await shoot(".fpm-band", "dev-fp-migrate.png");
// seats band
await shoot(".fps-band", "dev-fp-seats.png");

// mobile checks
const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
await m.goto(URL, { waitUntil: "networkidle", timeout: 90000 });
await m.waitForTimeout(1200);
async function mshoot(selector, out) {
  const el = m.locator(selector).first();
  await el.scrollIntoViewIfNeeded();
  await m.waitForTimeout(1200);
  await el.screenshot({ path: path.join(outDir, out) });
  console.log("shot", out);
}
await mshoot(".fph-island", "dev-fp-hero-mobile.png");
await mshoot(".fpm-band", "dev-fp-migrate-mobile.png");
await mshoot(".fps-band", "dev-fp-seats-mobile.png");
await m.close();

await browser.close();
