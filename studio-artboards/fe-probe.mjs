import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, "renders");
fs.mkdirSync(outDir, { recursive: true });

const BASE = process.env.PD_BASE || "http://localhost:3199";
const URL = `${BASE}/extension`;

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

// hero console island (fe-hero)
await shoot(".fex-island", "dev-fe-hero.png");
// full hero section (light band + island)
await shoot("section.bg-\\[\\#EFEFEF\\]", "dev-fe-hero-band.png");
// install trio band
await shoot(".fex-band-install", "dev-fe-install.png");
// demo six-plates band
await shoot(".fex-band-demo", "dev-fe-demo.png");
// truth band
await shoot(".fex-band-truth", "dev-fe-truth.png");
// fix band
await shoot(".fex-band-fix", "dev-fe-fix.png");
// CTA rec-orb island
await shoot(".fex-island-cta", "dev-fe-cta.png");
// CTA full section (light + island)
await shoot("main > section.bg-\\[\\#EFEFEF\\]", "dev-fe-cta-band.png");

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
await mshoot(".fex-island", "dev-fe-hero-mobile.png");
await mshoot(".fex-band-install", "dev-fe-install-mobile.png");
await mshoot(".fex-band-demo", "dev-fe-demo-mobile.png");
await mshoot(".fex-band-truth", "dev-fe-truth-mobile.png");
await mshoot(".fex-band-fix", "dev-fe-fix-mobile.png");
await mshoot(".fex-island-cta", "dev-fe-cta-mobile.png");
await m.close();

await browser.close();
