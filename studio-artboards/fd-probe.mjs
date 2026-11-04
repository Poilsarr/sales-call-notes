import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

// Batch D visual-first probe: /features trio, /pricing hero island,
// /extension hero + truth + fix + CTA. Desktop 1440 + mobile 390.

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, "renders");
fs.mkdirSync(outDir, { recursive: true });

const BASE = process.env.PD_BASE || "http://localhost:3199";

const browser = await chromium.launch();

const d = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
async function dshoot(url, selector, out) {
  await d.goto(`${BASE}${url}`, { waitUntil: "networkidle", timeout: 90000 });
  await d.waitForTimeout(1500);
  const el = d.locator(selector).first();
  await el.scrollIntoViewIfNeeded();
  await d.mouse.move(720, 300);
  await d.waitForTimeout(1800);
  await el.screenshot({ path: path.join(outDir, out) });
  console.log("shot", out);
}

// /features — proof trio band + one card close-up
await dshoot("/features", ".fpb-band", "dev-fd-trio.png");
await dshoot("/features", ".fpb-cardwrap", "dev-fd-trio-card.png");

// /pricing — hero island (visual anchor) + hero band
await dshoot("/pricing", ".fph-island", "dev-fd-pricing-island.png");
await dshoot("/pricing", "main section", "dev-fd-pricing-hero.png");

// /extension — hero island, truth band, truth card close-up, fix band, fix card
await dshoot("/extension", ".fex-island", "dev-fd-ext-island.png");
await dshoot("/extension", ".fex-band-truth", "dev-fd-ext-truth.png");
await dshoot("/extension", ".fex-truthcard", "dev-fd-ext-truthcard.png");
await dshoot("/extension", ".fex-band-fix", "dev-fd-ext-fix.png");
await dshoot(
  "/extension",
  ".fex-fixgrid .fex-fixc",
  "dev-fd-ext-fixcard.png",
);
await dshoot("/extension", ".doppel-outer", "dev-fd-ext-cta.png");

await d.close();

// mobile 390 spot checks
const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
async function mshoot(url, selector, out) {
  await m.goto(`${BASE}${url}`, { waitUntil: "networkidle", timeout: 90000 });
  await m.waitForTimeout(1200);
  const el = m.locator(selector).first();
  await el.scrollIntoViewIfNeeded();
  await m.waitForTimeout(1200);
  await el.screenshot({ path: path.join(outDir, out) });
  console.log("shot", out);
}
await mshoot("/features", ".fpb-cardwrap", "dev-fd-trio-mobile.png");
await mshoot("/pricing", ".fph-island", "dev-fd-pricing-mobile.png");
await mshoot("/extension", ".fex-truthcard", "dev-fd-ext-truth-mobile.png");
await mshoot("/extension", ".fex-fixgrid .fex-fixc", "dev-fd-ext-fix-mobile.png");
await m.close();

await browser.close();
console.log("batch D probes done");
