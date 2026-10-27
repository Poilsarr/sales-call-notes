import path from "node:path";
import { chromium } from "playwright";

const outDir = "/var/folders/pr/9l205kmd19gg4f53dtlrdxf80000gn/T/opencode/studio-renders";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1250 }, deviceScaleFactor: 2 });
await page.goto("http://localhost:3199/", { waitUntil: "networkidle" });

const sec = page.locator('[data-track-section="social-proof-studio"]');
await sec.scrollIntoViewIfNeeded();
await page.waitForTimeout(700);
await sec.screenshot({ path: path.join(outDir, "social-full.png") });

// hover state: pointer over first marquee card (row pauses, card lifts)
await page.evaluate(() => window.scrollBy(0, 760));
await page.waitForTimeout(400);
const row = page.locator('[data-track-section="social-proof-studio"] .animate-marquee-reviews');
const box = await row.boundingBox();
await page.mouse.move(box.x + 760, box.y + box.height / 2);   // pointer over a card -> row pauses, card lifts
await page.waitForTimeout(700);
await page.screenshot({ path: path.join(outDir, "social-reviews-hover.png") });

// mobile
const m = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await m.goto("http://localhost:3199/", { waitUntil: "networkidle" });
const msec = m.locator('[data-track-section="social-proof-studio"]');
await msec.scrollIntoViewIfNeeded();
await m.waitForTimeout(700);
await msec.screenshot({ path: path.join(outDir, "social-mobile.png") });

await browser.close();
